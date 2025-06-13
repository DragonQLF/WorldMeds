const express = require('express');
const router = express.Router();
const db = require('../db');
const { formatPrice, convertToUSD, fetchCurrencyRates } = require('../utils/priceUtils');
const logger = require('../utils/logger');

/**
 * Helper function to convert price to USD using pre-fetched rates
 * @param {number} amount - Amount in local currency
 * @param {string} fromCurrency - Source currency code
 * @param {Object} rates - Pre-fetched currency rates
 * @returns {number} Converted amount in USD
 */
const convertToUSDWithRates = (amount, fromCurrency, rates) => {
  try {
    const currency = (fromCurrency?.toLowerCase() || 'usd');
    const numericAmount = parseFloat(amount);
    
    if (numericAmount === null || numericAmount === undefined || isNaN(numericAmount)) {
      console.warn('Invalid amount for conversion:', amount);
      return 0;
    }
    
    if (currency === 'usd') return numericAmount;
    
    if (!rates[currency]) {
      console.warn(`Currency conversion rate not found for ${currency}, using 1:1 rate`);
      return numericAmount;
    }
    
    // Since rates are USD to currency, we divide to get currency to USD
    return formatPrice(numericAmount / rates[currency]);
  } catch (error) {
    console.error('Error in currency conversion:', error);
    return parseFloat(amount) || 0;
  }
};

// Get general statistics
router.get("/general", async (req, res) => {
  try {
    // Initialize stats object
    const stats = {
      totalMedicines: 0,
      totalCountries: 0,
      totalTransactions: 0,
      averagePrice: 0,
      lowestPriceCountry: { country: 'N/A', averagePrice: 0 },
      highestPriceCountry: { country: 'N/A', averagePrice: 0 },
      mostPurchasedMedicine: { medicine: 'N/A', totalQuantity: 0 },
      medicinesByCountry: [],
      pricesByMedicine: [],
      monthlyTrends: []
    };

    // Build date filter
    let dateFilter = "";
    const params = [];
    if (req.query.date) {
      dateFilter = "AND DATE(mc.month) = ?";
      params.push(req.query.date);
    } else if (req.query.month) {
      dateFilter = "AND DATE_FORMAT(mc.month, '%Y-%m') = ?";
      params.push(req.query.month);
    }

    // Fetch currency rates once at the start
    const rates = await fetchCurrencyRates();

    // 1. Get total unique medicines
    const medicinesResult = await new Promise((resolve, reject) => {
      const query = "SELECT COUNT(DISTINCT id) as total FROM medicines";
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].total);
      });
    });
    stats.totalMedicines = medicinesResult;

    // 2. Get total countries
    const countriesResult = await new Promise((resolve, reject) => {
      const query = "SELECT COUNT(id) as total FROM countries";
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].total);
      });
    });
    stats.totalCountries = countriesResult;

    // 3. Get total transactions
    const transactionsResult = await new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) as total 
        FROM medicine_countries mc
        WHERE 1=1 ${dateFilter}
      `;
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].total);
      });
    });
    stats.totalTransactions = transactionsResult;

    // 4. Get medicines by country
    const medicinesByCountryResult = await new Promise((resolve, reject) => {
      const query = `
        SELECT 
          c.name as country,
          c.currency,
          COUNT(DISTINCT mc.medicine_id) as medicineCount,
          AVG(mc.sale_price) as averagePrice
        FROM medicine_countries mc
        JOIN countries c ON mc.country_id = c.id
        WHERE mc.sale_price IS NOT NULL ${dateFilter}
        GROUP BY c.id, c.name, c.currency
      `;
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Convert medicines by country to USD using pre-fetched rates and find lowest/highest price countries
    stats.medicinesByCountry = medicinesByCountryResult.map(item => {
      const usdPrice = convertToUSDWithRates(item.averagePrice, item.currency, rates);
      return {
        country: item.country,
        medicineCount: item.medicineCount,
        averagePrice: formatPrice(usdPrice) || 0
      };
    });

    // Find lowest and highest price countries
    if (stats.medicinesByCountry.length > 0) {
      const sortedCountries = [...stats.medicinesByCountry].sort((a, b) => a.averagePrice - b.averagePrice);
      stats.lowestPriceCountry = {
        country: sortedCountries[0].country,
        averagePrice: sortedCountries[0].averagePrice
      };
      stats.highestPriceCountry = {
        country: sortedCountries[sortedCountries.length - 1].country,
        averagePrice: sortedCountries[sortedCountries.length - 1].averagePrice
      };
    }

    // 5. Get most purchased medicine
    const mostPurchasedResult = await new Promise((resolve, reject) => {
      const query = `
        SELECT 
          m.name,
          SUM(mc.quantity_purchased) as total_quantity
        FROM medicine_countries mc
        JOIN medicines m ON mc.medicine_id = m.id
        WHERE mc.quantity_purchased IS NOT NULL ${dateFilter}
        GROUP BY m.id, m.name
        ORDER BY total_quantity DESC
        LIMIT 1
      `;
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (mostPurchasedResult.length > 0) {
      stats.mostPurchasedMedicine = {
        medicine: mostPurchasedResult[0].name,
        totalQuantity: mostPurchasedResult[0].total_quantity
      };
    }

    // 6. Get all prices with currencies for USD conversion and global average
    const allPricesResult = await new Promise((resolve, reject) => {
      const query = `
        SELECT mc.sale_price, c.currency, mc.month 
        FROM medicine_countries mc
        JOIN countries c ON mc.country_id = c.id
        WHERE mc.sale_price IS NOT NULL ${dateFilter}
      `;
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Convert all prices to USD using pre-fetched rates
    const usdPrices = allPricesResult.map(item => 
      convertToUSDWithRates(item.sale_price, item.currency, rates)
    );
    stats.averagePrice = usdPrices.length > 0 ? 
      formatPrice(usdPrices.reduce((sum, price) => sum + price, 0) / usdPrices.length) : 0;

    // 7. Get prices by medicine statistics
    const pricesByMedicineResult = await new Promise((resolve, reject) => {
      const query = `
        SELECT 
          m.name as medicine,
          mc.sale_price,
          c.currency,
          c.id as country_id
        FROM medicine_countries mc
        JOIN medicines m ON mc.medicine_id = m.id
        JOIN countries c ON mc.country_id = c.id
        WHERE mc.sale_price IS NOT NULL ${dateFilter}
      `;
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Process prices by medicine using pre-fetched rates
    const medicineStats = {};
    for (const item of pricesByMedicineResult) {
      const usdPrice = convertToUSDWithRates(item.sale_price, item.currency, rates);
      if (usdPrice && !isNaN(usdPrice)) {
        if (!medicineStats[item.medicine]) {
          medicineStats[item.medicine] = {
            prices: [],
            countries: new Set()
          };
        }
        medicineStats[item.medicine].prices.push(usdPrice);
        medicineStats[item.medicine].countries.add(item.country_id);
      }
    }

    // Calculate min, max, average for each medicine
    stats.pricesByMedicine = Object.entries(medicineStats)
      .map(([medicine, data]) => {
        if (data.prices.length > 0) {
          const prices = data.prices;
          return {
            medicine: medicine,
            averagePrice: formatPrice(prices.reduce((sum, p) => sum + p, 0) / prices.length),
            minPrice: formatPrice(Math.min(...prices)),
            maxPrice: formatPrice(Math.max(...prices)),
            countryCount: data.countries.size
          };
        }
        return null;
      })
      .filter(item => item !== null);

    // 8. Get monthly trends
    const monthlyTrendsResult = await new Promise((resolve, reject) => {
      const query = `
        SELECT 
          DATE_FORMAT(mc.month, '%Y-%m-01') as month,
          c.currency,
          mc.sale_price
        FROM medicine_countries mc
        JOIN countries c ON mc.country_id = c.id
        WHERE mc.sale_price IS NOT NULL AND mc.month IS NOT NULL ${dateFilter}
        ORDER BY mc.month DESC
        LIMIT 100
      `;
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Process monthly trends using pre-fetched rates
    const monthlyStats = {};
    for (const item of monthlyTrendsResult) {
      const usdPrice = convertToUSDWithRates(item.sale_price, item.currency, rates);
      if (usdPrice && !isNaN(usdPrice)) {
        if (!monthlyStats[item.month]) {
          monthlyStats[item.month] = {
            prices: [],
            transactions: 0
          };
        }
        monthlyStats[item.month].prices.push(usdPrice);
        monthlyStats[item.month].transactions++;
      }
    }

    // Calculate monthly averages and format the response
    stats.monthlyTrends = Object.entries(monthlyStats)
      .map(([month, data]) => ({
        month: month,
        averagePrice: formatPrice(data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length),
        totalTransactions: data.transactions
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    res.json(stats);
  } catch (error) {
    console.error('Error in /stats/general:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get global average trends with optimized currency conversion
router.get("/global-trends", async (req, res) => {
  try {
    // Fetch currency rates once at the start
    const rates = await fetchCurrencyRates();

    const query = `
      SELECT 
        DATE_FORMAT(mc.month, '%Y-%m-01') as month,
        mc.sale_price,
        c.currency
      FROM medicine_countries mc
      JOIN countries c ON mc.country_id = c.id
      WHERE mc.sale_price IS NOT NULL AND mc.month IS NOT NULL
      ORDER BY mc.month DESC
      LIMIT 5000;
    `;

    const results = await new Promise((resolve, reject) => {
      db.query(query, [], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Process results using pre-fetched rates
    const monthlyStats = {};
    for (const item of results) {
      const usdPrice = convertToUSDWithRates(item.sale_price, item.currency, rates);
      if (usdPrice && !isNaN(usdPrice)) {
        if (!monthlyStats[item.month]) {
          monthlyStats[item.month] = {
            prices: [],
            transactions: 0
          };
        }
        monthlyStats[item.month].prices.push(usdPrice);
        monthlyStats[item.month].transactions += 1;
      }
    }

    // Calculate monthly averages and format the response
    let trends = Object.entries(monthlyStats)
      .map(([month, data]) => ({
        month: month,
        averagePrice: formatPrice(data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length),
        totalTransactions: data.transactions
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    res.json(trends);
  } catch (error) {
    console.error('Error in /stats/global-trends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update price stats route to use optimized currency conversion
router.get('/price-stats', async (req, res) => {
  try {
    // Fetch currency rates once at the start
    const rates = await fetchCurrencyRates();
    
    const prices = await db.collection('prices').find().toArray();
    
    // Convert prices using pre-fetched rates
    const convertedPrices = prices.map(price => ({
      ...price,
      usdPrice: convertToUSDWithRates(price.amount, price.currency, rates)
    }));
    
    const stats = calculatePriceStats(convertedPrices);
    res.json(stats);
  } catch (error) {
    console.error('Error calculating price stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update country stats route to use optimized currency conversion
router.get('/country-stats', async (req, res) => {
  try {
    // Fetch currency rates once at the start
    const rates = await fetchCurrencyRates();
    
    const prices = await db.collection('prices').find().toArray();
    
    // Convert prices using pre-fetched rates
    const convertedPrices = prices.map(price => ({
      ...price,
      usdPrice: convertToUSDWithRates(price.amount, price.currency, rates)
    }));
    
    const countryStats = calculateCountryStats(convertedPrices);
    res.json(countryStats);
  } catch (error) {
    console.error('Error calculating country stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 
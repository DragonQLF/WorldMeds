const express = require('express');
const router = express.Router();
const db = require('../db');
const { convertToUSD, formatPrice } = require('../utils/priceUtils');

// Helper function to build date filter conditions
const buildDateFilter = (req) => {
  const { date, start, end, month } = req.query;
  let dateFilter = '';
  const params = [];

  // Don't apply any date filter if month is 'all'
  if (month === 'all') {
    return { dateFilter: '', params: [] };
  }

  if (date) {
    dateFilter = 'AND mc.month = ?';
    params.push(date);
  } else if (start && end) {
    dateFilter = 'AND mc.month BETWEEN ? AND ?';
    params.push(start, end);
  } else if (start) {
    dateFilter = 'AND mc.month >= ?';
    params.push(start);
  } else if (month) {
    dateFilter = 'AND DATE_FORMAT(mc.month, "%Y-%m") = ?';
    params.push(month);
  }

  return { dateFilter, params };
};

// Get general statistics
router.get("/general", async (req, res) => {
  try {
    console.log("Fetching general statistics...");
    const { dateFilter, params } = buildDateFilter(req);
    
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

    // 1. Get total medicines
    const medicinesResult = await new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as total FROM medicines', (err, results) => {
        if (err) reject(err);
        else resolve(results[0].total);
      });
    });
    stats.totalMedicines = medicinesResult;

    // 2. Get total countries
    const countriesResult = await new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as total FROM countries', (err, results) => {
        if (err) reject(err);
        else resolve(results[0].total);
      });
    });
    stats.totalCountries = countriesResult;

    // 3. Get total transactions with date filter
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

    // 4. Get all prices with currencies for USD conversion and global average
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

    // Convert all prices to USD using direct conversion
    const usdPrices = await Promise.all(allPricesResult.map(async item => {
      return await convertToUSD(item.sale_price, item.currency);
    }));
    stats.averagePrice = usdPrices.length > 0 ? 
      formatPrice(usdPrices.reduce((sum, price) => sum + price, 0) / usdPrices.length) : 0;

    // 5. Get country averages for lowest/highest price countries
    const countryAveragesResult = await new Promise((resolve, reject) => {
      const query = `
        SELECT 
          c.name,
          c.currency,
          AVG(mc.sale_price) as avg_price,
          mc.month
        FROM medicine_countries mc
        JOIN countries c ON mc.country_id = c.id
        WHERE mc.sale_price IS NOT NULL ${dateFilter}
        GROUP BY c.id, c.name, c.currency, mc.month
      `;
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Convert country averages to USD using direct conversion
    const countryPriceData = await Promise.all(countryAveragesResult.map(async country => ({
      country: country.name,
      averagePrice: formatPrice(await convertToUSD(country.avg_price, country.currency))
    })));

    if (countryPriceData.length > 0) {
      countryPriceData.sort((a, b) => a.averagePrice - b.averagePrice);
      stats.lowestPriceCountry = countryPriceData[0];
      stats.highestPriceCountry = countryPriceData[countryPriceData.length - 1];
    }

    // 6. Get most purchased medicine
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

    // 7. Get medicines by country statistics
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
        ORDER BY medicineCount DESC
      `;
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Convert medicines by country to USD
    for (const item of medicinesByCountryResult) {
      const usdPrice = await convertToUSD(item.averagePrice, item.currency);
      stats.medicinesByCountry.push({
        country: item.country,
        medicineCount: item.medicineCount,
        averagePrice: formatPrice(usdPrice) || 0
      });
    }

    // 8. Get prices by medicine statistics
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

    // Process prices by medicine and convert to USD
    const medicineStats = {};
    for (const item of pricesByMedicineResult) {
      const usdPrice = await convertToUSD(item.sale_price, item.currency);
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
    for (const [medicine, data] of Object.entries(medicineStats)) {
      if (data.prices.length > 0) {
        const prices = data.prices;
        stats.pricesByMedicine.push({
          medicine: medicine,
          averagePrice: formatPrice(prices.reduce((sum, p) => sum + p, 0) / prices.length),
          minPrice: formatPrice(Math.min(...prices)),
          maxPrice: formatPrice(Math.max(...prices)),
          countryCount: data.countries.size
        });
      }
    }

    // 9. Get monthly trends
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

    // Process monthly trends and convert to USD
    const monthlyStats = {};
    for (const item of monthlyTrendsResult) {
      const usdPrice = await convertToUSD(item.sale_price, item.currency);
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

    // Calculate monthly averages
    for (const [month, data] of Object.entries(monthlyStats)) {
      if (data.prices.length > 0) {
        stats.monthlyTrends.push({
          month: month,
          averagePrice: formatPrice(data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length),
          totalTransactions: data.transactions
        });
      }
    }

    res.json(stats);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Get global average trends
router.get("/global-trends", async (req, res) => {
  try {
    // Fetch individual sale prices with their currencies for aggregation in Node.js
    const query = `
      SELECT 
        DATE_FORMAT(mc.month, '%Y-%m-01') as month,
        mc.sale_price,
        c.currency
      FROM medicine_countries mc
      JOIN countries c ON mc.country_id = c.id
      WHERE mc.sale_price IS NOT NULL AND mc.month IS NOT NULL
      ORDER BY mc.month DESC
      LIMIT 5000; -- Fetch a large enough number of records to cover 24 months
    `;

    const results = await new Promise((resolve, reject) => {
      db.query(query, [], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Process results: convert to USD and aggregate by month
    const monthlyStats = {};
    for (const item of results) {
      // Use the first day of the month for historical rates
      const rateDate = item.month;
      const usdPrice = await convertToUSD(item.sale_price, item.currency, rateDate);
      if (usdPrice && !isNaN(usdPrice)) {
        if (!monthlyStats[item.month]) {
          monthlyStats[item.month] = {
            prices: [],
            transactions: 0
          };
        }
        monthlyStats[item.month].prices.push(usdPrice);
        // Each row here represents an individual sale, so we count each as a transaction
        monthlyStats[item.month].transactions += 1; 
      }
    }

    // Calculate monthly averages and format the response
    let trends = Object.entries(monthlyStats).map(([month, data]) => ({
      month: month,
      averagePrice: formatPrice(data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length),
      totalTransactions: data.transactions
    }));

    // Sort by month ascending and limit to the last 24 unique months
    trends.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
    // Ensure we only return the latest 24 months, if available
    trends = trends.slice(Math.max(0, trends.length - 24));

    res.json(trends);
  } catch (error) {
    console.error("Error fetching global trends:", error);
    res.status(500).json({ error: "Failed to fetch global trends" });
  }
});

// Update routes to use direct conversion
router.get('/price-stats', async (req, res) => {
  try {
    const prices = await db.collection('prices').find().toArray();
    
    // Convert prices individually
    const convertedPrices = await Promise.all(prices.map(async (price) => {
      const usdPrice = await convertToUSD(price.amount, price.currency);
      return {
        ...price,
        usdPrice
      };
    }));
    
    // Calculate statistics
    const stats = calculatePriceStats(convertedPrices);
    res.json(stats);
  } catch (error) {
    console.error('Error calculating price stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/country-stats', async (req, res) => {
  try {
    const prices = await db.collection('prices').find().toArray();
    
    // Convert prices individually
    const convertedPrices = await Promise.all(prices.map(async (price) => {
      const usdPrice = await convertToUSD(price.amount, price.currency);
      return {
        ...price,
        usdPrice
      };
    }));
    
    // Calculate country-specific stats
    const countryStats = calculateCountryStats(convertedPrices);
    res.json(countryStats);
  } catch (error) {
    console.error('Error calculating country stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 
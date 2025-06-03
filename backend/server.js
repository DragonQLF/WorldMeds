const express = require("express");
const db = require("./db");
const cors = require("cors");
const path = require('path');
const fs = require('fs');
const config = require('./config');
const http = require('http');
const { setupWebsocketServer } = require('./websocket');
const { formatPrice, preparePriceData, convertToUSD, fetchCurrencyRates: fetchBackendCurrencyRates } = require('./utils/priceUtils');

const app = express();
const port = config.PORT;

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket server
const wss = setupWebsocketServer(server);

// Get base directory that works for both dev and Docker environments
const getBaseDir = () => {
  return fs.existsSync('/usr/src/app') ? '/usr/src/app' : __dirname;
};

// Updated CORS configuration
app.use(cors({
  origin: config.ALLOWED_ORIGINS,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const comparisonRoutes = require('./routes/comparisonRoutes');

app.use('/api/admin', adminRoutes);

// Comparison routes for medicine price comparison
app.use('/api/comparison', comparisonRoutes);

// Public API endpoints - No authentication required

// Search endpoints (Public)
app.get("/api/search/countries", (req, res) => {
  console.log('[REQ] /api/search/countries', { query: req.query, body: req.body });
  const searchTerm = req.query.q || '';
  let dateFilter = '';
  let params = [];

  if (!searchTerm || searchTerm.length < 2) {
    return res.json([]);
  }

  // Date/month filtering logic
  if (req.query.date) {
    dateFilter = `AND DATE(mc.month) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    dateFilter = `AND DATE(mc.month) >= ?`;
    params.push(req.query.start);
    if (req.query.end) {
      dateFilter += ` AND DATE(mc.month) <= ?`;
      params.push(req.query.end);
    }
  } else if (req.query.month) {
    dateFilter = `AND DATE_FORMAT(mc.month, '%Y-%m') = ?`;
    params.push(req.query.month);
  }

  const sql = `
    SELECT 
      c.id, 
      c.name, 
      c.currency,
      c.iso_code,
      (
        SELECT AVG(mc.sale_price)
        FROM medicine_countries mc
        WHERE mc.country_id = c.id
        ${dateFilter || `AND DATE_FORMAT(mc.month, '%Y-%m') = DATE_FORMAT((SELECT MAX(month) FROM medicine_countries WHERE country_id = c.id), '%Y-%m')`}
      ) AS averagePrice,
      (
        SELECT AVG(mc.sale_price)
        FROM medicine_countries mc
        WHERE mc.country_id = c.id
        ${dateFilter || `AND DATE_FORMAT(mc.month, '%Y-%m') = DATE_FORMAT(DATE_SUB((SELECT MAX(month) FROM medicine_countries WHERE country_id = c.id), INTERVAL 1 MONTH), '%Y-%m')`}
      ) AS previousPrice,
      (
        SELECT COUNT(DISTINCT mc.medicine_id)
        FROM medicine_countries mc
        WHERE mc.country_id = c.id
      ) AS medicineCount,
      CASE
          WHEN (
              SELECT AVG(mc_current.sale_price)
              FROM medicine_countries mc_current
              WHERE mc_current.country_id = c.id
              AND DATE_FORMAT(mc_current.month, '%Y-%m') = DATE_FORMAT((SELECT MAX(month) FROM medicine_countries WHERE country_id = c.id), '%Y-%m')
          ) > (
              SELECT AVG(mc_prev.sale_price)
              FROM medicine_countries mc_prev
              WHERE mc_prev.country_id = c.id
              AND DATE_FORMAT(mc_prev.month, '%Y-%m') = DATE_FORMAT(DATE_SUB((SELECT MAX(month) FROM medicine_countries WHERE country_id = c.id), INTERVAL 1 MONTH), '%Y-%m')
          ) THEN 'up'
          WHEN (
              SELECT AVG(mc_current.sale_price)
              FROM medicine_countries mc_current
              WHERE mc_current.country_id = c.id
              AND DATE_FORMAT(mc_current.month, '%Y-%m') = DATE_FORMAT((SELECT MAX(month) FROM medicine_countries WHERE country_id = c.id), '%Y-%m')
          ) < (
              SELECT AVG(mc_prev.sale_price)
              FROM medicine_countries mc_prev
              WHERE mc_prev.country_id = c.id
              AND DATE_FORMAT(mc_prev.month, '%Y-%m') = DATE_FORMAT(DATE_SUB((SELECT MAX(month) FROM medicine_countries WHERE country_id = c.id), INTERVAL 1 MONTH), '%Y-%m')
          ) THEN 'down'
          ELSE 'stable'
      END AS trendIndicator
    FROM countries c
    WHERE c.name LIKE ?
    ORDER BY c.name
    LIMIT 20
  `;

  // The default date filter doesn't use parameters. If a date filter is applied, the date parameters are used in two subqueries,
  // so they need to be included twice in the parameters array.
  let queryParams = [];
  if (params.length > 0) {
    // Add date parameters for the first subquery
    queryParams = [...params];
    // Add date parameters again for the second subquery
    queryParams = [...queryParams, ...params];
  }
  // Add the search term parameter
  queryParams.push(`%${searchTerm}%`);

  db.query(sql, queryParams, (err, results) => {
    if (err) {
      console.error("Error searching countries:", err);
      return res.status(500).json({ error: "Database error" });
    }
    const formattedResults = results.map(row => ({
      id: row.id,
      name: row.name,
      currency: row.currency,
      iso_code: row.iso_code,
      averagePrice: row.averagePrice ? parseFloat(row.averagePrice) : null,
      previousPrice: row.previousPrice ? parseFloat(row.previousPrice) : null,
      medicineCount: parseInt(row.medicineCount) || 0,
      trendIndicator: row.trendIndicator // Include the new trend indicator
    }));
    res.json(formattedResults);
  });
});

app.get("/api/search/medicines", (req, res) => {
  console.log('[REQ] /api/search/medicines', { query: req.query, body: req.body });
  const searchTerm = req.query.q || '';
  
  if (!searchTerm || searchTerm.length < 2) {
    return res.json([]);
  }
  
  const sql = `
    SELECT id, name, dosage 
    FROM medicines 
    WHERE name LIKE ? 
    ORDER BY name 
    LIMIT 20
  `;
  
  db.query(sql, [`%${searchTerm}%`], (err, results) => {
    if (err) {
      console.error("Error searching medicines:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// NEW Endpoint to provide currency rates to the frontend
app.get("/api/currency-rates", async (req, res) => {
  console.log('[REQ] /api/currency-rates', { query: req.query, body: req.body });
  try {
    console.log("Backend /api/currency-rates endpoint hit");
    const rates = await fetchBackendCurrencyRates();
    if (rates && Object.keys(rates).length > 0) {
      res.json(rates);
    } else {
      // This case implies fallback to static rates or an empty object if initial fetch failed badly
      console.warn("Backend /api/currency-rates returning potentially static or empty rates.");
      res.json(rates || STATIC_CURRENCY_RATES); // Send static if rates is null/undefined
    }
  } catch (error) {
    console.error("Error in /api/currency-rates endpoint (backend):", error);
    res.status(500).json({ error: "Failed to fetch currency rates" });
  }
});

// Get global average medicine price - UPDATED to convert to USD before averaging
app.get("/api/global-average-medicine-price", async (req, res) => {
  console.log('[REQ] /api/global-average-medicine-price', { query: req.query, body: req.body });
  try {
    // First, get all the medicine prices with their country currencies
    let sql = `
      SELECT 
        mc.sale_price, 
        c.currency AS local_currency
      FROM medicine_countries mc
      JOIN countries c ON mc.country_id = c.id
    `;
    
    const params = [];
    
    if (req.query.date) {
      sql += ` WHERE DATE(mc.month) = ?`;
      params.push(req.query.date);
    } else if (req.query.start) {
      sql += ` WHERE DATE(mc.month) >= ?`;
      params.push(req.query.start);
      
      if (req.query.end) {
        sql += ` AND DATE(mc.month) <= ?`;
        params.push(req.query.end);
      }
    } else if (req.query.month) {
      sql += ` WHERE DATE_FORMAT(mc.month, '%Y-%m') = ?`;
      params.push(req.query.month);
    }
    
    // Execute the query to get all prices with their currencies
    db.query(sql, params, async (err, results) => {
      if (err) {
        console.error("Error fetching prices for global average:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      if (results.length === 0) {
        return res.json({ global_average: 0 });
      }
      
      // Convert all prices to USD before averaging
      const pricePromises = results.map(async (item) => {
        if (item.sale_price === null || item.sale_price === undefined) {
          return null; // Skip null prices
        }
        return await convertToUSD(item.sale_price, item.local_currency);
      });
      
      // Wait for all conversions to complete
      const usdPrices = await Promise.all(pricePromises);
      
      // Filter out null values and calculate the average
      const validPrices = usdPrices.filter(price => price !== null && !isNaN(price));
      const sum = validPrices.reduce((acc, price) => acc + price, 0);
      const avg = validPrices.length > 0 ? sum / validPrices.length : 0;
      
      // Format the result
      const globalAverage = formatPrice(avg) || 0;
      
      console.log(`Calculated global average from ${validPrices.length} valid prices: $${globalAverage} USD with month filter: ${req.query.month || 'none'}`);
      res.json({ global_average: globalAverage });
    });
  } catch (error) {
    console.error("Error calculating global average:", error);
    res.status(500).json({ error: "Server error calculating global average" });
  }
});

// Get average prices for all countries with trend data
app.get("/api/countries-average-prices", (req, res) => {
  console.log('[REQ] /api/countries-average-prices', { query: req.query, body: req.body });
  let sql = `
    SELECT 
      c.id AS countryId,
      c.name AS countryName,
      c.currency AS localCurrency,
      c.iso_code,
      (
        SELECT AVG(sub.avg_price)
        FROM (
          SELECT 
            AVG(mc.sale_price) AS avg_price,
            mc.medicine_id
          FROM medicine_countries mc
          WHERE mc.country_id = c.id
  `;
  
  const params = [];
  
  if (req.query.date) {
    sql += ` AND DATE(mc.month) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mc.month) >= ?`;
    params.push(req.query.start);
    
    if (req.query.end) {
      sql += ` AND DATE(mc.month) <= ?`;
      params.push(req.query.end);
    }
  } else if (req.query.month) {
    sql += ` AND DATE_FORMAT(mc.month, '%Y-%m') = ?`;
    params.push(req.query.month);
  } else {
    sql += ``;
  }
  
  sql += `
          GROUP BY mc.medicine_id
          ORDER BY SUM(mc.quantity_purchased) DESC
          LIMIT 5
        ) AS sub
      ) AS averagePrice,
      (
        SELECT AVG(sub.original_price)
        FROM (
          SELECT AVG(mc.sale_price) AS original_price, mc.medicine_id
          FROM medicine_countries mc
          WHERE mc.country_id = c.id
  `;
  
  if (req.query.date) {
    sql += ` AND DATE(mc.month) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mc.month) >= ?`;
    params.push(req.query.start);
    
    if (req.query.end) {
      sql += ` AND DATE(mc.month) <= ?`;
      params.push(req.query.end);
    }
  } else if (req.query.month) {
    sql += ` AND DATE_FORMAT(mc.month, '%Y-%m') = ?`;
    params.push(req.query.month);
  } else {
    sql += ``;
  }
  
  sql += `
          GROUP BY mc.medicine_id
          ORDER BY SUM(mc.quantity_purchased) DESC
          LIMIT 5
        ) AS sub
      ) AS originalPrice,
      (
        SELECT AVG(sub.prev_price)
        FROM (
          SELECT AVG(mc.sale_price) AS prev_price, mc.medicine_id
          FROM medicine_countries mc
          WHERE mc.country_id = c.id
          AND DATE_FORMAT(mc.month, '%Y-%m') = DATE_FORMAT(
            DATE_SUB(
              CASE
                WHEN ? IS NOT NULL THEN STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d')
                ELSE (SELECT MAX(month) FROM medicine_countries WHERE country_id = c.id)
              END,
              INTERVAL 1 MONTH
            ),
            '%Y-%m'
          )
          GROUP BY mc.medicine_id
          ORDER BY SUM(mc.quantity_purchased) DESC
          LIMIT 5
        ) AS sub
      ) AS previousPrice,
      (
        SELECT COUNT(DISTINCT mc2.medicine_id)
        FROM medicine_countries mc2
        WHERE mc2.country_id = c.id
      ) AS totalMedicines,
      (
        SELECT AVG(mc3.pills_per_package)
        FROM medicine_countries mc3
        WHERE mc3.country_id = c.id
        LIMIT 1
      ) AS pillsPerPackage
    FROM countries c;
  `;
  
  // Add month parameter twice for the previous month calculation
  if (req.query.month) {
    params.push(req.query.month, req.query.month);
  } else {
    params.push(null, null);
  }
  
  db.query(sql, params, async (err, results) => {
    if (err) {
      console.error("Error fetching countries averages:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    // Process the results, ensure we use package prices consistently
    // but don't do the currency conversion here - we'll do it on the frontend
    const formattedResults = results.map(country => ({
      countryId: country.countryId,
      countryName: country.countryName,
      localCurrency: country.localCurrency,
      iso_code: country.iso_code,
      averagePrice: country.averagePrice === null ? 0 : parseFloat(country.averagePrice),
      originalPrice: country.originalPrice === null ? 0 : parseFloat(country.originalPrice),
      previousPrice: country.previousPrice === null ? 0 : parseFloat(country.previousPrice),
      totalMedicines: parseInt(country.totalMedicines) || 0,
      pillsPerPackage: parseFloat(country.pillsPerPackage) || 1,
    }));
    
    console.log(`Returning countries data with month filter: ${req.query.month || 'none'}`);
    res.json(formattedResults);
  });
});

// Get all countries with price trend data
app.get("/api/countries", (req, res) => {
  console.log('[REQ] /api/countries', { query: req.query, body: req.body });
  const sql = `
    SELECT 
      c.id, 
      c.name, 
      c.currency,
      c.iso_code,
      (
        SELECT AVG(mc.sale_price)
        FROM medicine_countries mc
        WHERE mc.country_id = c.id
        AND DATE_FORMAT(mc.month, '%Y-%m') = DATE_FORMAT(
          (SELECT MAX(month) FROM medicine_countries WHERE country_id = c.id),
          '%Y-%m'
        )
      ) AS averagePrice,
      (
        SELECT AVG(mc.sale_price)
        FROM medicine_countries mc
        WHERE mc.country_id = c.id
        AND DATE_FORMAT(mc.month, '%Y-%m') = DATE_FORMAT(
          DATE_SUB(
            (SELECT MAX(month) FROM medicine_countries WHERE country_id = c.id), 
            INTERVAL 1 MONTH
          ),
          '%Y-%m'
        )
      ) AS previousPrice,
      (
        SELECT COUNT(DISTINCT mc.medicine_id)
        FROM medicine_countries mc
        WHERE mc.country_id = c.id
      ) AS medicineCount
    FROM countries c
    ORDER BY c.name
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching countries:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// Updated endpoint to get available months - for use with month picker
app.get("/api/available-months", (req, res) => {
  console.log('[REQ] /api/available-months', { query: req.query, body: req.body });
  const sql = `
    SELECT DISTINCT DATE_FORMAT(month, '%Y-%m') as available_month
    FROM medicine_countries
    WHERE month IS NOT NULL
    ORDER BY available_month DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching available months:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    // Extract months from results
    const availableMonths = results.map(row => row.available_month);
    console.log('Returning available months:', availableMonths);
    res.json(availableMonths);
  });
});

// Public endpoint to get all medicines (for search modal)
app.get("/api/medicines", (req, res) => {
  console.log('[REQ] /api/medicines', { query: req.query, body: req.body });
  const sql = `
    SELECT id, name, dosage
    FROM medicines
    ORDER BY name
    LIMIT 100
  `;
  db.query(sql, [], (err, results) => {
    if (err) {
      console.error("Error fetching medicines:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// Use auth routes
app.use('/api', authRoutes);

// Use user routes
app.use('/api', userRoutes);

// Get country average medicine price
app.get("/api/country/:countryId/average-medicine-price", (req, res) => {
  console.log('[REQ] /api/country/:countryId/average-medicine-price', { query: req.query, body: req.body });
  let sql = `
    SELECT AVG(avg_price) AS overall_average FROM (
      SELECT AVG(mc.sale_price) AS avg_price
      FROM medicine_countries mc
      WHERE mc.country_id = ?
  `;
  
  const params = [req.params.countryId];
  
  if (req.query.date) {
    sql += ` AND DATE(mc.month) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mc.month) >= ?`;
    params.push(req.query.start);
    
    if (req.query.end) {
      sql += ` AND DATE(mc.month) <= ?`;
      params.push(req.query.end);
    }
  } else if (req.query.month) {
    sql += ` AND DATE_FORMAT(mc.month, '%Y-%m') = ?`;
    params.push(req.query.month);
  }
  
  sql += `
      GROUP BY mc.medicine_id
      ORDER BY SUM(mc.quantity_purchased) DESC
      LIMIT 5
    ) AS sub;
  `;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching country average:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results[0]);
  });
});

// Get country details
app.get("/api/country/:countryId/details", (req, res) => {
  console.log('[REQ] /api/country/:countryId/details', { query: req.query, body: req.body });
  let sql = `
    SELECT 
      c.name,
      c.currency,
      c.iso_code,
      SUM(mc.quantity_purchased) AS total_medicines,
      AVG(mc.sale_price) AS avg_price,
      MAX(CASE WHEN mc.sale_price IS NULL THEN 1 ELSE 0 END) AS using_reference_price
    FROM medicine_countries mc
    JOIN countries c ON mc.country_id = c.id
    WHERE c.id = ?
  `;
  
  const params = [req.params.countryId];
  
  if (req.query.date) {
    sql += ` AND DATE(mc.month) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mc.month) >= ?`;
    params.push(req.query.start);
    
    if (req.query.end) {
      sql += ` AND DATE(mc.month) <= ?`;
      params.push(req.query.end);
    }
  } else if (req.query.month) {
    sql += ` AND DATE_FORMAT(mc.month, '%Y-%m') = ?`;
    params.push(req.query.month);
  }
  
  sql += ` GROUP BY c.id;`;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching country details:", err);
      return res.status(500).json({ error: "Database error" });
    }
    const countryDetails = results[0] || null; // Get the first row or null
    if (countryDetails) {
       // Ensure iso_code is included
       countryDetails.iso_code = results[0].iso_code;
      // Format the price if it exists
      if (countryDetails.avg_price !== undefined && countryDetails.avg_price !== null) {
        countryDetails.avg_price = parseFloat(countryDetails.avg_price);
      }
    }
    console.log(`Country details for ${req.params.countryId} with month filter: ${req.query.month || 'none'}`, countryDetails);
    res.json(countryDetails);
  });
});

// Get country medicines
app.get("/api/country/:countryId/medicines", (req, res) => {
  console.log('[REQ] /api/country/:countryId/medicines', { query: req.query, body: req.body });
  let sql = `
    SELECT 
      c.name AS country, 
      c.currency, 
      m.name, 
      m.dosage, 
      mc.quantity_purchased, 
      mc.reference_price,
      mc.pills_per_package,
      mc.sale_price
    FROM medicine_countries mc
    JOIN countries c ON mc.country_id = c.id
    JOIN medicines m ON mc.medicine_id = m.id
    WHERE c.id = ?
  `;
  
  const params = [req.params.countryId];
  
  if (req.query.date) {
    sql += ` AND DATE(mc.month) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mc.month) >= ?`;
    params.push(req.query.start);
    
    if (req.query.end) {
      sql += ` AND DATE(mc.month) <= ?`;
      params.push(req.query.end);
    }
  } else if (req.query.month) {
    sql += ` AND DATE_FORMAT(mc.month, '%Y-%m') = ?`;
    params.push(req.query.month);
  }
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching medicines:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

app.get("/api/country/:countryId/summary", (req, res) => {
  console.log('[REQ] /api/country/:countryId/summary', { query: req.query, body: req.body });
  let sql = `
    SELECT 
      c.name AS country, 
      AVG(mc.sale_price) AS average_price,
      SUM(mc.quantity_purchased) AS total_quantity
    FROM medicine_countries mc
    JOIN countries c ON mc.country_id = c.id
    WHERE c.id = ?
  `;
  
  const params = [req.params.countryId];
  
  if (req.query.date) {
    sql += ` AND DATE(mc.month) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mc.month) >= ?`;
    params.push(req.query.start);
    
    if (req.query.end) {
      sql += ` AND DATE(mc.month) <= ?`;
      params.push(req.query.end);
    }
  } else if (req.query.month) {
    sql += ` AND DATE_FORMAT(mc.month, '%Y-%m') = ?`;
    params.push(req.query.month);
  }
  
  sql += ` GROUP BY c.id;`;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching summary:", err);
      return res.status(500).json({ error: "Database error" });
    }
    console.log(`Country summary for ${req.params.countryId} with month filter: ${req.query.month || 'none'}`, results[0]);
    res.json(results[0] || null);
  });
});

// Get top 5 medicines for a country
app.get("/api/country/:countryId/top-medicines", (req, res) => {
  console.log('[REQ] /api/country/:countryId/top-medicines', { query: req.query, body: req.body });
  let sql = `
    SELECT 
      m.name,
      m.dosage,
      AVG(mc.sale_price) AS originalPrice,
      AVG(mc.sale_price) AS averagePrice,
      SUM(mc.quantity_purchased) AS totalSold,
      MAX(mc.pills_per_package) AS pillsPerPackage,
      MAX(CASE WHEN mc.sale_price IS NULL THEN 1 ELSE 0 END) AS using_reference_price,
      (SELECT c.currency FROM countries c WHERE c.id = ?) AS localCurrency
    FROM medicine_countries mc
    JOIN medicines m ON mc.medicine_id = m.id
    WHERE mc.country_id = ?
  `;
  
  const params = [req.params.countryId, req.params.countryId];
  
  if (req.query.date) {
    sql += ` AND DATE(mc.month) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mc.month) >= ?`;
    params.push(req.query.start);
    
    if (req.query.end) {
      sql += ` AND DATE(mc.month) <= ?`;
      params.push(req.query.end);
    }
  } else if (req.query.month) {
    sql += ` AND DATE_FORMAT(mc.month, '%Y-%m') = ?`;
    params.push(req.query.month);
  }
  
  sql += `
    GROUP BY mc.medicine_id
    ORDER BY totalSold DESC
    LIMIT 5;
  `;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching top medicines:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    // Format prices consistently
    results.forEach(medicine => {
      medicine.averagePrice = formatPrice(medicine.averagePrice);
      medicine.originalPrice = formatPrice(medicine.originalPrice);
    });
    
    console.log(`Top medicines for ${req.params.countryId} with month filter: ${req.query.month || 'none'}`);
    res.json(results);
  });
});

// Get medicine details (with date/month/range filtering)
app.get("/api/medicines/:medicineId", (req, res) => {
  console.log('[REQ] /api/medicines/:medicineId', { query: req.query, body: req.body });
  let sql = `
    SELECT 
      m.id, m.name, m.dosage,
      AVG(mc.sale_price) AS avg_price,
      SUM(mc.quantity_purchased) AS total_quantity,
      MAX(CASE WHEN mc.sale_price IS NULL THEN 1 ELSE 0 END) AS using_reference_price,
      c.currency
    FROM medicine_countries mc
    JOIN medicines m ON mc.medicine_id = m.id
    JOIN countries c ON mc.country_id = c.id
    WHERE m.id = ?
  `;
  const params = [req.params.medicineId];

  if (req.query.date) {
    sql += ` AND DATE(mc.month) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mc.month) >= ?`;
    params.push(req.query.start);
    if (req.query.end) {
      sql += ` AND DATE(mc.month) <= ?`;
      params.push(req.query.end);
    }
  } else if (req.query.month) {
    sql += ` AND DATE_FORMAT(mc.month, '%Y-%m') = ?`;
    params.push(req.query.month);
  }

  sql += ` GROUP BY m.id, c.currency`;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching medicine details:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results[0] || null);
  });
});

// Get countries where this medicine is available (with date/month/range filtering)
app.get("/api/medicines/:medicineId/countries", (req, res) => {
  console.log('[REQ] /api/medicines/:medicineId/countries', { query: req.query, body: req.body });
  let sql = `
    SELECT 
      c.id, c.name, c.currency,
      SUM(mc.quantity_purchased) AS total_quantity,
      AVG(mc.sale_price) AS avg_price
    FROM medicine_countries mc
    JOIN countries c ON mc.country_id = c.id
    WHERE mc.medicine_id = ?
  `;
  const params = [req.params.medicineId];

  if (req.query.date) {
    sql += ` AND DATE(mc.month) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mc.month) >= ?`;
    params.push(req.query.start);
    if (req.query.end) {
      sql += ` AND DATE(mc.month) <= ?`;
      params.push(req.query.end);
    }
  } else if (req.query.month) {
    sql += ` AND DATE_FORMAT(mc.month, '%Y-%m') = ?`;
    params.push(req.query.month);
  }

  sql += ` GROUP BY c.id`;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching medicine countries:", err);
      return res.status(500).json({ error: "Database error" });
    }
    // Ensure avg_price is always a number or null
    const fixedResults = results.map(row => ({
      ...row,
      avg_price: row.avg_price !== null ? Number(row.avg_price) : null
    }));
    res.json(fixedResults);
  });
});

// Get available months for a specific medicine
app.get("/api/medicines/:medicineId/available-months", (req, res) => {
  console.log('[REQ] /api/medicines/:medicineId/available-months', { query: req.query, body: req.body });
  const sql = `
    SELECT DISTINCT DATE_FORMAT(month, '%Y-%m') as available_month
    FROM medicine_countries
    WHERE medicine_id = ?
    ORDER BY available_month DESC
  `;
  db.query(sql, [req.params.medicineId], (err, results) => {
    if (err) {
      console.error("Error fetching available months for medicine:", err);
      return res.status(500).json({ error: "Database error" });
    }
    const months = results.map(row => row.available_month);
    res.json(months);
  });
});

// Start server
server.listen(port, () => {
  console.log(`Server with WebSockets running on port ${port}`);
});

module.exports = {
  startServer: () => {
    server.listen(port, () => {
      console.log(`Server with WebSockets running on port ${port}`);
    });
    return server;
  }
};

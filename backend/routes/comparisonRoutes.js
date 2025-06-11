const express = require("express");
const router = express.Router();
const db = require("../db");
const { formatPrice } = require("../utils/priceUtils");

// Helper function to format dates consistently
const formatDateForQuery = (dateString) => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
};

// Get available months for the date picker
router.get("/available-months", (req, res) => {
  const sql = `
    SELECT DISTINCT DATE_FORMAT(month, '%Y-%m') as month
    FROM medicine_countries
    WHERE month IS NOT NULL
    ORDER BY month DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching available months:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    const months = results.map(row => row.month);
    res.json(months);
  });
});

// Get historical average prices for a country by month
router.get("/country/:id/historical-prices", (req, res) => {
  const countryId = req.params.id;
  
  // Basic validation
  if (!countryId || isNaN(countryId)) {
    return res.status(400).json({ error: "Invalid country ID" });
  }

  const sql = `
    SELECT 
      DATE_FORMAT(month, '%Y-%m') as month,
      AVG(COALESCE(sale_price, reference_price)) as average_price
    FROM medicine_countries
    WHERE country_id = ? AND month IS NOT NULL
    GROUP BY DATE_FORMAT(month, '%Y-%m')
    ORDER BY month ASC
  `;

  db.query(sql, [countryId], (err, results) => {
    if (err) {
      console.error(`Error fetching historical prices for country ${countryId}:`, err);
      return res.status(500).json({ error: "Database error" });
    }
    // Ensure average_price is a number
    const formattedResults = results.map(row => ({
      month: row.month,
      average_price: parseFloat(row.average_price) || 0
    }));

    res.json(formattedResults);
  });
});

// Search countries endpoint - FIXED: proper filtering and parameter handling
router.get("/countries", (req, res) => {
  console.log('[REQ] /api/comparison/countries', { query: req.query, body: req.body });
  
  const { q, month, date, medicines, countries } = req.query;
  
  // Build the main WHERE clause
  let mainWhereConditions = [];
  let mainParams = [];

  // Add country name search filter
  if (q && q.trim()) {
    mainWhereConditions.push("c.name LIKE ?");
    mainParams.push(`%${q.trim()}%`);
  }
  
  // Add country ID filter (if provided)
  if (countries) {
      const countryIds = countries.split(',').filter(id => id.trim());
      if (countryIds.length > 0) {
        const placeholders = countryIds.map(() => '?').join(',');
        mainWhereConditions.push(`c.id IN (${placeholders})`);
        mainParams.push(...countryIds);
      }
  }

  // Add filter for countries that have the selected medicines in the selected time period
  if (medicines) {
    const medicineIds = medicines.split(',').filter(id => id.trim());
    if (medicineIds.length > 0) {
      const placeholders = medicineIds.map(() => '?').join(',');
      
      let medicineCountrySubqueryConditions = [`mc.medicine_id IN (${placeholders})`];
      let medicineCountrySubqueryparams = [...medicineIds];

       // Add date filtering to the subquery
      if (month && month !== 'all') {
        medicineCountrySubqueryConditions.push("DATE_FORMAT(mc.month, '%Y-%m') = ?");
        medicineCountrySubqueryparams.push(month);
      } else if (date) {
        const formattedDate = formatDateForQuery(date);
        if (formattedDate) {
          medicineCountrySubqueryConditions.push("DATE(mc.month) = ?");
          medicineCountrySubqueryparams.push(formattedDate);
        }
      }

      const medicineCountrySubqueryWhere = medicineCountrySubqueryConditions.length > 0 
        ? `WHERE ${medicineCountrySubqueryConditions.join(' AND ')}` : '';

      mainWhereConditions.push(`c.id IN (SELECT DISTINCT mc.country_id FROM medicine_countries mc ${medicineCountrySubqueryWhere})`);
      mainParams.push(...medicineCountrySubqueryparams);
    }
  }
  
  const finalWhereClause = mainWhereConditions.length > 0 ? `WHERE ${mainWhereConditions.join(' AND ')}` : '';
  const finalParams = mainParams;

  const sql = `
    SELECT 
      c.id, 
      c.name, 
      c.currency,
      (
        SELECT AVG(COALESCE(mc.sale_price, mc.reference_price))
        FROM medicine_countries mc
        WHERE mc.country_id = c.id
      ) AS averagePrice,
      (
        SELECT COUNT(DISTINCT mc.medicine_id)
        FROM medicine_countries mc
        WHERE mc.country_id = c.id
      ) AS totalMedicines
    FROM countries c
    ${finalWhereClause}
    ORDER BY c.name
    LIMIT 20
  `;
  
  // Parameters for the subqueries (averagePrice and totalMedicines)
  // These need the date and medicine parameters
  let subqueryParams = [];
   // Add date and medicine params for the AVG subquery
  if (month && month !== 'all') {
    subqueryParams.push(month);
  } else if (date) {
    const formattedDate = formatDateForQuery(date);
    if (formattedDate) {
      subqueryParams.push(formattedDate);
    }
  }
  if (medicines) {
      const medicineIds = medicines.split(',').filter(id => id.trim());
       if (medicineIds.length > 0) {
            subqueryParams.push(...medicineIds);
       }
  }

  // Add date and medicine params again for the COUNT subquery
   if (month && month !== 'all') {
    subqueryParams.push(month);
  } else if (date) {
    const formattedDate = formatDateForQuery(date);
    if (formattedDate) {
      subqueryParams.push(formattedDate);
    }
  }
  if (medicines) {
      const medicineIds = medicines.split(',').filter(id => id.trim());
       if (medicineIds.length > 0) {
            subqueryParams.push(...medicineIds);
       }
  }

  // Combine main query parameters with subquery parameters
  const allParams = [...finalParams, ...subqueryParams];

  console.log('Executing SQL for /countries:', sql);
  console.log('Parameters for /countries:', allParams);

  db.query(sql, allParams, (err, results) => {
    if (err) {
      console.error("Error searching countries:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    const formattedResults = results.map(row => ({
      id: row.id,
      name: row.name,
      currency: row.currency,
      averagePrice: row.averagePrice ? parseFloat(row.averagePrice) : null,
      totalMedicines: parseInt(row.totalMedicines) || 0
    }));
    
    res.json(formattedResults);
  });
});

// Get historical global average prices for a medicine by month
router.get("/medicines/:id/historical-prices", (req, res) => {
  const medicineId = req.params.id;
  
  // Basic validation
  if (!medicineId || isNaN(medicineId)) {
    return res.status(400).json({ error: "Invalid medicine ID" });
  }

  // We'll calculate the average price across all countries for this medicine by month
  const sql = `
    SELECT 
      DATE_FORMAT(month, '%Y-%m') as month,
      AVG(COALESCE(sale_price, reference_price)) as average_price_usd
    FROM medicine_countries
    WHERE medicine_id = ? AND month IS NOT NULL
    GROUP BY DATE_FORMAT(month, '%Y-%m')
    ORDER BY month ASC
  `;

  db.query(sql, [medicineId], (err, results) => {
    if (err) {
      console.error(`Error fetching historical prices for medicine ${medicineId}:`, err);
      return res.status(500).json({ error: "Database error" });
    }
     // Ensure average_price_usd is a number
    const formattedResults = results.map(row => ({
      month: row.month,
      average_price_usd: parseFloat(row.average_price_usd) || 0
    }));

    res.json(formattedResults);
  });
});

// Search medicines endpoint - FIXED: proper filtering and parameter handling
router.get("/medicines", (req, res) => {
  const { q, countries, medicines, month, date, start, end } = req.query;
  let whereClause = "";
  let params = [];
  
  // Build WHERE clause for medicine name/dosage search
  if (q && q.trim()) {
    whereClause = "WHERE m.name LIKE ? OR m.dosage LIKE ?";
    params.push(`%${q.trim()}%`, `%${q.trim()}%`);
  }
  
  // Build date filter for medicine filtering
  let dateFilter = "";
  let dateParams = [];
  if (month && month !== 'all') {
    dateFilter = "AND DATE_FORMAT(mc.month, '%Y-%m') = ?";
    dateParams.push(month);
  } else if (date) {
    const formattedDate = formatDateForQuery(date);
    if (formattedDate) {
      dateFilter = "AND DATE(mc.month) = ?";
      dateParams.push(formattedDate);
    }
  } else if (start && end) {
    const formattedStart = formatDateForQuery(start);
    const formattedEnd = formatDateForQuery(end);
    if (formattedStart && formattedEnd) {
      dateFilter = "AND mc.month BETWEEN ? AND ?";
      dateParams.push(`${formattedStart}-01`, `${formattedEnd}-01`);
    } else if (formattedStart) {
      dateFilter = "AND mc.month >= ?";
      dateParams.push(`${formattedStart}-01`);
    }
  }
  
  // Build country filter
  if (countries) {
    const countryIds = countries.split(',').filter(id => id.trim());
    if (countryIds.length > 0) {
      const placeholders = countryIds.map(() => '?').join(',');
      const countryWhereClause = `m.id IN (
        SELECT DISTINCT mc.medicine_id 
        FROM medicine_countries mc 
        WHERE mc.country_id IN (${placeholders}) ${dateFilter}
      )`;
      
      if (whereClause) {
        whereClause += ` AND ${countryWhereClause}`;
        params.push(...countryIds);
      } else {
        whereClause = `WHERE ${countryWhereClause}`;
        params = countryIds;
      }
      // Add date params for the subquery if present
      if (dateParams.length > 0) {
        params.push(...dateParams);
      }
    }
  }

  // Build medicine filter (for excluding already selected medicines)
  if (medicines) {
    const medicineIds = medicines.split(',').filter(id => id.trim());
    if (medicineIds.length > 0) {
      const placeholders = medicineIds.map(() => '?').join(',');
      const medicineWhereClause = `m.id NOT IN (${placeholders})`; // Use NOT IN for excluding
      
      if (whereClause) {
        whereClause += ` AND ${medicineWhereClause}`;
        params.push(...medicineIds);
      } else {
        whereClause = `WHERE ${medicineWhereClause}`;
        params = medicineIds;
      }
    }
  }

  const sql = `
    SELECT DISTINCT
      m.id,
      m.name,
      m.dosage,
      (
        SELECT COUNT(DISTINCT mc.country_id)
        FROM medicine_countries mc
        WHERE mc.medicine_id = m.id
        ${dateFilter}
      ) as available_countries
    FROM medicines m
    ${whereClause}
    ORDER BY m.name
    LIMIT 20
  `;

  // Add date params for the available_countries subquery
  if (dateParams.length > 0) {
    params.push(...dateParams);
  }

  console.log('Executing SQL for /medicines:', sql);
  console.log('Parameters for /medicines:', params);

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error searching medicines:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// Get all countries endpoint - FIXED: using COALESCE for price handling
router.get("/all-countries", (req, res) => {
  const { month, date } = req.query;
  
  // Build date filter for subqueries
  let dateFilter = "";
  let params = [];
  
  if (month && month !== 'all') {
    dateFilter = "AND DATE_FORMAT(mc.month, '%Y-%m') = ?";
    params.push(month, month); // Two subqueries need the month parameter
  } else if (date) {
    const formattedDate = formatDateForQuery(date);
    if (formattedDate) {
      dateFilter = "AND DATE(mc.month) = ?";
      params.push(formattedDate, formattedDate); // Two subqueries need the date parameter
    }
  }
  
  const sql = `
    SELECT 
      c.id, 
      c.name, 
      c.currency,
      (
        SELECT AVG(COALESCE(mc.sale_price, mc.reference_price))
        FROM medicine_countries mc
        WHERE mc.country_id = c.id
        ${dateFilter}
      ) AS averagePrice,
      (
        SELECT COUNT(DISTINCT mc.medicine_id)
        FROM medicine_countries mc
        WHERE mc.country_id = c.id
      ) AS totalMedicines
    FROM countries c
    ORDER BY c.name
  `;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching all countries:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    const formattedResults = results.map(row => ({
      id: row.id,
      name: row.name,
      currency: row.currency,
      averagePrice: row.averagePrice ? parseFloat(row.averagePrice) : null,
      totalMedicines: parseInt(row.totalMedicines) || 0
    }));
    
    res.json(formattedResults);
  });
});

// Get all medicines endpoint - FIXED: using COALESCE for price handling
router.get("/all-medicines", (req, res) => {
  const sql = `
    SELECT 
      m.id,
      m.name,
      m.dosage,
      (
        SELECT AVG(COALESCE(mc.sale_price, mc.reference_price))
        FROM medicine_countries mc
        WHERE mc.medicine_id = m.id
      ) AS averagePrice,
      (
        SELECT COUNT(DISTINCT mc.country_id)
        FROM medicine_countries mc
        WHERE mc.medicine_id = m.id
      ) AS countryCount
    FROM medicines m
    ORDER BY m.name
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching all medicines:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    const formattedResults = results.map(row => ({
      id: row.id,
      name: row.name,
      dosage: row.dosage,
      averagePrice: row.averagePrice ? parseFloat(row.averagePrice) : null,
      countryCount: parseInt(row.countryCount) || 0
    }));
    
    res.json(formattedResults);
  });
});

// Add the comparison endpoint that was missing
router.get("/compare", (req, res) => {
  const { medicines, countries, month, date } = req.query;
  
  if (!medicines || !countries) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const medicineIds = medicines.split(',').filter(id => id.trim());
  const countryIds = countries.split(',').filter(id => id.trim());

  // Build date filter
  let dateFilter = "";
  let dateParams = [];
  if (month && month !== 'all') {
    dateFilter = "AND DATE_FORMAT(mc.month, '%Y-%m') = ?";
    dateParams.push(month);
  } else if (date) {
    const formattedDate = formatDateForQuery(date);
    if (formattedDate) {
      dateFilter = "AND DATE(mc.month) = ?";
      dateParams.push(formattedDate);
    }
  }

  // Get current prices
  const currentPricesSql = `
    SELECT 
      m.id as medicine_id,
      m.name as medicine,
      c.id as country_id,
      c.name as country,
      c.currency,
      mc.sale_price as price,
      mc.month,
      mc.reference_price
    FROM medicines m
    CROSS JOIN countries c
    LEFT JOIN medicine_countries mc ON mc.medicine_id = m.id AND mc.country_id = c.id
    WHERE m.id IN (${medicineIds.map(() => '?').join(',')})
    AND c.id IN (${countryIds.map(() => '?').join(',')})
    ${dateFilter}
    ORDER BY m.name, c.name
  `;

  // Get historical prices for trend data
  const trendDataSql = `
    SELECT 
      m.id as medicine_id,
      c.id as country_id,
      mc.sale_price as price,
      mc.month,
      c.currency
    FROM medicines m
    CROSS JOIN countries c
    LEFT JOIN medicine_countries mc ON mc.medicine_id = m.id AND mc.country_id = c.id
    WHERE m.id IN (${medicineIds.map(() => '?').join(',')})
    AND c.id IN (${countryIds.map(() => '?').join(',')})
    AND mc.month IS NOT NULL
    ORDER BY mc.month DESC
  `;

  const currentParams = [...medicineIds, ...countryIds, ...dateParams];
  const trendParams = [...medicineIds, ...countryIds];

  // Execute both queries
  db.query(currentPricesSql, currentParams, (err, currentResults) => {
    if (err) {
      console.error("Error fetching current prices:", err);
      return res.status(500).json({ error: "Database error" });
    }

    db.query(trendDataSql, trendParams, (err, trendResults) => {
      if (err) {
        console.error("Error fetching trend data:", err);
        return res.status(500).json({ error: "Database error" });
      }

      // Process and combine the results
      const processedData = currentResults.map(row => {
        const trendData = trendResults
          .filter(trend => 
            trend.medicine_id === row.medicine_id && 
            trend.country_id === row.country_id
          )
          .map(trend => ({
            month: trend.month,
            price: trend.price,
            currency: trend.currency
          }));

        return {
          medicine_id: row.medicine_id,
          medicine: row.medicine,
          country_id: row.country_id,
          country: row.country,
          price: row.price,
          currency: row.currency,
          month: row.month,
          reference_price: row.reference_price,
          trendData: trendData
        };
      });

      res.json(processedData);
    });
  });
});

module.exports = router;

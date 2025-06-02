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
        ${dateFilter}
        ${medicineFilter}
      ) AS averagePrice,
      (
        SELECT COUNT(DISTINCT mc.medicine_id)
        FROM medicine_countries mc
        WHERE mc.country_id = c.id
        ${dateFilter}
        ${medicineFilter}
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

// Search medicines endpoint - FIXED: proper filtering and parameter handling
router.get("/medicines", (req, res) => {
  const { q, countries, medicines, month, date, start, end } = req.query; // Added date/month params
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
      dateParams.push(`${formattedStart}-01`, `${formattedEnd}-01`); // Assuming month is stored as YYYY-MM-DD, use the first day of the month
    } else if (formattedStart) { // Handle case with only start date for range
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
    ${whereClause}
    ORDER BY m.name
    LIMIT 20
  `;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error searching medicines:", err);
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
  
  if (!medicines && !countries) {
    return res.status(400).json({ error: "At least one medicine or country must be specified" });
  }
  
  let whereConditions = [];
  let params = [];
  
  // Build filters
  if (medicines) {
    const medicineIds = medicines.split(',').filter(id => id.trim());
    if (medicineIds.length > 0) {
      const placeholders = medicineIds.map(() => '?').join(',');
      whereConditions.push(`mc.medicine_id IN (${placeholders})`);
      params.push(...medicineIds);
    }
  }
  
  if (countries) {
    const countryIds = countries.split(',').filter(id => id.trim());
    if (countryIds.length > 0) {
      const placeholders = countryIds.map(() => '?').join(',');
      whereConditions.push(`mc.country_id IN (${placeholders})`);
      params.push(...countryIds);
    }
  }
  
  // Build date filter
  if (month && month !== 'all') {
    whereConditions.push("DATE_FORMAT(mc.month, '%Y-%m') = ?");
    params.push(month);
  } else if (date) {
    const formattedDate = formatDateForQuery(date);
    if (formattedDate) {
      whereConditions.push("DATE(mc.month) = ?");
      params.push(formattedDate);
    }
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  const sql = `
    SELECT 
      m.id as medicine_id,
      m.name as medicine_name,
      m.dosage,
      c.id as country_id,
      c.name as country_name,
      c.currency,
      mc.month,
      COALESCE(mc.sale_price, mc.reference_price) as price,
      mc.quantity_purchased,
      mc.pills_per_package
    FROM medicine_countries mc
    JOIN medicines m ON mc.medicine_id = m.id
    JOIN countries c ON mc.country_id = c.id
    ${whereClause}
    ORDER BY m.name, c.name, mc.month DESC
  `;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching comparison data:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    const formattedResults = results.map(row => ({
      medicineId: row.medicine_id,
      medicineName: row.medicine_name,
      dosage: row.dosage,
      countryId: row.country_id,
      countryName: row.country_name,
      currency: row.currency,
      month: row.month,
      price: row.price ? parseFloat(row.price) : null,
      quantity: parseInt(row.quantity_purchased) || 0,
      pillsPerPackage: parseInt(row.pills_per_package) || 1
    }));
    
    res.json(formattedResults);
  });
});

module.exports = router;

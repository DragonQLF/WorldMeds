
const express = require("express");
const router = express.Router();
const db = require("../db");
const { formatPrice } = require("../utils/priceUtils");

// Get all medicines for the comparison dropdown
router.get("/medicines", (req, res) => {
  const sql = `
    SELECT 
      id,
      name,
      dosage as active_ingredient
    FROM medicines
    ORDER BY name
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching medicines for comparison:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    res.json(results);
  });
});

// Get all countries for the comparison selection
router.get("/countries", (req, res) => {
  const sql = `
    SELECT 
      id,
      name,
      currency
    FROM countries
    ORDER BY name
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching countries for comparison:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    res.json(results);
  });
});

// Get countries that have data for specific medicines
router.get("/available-countries", (req, res) => {
  const { medicineIds } = req.query;
  
  if (!medicineIds) {
    return res.status(400).json({ error: "Medicine IDs are required" });
  }
  
  // Parse medicine IDs from comma-separated string
  const medIds = medicineIds.split(",");
  
  // Use a more efficient query to find countries that have ALL selected medicines
  const placeholders = medIds.map(() => "?").join(",");
  const sql = `
    SELECT 
      c.id,
      c.name,
      c.currency
    FROM countries c
    WHERE c.id IN (
      SELECT mc.country_id
      FROM medicine_countries mc
      WHERE mc.medicine_id IN (${placeholders})
      GROUP BY mc.country_id
      HAVING COUNT(DISTINCT mc.medicine_id) = ?
    )
    ORDER BY c.name
  `;
  
  db.query(sql, [...medIds, medIds.length], (err, results) => {
    if (err) {
      console.error("Error fetching available countries:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    res.json(results);
  });
});

// Get comparison data for specific medicine(s) across countries
router.get("/data", (req, res) => {
  const { medicineIds, countries, mode } = req.query;
  
  if (!medicineIds) {
    return res.status(400).json({ error: "Medicine ID is required" });
  }
  
  // Parse medicine IDs and countries from comma-separated strings
  const medIds = medicineIds.split(",");
  const countryIds = countries ? countries.split(",") : [];
  const comparisonMode = mode || "medicine"; // Default to medicine comparison mode
  
  let sql, params;
  
  if (comparisonMode === "medicine" || countryIds.length > 1) {
    // Compare medicine(s) across multiple countries
    sql = `
      SELECT 
        c.id AS countryId,
        c.name AS country,
        c.currency,
        m.id AS medicineId,
        m.name AS medicine,
        m.dosage AS activeIngredient,
        mc.sale_price AS price,
        mc.month,
        mc.pills_per_package
      FROM medicine_countries mc
      JOIN countries c ON mc.country_id = c.id
      JOIN medicines m ON mc.medicine_id = m.id
      WHERE mc.medicine_id IN (?)
    `;
    
    params = [medIds];
    
    if (countryIds.length > 0) {
      sql += ` AND c.id IN (?)`;
      params.push(countryIds);
    }
  } else if (comparisonMode === "country" && countryIds.length === 1) {
    // Compare multiple medicines within a single country
    sql = `
      SELECT 
        c.id AS countryId,
        c.name AS country,
        c.currency,
        m.id AS medicineId,
        m.name AS medicine,
        m.dosage AS activeIngredient,
        mc.sale_price AS price,
        mc.month,
        mc.pills_per_package
      FROM medicine_countries mc
      JOIN medicines m ON mc.medicine_id = m.id
      JOIN countries c ON mc.country_id = c.id
      WHERE c.id = ?
    `;
    
    params = [countryIds[0]];
    
    if (medIds.length > 0) {
      sql += ` AND mc.medicine_id IN (?)`;
      params.push(medIds);
    }
  }
  
  sql += ` ORDER BY mc.month DESC, m.name`;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching comparison data:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    // Group results to build response data
    const responseData = [];
    const groupedData = {};
    
    // Handle case where results might be empty
    if (!results || results.length === 0) {
      return res.json([]);
    }
    
    results.forEach(row => {
      const key = comparisonMode === "medicine" ? 
        `country_${row.countryId}_medicine_${row.medicineId}` : 
        `medicine_${row.medicineId}_country_${row.countryId}`;
      
      if (!groupedData[key]) {
        groupedData[key] = {
          countryId: row.countryId,
          country: row.country,
          medicineId: row.medicineId,
          medicine: row.medicine,
          activeIngredient: row.activeIngredient,
          currency: row.currency,
          price: row.price,
          pillsPerPackage: row.pills_per_package,
          trendData: []
        };
      }
      
      const month = new Date(row.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      // Add to trend data if not already added for this month
      const existingMonth = groupedData[key].trendData.find(item => item.month === month);
      if (!existingMonth) {
        groupedData[key].trendData.push({
          month,
          price: formatPrice(row.price)
        });
      }
    });
    
    // Convert to array format
    Object.values(groupedData).forEach(item => {
      responseData.push(item);
    });
    
    res.json(responseData);
  });
});

module.exports = router;

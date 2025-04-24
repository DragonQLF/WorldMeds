const express = require("express");
const db = require("./db");
const cors = require("cors");
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const { authenticateOptional } = require('./middleware/auth');
const multer = require("multer");
const config = require('./config');

const app = express();
const port = config.PORT;

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

// ✅ Get global average medicine price - Moving this before user routes so it doesn't require auth
app.get("/api/global-average-medicine-price", (req, res) => {
  let sql = `
    SELECT AVG(overall_average) AS global_average FROM (
      SELECT p.id,
        (
          SELECT AVG(sub.avg_price) FROM (
            SELECT AVG(mp.preco_venda) AS avg_price
            FROM medicamentos_paises mp
            WHERE mp.pais_id = p.id
  `;
  
  const params = [];
  
  if (req.query.date) {
    sql += ` AND DATE(mp.mes) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mp.mes) >= ?`;
    params.push(req.query.start);
    
    if (req.query.end) {
      sql += ` AND DATE(mp.mes) <= ?`;
      params.push(req.query.end);
    }
  }
  
  sql += `
            GROUP BY mp.medicamento_id
            ORDER BY SUM(mp.quantidade_comprada) DESC
            LIMIT 5
          ) AS sub
        ) AS overall_average
      FROM paises p
    ) AS t;
  `;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching global average:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results[0]);
  });
});

// New Endpoint: Get average prices for all countries - Moving this before user routes so it doesn't require auth
app.get("/api/countries-average-prices", (req, res) => {
  let sql = `
    SELECT 
      p.id AS countryId,
      p.nome AS countryName,
      (
        SELECT AVG(sub.avg_price)
        FROM (
          SELECT AVG(mp.preco_venda) AS avg_price
          FROM medicamentos_paises mp
          WHERE mp.pais_id = p.id
  `;
  
  const params = [];
  
  if (req.query.date) {
    sql += ` AND DATE(mp.mes) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mp.mes) >= ?`;
    params.push(req.query.start);
    
    if (req.query.end) {
      sql += ` AND DATE(mp.mes) <= ?`;
      params.push(req.query.end);
    }
  }
  
  sql += `
          GROUP BY mp.medicamento_id
          ORDER BY SUM(mp.quantidade_comprada) DESC
          LIMIT 5
        ) AS sub
      ) AS averagePrice,
      (
        SELECT SUM(mp2.quantidade_comprada)
        FROM medicamentos_paises mp2
        WHERE mp2.pais_id = p.id
  `;
  
  if (req.query.date) {
    sql += ` AND DATE(mp2.mes) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mp2.mes) >= ?`;
    params.push(req.query.start);
    
    if (req.query.end) {
      sql += ` AND DATE(mp2.mes) <= ?`;
      params.push(req.query.end);
    }
  }
  
  sql += `
      ) AS totalMedicines
    FROM paises p;
  `;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching countries averages:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// Use auth routes
app.use('/api', authRoutes);

// Use user routes
app.use('/api', userRoutes);

// ✅ Get all countries
app.get("/api/countries", (req, res) => {
  const sql = "SELECT id, nome AS name, moeda AS currency FROM paises";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching countries:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// ✅ Get country average medicine price
app.get("/api/country/:countryId/average-medicine-price", (req, res) => {
  let sql = `
    SELECT AVG(avg_price) AS overall_average FROM (
      SELECT AVG(mp.preco_venda) AS avg_price
      FROM medicamentos_paises mp
      WHERE mp.pais_id = ?
  `;
  
  const params = [req.params.countryId];
  
  if (req.query.date) {
    sql += ` AND DATE(mp.mes) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mp.mes) >= ?`;
    params.push(req.query.start);
    
    if (req.query.end) {
      sql += ` AND DATE(mp.mes) <= ?`;
      params.push(req.query.end);
    }
  }
  
  sql += `
      GROUP BY mp.medicamento_id
      ORDER BY SUM(mp.quantidade_comprada) DESC
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

// ✅ Get country details
app.get("/api/country/:countryId/details", (req, res) => {
  let sql = `
    SELECT 
      p.nome AS name,
      p.moeda AS currency,
      SUM(mp.quantidade_comprada) AS total_medicines,
      AVG(COALESCE(
        mp.preco_venda / NULLIF(mp.quantidade_comprada, 0), 
        mp.preco_referencia / NULLIF(mp.quantidade_comprada, 0)
      )) AS avg_price,
      MAX(CASE WHEN mp.preco_venda IS NULL THEN 1 ELSE 0 END) AS using_reference_price
    FROM medicamentos_paises mp
    JOIN paises p ON mp.pais_id = p.id
    WHERE p.id = ?
  `;
  
  const params = [req.params.countryId];
  
  if (req.query.date) {
    sql += ` AND DATE(mp.mes) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mp.mes) >= ?`;
    params.push(req.query.start);
    
    if (req.query.end) {
      sql += ` AND DATE(mp.mes) <= ?`;
      params.push(req.query.end);
    }
  }
  
  sql += ` GROUP BY p.id;`;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching country details:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results[0] || null);
  });
});

// ✅ Original endpoints from question
app.get("/api/country/:countryId/medicines", (req, res) => {
  let sql = `
    SELECT 
      p.nome AS country, 
      p.moeda AS currency, 
      m.nome AS name, 
      m.dosagem AS dosage, 
      mp.quantidade_comprada AS quantity_purchased, 
      mp.preco_referencia AS reference_price
    FROM medicamentos_paises mp
    JOIN paises p ON mp.pais_id = p.id
    JOIN medicamentos m ON mp.medicamento_id = m.id
    WHERE p.id = ?
  `;
  
  const params = [req.params.countryId];
  
  if (req.query.date) {
    sql += ` AND DATE(mp.mes) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mp.mes) >= ?`;
    params.push(req.query.start);
    
    if (req.query.end) {
      sql += ` AND DATE(mp.mes) <= ?`;
      params.push(req.query.end);
    }
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
  let sql = `
    SELECT 
      p.nome AS country, 
      AVG(mp.preco_venda) AS average_sale_price,
      SUM(mp.quantidade_comprada) AS total_quantity
    FROM medicamentos_paises mp
    JOIN paises p ON mp.pais_id = p.id
    WHERE p.id = ?
  `;
  
  const params = [req.params.countryId];
  
  if (req.query.date) {
    sql += ` AND DATE(mp.mes) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mp.mes) >= ?`;
    params.push(req.query.start);
    
    if (req.query.end) {
      sql += ` AND DATE(mp.mes) <= ?`;
      params.push(req.query.end);
    }
  }
  
  sql += ` GROUP BY p.id;`;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching summary:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results[0] || null);
  });
});

app.get("/api/medicine/:medicineId/countries", (req, res) => {
  let sql = `
    SELECT 
      m.nome AS medicine, 
      m.dosagem AS dosage, 
      p.nome AS country, 
      p.moeda AS currency, 
      mp.quantidade_comprada AS quantity_purchased, 
      mp.preco_venda AS sale_price
    FROM medicamentos_paises mp
    JOIN paises p ON mp.pais_id = p.id
    JOIN medicamentos m ON mp.medicamento_id = m.id
    WHERE m.id = ?
  `;
  
  const params = [req.params.medicineId];
  
  if (req.query.date) {
    sql += ` AND DATE(mp.mes) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mp.mes) >= ?`;
    params.push(req.query.start);
    
    if (req.query.end) {
      sql += ` AND DATE(mp.mes) <= ?`;
      params.push(req.query.end);
    }
  }
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching medicine countries:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

app.get("/api/country/:countryId/medicine/:medicineId", (req, res) => {
  let sql = `
    SELECT 
      m.nome AS medicine, 
      m.dosagem AS dosage, 
      p.nome AS country, 
      p.moeda AS currency, 
      mp.quantidade_comprada AS quantity_purchased, 
      mp.preco_referencia AS reference_price, 
      mp.preco_venda AS sale_price, 
      mp.mes AS month,
      COALESCE(
        mp.preco_venda, 
        mp.preco_referencia / NULLIF(mp.quantidade_comprada, 0)
      ) AS final_price
    FROM medicamentos_paises mp
    JOIN paises p ON mp.pais_id = p.id
    JOIN medicamentos m ON mp.medicamento_id = m.id
    WHERE p.id = ? AND m.id = ?
  `;
  
  const params = [req.params.countryId, req.params.medicineId];
  
  if (req.query.date) {
    sql += ` AND DATE(mp.mes) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mp.mes) >= ?`;
    params.push(req.query.start);
    
    if (req.query.end) {
      sql += ` AND DATE(mp.mes) <= ?`;
      params.push(req.query.end);
    }
  }
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching medicine details:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results[0] || null);
  });
});

// Updated Endpoint: Get top 5 medicines for a country
app.get("/api/country/:countryId/top-medicines", (req, res) => {
  let sql = `
    SELECT 
      m.nome AS name,
      m.dosagem AS dosage,
      AVG(COALESCE(
        mp.preco_venda / NULLIF(mp.quantidade_comprada, 0), 
        mp.preco_referencia / NULLIF(mp.quantidade_comprada, 0)
      )) AS averagePrice,
      SUM(mp.quantidade_comprada) AS totalSold,
      MAX(CASE WHEN mp.preco_venda IS NULL THEN 1 ELSE 0 END) AS using_reference_price
    FROM medicamentos_paises mp
    JOIN medicamentos m ON mp.medicamento_id = m.id
    WHERE mp.pais_id = ?
  `;
  
  const params = [req.params.countryId];
  
  if (req.query.date) {
    sql += ` AND DATE(mp.mes) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mp.mes) >= ?`;
    params.push(req.query.start);
    
    if (req.query.end) {
      sql += ` AND DATE(mp.mes) <= ?`;
      params.push(req.query.end);
    }
  }
  
  sql += `
    GROUP BY mp.medicamento_id
    ORDER BY totalSold DESC
    LIMIT 5;
  `;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching top medicines:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

app.get("/api/country/:countryId/total-medicines", (req, res) => {
  let sql = `
    SELECT SUM(mp.quantidade_comprada) AS total_medicines
    FROM medicamentos_paises mp
    WHERE mp.pais_id = ?
  `;
  
  const params = [req.params.countryId];
  
  if (req.query.date) {
    sql += ` AND DATE(mp.mes) = ?`;
    params.push(req.query.date);
  } else if (req.query.start) {
    sql += ` AND DATE(mp.mes) >= ?`;
    params.push(req.query.start);
    
    if (req.query.end) {
      sql += ` AND DATE(mp.mes) <= ?`;
      params.push(req.query.end);
    }
  }
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching total medicines:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results[0]);
  });
});

// New search endpoints
app.get("/api/search/countries", (req, res) => {
  const searchTerm = req.query.q || '';
  
  if (!searchTerm || searchTerm.length < 2) {
    return res.json([]);
  }
  
  const sql = `
    SELECT id, nome AS name 
    FROM paises 
    WHERE nome LIKE ? 
    ORDER BY nome 
    LIMIT 20
  `;
  
  db.query(sql, [`%${searchTerm}%`], (err, results) => {
    if (err) {
      console.error("Error searching countries:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

app.get("/api/search/medicines", (req, res) => {
  const searchTerm = req.query.q || '';
  
  if (!searchTerm || searchTerm.length < 2) {
    return res.json([]);
  }
  
  const sql = `
    SELECT id, nome AS name, dosagem AS dosage 
    FROM medicamentos 
    WHERE nome LIKE ? 
    ORDER BY nome 
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

// GET endpoint for data by date range
app.get("/api/data", (req, res) => {
  const { start, end } = req.query;
  
  if (!start) {
    return res.status(400).json({ error: "Start date is required" });
  }
  
  let sql = `
    SELECT 
      p.nome AS country,
      m.nome AS medicine,
      AVG(mp.preco_venda) AS average_price,
      SUM(mp.quantidade_comprada) AS total_quantity,
      mp.mes AS date
    FROM medicamentos_paises mp
    JOIN paises p ON mp.pais_id = p.id
    JOIN medicamentos m ON mp.medicamento_id = m.id
    WHERE DATE(mp.mes) >= ?
  `;
  
  const params = [start];
  
  if (end) {
    sql += ` AND DATE(mp.mes) <= ?`;
    params.push(end);
  }
  
  sql += `
    GROUP BY p.id, m.id, DATE(mp.mes)
    ORDER BY mp.mes;
  `;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching data by date range:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// New endpoint for getting price index data
app.get("/api/price-index", (req, res) => {
  const { start, end } = req.query;
  
  let sql = `
    SELECT 
      DATE(mp.mes) AS date,
      AVG(mp.preco_venda) AS average_price,
      COUNT(DISTINCT m.id) AS medicine_count,
      COUNT(DISTINCT p.id) AS country_count
    FROM medicamentos_paises mp
    JOIN paises p ON mp.pais_id = p.id
    JOIN medicamentos m ON mp.medicamento_id = m.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (start) {
    sql += ` AND DATE(mp.mes) >= ?`;
    params.push(start);
  }
  
  if (end) {
    sql += ` AND DATE(mp.mes) <= ?`;
    params.push(end);
  }
  
  sql += `
    GROUP BY DATE(mp.mes)
    ORDER BY date;
  `;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching price index:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

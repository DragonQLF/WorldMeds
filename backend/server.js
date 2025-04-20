const express = require("express");
const db = require("./db");
const cors = require("cors");

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
  const sql = `
    SELECT AVG(avg_price) AS overall_average FROM (
      SELECT AVG(mp.preco_venda) AS avg_price
      FROM medicamentos_paises mp
      WHERE mp.pais_id = ?
      GROUP BY mp.medicamento_id
      ORDER BY SUM(mp.quantidade_comprada) DESC
      LIMIT 5
    ) AS sub;
  `;
  db.query(sql, [req.params.countryId], (err, results) => {
    if (err) {
      console.error("Error fetching country average:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results[0]);
  });
});

// ✅ Get global average medicine price
app.get("/api/global-average-medicine-price", (req, res) => {
  const sql = `
    SELECT AVG(overall_average) AS global_average FROM (
      SELECT p.id,
        (
          SELECT AVG(sub.avg_price) FROM (
            SELECT AVG(mp.preco_venda) AS avg_price
            FROM medicamentos_paises mp
            WHERE mp.pais_id = p.id
            GROUP BY mp.medicamento_id
            ORDER BY SUM(mp.quantidade_comprada) DESC
            LIMIT 5
          ) AS sub
        ) AS overall_average
      FROM paises p
    ) AS t;
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching global average:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results[0]);
  });
});

// ✅ Get country details
app.get("/api/country/:countryId/details", (req, res) => {
  const sql = `
    SELECT 
      p.nome AS name,
      p.moeda AS currency,
      SUM(mp.quantidade_comprada) AS total_medicines,
      AVG(mp.preco_venda) AS avg_price
    FROM medicamentos_paises mp
    JOIN paises p ON mp.pais_id = p.id
    WHERE p.id = ?
    GROUP BY p.id;
  `;
  db.query(sql, [req.params.countryId], (err, results) => {
    if (err) {
      console.error("Error fetching country details:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results[0] || null);
  });
});

// ✅ Original endpoints from question
app.get("/api/country/:countryId/medicines", (req, res) => {
  const sql = `
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
    WHERE p.id = ?;
  `;
  db.query(sql, [req.params.countryId], (err, results) => {
    if (err) {
      console.error("Error fetching medicines:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

app.get("/api/country/:countryId/summary", (req, res) => {
  const sql = `
    SELECT 
      p.nome AS country, 
      AVG(mp.preco_venda) AS average_sale_price,
      SUM(mp.quantidade_comprada) AS total_quantity
    FROM medicamentos_paises mp
    JOIN paises p ON mp.pais_id = p.id
    WHERE p.id = ?
    GROUP BY p.id;
  `;
  db.query(sql, [req.params.countryId], (err, results) => {
    if (err) {
      console.error("Error fetching summary:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results[0] || null);
  });
});

app.get("/api/medicine/:medicineId/countries", (req, res) => {
  const sql = `
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
    WHERE m.id = ?;
  `;
  db.query(sql, [req.params.medicineId], (err, results) => {
    if (err) {
      console.error("Error fetching medicine countries:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

app.get("/api/country/:countryId/medicine/:medicineId", (req, res) => {
  const sql = `
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
      AS final_price
    FROM medicamentos_paises mp
    JOIN paises p ON mp.pais_id = p.id
    JOIN medicamentos m ON mp.medicamento_id = m.id
    WHERE p.id = ? AND m.id = ?;
  `;
  db.query(sql, [req.params.countryId, req.params.medicineId], (err, results) => {
    if (err) {
      console.error("Error fetching medicine details:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results[0] || null);
  });
});
// New Endpoint: Get average prices for all countries
app.get("/api/countries-average-prices", (req, res) => {
    const sql = `
      SELECT 
        p.id AS countryId,
        p.nome AS countryName,
        (
          SELECT AVG(sub.avg_price)
          FROM (
            SELECT AVG(mp.preco_venda) AS avg_price
            FROM medicamentos_paises mp
            WHERE mp.pais_id = p.id
            GROUP BY mp.medicamento_id
            ORDER BY SUM(mp.quantidade_comprada) DESC
            LIMIT 5
          ) AS sub
        ) AS averagePrice
      FROM paises p;
    `;
    db.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching countries averages:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(results);
    });
  });
  
  // Updated Endpoint: Get top 5 medicines for a country
  app.get("/api/country/:countryId/top-medicines", (req, res) => {
    const sql = `
      SELECT 
        m.nome AS name,
        m.dosagem AS dosage,
        AVG(mp.preco_venda) AS averagePrice,
        SUM(mp.quantidade_comprada) AS totalSold
      FROM medicamentos_paises mp
      JOIN medicamentos m ON mp.medicamento_id = m.id
      WHERE mp.pais_id = ?
      GROUP BY mp.medicamento_id
      ORDER BY totalSold DESC
      LIMIT 5;
    `;
    db.query(sql, [req.params.countryId], (err, results) => {
      if (err) {
        console.error("Error fetching top medicines:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(results);
    });
  });

  app.get("/api/country/:countryId/total-medicines", (req, res) => {
    const sql = `
      SELECT SUM(mp.quantidade_comprada) AS total_medicines
      FROM medicamentos_paises mp
      WHERE mp.pais_id = ?;
    `;
    db.query(sql, [req.params.countryId], (err, results) => {
      if (err) {
        console.error("Error fetching total medicines:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(results[0]);
    });
  });
  
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
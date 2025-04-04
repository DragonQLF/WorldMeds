const express = require("express");
const db = require("./db");

const app = express();
const port = 3001;

// Removed the duplicate database connection code

// ✅ Get all medicines for a country
app.get("/api/country/:countryId/medicines", (req, res) => {
    const sql = `
        SELECT p.nome as country, p.moeda as currency, m.nome as name, 
               m.dosagem as dosage, mp.quantidade_comprada as quantity_purchased, 
               mp.preco_referencia as reference_price
        FROM medicamentos_paises mp
        JOIN paises p ON mp.pais_id = p.id
        JOIN medicamentos m ON mp.medicamento_id = m.id
        WHERE p.id = ?;
    `;

    db.query(sql, [req.params.countryId], (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// ✅ Get a specific medicine across multiple countries
app.get("/api/medicine/:medicineId/countries", (req, res) => {
    const sql = `
        SELECT m.nome as medicine, m.dosagem as dosage, 
               p.nome as country, p.moeda as currency, 
               mp.quantidade_comprada as quantity_purchased, 
               mp.preco_referencia as reference_price
        FROM medicamentos_paises mp
        JOIN paises p ON mp.pais_id = p.id
        JOIN medicamentos m ON mp.medicamento_id = m.id
        WHERE m.id = ?;
    `;

    db.query(sql, [req.params.medicineId], (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// ✅ Get details for one medicine in one country (calculates price if sale price is NULL)
app.get("/api/country/:countryId/medicine/:medicineId", (req, res) => {
    const sql = `
        SELECT m.nome as medicine, m.dosagem as dosage, 
               p.nome as country, p.moeda as currency, 
               mp.quantidade_comprada as quantity_purchased, 
               mp.preco_referencia as reference_price, 
               mp.preco_venda as sale_price, mp.mes as month,
               COALESCE(mp.preco_venda, mp.preco_referencia / NULLIF(mp.quantidade_comprada, 0)) as final_price
        FROM medicamentos_paises mp
        JOIN paises p ON mp.pais_id = p.id
        JOIN medicamentos m ON mp.medicamento_id = m.id
        WHERE p.id = ? AND m.id = ?;
    `;

    db.query(sql, [req.params.countryId, req.params.medicineId], (err, result) => {
        if (err) throw err;
        res.json(result[0]);
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Configuração da conexão MySQL usando variáveis de ambiente
const db = mysql.createConnection({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "worldmeds_user",
  password: process.env.DB_PASSWORD || "worldmeds_password",
  database: process.env.DB_NAME || "worldmeds_db"
});

db.connect(err => {
  if (err) {
    console.error("Erro ao conectar ao MySQL:", err);
  } else {
    console.log("Conectado ao MySQL");
  }
});

// Endpoint para consultar um medicamento em vários países
app.get("/api/medicamento/:medicamentoId", (req, res) => {
  const { medicamentoId } = req.params;
  const query = `
    SELECT m.id, m.nome, m.dosagem, 
           p.nome AS pais, p.moeda, mp.mes, 
           mp.preco_referencia, 
           COALESCE(mp.preco_venda, 'Not Available') AS preco_venda,
           mp.quantidade_comprada
    FROM medicamentos_paises mp
    JOIN medicamentos m ON mp.medicamento_id = m.id
    JOIN paises p ON mp.pais_id = p.id
    WHERE m.id = ?
  `;
  db.query(query, [medicamentoId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar dados:", err);
      return res.status(500).json({ error: "Erro ao buscar os dados" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Medicamento não encontrado" });
    }
    const { id, nome, dosagem } = results[0];
    const response = {
      medicamento: { id, nome, dosagem },
      dados: results.map(row => ({
        pais: row.pais,
        moeda: row.moeda,
        mes: row.mes,
        preco_referencia: row.preco_referencia,
        preco_venda: row.preco_venda,
        quantidade_comprada: row.quantidade_comprada
      }))
    };
    res.json(response);
  });
});

// Endpoint para consultar um país com vários medicamentos
app.get("/api/pais/:paisId", (req, res) => {
  const { paisId } = req.params;
  const query = `
    SELECT p.id AS paisId, p.nome AS pais, p.moeda,
           m.id AS medicamentoId, m.nome, m.dosagem,
           mp.mes, mp.preco_referencia,
           COALESCE(mp.preco_venda, 'Not Available') AS preco_venda,
           mp.quantidade_comprada
    FROM medicamentos_paises mp
    JOIN medicamentos m ON mp.medicamento_id = m.id
    JOIN paises p ON mp.pais_id = p.id
    WHERE p.id = ?
  `;
  db.query(query, [paisId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar dados:", err);
      return res.status(500).json({ error: "Erro ao buscar os dados" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "País não encontrado ou sem registros" });
    }
    const { paisId: id, pais, moeda } = results[0];
    const response = {
      pais: { id, nome: pais, moeda },
      medicamentos: results.map(row => ({
        medicamentoId: row.medicamentoId,
        nome: row.nome,
        dosagem: row.dosagem,
        mes: row.mes,
        preco_referencia: row.preco_referencia,
        preco_venda: row.preco_venda,
        quantidade_comprada: row.quantidade_comprada
      }))
    };
    res.json(response);
  });
});

// Inicia o servidor na porta 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

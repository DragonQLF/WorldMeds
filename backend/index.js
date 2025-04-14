require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Erro no servidor" });
    if (results.length === 0) return res.json({ success: false, message: "Usuário não encontrado" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ success: false, message: "Senha incorreta" });

    res.json({ success: true, user: { id: user.id, email: user.email } });
  });
});

// SIGN UP
app.post("/signup", async (req, res) => {
  const { first_name, last_name, email, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)",
    [first_name, last_name, email, hash],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Erro ao criar conta" });
      res.json({ success: true, id: result.insertId });
    }
  );
});

// Healthcheck
app.get("/health", (req, res) => res.send("OK"));

app.listen(3001, () => console.log("Servidor rodando na porta 3001"));

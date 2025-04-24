require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// LOGIN
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Erro no servidor" });
    if (results.length === 0) return res.status(401).json({ success: false, message: "Usuário não encontrado" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: "Senha incorreta" });

    // Generate token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: user.id }, 'your-secret-key', { expiresIn: '7d' });

    // Return more user data
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role || 'user'
      },
      token
    });
  });
});

// SIGN UP
app.post("/api/signup", async (req, res) => {
  const { first_name, last_name, email, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)",
    [first_name, last_name, email, hash, 'user'],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Erro ao criar conta" });
      res.json({ success: true, id: result.insertId });
    }
  );
});

// Healthcheck
app.get("/api/health", (req, res) => res.send("OK"));

// Get user profile
app.get("/api/profile", (req, res) => {
  // Get the authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  
  // Extract the token
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify the token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, 'your-secret-key');
    
    // Get user data
    db.query("SELECT id, first_name, last_name, email, role FROM users WHERE id = ?", 
      [decoded.userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Error fetching profile" });
        if (results.length === 0) return res.status(404).json({ success: false, message: "User not found" });
        
        const user = results[0];
        
        res.json({ 
          success: true, 
          user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role || 'user'
          }
        });
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
});

// Update user profile
app.put("/api/profile", (req, res) => {
  // Get the authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  
  // Extract the token
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify the token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, 'your-secret-key');
    
    const { first_name, last_name, email } = req.body;
    
    // Validate required fields
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    
    // Check if email is already taken by another user
    db.query("SELECT id FROM users WHERE email = ? AND id != ?", 
      [email, decoded.userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Error checking email" });
        if (results.length > 0) return res.status(400).json({ success: false, message: "Email already in use" });
        
        // Update the user profile
        db.query(
          "UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?",
          [first_name, last_name, email, decoded.userId],
          (err, result) => {
            if (err) return res.status(500).json({ success: false, message: "Error updating profile" });
            
            // Get updated user data
            db.query("SELECT id, first_name, last_name, email, role FROM users WHERE id = ?", 
              [decoded.userId], (err, results) => {
                if (err) return res.status(500).json({ success: false, message: "Error fetching updated profile" });
                
                const user = results[0];
                
                res.json({ 
                  success: true, 
                  user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role || 'user'
                  }
                });
            });
          }
        );
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
});

app.listen(3001, () => console.log("Servidor rodando na porta 3001"));

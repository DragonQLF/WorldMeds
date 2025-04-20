const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "db", // Replace with actual host
    user: "worldmeds_user", // Replace with actual username
    password: "1234", // Replace with actual password
    database: "worldmeds_db", // Replace with actual database name
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed: " + err.stack);
        return;
    }
    console.log("Connected to database.");
});

module.exports = db;

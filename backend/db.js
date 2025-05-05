const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "db",
    user: "worldmeds_user",
    password: "1234",
    database: "worldmeds_db"
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:");
        console.error("Error code:", err.code);
        console.error("Error message:", err.message);
        return;
    }
    console.log("Connected to database successfully!");
});

module.exports = db;

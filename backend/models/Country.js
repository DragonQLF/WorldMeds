
const db = require('../db');

class Country {
  // Find a country by ID
  static async findById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id, name, currency FROM countries WHERE id = ?';
      db.query(query, [id], (err, results) => {
        if (err) return reject(err);
        
        if (results.length === 0) {
          return resolve(null);
        }
        
        resolve(results[0]);
      });
    });
  }

  // Get all countries
  static async findAll() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id, name, currency FROM countries ORDER BY name';
      db.query(query, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  // Create a new country
  static async create(data) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO countries (name, currency) VALUES (?, ?)';
      db.query(query, [data.name, data.currency], (err, result) => {
        if (err) return reject(err);
        
        this.findById(result.insertId)
          .then(country => resolve(country))
          .catch(err => reject(err));
      });
    });
  }

  // Update a country
  static async update(id, data) {
    return new Promise((resolve, reject) => {
      // Build the query dynamically based on what fields are being updated
      let query = 'UPDATE countries SET ';
      const queryParams = [];
      const updates = [];
      
      if (data.name !== undefined) {
        updates.push('name = ?');
        queryParams.push(data.name);
      }
      
      if (data.currency !== undefined) {
        updates.push('currency = ?');
        queryParams.push(data.currency);
      }
      
      // If there's nothing to update
      if (updates.length === 0) {
        return resolve(null);
      }
      
      query += updates.join(', ') + ' WHERE id = ?';
      queryParams.push(id);
      
      db.query(query, queryParams, (err) => {
        if (err) return reject(err);
        
        this.findById(id)
          .then(country => resolve(country))
          .catch(err => reject(err));
      });
    });
  }

  // Delete a country
  static async delete(id) {
    return new Promise((resolve, reject) => {
      // First check if there are any references to this country
      const checkQuery = 'SELECT COUNT(*) as count FROM medicine_countries WHERE country_id = ?';
      
      db.query(checkQuery, [id], (checkErr, checkResults) => {
        if (checkErr) return reject(checkErr);
        
        // If there are references, don't allow deletion
        if (checkResults[0].count > 0) {
          return reject(new Error('Cannot delete country with associated sales records'));
        }
        
        // If no references, proceed with deletion
        const deleteQuery = 'DELETE FROM countries WHERE id = ?';
        db.query(deleteQuery, [id], (err, result) => {
          if (err) return reject(err);
          resolve(result.affectedRows > 0);
        });
      });
    });
  }

  // Get medicines for a country - NEW METHOD
  static async getMedicines(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          m.id,
          m.name,
          m.dosage,
          mc.month AS lastPurchaseDate,
          mc.sale_price AS lastPrice,
          mc.quantity_purchased AS lastQuantity,
          mc.pills_per_package AS pillsPerPackage
        FROM medicines m
        JOIN medicine_countries mc ON m.id = mc.medicine_id
        WHERE mc.country_id = ?
        ORDER BY m.name ASC`;
        
      db.query(query, [id], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
}

module.exports = Country;

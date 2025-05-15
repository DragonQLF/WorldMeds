
const db = require('../db');
const { formatPrice } = require('../utils/priceUtils');

class Medicine {
  // Find a medicine by ID
  static async findById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          m.id, 
          m.name, 
          m.dosage,
          (SELECT AVG(mc.sale_price) FROM medicine_countries mc WHERE mc.medicine_id = m.id) AS averagePrice,
          (SELECT SUM(mc.quantity_purchased) FROM medicine_countries mc WHERE mc.medicine_id = m.id) AS totalQuantity
        FROM medicines m 
        WHERE m.id = ?`;
      
      db.query(query, [id], (err, results) => {
        if (err) return reject(err);
        
        if (results.length === 0) {
          return resolve(null);
        }
        
        resolve(results[0]);
      });
    });
  }

  // Get all medicines
  static async findAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          m.id, 
          m.name, 
          m.dosage,
          (SELECT AVG(mc.sale_price) FROM medicine_countries mc WHERE mc.medicine_id = m.id) AS averagePrice,
          (SELECT SUM(mc.quantity_purchased) FROM medicine_countries mc WHERE mc.medicine_id = m.id) AS totalQuantity
        FROM medicines m
        ORDER BY m.name`;
        
      db.query(query, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  // Create a new medicine
  static async create(data) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO medicines (name, dosage) VALUES (?, ?)';
      db.query(query, [data.name, data.dosage], (err, result) => {
        if (err) return reject(err);
        
        this.findById(result.insertId)
          .then(medicine => resolve(medicine))
          .catch(err => reject(err));
      });
    });
  }

  // Update a medicine
  static async update(id, data) {
    return new Promise((resolve, reject) => {
      // Build the query dynamically based on what fields are being updated
      let query = 'UPDATE medicines SET ';
      const queryParams = [];
      const updates = [];
      
      if (data.name !== undefined) {
        updates.push('name = ?');
        queryParams.push(data.name);
      }
      
      if (data.dosage !== undefined) {
        updates.push('dosage = ?');
        queryParams.push(data.dosage);
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
          .then(medicine => resolve(medicine))
          .catch(err => reject(err));
      });
    });
  }

  // Delete a medicine
  static async delete(id) {
    return new Promise((resolve, reject) => {
      // First check if there are any references to this medicine
      const checkQuery = 'SELECT COUNT(*) as count FROM medicine_countries WHERE medicine_id = ?';
      
      db.query(checkQuery, [id], (checkErr, checkResults) => {
        if (checkErr) return reject(checkErr);
        
        // If there are references, don't allow deletion
        if (checkResults[0].count > 0) {
          return reject(new Error('Cannot delete medicine with associated sales records'));
        }
        
        // If no references, proceed with deletion
        const deleteQuery = 'DELETE FROM medicines WHERE id = ?';
        db.query(deleteQuery, [id], (err, result) => {
          if (err) return reject(err);
          resolve(result.affectedRows > 0);
        });
      });
    });
  }

  // Get transactions for a medicine
  static async getTransactions(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          mc.id,
          mc.month AS saleDate,
          mc.quantity_purchased AS quantity,
          mc.sale_price AS price,
          c.name AS countryName,
          c.id AS countryId,
          c.currency AS currency,
          mc.pills_per_package AS pillsPerPackage
        FROM medicine_countries mc
        JOIN countries c ON mc.country_id = c.id
        WHERE mc.medicine_id = ?
        ORDER BY mc.month DESC
        LIMIT 100`;
        
      db.query(query, [id], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
  
  // Get countries for a medicine
  static async getCountries(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          c.id,
          c.name,
          c.currency,
          mc.month AS lastPurchaseDate,
          mc.sale_price AS lastPrice,
          mc.quantity_purchased AS lastQuantity,
          mc.pills_per_package AS pillsPerPackage
        FROM countries c
        JOIN medicine_countries mc ON c.id = mc.country_id
        WHERE mc.medicine_id = ?
        ORDER BY c.name ASC`;
        
      db.query(query, [id], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
}

module.exports = Medicine;

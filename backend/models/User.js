const db = require('../db');
const bcrypt = require('bcryptjs');

class User {
  // Find a user by their ID
  static async findById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id, first_name, last_name, email FROM users WHERE id = ?';
      db.query(query, [id], (err, results) => {
        if (err) return reject(err);
        
        if (results.length === 0) {
          return resolve(null);
        }
        
        // Format the user object to match our expected format
        const user = {
          id: results[0].id,
          firstName: results[0].first_name,
          lastName: results[0].last_name,
          email: results[0].email
        };
        
        resolve(user);
      });
    });
  }

  // Find a user by their email
  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE email = ?';
      db.query(query, [email], (err, results) => {
        if (err) return reject(err);
        
        if (results.length === 0) {
          return resolve(null);
        }
        
        // Return full user data including password (for authentication)
        resolve(results[0]);
      });
    });
  }

  // Create a new user
  static async create(userData) {
    return new Promise(async (resolve, reject) => {
      try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const query = 'INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)';
        db.query(
          query,
          [userData.firstName, userData.lastName, userData.email, hashedPassword],
          (err, result) => {
            if (err) return reject(err);
            
            // Get the user we just created
            this.findById(result.insertId)
              .then(user => resolve(user))
              .catch(err => reject(err));
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  // Update user profile
  static async updateProfile(userId, userData) {
    return new Promise((resolve, reject) => {
      // Build the query dynamically based on what fields are being updated
      let query = 'UPDATE users SET ';
      const queryParams = [];
      const updates = [];
      
      if (userData.firstName !== undefined) {
        updates.push('first_name = ?');
        queryParams.push(userData.firstName);
      }
      
      if (userData.lastName !== undefined) {
        updates.push('last_name = ?');
        queryParams.push(userData.lastName);
      }
      
      if (userData.email !== undefined) {
        updates.push('email = ?');
        queryParams.push(userData.email);
      }
      
      // If there's nothing to update
      if (updates.length === 0) {
        return resolve(null);
      }
      
      query += updates.join(', ') + ' WHERE id = ?';
      queryParams.push(userId);
      
      db.query(query, queryParams, (err) => {
        if (err) return reject(err);
        
        // Get the updated user
        this.findById(userId)
          .then(user => resolve(user))
          .catch(err => reject(err));
      });
    });
  }

  // Change user password
  static async changePassword(userId, currentPassword, newPassword) {
    return new Promise(async (resolve, reject) => {
      try {
        // First get the user to verify current password
        const query = 'SELECT password FROM users WHERE id = ?';
        db.query(query, [userId], async (err, results) => {
          if (err) return reject(err);
          
          if (results.length === 0) {
            return reject(new Error('User not found'));
          }
          
          // Verify current password
          const passwordMatch = await bcrypt.compare(currentPassword, results[0].password);
          if (!passwordMatch) {
            return reject(new Error('Current password is incorrect'));
          }
          
          // Hash new password
          const hashedPassword = await bcrypt.hash(newPassword, 10);
          
          // Update the password
          const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
          db.query(updateQuery, [hashedPassword, userId], (err) => {
            if (err) return reject(err);
            resolve(true);
          });
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = User; 
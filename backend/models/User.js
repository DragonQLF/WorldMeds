
const db = require('../db');
const bcrypt = require('bcryptjs');

class User {
  // Find a user by their ID
  static async findById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id, first_name, last_name, email, role, email_verified FROM users WHERE id = ?';
      db.query(query, [id], (err, results) => {
        if (err) return reject(err);
        
        if (results.length === 0) {
          return resolve(null);
        }
        
        const user = {
          id: results[0].id,
          first_name: results[0].first_name,
          last_name: results[0].last_name,
          firstName: results[0].first_name,
          lastName: results[0].last_name,
          email: results[0].email,
          role: results[0].role || 'user',
          email_verified: results[0].email_verified || false
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
        
        resolve(results[0]);
      });
    });
  }

  // Find user by verification token
  static async findByVerificationToken(token) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE verification_token = ? AND email_verified = false';
      db.query(query, [token], (err, results) => {
        if (err) return reject(err);
        
        if (results.length === 0) {
          return resolve(null);
        }
        
        resolve(results[0]);
      });
    });
  }

  // Find user by password reset token
  static async findByPasswordResetToken(token) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()';
      db.query(query, [token], (err, results) => {
        if (err) return reject(err);
        
        if (results.length === 0) {
          return resolve(null);
        }
        
        resolve(results[0]);
      });
    });
  }

  // Create a new user
  static async create(userData) {
    return new Promise(async (resolve, reject) => {
      try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const query = `INSERT INTO users (first_name, last_name, email, password, verification_token, email_verified) 
                       VALUES (?, ?, ?, ?, ?, ?)`;
        db.query(
          query,
          [
            userData.first_name, 
            userData.last_name, 
            userData.email, 
            hashedPassword,
            userData.verification_token || null,
            userData.email_verified || false
          ],
          (err, result) => {
            if (err) return reject(err);
            
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

  // Verify email
  static async verifyEmail(userId) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE users SET email_verified = true, verification_token = NULL WHERE id = ?';
      db.query(query, [userId], (err) => {
        if (err) return reject(err);
        resolve(true);
      });
    });
  }

  // Set password reset token
  static async setPasswordResetToken(userId, token, expiry) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?';
      db.query(query, [token, expiry, userId], (err) => {
        if (err) return reject(err);
        resolve(true);
      });
    });
  }

  // Reset password
  static async resetPassword(userId, newPassword) {
    return new Promise(async (resolve, reject) => {
      try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const query = 'UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?';
        db.query(query, [hashedPassword, userId], (err) => {
          if (err) return reject(err);
          resolve(true);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  // Update user profile
  static async updateProfile(userId, userData) {
    return new Promise((resolve, reject) => {
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
      
      if (updates.length === 0) {
        return resolve(null);
      }
      
      query += updates.join(', ') + ' WHERE id = ?';
      queryParams.push(userId);
      
      db.query(query, queryParams, (err) => {
        if (err) return reject(err);
        
        this.findById(userId)
          .then(user => resolve(user))
          .catch(err => reject(err));
      });
    });
  }

  static async changePassword(userId, currentPassword, newPassword) {
    return new Promise(async (resolve, reject) => {
      try {
        const query = 'SELECT password FROM users WHERE id = ?';
        db.query(query, [userId], async (err, results) => {
          if (err) return reject(err);
          
          if (results.length === 0) {
            return reject(new Error('User not found'));
          }
          
          const passwordMatch = await bcrypt.compare(currentPassword, results[0].password);
          if (!passwordMatch) {
            return reject(new Error('Current password is incorrect'));
          }
          
          const hashedPassword = await bcrypt.hash(newPassword, 10);
          
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

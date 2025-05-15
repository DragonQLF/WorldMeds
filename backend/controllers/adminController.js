const db = require('../db');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const Country = require('../models/Country');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Count total users
    const usersQuery = 'SELECT COUNT(*) AS userCount FROM users';
    
    // Count total medicines
    const medicinesQuery = 'SELECT COUNT(*) AS medicineCount FROM medicines';
    
    // Count total countries
    const countriesQuery = 'SELECT COUNT(*) AS countryCount FROM countries';
    
    // Get dashboard statistics
    db.query(usersQuery, (err, usersResult) => {
      if (err) {
        console.error('Error fetching user count:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      db.query(medicinesQuery, (err, medicinesResult) => {
        if (err) {
          console.error('Error fetching medicines count:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        db.query(countriesQuery, (err, countriesResult) => {
          if (err) {
            console.error('Error fetching countries count:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          
          // Return the dashboard statistics
          res.json({
            users: usersResult[0].userCount,
            medicines: medicinesResult[0].medicineCount,
            countries: countriesResult[0].countryCount,
            onlineUsers: global.onlineUsers?.size || 0,
            anonymousVisitors: global.anonymousVisitors?.size || 0,
            totalVisitors: (global.onlineUsers?.size || 0) + (global.anonymousVisitors?.size || 0)
          });
        });
      });
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// User CRUD operations
exports.getAllUsers = async (req, res) => {
  try {
    db.query(
      'SELECT id, first_name, last_name, email, role, created_at FROM users ORDER BY created_at DESC',
      (err, results) => {
        if (err) {
          console.error('Error fetching users:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Format the response to match our expected format
        const formattedResults = results.map(user => ({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          createdAt: user.created_at
        }));
        
        res.json(formattedResults);
      }
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role = 'user' } = req.body;
    
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if user already exists
    db.query('SELECT id FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error('Error checking user:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (results.length > 0) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      db.query(
        'INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
        [firstName, lastName, email, hashedPassword, role],
        (err, result) => {
          if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          
          res.status(201).json({
            id: result.insertId,
            firstName,
            lastName,
            email,
            role
          });
        }
      );
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    db.query(
      'SELECT id, first_name, last_name, email, role, created_at FROM users WHERE id = ?',
      [userId],
      (err, results) => {
        if (err) {
          console.error('Error fetching user:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        const user = results[0];
        
        res.json({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          createdAt: user.created_at
        });
      }
    );
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, email, role } = req.body;
    
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    // Check if email is already taken by another user
    db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId],
      (err, results) => {
        if (err) {
          console.error('Error checking email:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length > 0) {
          return res.status(400).json({ error: 'Email already in use by another user' });
        }
        
        // Update user
        const updateData = [firstName, lastName, email];
        let query = 'UPDATE users SET first_name = ?, last_name = ?, email = ?';
        
        if (role) {
          query += ', role = ?';
          updateData.push(role);
        }
        
        query += ' WHERE id = ?';
        updateData.push(userId);
        
        db.query(query, updateData, (err, result) => {
          if (err) {
            console.error('Error updating user:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          
          if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
          }
          
          res.json({
            id: userId,
            firstName,
            lastName,
            email,
            role: role || 'user'
          });
        });
      }
    );
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent deleting the last admin
    db.query(
      'SELECT COUNT(*) AS adminCount FROM users WHERE role = "admin"',
      (err, results) => {
        if (err) {
          console.error('Error counting admins:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        const adminCount = results[0].adminCount;
        
        if (adminCount <= 1) {
          // Check if the user to delete is an admin
          db.query(
            'SELECT role FROM users WHERE id = ?',
            [userId],
            (err, userResults) => {
              if (err) {
                console.error('Error checking user role:', err);
                return res.status(500).json({ error: 'Database error' });
              }
              
              if (userResults.length === 0) {
                return res.status(404).json({ error: 'User not found' });
              }
              
              const userRole = userResults[0].role;
              
              if (userRole === 'admin' && adminCount <= 1) {
                return res.status(400).json({ error: 'Cannot delete the last admin user' });
              }
              
              // Delete user
              db.query('DELETE FROM users WHERE id = ?', [userId], (err, result) => {
                if (err) {
                  console.error('Error deleting user:', err);
                  return res.status(500).json({ error: 'Database error' });
                }
                
                if (result.affectedRows === 0) {
                  return res.status(404).json({ error: 'User not found' });
                }
                
                res.json({ success: true, message: 'User deleted successfully' });
              });
            }
          );
        } else {
          // Delete user
          db.query('DELETE FROM users WHERE id = ?', [userId], (err, result) => {
            if (err) {
              console.error('Error deleting user:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            
            if (result.affectedRows === 0) {
              return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({ success: true, message: 'User deleted successfully' });
          });
        }
      }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Medicine CRUD operations
exports.getAllMedicines = async (req, res) => {
  try {
    const query = `
      SELECT 
        m.id, 
        m.name, 
        m.dosage,
        COUNT(DISTINCT mc.country_id) AS countryCount
      FROM medicines m
      LEFT JOIN medicine_countries mc ON m.id = mc.medicine_id
      GROUP BY m.id, m.name, m.dosage
      ORDER BY m.name ASC
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching medicines:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json(results);
    });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createMedicine = async (req, res) => {
  try {
    const { name, dosage } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Medicine name is required' });
    }
    
    // Create medicine
    db.query(
      'INSERT INTO medicines (name, dosage) VALUES (?, ?)',
      [name, dosage || ''],
      (err, result) => {
        if (err) {
          console.error('Error creating medicine:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        res.status(201).json({
          id: result.insertId,
          name,
          dosage: dosage || ''
        });
      }
    );
  } catch (error) {
    console.error('Error creating medicine:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getMedicineById = async (req, res) => {
  try {
    const medicineId = req.params.id;
    
    db.query(
      `SELECT 
        m.id, 
        m.name, 
        m.dosage,
        (SELECT AVG(mc.sale_price) FROM medicine_countries mc WHERE mc.medicine_id = m.id) AS averagePrice,
        (SELECT SUM(mc.quantity_purchased) FROM medicine_countries mc WHERE mc.medicine_id = m.id) AS totalQuantity
      FROM medicines m
      WHERE m.id = ?`,
      [medicineId],
      (err, results) => {
        if (err) {
          console.error('Error fetching medicine:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
          return res.status(404).json({ error: 'Medicine not found' });
        }
        
        res.json(results[0]);
      }
    );
  } catch (error) {
    console.error('Error fetching medicine:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    const medicineId = req.params.id;
    const { name, dosage } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Medicine name is required' });
    }
    
    // Update medicine
    db.query(
      'UPDATE medicines SET name = ?, dosage = ? WHERE id = ?',
      [name, dosage || '', medicineId],
      (err, result) => {
        if (err) {
          console.error('Error updating medicine:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Medicine not found' });
        }
        
        res.json({
          id: medicineId,
          name,
          dosage: dosage || ''
        });
      }
    );
  } catch (error) {
    console.error('Error updating medicine:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const medicineId = req.params.id;
    
    // Check if medicine has associated records
    db.query(
      'SELECT COUNT(*) AS count FROM medicine_countries WHERE medicine_id = ?',
      [medicineId],
      (err, results) => {
        if (err) {
          console.error('Error checking medicine records:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        const count = results[0].count;
        
        if (count > 0) {
          return res.status(400).json({ error: 'Cannot delete medicine with associated records' });
        }
        
        // Delete medicine
        db.query('DELETE FROM medicines WHERE id = ?', [medicineId], (err, result) => {
          if (err) {
            console.error('Error deleting medicine:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          
          if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Medicine not found' });
          }
          
          res.json({ success: true, message: 'Medicine deleted successfully' });
        });
      }
    );
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get medicine transactions
exports.getMedicineTransactions = async (req, res) => {
  try {
    const medicineId = req.params.id;
    const query = `
      SELECT 
        mc.id,
        mc.month AS saleDate,
        mc.quantity_purchased AS quantity,
        mc.sale_price AS price,
        c.name AS countryName,
        c.id AS countryId,
        mc.pills_per_package AS pillsPerPackage
      FROM medicine_countries mc
      JOIN countries c ON mc.country_id = c.id
      WHERE mc.medicine_id = ?
      ORDER BY mc.month DESC
      LIMIT 100
    `;
    
    db.query(query, [medicineId], (err, results) => {
      if (err) {
        console.error('Error fetching medicine transactions:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json(results);
    });
  } catch (error) {
    console.error('Error fetching medicine transactions:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get medicine countries
exports.getMedicineCountries = async (req, res) => {
  try {
    const medicineId = req.params.id;
    
    const countries = await Medicine.getCountries(medicineId);
    
    res.json(countries);
  } catch (error) {
    console.error('Error fetching medicine countries:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Country CRUD operations
exports.getAllCountries = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id, 
        c.name, 
        c.currency,
        COUNT(DISTINCT mc.medicine_id) AS medicineCount
      FROM countries c
      LEFT JOIN medicine_countries mc ON c.id = mc.country_id
      GROUP BY c.id, c.name, c.currency
      ORDER BY c.name ASC
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching countries:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json(results);
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createCountry = async (req, res) => {
  try {
    const { name, currency } = req.body;
    
    if (!name || !currency) {
      return res.status(400).json({ error: 'Country name and currency are required' });
    }
    
    // Create country
    db.query(
      'INSERT INTO countries (name, currency) VALUES (?, ?)',
      [name, currency],
      (err, result) => {
        if (err) {
          console.error('Error creating country:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        res.status(201).json({
          id: result.insertId,
          name,
          currency
        });
      }
    );
  } catch (error) {
    console.error('Error creating country:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getCountryById = async (req, res) => {
  try {
    const countryId = req.params.id;
    
    db.query(
      `SELECT 
        c.id, 
        c.name, 
        c.currency,
        COUNT(DISTINCT mc.medicine_id) AS medicineCount
      FROM countries c
      LEFT JOIN medicine_countries mc ON c.id = mc.country_id
      WHERE c.id = ?
      GROUP BY c.id, c.name, c.currency`,
      [countryId],
      (err, results) => {
        if (err) {
          console.error('Error fetching country:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
          return res.status(404).json({ error: 'Country not found' });
        }
        
        res.json(results[0]);
      }
    );
  } catch (error) {
    console.error('Error fetching country:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateCountry = async (req, res) => {
  try {
    const countryId = req.params.id;
    const { name, currency } = req.body;
    
    if (!name || !currency) {
      return res.status(400).json({ error: 'Country name and currency are required' });
    }
    
    // Update country
    db.query(
      'UPDATE countries SET name = ?, currency = ? WHERE id = ?',
      [name, currency, countryId],
      (err, result) => {
        if (err) {
          console.error('Error updating country:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Country not found' });
        }
        
        res.json({
          id: countryId,
          name,
          currency
        });
      }
    );
  } catch (error) {
    console.error('Error updating country:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteCountry = async (req, res) => {
  try {
    const countryId = req.params.id;
    
    // Check if country has associated records
    db.query(
      'SELECT COUNT(*) AS count FROM medicine_countries WHERE country_id = ?',
      [countryId],
      (err, results) => {
        if (err) {
          console.error('Error checking country records:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        const count = results[0].count;
        
        if (count > 0) {
          return res.status(400).json({ error: 'Cannot delete country with associated records' });
        }
        
        // Delete country
        db.query('DELETE FROM countries WHERE id = ?', [countryId], (err, result) => {
          if (err) {
            console.error('Error deleting country:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          
          if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Country not found' });
          }
          
          res.json({ success: true, message: 'Country deleted successfully' });
        });
      }
    );
  } catch (error) {
    console.error('Error deleting country:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get country medicines
exports.getCountryMedicines = async (req, res) => {
  try {
    const countryId = req.params.id;
    
    const medicines = await Country.getMedicines(countryId);
    
    res.json(medicines);
  } catch (error) {
    console.error('Error fetching country medicines:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

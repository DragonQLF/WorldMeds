
CREATE TABLE IF NOT EXISTS countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    currency VARCHAR(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS medicines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS medicine_countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT,
    country_id INT,
    month DATE,
    reference_price DECIMAL(10,2),
    sale_price DECIMAL(10,2) NULL,
    quantity_purchased INT,
    pills_per_package INT DEFAULT 1,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id),
    FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on the role column for faster queries
CREATE INDEX idx_users_role ON users(role);

-- Insert example data with more countries
INSERT INTO countries (name, currency) 
VALUES 
    ('Argentina', 'ARS'), 
    ('Brazil', 'BRL'), 
    ('Chile', 'CLP'), 
    ('Mexico', 'MXN'), 
    ('United States of America', 'USD'),
    ('Canada', 'CAD'),
    ('Australia', 'AUD'),
    ('Russia', 'RUB'),
    ('India', 'INR'),
    ('South Korea', 'KRW'),
    ('Algeria', 'DZD'),
    ('Angola', 'AOA');

INSERT INTO medicines (name, dosage) 
VALUES 
    ('Paracetamol', '500 mg'), 
    ('Aspirin', '100 mg'), 
    ('Ibuprofen', '200 mg'), 
    ('Amoxicillin', '250 mg'), 
    ('Ciprofloxacin', '500 mg');

-- Insert historical data for trend analysis
-- March 2024
INSERT INTO medicine_countries (medicine_id, country_id, month, reference_price, sale_price, quantity_purchased, pills_per_package)
VALUES 
    (1, 1, '2024-03-01', 500.00, 600.00, 100, 30),
    (2, 2, '2024-03-01', 1000.00, 18.00, 200, 20),
    (3, 3, '2024-03-01', 300.00, 3500.00, 150, 15),
    (4, 4, '2024-03-01', 800.00, 850.00, 250, 10),
    (5, 5, '2024-03-01', 1200.00, 12.50, 300, 25),
    (1, 2, '2024-03-01', 550.00, 14.50, 120, 30),
    (1, 6, '2024-03-01', 5.00, 6.50, 200, 30),
    (2, 7, '2024-03-01', 7.00, 8.50, 300, 20),
    (3, 8, '2024-03-01', 200.00, 250.00, 100, 15),
    (4, 9, '2024-03-01', 300.00, 350.00, 150, 10),
    (5, 10, '2024-03-01', 2000.00, 2400.00, 80, 25);

-- April 2024
INSERT INTO medicine_countries (medicine_id, country_id, month, reference_price, sale_price, quantity_purchased, pills_per_package)
VALUES 
    (1, 1, '2024-04-01', 520.00, 620.00, 110, 30),
    (2, 2, '2024-04-01', 980.00, 17.50, 220, 20),
    (3, 3, '2024-04-01', 310.00, 3600.00, 160, 15),
    (4, 4, '2024-04-01', 820.00, 870.00, 240, 10),
    (5, 5, '2024-04-01', 1180.00, 12.20, 310, 25),
    (1, 6, '2024-04-01', 5.20, 6.80, 210, 30),
    (2, 7, '2024-04-01', 6.80, 8.20, 290, 20),
    (3, 8, '2024-04-01', 210.00, 260.00, 120, 15),
    (4, 9, '2024-04-01', 320.00, 380.00, 160, 10),
    (5, 10, '2024-04-01', 1950.00, 2350.00, 90, 25);

-- May 2024 
INSERT INTO medicine_countries (medicine_id, country_id, month, reference_price, sale_price, quantity_purchased, pills_per_package)
VALUES 
    (1, 1, '2024-05-01', 540.00, 650.00, 120, 30),
    (2, 2, '2024-05-01', 990.00, 16.80, 230, 20),
    (3, 3, '2024-05-01', 315.00, 3650.00, 170, 15),
    (4, 4, '2024-05-01', 840.00, 890.00, 260, 10),
    (5, 5, '2024-05-01', 1160.00, 12.50, 320, 25),
    (1, 6, '2024-05-01', 5.40, 7.20, 220, 30),
    (2, 7, '2024-05-01', 6.50, 7.80, 310, 20),
    (3, 8, '2024-05-01', 220.00, 280.00, 140, 15),
    (4, 9, '2024-05-01', 340.00, 410.00, 170, 10),
    (5, 10, '2024-05-01', 1900.00, 2250.00, 100, 25),
    (1, 11, '2024-05-01', 80.00, 90.00, 50, 30),
    (2, 12, '2024-05-01', 150.00, 180.00, 40, 20);

-- Create the MySQL user if it doesn't exist and grant permissions
CREATE USER IF NOT EXISTS 'worldmeds_user'@'%' IDENTIFIED BY '1234';

GRANT ALL PRIVILEGES ON worldmeds_db.* TO 'worldmeds_user'@'%';

FLUSH PRIVILEGES;

-- Table: countries
-- Stores information about countries, including currency and ISO code.
CREATE TABLE IF NOT EXISTS countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    currency VARCHAR(10) NOT NULL,
    iso_code VARCHAR(2) UNIQUE COMMENT 'ISO 3166-1 alpha-2 country code'
);

-- Table: medicines
-- Stores information about medicines, including name and dosage.
CREATE TABLE IF NOT EXISTS medicines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(50) NOT NULL
);

-- Table: medicine_countries
-- Stores price and purchase data for medicines in specific countries for a given month.
-- Includes foreign keys linking to the countries and medicines tables.
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

-- Table: users
-- Stores user information, including authentication details and role.
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255) NULL,
  password_reset_token VARCHAR(255) NULL,
  password_reset_expires DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on the role column for faster queries
CREATE INDEX idx_users_role ON users(role);

-- Insert example data for countries
INSERT INTO countries (name, currency, iso_code) VALUES
('United States of America', 'USD', 'US'),
('Canada', 'CAD', 'CA'),
('Mexico', 'MXN', 'MX'),
('Brazil', 'BRL', 'BR'),
('United Kingdom', 'GBP', 'GB'),
('France', 'EUR', 'FR'),
('Germany', 'EUR', 'DE'),
('Spain', 'EUR', 'ES'),
('Italy', 'EUR', 'IT'),
('Japan', 'JPY', 'JP'),
('China', 'CNY', 'CN'),
('India', 'INR', 'IN'),
('Australia', 'AUD', 'AU'),
('Russia', 'RUB', 'RU'),
('Chile', 'CLP', 'CL'),
('Argentina', 'ARS', 'AR'),
('Algeria', 'DZD', 'DZ'),
('Angola', 'AOA', 'AO');

-- Insert example data for medicines
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
    (1, 1, '2024-03-01', 500.00, 600.00, 100, 30), -- Paracetamol in United States of America
    (2, 2, '2024-03-01', 1000.00, 18.00, 200, 20), -- Aspirin in Canada
    (3, 3, '2024-03-01', 300.00, 3500.00, 150, 15), -- Ibuprofen in Mexico
    (4, 4, '2024-03-01', 800.00, 850.00, 250, 10), -- Amoxicillin in Brazil
    (5, 5, '2024-03-01', 1200.00, 12.50, 300, 25), -- Ciprofloxacin in United Kingdom
    (1, 2, '2024-03-01', 550.00, 14.50, 120, 30), -- Paracetamol in Canada
    (1, 6, '2024-03-01', 5.00, 6.50, 200, 30), -- Paracetamol in France
    (2, 7, '2024-03-01', 7.00, 8.50, 300, 20), -- Aspirin in Germany
    (3, 8, '2024-03-01', 200.00, 250.00, 100, 15), -- Ibuprofen in Spain
    (4, 9, '2024-03-01', 320.00, 380.00, 160, 10), -- Amoxicillin in Italy
    (5, 10, '2024-03-01', 1950.00, 2350.00, 90, 25); -- Ciprofloxacin in Japan

-- Additional data for March 2024
INSERT INTO medicine_countries (medicine_id, country_id, month, reference_price, sale_price, quantity_purchased, pills_per_package)
VALUES
    (2, 11, '2024-03-01', 160.00, 190.00, 45, 20), -- Aspirin in China
    (3, 11, '2024-03-01', 90.00, 100.00, 30, 15), -- Ibuprofen in China
    (4, 11, '2024-03-01', 250.00, 280.00, 35, 10), -- Amoxicillin in China
    (5, 11, '2024-03-01', 300.00, 340.00, 25, 25), -- Ciprofloxacin in China
    (1, 12, '2024-03-01', 70.00, 80.00, 55, 30), -- Paracetamol in India
    (3, 12, '2024-03-01', 110.00, 130.00, 40, 15), -- Ibuprofen in India
    (4, 12, '2024-03-01', 200.00, 230.00, 30, 10), -- Amoxicillin in India
    (5, 12, '2024-03-01', 280.00, 310.00, 20, 25), -- Ciprofloxacin in India
    (1, 13, '2024-03-01', 220.00, 250.00, 60, 30), -- Paracetamol in Australia
    (2, 13, '2024-03-01', 180.00, 210.00, 50, 20), -- Aspirin in Australia
    (4, 13, '2024-03-01', 550.00, 600.00, 40, 10), -- Amoxicillin in Australia
    (5, 13, '2024-03-01', 700.00, 750.00, 30, 25), -- Ciprofloxacin in Australia
    (1, 14, '2024-03-01', 500.00, 550.00, 65, 30), -- Paracetamol in Russia
    (2, 14, '2024-03-01', 400.00, 450.00, 55, 20), -- Aspirin in Russia
    (3, 14, '2024-03-01', 150.00, 180.00, 45, 15), -- Ibuprofen in Russia
    (5, 14, '2024-03-01', 800.00, 850.00, 35, 25), -- Ciprofloxacin in Russia
    (1, 15, '2024-03-01', 300.00, 330.00, 70, 30), -- Paracetamol in Chile
    (2, 15, '2024-03-01', 250.00, 280.00, 60, 20), -- Aspirin in Chile
    (3, 15, '2024-03-01', 100.00, 120.00, 50, 15), -- Ibuprofen in Chile
    (4, 16, '2024-03-01', 700.00, 750.00, 40, 10), -- Amoxicillin in Argentina
    (5, 16, '2024-03-01', 900.00, 950.00, 30, 25), -- Ciprofloxacin in Argentina
    (1, 17, '2024-03-01', 400.00, 440.00, 50, 30), -- Paracetamol in Algeria
    (3, 17, '2024-03-01', 120.00, 140.00, 40, 15), -- Ibuprofen in Algeria
    (2, 18, '2024-03-01', 300.00, 330.00, 45, 20), -- Aspirin in Angola
    (5, 18, '2024-03-01', 600.00, 650.00, 35, 25); -- Ciprofloxacin in Angola

-- April 2024
INSERT INTO medicine_countries (medicine_id, country_id, month, reference_price, sale_price, quantity_purchased, pills_per_package)
VALUES 
    (1, 1, '2024-04-01', 520.00, 620.00, 110, 30), -- Paracetamol in United States of America
    (2, 2, '2024-04-01', 980.00, 17.50, 220, 20), -- Aspirin in Canada
    (3, 3, '2024-04-01', 310.00, 3600.00, 160, 15), -- Ibuprofen in Mexico
    (4, 4, '2024-04-01', 820.00, 870.00, 240, 10), -- Amoxicillin in Brazil
    (5, 5, '2024-04-01', 1180.00, 12.20, 310, 25), -- Ciprofloxacin in United Kingdom
    (1, 6, '2024-04-01', 5.20, 6.80, 210, 30), -- Paracetamol in France
    (2, 7, '2024-04-01', 6.80, 8.20, 290, 20), -- Aspirin in Germany
    (3, 8, '2024-04-01', 210.00, 260.00, 120, 15), -- Ibuprofen in Spain
    (4, 9, '2024-04-01', 320.00, 380.00, 160, 10), -- Amoxicillin in Italy
    (5, 10, '2024-04-01', 1950.00, 2350.00, 90, 25); -- Ciprofloxacin in Japan

-- Additional data for April 2024
INSERT INTO medicine_countries (medicine_id, country_id, month, reference_price, sale_price, quantity_purchased, pills_per_package)
VALUES
    (2, 11, '2024-04-01', 165.00, 195.00, 50, 20), -- Aspirin in China
    (3, 11, '2024-04-01', 92.00, 103.00, 33, 15), -- Ibuprofen in China
    (4, 11, '2024-04-01', 255.00, 285.00, 38, 10), -- Amoxicillin in China
    (5, 11, '2024-04-01', 310.00, 350.00, 28, 25), -- Ciprofloxacin in China
    (1, 12, '2024-04-01', 72.00, 83.00, 60, 30), -- Paracetamol in India
    (3, 12, '2024-04-01', 112.00, 133.00, 43, 15), -- Ibuprofen in India
    (4, 12, '2024-04-01', 205.00, 235.00, 33, 10), -- Amoxicillin in India
    (5, 12, '2024-04-01', 285.00, 315.00, 23, 25), -- Ciprofloxacin in India
    (1, 13, '2024-04-01', 225.00, 255.00, 65, 30), -- Paracetamol in Australia
    (2, 13, '2024-04-01', 185.00, 215.00, 55, 20), -- Aspirin in Australia
    (4, 13, '2024-04-01', 560.00, 610.00, 43, 10), -- Amoxicillin in Australia
    (5, 13, '2024-04-01', 710.00, 760.00, 33, 25), -- Ciprofloxacin in Australia
    (1, 14, '2024-04-01', 510.00, 560.00, 70, 30), -- Paracetamol in Russia
    (2, 14, '2024-04-01', 410.00, 460.00, 60, 20), -- Aspirin in Russia
    (3, 14, '2024-04-01', 155.00, 185.00, 50, 15), -- Ibuprofen in Russia
    (5, 14, '2024-04-01', 810.00, 860.00, 38, 25), -- Ciprofloxacin in Russia
    (1, 15, '2024-04-01', 305.00, 335.00, 75, 30), -- Paracetamol in Chile
    (2, 15, '2024-04-01', 255.00, 285.00, 65, 20), -- Aspirin in Chile
    (3, 15, '2024-04-01', 102.00, 123.00, 55, 15), -- Ibuprofen in Chile
    (4, 16, '2024-04-01', 710.00, 760.00, 43, 10), -- Amoxicillin in Argentina
    (5, 16, '2024-04-01', 910.00, 960.00, 33, 25), -- Ciprofloxacin in Argentina
    (1, 17, '2024-04-01', 405.00, 445.00, 55, 30), -- Paracetamol in Algeria
    (3, 17, '2024-04-01', 122.00, 143.00, 43, 15), -- Ibuprofen in Algeria
    (2, 18, '2024-04-01', 305.00, 335.00, 50, 20), -- Aspirin in Angola
    (5, 18, '2024-04-01', 610.00, 660.00, 38, 25); -- Ciprofloxacin in Angola

-- May 2024 
INSERT INTO medicine_countries (medicine_id, country_id, month, reference_price, sale_price, quantity_purchased, pills_per_package)
VALUES 
    (1, 1, '2024-05-01', 540.00, 650.00, 120, 30), -- Paracetamol in United States of America
    (2, 2, '2024-05-01', 990.00, 16.80, 230, 20), -- Aspirin in Canada
    (3, 3, '2024-05-01', 315.00, 3650.00, 170, 15), -- Ibuprofen in Mexico
    (4, 4, '2024-05-01', 840.00, 890.00, 260, 10), -- Amoxicillin in Brazil
    (5, 5, '2024-05-01', 1160.00, 12.50, 320, 25), -- Ciprofloxacin in United Kingdom
    (1, 6, '2024-05-01', 5.40, 7.20, 220, 30), -- Paracetamol in France
    (2, 7, '2024-05-01', 6.50, 7.80, 310, 20), -- Aspirin in Germany
    (3, 8, '2024-05-01', 220.00, 280.00, 140, 15), -- Ibuprofen in Spain
    (4, 9, '2024-05-01', 340.00, 410.00, 170, 10), -- Amoxicillin in Italy
    (5, 10, '2024-05-01', 1900.00, 2250.00, 100, 25), -- Ciprofloxacin in Japan
    (1, 11, '2024-05-01', 80.00, 90.00, 50, 30), -- Paracetamol in China
    (2, 12, '2024-05-01', 150.00, 180.00, 40, 20); -- Aspirin in India

-- Additional data for May 2024
INSERT INTO medicine_countries (medicine_id, country_id, month, reference_price, sale_price, quantity_purchased, pills_per_package)
VALUES
    (2, 11, '2024-05-01', 170.00, 200.00, 55, 20), -- Aspirin in China
    (3, 11, '2024-05-01', 94.00, 106.00, 36, 15), -- Ibuprofen in China
    (4, 11, '2024-05-01', 260.00, 290.00, 41, 10), -- Amoxicillin in China
    (5, 11, '2024-05-01', 320.00, 360.00, 31, 25), -- Ciprofloxacin in China
    (1, 12, '2024-05-01', 74.00, 86.00, 65, 30), -- Paracetamol in India
    (3, 12, '2024-05-01', 114.00, 136.00, 46, 15), -- Ibuprofen in India
    (4, 12, '2024-05-01', 210.00, 240.00, 36, 10), -- Amoxicillin in India
    (5, 12, '2024-05-01', 290.00, 320.00, 26, 25), -- Ciprofloxacin in India
    (1, 13, '2024-05-01', 230.00, 260.00, 70, 30), -- Paracetamol in Australia
    (2, 13, '2024-05-01', 190.00, 220.00, 60, 20), -- Aspirin in Australia
    (4, 13, '2024-05-01', 570.00, 620.00, 46, 10), -- Amoxicillin in Australia
    (5, 13, '2024-05-01', 720.00, 770.00, 36, 25), -- Ciprofloxacin in Australia
    (1, 14, '2024-05-01', 520.00, 570.00, 75, 30), -- Paracetamol in Russia
    (2, 14, '2024-05-01', 420.00, 470.00, 65, 20), -- Aspirin in Russia
    (3, 14, '2024-05-01', 160.00, 190.00, 55, 15), -- Ibuprofen in Russia
    (5, 14, '2024-05-01', 820.00, 870.00, 41, 25), -- Ciprofloxacin in Russia
    (1, 15, '2024-05-01', 305.00, 335.00, 75, 30), -- Paracetamol in Chile
    (2, 15, '2024-05-01', 255.00, 285.00, 65, 20), -- Aspirin in Chile
    (3, 15, '2024-05-01', 102.00, 123.00, 55, 15), -- Ibuprofen in Chile
    (4, 16, '2024-05-01', 710.00, 760.00, 43, 10), -- Amoxicillin in Argentina
    (5, 16, '2024-05-01', 910.00, 960.00, 33, 25), -- Ciprofloxacin in Argentina
    (1, 17, '2024-05-01', 410.00, 450.00, 60, 30), -- Paracetamol in Algeria
    (3, 17, '2024-05-01', 124.00, 146.00, 46, 15), -- Ibuprofen in Algeria
    (2, 18, '2024-05-01', 310.00, 340.00, 55, 20), -- Aspirin in Angola
    (5, 18, '2024-05-01', 620.00, 670.00, 41, 25); -- Ciprofloxacin in Angola

-- June 2024
INSERT INTO medicine_countries (medicine_id, country_id, month, reference_price, sale_price, quantity_purchased, pills_per_package)
VALUES 
    (1, 1, '2024-06-01', 550.00, 660.00, 130, 30), -- Paracetamol in United States of America
    (2, 2, '2024-06-01', 970.00, 17.20, 240, 20), -- Aspirin in Canada
    (3, 3, '2024-06-01', 320.00, 3700.00, 180, 15), -- Ibuprofen in Mexico
    (4, 4, '2024-06-01', 850.00, 900.00, 270, 10), -- Amoxicillin in Brazil
    (5, 5, '2024-06-01', 1150.00, 12.80, 330, 25), -- Ciprofloxacin in United Kingdom
    (1, 6, '2024-06-01', 5.60, 7.50, 230, 30), -- Paracetamol in France
    (2, 7, '2024-06-01', 6.30, 7.60, 320, 20), -- Aspirin in Germany
    (3, 8, '2024-06-01', 230.00, 290.00, 150, 15), -- Ibuprofen in Spain
    (4, 9, '2024-06-01', 350.00, 420.00, 180, 10), -- Amoxicillin in Italy
    (5, 10, '2024-06-01', 1850.00, 2150.00, 110, 25), -- Ciprofloxacin in Japan
    (1, 11, '2024-06-01', 82.00, 92.00, 60, 30), -- Paracetamol in China
    (2, 12, '2024-06-01', 155.00, 185.00, 50, 20), -- Aspirin in India
    (3, 13, '2024-06-01', 250.00, 280.00, 70, 15), -- Ibuprofen in Australia (Assuming ID 13 for Australia)
    (4, 14, '2024-06-01', 600.00, 650.00, 80, 10); -- Amoxicillin in Russia (Assuming ID 14 for Russia)

-- Additional data for June 2024
INSERT INTO medicine_countries (medicine_id, country_id, month, reference_price, sale_price, quantity_purchased, pills_per_package)
VALUES
    (2, 11, '2024-06-01', 175.00, 205.00, 60, 20), -- Aspirin in China
    (3, 11, '2024-06-01', 96.00, 109.00, 39, 15), -- Ibuprofen in China
    (4, 11, '2024-06-01', 265.00, 295.00, 44, 10), -- Amoxicillin in China
    (5, 11, '2024-06-01', 330.00, 370.00, 34, 25), -- Ciprofloxacin in China
    (1, 12, '2024-06-01', 76.00, 89.00, 70, 30), -- Paracetamol in India
    (3, 12, '2024-06-01', 116.00, 139.00, 49, 15), -- Ibuprofen in India
    (4, 12, '2024-06-01', 215.00, 245.00, 39, 10), -- Amoxicillin in India
    (5, 12, '2024-06-01', 295.00, 325.00, 29, 25), -- Ciprofloxacin in India
    (1, 13, '2024-06-01', 235.00, 265.00, 75, 30), -- Paracetamol in Australia
    (2, 13, '2024-06-01', 195.00, 225.00, 65, 20), -- Aspirin in Australia
    (5, 13, '2024-06-01', 730.00, 780.00, 39, 25), -- Ciprofloxacin in Australia
    (1, 14, '2024-06-01', 530.00, 580.00, 80, 30), -- Paracetamol in Russia
    (2, 14, '2024-06-01', 430.00, 480.00, 70, 20), -- Aspirin in Russia
    (3, 14, '2024-06-01', 165.00, 195.00, 60, 15), -- Ibuprofen in Russia
    (5, 14, '2024-06-01', 830.00, 880.00, 44, 25), -- Ciprofloxacin in Russia
    (1, 15, '2024-06-01', 315.00, 345.00, 85, 30), -- Paracetamol in Chile
    (2, 15, '2024-06-01', 265.00, 295.00, 75, 20), -- Aspirin in Chile
    (3, 15, '2024-06-01', 106.00, 129.00, 65, 15), -- Ibuprofen in Chile
    (4, 16, '2024-06-01', 730.00, 780.00, 49, 10), -- Amoxicillin in Argentina
    (5, 16, '2024-06-01', 930.00, 980.00, 39, 25), -- Ciprofloxacin in Argentina
    (1, 17, '2024-06-01', 415.00, 455.00, 65, 30), -- Paracetamol in Algeria
    (3, 17, '2024-06-01', 126.00, 149.00, 49, 15), -- Ibuprofen in Algeria
    (2, 18, '2024-06-01', 315.00, 345.00, 60, 20), -- Aspirin in Angola
    (5, 18, '2024-06-01', 630.00, 680.00, 44, 25); -- Ciprofloxacin in Angola

-- Additional data for November 2024
INSERT INTO medicine_countries (medicine_id, country_id, month, reference_price, sale_price, quantity_purchased, pills_per_package)
VALUES 
    (1, 1, '2024-11-01', 600.00, 710.00, 180, 30), -- Paracetamol in United States of America
    (2, 2, '2024-11-01', 920.00, 16.20, 290, 20), -- Aspirin in Canada
    (3, 3, '2024-11-01', 345.00, 3950.00, 230, 15), -- Ibuprofen in Mexico
    (4, 4, '2024-11-01', 900.00, 950.00, 320, 10), -- Amoxicillin in Brazil
    (5, 5, '2024-11-01', 1100.00, 13.80, 380, 25), -- Ciprofloxacin in United Kingdom
    (1, 6, '2024-11-01', 6.60, 8.60, 280, 30), -- Paracetamol in France
    (2, 7, '2024-11-01', 5.30, 6.60, 370, 20), -- Aspirin in Germany
    (3, 8, '2024-11-01', 280.00, 340.00, 200, 15), -- Ibuprofen in Spain
    (4, 9, '2024-11-01', 400.00, 470.00, 230, 10), -- Amoxicillin in Italy
    (5, 10, '2024-11-01', 1600.00, 1900.00, 160, 25), -- Ciprofloxacin in Japan
    (1, 11, '2024-11-01', 92.00, 102.00, 110, 30), -- Paracetamol in China
    (2, 11, '2024-11-01', 200.00, 230.00, 85, 20), -- Aspirin in China
    (3, 11, '2024-11-01', 106.00, 124.00, 54, 15), -- Ibuprofen in China
    (4, 11, '2024-11-01', 290.00, 320.00, 59, 10), -- Amoxicillin in China
    (5, 11, '2024-11-01', 380.00, 420.00, 49, 25), -- Ciprofloxacin in China
    (1, 12, '2024-11-01', 86.00, 103.00, 95, 30), -- Paracetamol in India
    (2, 12, '2024-11-01', 180.00, 210.00, 80, 20), -- Aspirin in India
    (3, 12, '2024-11-01', 126.00, 154.00, 64, 15), -- Ibuprofen in India
    (4, 12, '2024-11-01', 240.00, 270.00, 54, 10), -- Amoxicillin in India
    (5, 12, '2024-11-01', 320.00, 350.00, 44, 25), -- Ciprofloxacin in India
    (1, 13, '2024-11-01', 260.00, 290.00, 100, 30), -- Paracetamol in Australia
    (2, 13, '2024-11-01', 220.00, 250.00, 90, 20), -- Aspirin in Australia
    (4, 13, '2024-11-01', 620.00, 670.00, 59, 10), -- Amoxicillin in Australia
    (5, 13, '2024-11-01', 780.00, 830.00, 54, 25), -- Ciprofloxacin in Australia
    (1, 14, '2024-11-01', 580.00, 630.00, 105, 30), -- Paracetamol in Russia
    (2, 14, '2024-11-01', 480.00, 530.00, 95, 20), -- Aspirin in Russia
    (3, 14, '2024-11-01', 190.00, 220.00, 85, 15), -- Ibuprofen in Russia
    (4, 14, '2024-11-01', 670.00, 720.00, 130, 10), -- Amoxicillin in Russia
    (5, 14, '2024-11-01', 880.00, 930.00, 65, 25), -- Ciprofloxacin in Russia
    (1, 15, '2024-11-01', 340.00, 370.00, 110, 30), -- Paracetamol in Chile
    (2, 15, '2024-11-01', 290.00, 320.00, 100, 20), -- Aspirin in Chile
    (3, 15, '2024-11-01', 116.00, 144.00, 90, 15), -- Ibuprofen in Chile
    (4, 16, '2024-11-01', 780.00, 830.00, 64, 10), -- Amoxicillin in Argentina
    (5, 16, '2024-11-01', 980.00, 1030.00, 54, 25), -- Ciprofloxacin in Argentina
    (1, 17, '2024-11-01', 440.00, 480.00, 90, 30), -- Paracetamol in Algeria
    (3, 17, '2024-11-01', 136.00, 164.00, 64, 15), -- Ibuprofen in Algeria
    (2, 18, '2024-11-01', 340.00, 370.00, 85, 20), -- Aspirin in Angola
    (1, 1, '2024-07-01', 560.00, 670.00, 140, 30), -- Paracetamol in United States of America
    (2, 2, '2024-07-01', 960.00, 17.00, 250, 20), -- Aspirin in Canada
    (3, 3, '2024-07-01', 325.00, 3750.00, 190, 15), -- Ibuprofen in Mexico
    (4, 4, '2024-07-01', 860.00, 910.00, 280, 10), -- Amoxicillin in Brazil
    (5, 5, '2024-07-01', 1140.00, 13.00, 340, 25), -- Ciprofloxacin in United Kingdom
    (1, 6, '2024-07-01', 5.80, 7.80, 240, 30), -- Paracetamol in France
    (2, 7, '2024-07-01', 6.10, 7.40, 330, 20), -- Aspirin in Germany
    (3, 8, '2024-07-01', 240.00, 300.00, 160, 15), -- Ibuprofen in Spain
    (4, 9, '2024-07-01', 360.00, 430.00, 190, 10), -- Amoxicillin in Italy
    (5, 10, '2024-07-01', 1800.00, 2100.00, 120, 25), -- Ciprofloxacin in Japan
    (1, 11, '2024-07-01', 84.00, 94.00, 70, 30), -- Paracetamol in China
    (2, 12, '2024-07-01', 160.00, 190.00, 60, 20), -- Aspirin in India
    (3, 13, '2024-07-01', 260.00, 290.00, 80, 15), -- Ibuprofen in Australia
    (4, 14, '2024-07-01', 620.00, 670.00, 90, 10);

-- Additional data for July 2024
INSERT INTO medicine_countries (medicine_id, country_id, month, reference_price, sale_price, quantity_purchased, pills_per_package)
VALUES
    (2, 11, '2024-07-01', 180.00, 210.00, 65, 20), -- Aspirin in China
    (3, 11, '2024-07-01', 98.00, 112.00, 42, 15), -- Ibuprofen in China
    (4, 11, '2024-07-01', 270.00, 300.00, 47, 10), -- Amoxicillin in China
    (5, 11, '2024-07-01', 340.00, 380.00, 37, 25), -- Ciprofloxacin in China
    (1, 12, '2024-07-01', 78.00, 92.00, 75, 30), -- Paracetamol in India
    (3, 12, '2024-07-01', 118.00, 142.00, 52, 15), -- Ibuprofen in India
    (4, 12, '2024-07-01', 220.00, 250.00, 42, 10), -- Amoxicillin in India
    (5, 12, '2024-07-01', 300.00, 330.00, 32, 25), -- Ciprofloxacin in India
    (1, 13, '2024-07-01', 240.00, 270.00, 80, 30), -- Paracetamol in Australia
    (2, 13, '2024-07-01', 200.00, 230.00, 70, 20), -- Aspirin in Australia
    (5, 13, '2024-07-01', 740.00, 790.00, 42, 25), -- Ciprofloxacin in Australia
    (1, 14, '2024-07-01', 540.00, 590.00, 85, 30), -- Paracetamol in Russia
    (2, 14, '2024-07-01', 440.00, 490.00, 75, 20), -- Aspirin in Russia
    (3, 14, '2024-07-01', 170.00, 200.00, 65, 15), -- Ibuprofen in Russia
    (5, 14, '2024-07-01', 840.00, 890.00, 47, 25), -- Ciprofloxacin in Russia
    (1, 15, '2024-07-01', 320.00, 350.00, 90, 30), -- Paracetamol in Chile
    (2, 15, '2024-07-01', 270.00, 300.00, 80, 20), -- Aspirin in Chile
    (3, 15, '2024-07-01', 108.00, 132.00, 70, 15), -- Ibuprofen in Chile
    (4, 16, '2024-07-01', 740.00, 790.00, 49, 10), -- Amoxicillin in Argentina
    (5, 16, '2024-07-01', 940.00, 990.00, 39, 25), -- Ciprofloxacin in Argentina
    (1, 17, '2024-07-01', 415.00, 455.00, 65, 30), -- Paracetamol in Algeria
    (3, 17, '2024-07-01', 126.00, 149.00, 49, 15), -- Ibuprofen in Algeria
    (2, 18, '2024-07-01', 315.00, 345.00, 60, 20), -- Aspirin in Angola
    (5, 18, '2024-07-01', 630.00, 680.00, 44, 25); -- Ciprofloxacin in Angola

-- Additional data for August 2024
INSERT INTO medicine_countries (medicine_id, country_id, month, reference_price, sale_price, quantity_purchased, pills_per_package)
VALUES 
    (1, 1, '2024-08-01', 570.00, 680.00, 150, 30), -- Paracetamol in United States of America
    (2, 2, '2024-08-01', 950.00, 16.80, 260, 20), -- Aspirin in Canada
    (3, 3, '2024-08-01', 330.00, 3800.00, 200, 15), -- Ibuprofen in Mexico
    (4, 4, '2024-08-01', 870.00, 920.00, 290, 10), -- Amoxicillin in Brazil
    (5, 5, '2024-08-01', 1130.00, 13.20, 350, 25), -- Ciprofloxacin in United Kingdom
    (1, 6, '2024-08-01', 6.00, 8.00, 250, 30), -- Paracetamol in France
    (2, 7, '2024-08-01', 5.90, 7.20, 340, 20), -- Aspirin in Germany
    (3, 8, '2024-08-01', 250.00, 310.00, 170, 15), -- Ibuprofen in Spain
    (4, 9, '2024-08-01', 370.00, 440.00, 200, 10), -- Amoxicillin in Italy
    (5, 10, '2024-08-01', 1750.00, 2050.00, 130, 25), -- Ciprofloxacin in Japan
    (1, 11, '2024-08-01', 86.00, 96.00, 80, 30), -- Paracetamol in China
    (2, 11, '2024-08-01', 185.00, 215.00, 70, 20), -- Aspirin in China
    (3, 11, '2024-08-01', 100.00, 115.00, 45, 15), -- Ibuprofen in China
    (4, 11, '2024-08-01', 275.00, 305.00, 50, 10), -- Amoxicillin in China
    (5, 11, '2024-08-01', 350.00, 390.00, 40, 25), -- Ciprofloxacin in China
    (1, 12, '2024-08-01', 80.00, 95.00, 80, 30), -- Paracetamol in India
    (2, 12, '2024-08-01', 165.00, 195.00, 65, 20), -- Aspirin in India
    (3, 12, '2024-08-01', 120.00, 145.00, 55, 15), -- Ibuprofen in India
    (4, 12, '2024-08-01', 225.00, 255.00, 45, 10), -- Amoxicillin in India
    (5, 12, '2024-08-01', 305.00, 335.00, 35, 25), -- Ciprofloxacin in India
    (1, 13, '2024-08-01', 245.00, 275.00, 85, 30), -- Paracetamol in Australia
    (2, 13, '2024-08-01', 205.00, 235.00, 75, 20), -- Aspirin in Australia
    (4, 13, '2024-08-01', 590.00, 640.00, 50, 10), -- Amoxicillin in Australia
    (5, 13, '2024-08-01', 750.00, 800.00, 45, 25), -- Ciprofloxacin in Australia
    (1, 14, '2024-08-01', 550.00, 600.00, 90, 30), -- Paracetamol in Russia
    (2, 14, '2024-08-01', 450.00, 500.00, 80, 20), -- Aspirin in Russia
    (3, 14, '2024-08-01', 175.00, 205.00, 70, 15), -- Ibuprofen in Russia
    (4, 14, '2024-08-01', 640.00, 690.00, 100, 10), -- Amoxicillin in Russia
    (5, 14, '2024-08-01', 850.00, 900.00, 50, 25), -- Ciprofloxacin in Russia
    (1, 15, '2024-08-01', 325.00, 355.00, 95, 30), -- Paracetamol in Chile
    (2, 15, '2024-08-01', 275.00, 305.00, 85, 20), -- Aspirin in Chile
    (3, 15, '2024-08-01', 110.00, 135.00, 75, 15), -- Ibuprofen in Chile
    (4, 16, '2024-08-01', 750.00, 800.00, 55, 10), -- Amoxicillin in Argentina
    (5, 16, '2024-08-01', 950.00, 1000.00, 45, 25), -- Ciprofloxacin in Argentina
    (1, 17, '2024-08-01', 420.00, 460.00, 70, 30), -- Paracetamol in Algeria
    (3, 17, '2024-08-01', 130.00, 155.00, 55, 15), -- Ibuprofen in Algeria
    (2, 18, '2024-08-01', 325.00, 355.00, 70, 20), -- Aspirin in Angola
    (5, 18, '2024-08-01', 650.00, 700.00, 50, 25); -- Ciprofloxacin in Angola

-- Additional data for September 2024
INSERT INTO medicine_countries (medicine_id, country_id, month, reference_price, sale_price, quantity_purchased, pills_per_package)
VALUES 
    (1, 1, '2024-09-01', 580.00, 690.00, 160, 30), -- Paracetamol in United States of America
    (2, 2, '2024-09-01', 940.00, 16.60, 270, 20), -- Aspirin in Canada
    (3, 3, '2024-09-01', 335.00, 3850.00, 210, 15), -- Ibuprofen in Mexico
    (4, 4, '2024-09-01', 880.00, 930.00, 300, 10), -- Amoxicillin in Brazil
    (5, 5, '2024-09-01', 1120.00, 13.40, 360, 25), -- Ciprofloxacin in United Kingdom
    (1, 6, '2024-09-01', 6.20, 8.20, 260, 30), -- Paracetamol in France
    (2, 7, '2024-09-01', 5.70, 7.00, 350, 20), -- Aspirin in Germany
    (3, 8, '2024-09-01', 260.00, 320.00, 180, 15), -- Ibuprofen in Spain
    (4, 9, '2024-09-01', 380.00, 450.00, 210, 10), -- Amoxicillin in Italy
    (5, 10, '2024-09-01', 1700.00, 2000.00, 140, 25), -- Ciprofloxacin in Japan
    (1, 11, '2024-09-01', 88.00, 98.00, 90, 30), -- Paracetamol in China
    (2, 11, '2024-09-01', 190.00, 220.00, 75, 20), -- Aspirin in China
    (3, 11, '2024-09-01', 102.00, 118.00, 48, 15), -- Ibuprofen in China
    (4, 11, '2024-09-01', 280.00, 310.00, 53, 10), -- Amoxicillin in China
    (5, 11, '2024-09-01', 360.00, 400.00, 43, 25), -- Ciprofloxacin in China
    (1, 12, '2024-09-01', 82.00, 98.00, 85, 30), -- Paracetamol in India
    (2, 12, '2024-09-01', 170.00, 200.00, 70, 20), -- Aspirin in India
    (3, 12, '2024-09-01', 122.00, 148.00, 58, 15), -- Ibuprofen in India
    (4, 12, '2024-09-01', 230.00, 260.00, 48, 10), -- Amoxicillin in India
    (5, 12, '2024-09-01', 310.00, 340.00, 38, 25), -- Ciprofloxacin in India
    (1, 13, '2024-09-01', 250.00, 280.00, 90, 30), -- Paracetamol in Australia
    (2, 13, '2024-09-01', 210.00, 240.00, 80, 20), -- Aspirin in Australia
    (4, 13, '2024-09-01', 600.00, 650.00, 53, 10), -- Amoxicillin in Australia
    (5, 13, '2024-09-01', 760.00, 810.00, 48, 25), -- Ciprofloxacin in Australia
    (1, 14, '2024-09-01', 560.00, 610.00, 95, 30), -- Paracetamol in Russia
    (2, 14, '2024-09-01', 460.00, 510.00, 85, 20), -- Aspirin in Russia
    (3, 14, '2024-09-01', 180.00, 210.00, 75, 15), -- Ibuprofen in Russia
    (4, 14, '2024-09-01', 650.00, 700.00, 110, 10), -- Amoxicillin in Russia
    (5, 14, '2024-09-01', 860.00, 910.00, 55, 25), -- Ciprofloxacin in Russia
    (1, 15, '2024-09-01', 330.00, 360.00, 100, 30), -- Paracetamol in Chile
    (2, 15, '2024-09-01', 280.00, 310.00, 90, 20), -- Aspirin in Chile
    (3, 15, '2024-09-01', 112.00, 138.00, 80, 15), -- Ibuprofen in Chile
    (4, 16, '2024-09-01', 760.00, 810.00, 58, 10), -- Amoxicillin in Argentina
    (5, 16, '2024-09-01', 960.00, 1010.00, 48, 25), -- Ciprofloxacin in Argentina
    (1, 17, '2024-09-01', 430.00, 470.00, 80, 30), -- Paracetamol in Algeria
    (3, 17, '2024-09-01', 132.00, 158.00, 58, 15), -- Ibuprofen in Algeria
    (2, 18, '2024-09-01', 330.00, 360.00, 75, 20), -- Aspirin in Angola
    (5, 18, '2024-09-01', 660.00, 710.00, 53, 25); -- Ciprofloxacin in Angola

-- Additional data for October 2024
INSERT INTO medicine_countries (medicine_id, country_id, month, reference_price, sale_price, quantity_purchased, pills_per_package)
VALUES 
    (1, 1, '2024-10-01', 590.00, 700.00, 170, 30), -- Paracetamol in United States of America
    (2, 2, '2024-10-01', 930.00, 16.40, 280, 20), -- Aspirin in Canada
    (3, 3, '2024-10-01', 340.00, 3900.00, 220, 15), -- Ibuprofen in Mexico
    (4, 4, '2024-10-01', 890.00, 940.00, 310, 10), -- Amoxicillin in Brazil
    (5, 5, '2024-10-01', 1110.00, 13.60, 370, 25), -- Ciprofloxacin in United Kingdom
    (1, 6, '2024-10-01', 6.40, 8.40, 270, 30), -- Paracetamol in France
    (2, 7, '2024-10-01', 5.50, 6.80, 360, 20), -- Aspirin in Germany
    (3, 8, '2024-10-01', 270.00, 330.00, 190, 15), -- Ibuprofen in Spain
    (4, 9, '2024-10-01', 390.00, 460.00, 220, 10), -- Amoxicillin in Italy
    (5, 10, '2024-10-01', 1650.00, 1950.00, 150, 25), -- Ciprofloxacin in Japan
    (1, 11, '2024-10-01', 90.00, 100.00, 100, 30), -- Paracetamol in China
    (2, 11, '2024-10-01', 195.00, 225.00, 80, 20), -- Aspirin in China
    (3, 11, '2024-10-01', 104.00, 121.00, 51, 15), -- Ibuprofen in China
    (4, 11, '2024-10-01', 285.00, 315.00, 56, 10), -- Amoxicillin in China
    (5, 11, '2024-10-01', 370.00, 410.00, 46, 25), -- Ciprofloxacin in China
    (1, 12, '2024-10-01', 84.00, 100.00, 90, 30), -- Paracetamol in India
    (2, 12, '2024-10-01', 175.00, 205.00, 75, 20), -- Aspirin in India
    (3, 12, '2024-10-01', 124.00, 151.00, 61, 15), -- Ibuprofen in India
    (4, 12, '2024-10-01', 235.00, 265.00, 51, 10), -- Amoxicillin in India
    (5, 12, '2024-10-01', 315.00, 345.00, 41, 25), -- Ciprofloxacin in India
    (1, 13, '2024-10-01', 255.00, 285.00, 95, 30), -- Paracetamol in Australia
    (2, 13, '2024-10-01', 215.00, 245.00, 85, 20), -- Aspirin in Australia
    (4, 13, '2024-10-01', 610.00, 660.00, 56, 10), -- Amoxicillin in Australia
    (5, 13, '2024-10-01', 770.00, 820.00, 51, 25), -- Ciprofloxacin in Australia
    (1, 14, '2024-10-01', 570.00, 620.00, 100, 30), -- Paracetamol in Russia
    (2, 14, '2024-10-01', 470.00, 520.00, 90, 20), -- Aspirin in Russia
    (3, 14, '2024-10-01', 185.00, 215.00, 80, 15), -- Ibuprofen in Russia
    (4, 14, '2024-10-01', 660.00, 710.00, 120, 10), -- Amoxicillin in Russia
    (5, 14, '2024-10-01', 870.00, 920.00, 60, 25), -- Ciprofloxacin in Russia
    (1, 15, '2024-10-01', 335.00, 365.00, 105, 30), -- Paracetamol in Chile
    (2, 15, '2024-10-01', 285.00, 315.00, 95, 20), -- Aspirin in Chile
    (3, 15, '2024-10-01', 114.00, 141.00, 85, 15), -- Ibuprofen in Chile
    (4, 16, '2024-10-01', 770.00, 820.00, 61, 10), -- Amoxicillin in Argentina
    (5, 16, '2024-10-01', 970.00, 1020.00, 51, 25), -- Ciprofloxacin in Argentina
    (1, 17, '2024-10-01', 435.00, 475.00, 85, 30), -- Paracetamol in Algeria
    (3, 17, '2024-10-01', 134.00, 161.00, 61, 15), -- Ibuprofen in Algeria
    (2, 18, '2024-10-01', 335.00, 365.00, 80, 20), -- Aspirin in Angola
    (5, 18, '2024-10-01', 670.00, 720.00, 56, 25); -- Ciprofloxacin in Angola

-- Create the MySQL user and grant permissions
CREATE USER IF NOT EXISTS 'worldmeds_user'@'%' IDENTIFIED BY '1234';

GRANT ALL PRIVILEGES ON worldmeds_db.* TO 'worldmeds_user'@'%';

FLUSH PRIVILEGES;

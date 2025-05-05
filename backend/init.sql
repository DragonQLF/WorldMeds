CREATE TABLE IF NOT EXISTS paises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    moeda VARCHAR(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS medicamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    dosagem VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS medicamentos_paises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medicamento_id INT,
    pais_id INT,
    mes DATE,
    preco_referencia DECIMAL(10,2),
    preco_venda DECIMAL(10,2) NULL,
    quantidade_comprada INT,
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id),
    FOREIGN KEY (pais_id) REFERENCES paises(id)
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user'
);

-- Create an index on the role column for faster queries
CREATE INDEX idx_users_role ON users(role);

-- Insert example data
INSERT INTO paises (nome, moeda) 
VALUES 
    ('Argentina', 'ARS'), 
    ('Brazil', 'BRL'), 
    ('Chile', 'CLP'), 
    ('Mexico', 'MXN'), 
    ('USA', 'USD');

INSERT INTO medicamentos (nome, dosagem) 
VALUES 
    ('Paracetamol', '500 mg'), 
    ('Aspirin', '100 mg'), 
    ('Ibuprofen', '200 mg'), 
    ('Amoxicillin', '250 mg'), 
    ('Ciprofloxacin', '500 mg');

INSERT INTO medicamentos_paises (medicamento_id, pais_id, mes, preco_referencia, preco_venda, quantidade_comprada)
VALUES 
    (1, 1, '2024-03-01', 500.00, 600.00, 100),
    (2, 2, '2024-03-01', 1000.00, NULL, 200),
    (3, 3, '2024-04-01', 300.00, 350.00, 150),
    (4, 4, '2024-05-01', 800.00, 850.00, 250),
    (5, 5, '2024-06-01', 1200.00, 1250.00, 300),
    (1, 2, '2024-03-01', 550.00, 580.00, 120),
    (2, 3, '2024-04-01', 950.00, 980.00, 180),
    (3, 4, '2024-05-01', 310.00, 340.00, 140),
    (4, 5, '2024-06-01', 820.00, 840.00, 260),
    (5, 1, '2024-07-01', 1250.00, 1300.00, 320);

-- Create the MySQL user if it doesn't exist and grant permissions
CREATE USER IF NOT EXISTS 'worldmeds_user'@'%' IDENTIFIED BY '1234';

GRANT ALL PRIVILEGES ON worldmeds_db.* TO 'worldmeds_user'@'%';

FLUSH PRIVILEGES;

-- Add mock data for medicine statistics
INSERT INTO medicines (name, description, price, manufacturer) VALUES
('Aspirin', 'Pain reliever', 15.99, 'Bayer'),
('Ibuprofen', 'Anti-inflammatory', 12.50, 'Pfizer'),
('Paracetamol', 'Fever reducer', 8.99, 'GSK'),
('Amoxicillin', 'Antibiotic', 25.99, 'Novartis'),
('Omeprazole', 'Antacid', 18.75, 'AstraZeneca');

-- Add mock data for countries
INSERT INTO countries (name, continent) VALUES
('Portugal', 'Europe'),
('Spain', 'Europe'),
('Germany', 'Europe'),
('France', 'Europe'),
('Italy', 'Europe'),
('United States', 'North America'),
('Canada', 'North America'),
('Brazil', 'South America'),
('Argentina', 'South America'),
('Japan', 'Asia'),
('China', 'Asia'),
('Australia', 'Oceania');

-- Add mock price history (2020-2023)
INSERT INTO price_history (medicine_id, country_id, price, date) VALUES
-- Aspirin price history
(1, 1, 12.99, '2020-01-01'), (1, 1, 13.99, '2021-01-01'), (1, 1, 14.99, '2022-01-01'), (1, 1, 15.99, '2023-01-01'),
(1, 2, 13.50, '2020-01-01'), (1, 2, 14.50, '2021-01-01'), (1, 2, 15.50, '2022-01-01'), (1, 2, 16.50, '2023-01-01'),
-- Ibuprofen price history
(2, 1, 10.50, '2020-01-01'), (2, 1, 11.00, '2021-01-01'), (2, 1, 11.50, '2022-01-01'), (2, 1, 12.50, '2023-01-01'),
(2, 2, 11.00, '2020-01-01'), (2, 2, 11.50, '2021-01-01'), (2, 2, 12.00, '2022-01-01'), (2, 2, 13.00, '2023-01-01');

-- Add mock purchase data
INSERT INTO purchases (medicine_id, country_id, quantity, date) VALUES
(1, 3, 1000, '2023-01-15'), -- Germany buys a lot of Aspirin
(1, 4, 800, '2023-01-20'),  -- France
(2, 3, 1200, '2023-02-01'), -- Germany buys Ibuprofen
(3, 1, 500, '2023-02-15'),  -- Portugal
(4, 5, 600, '2023-03-01'),  -- Italy
(5, 3, 900, '2023-03-15');  -- Germany

-- Add mock continental average prices
INSERT INTO continental_prices (continent, average_price, date) VALUES
('Europe', 18.50, '2023-01-01'),
('North America', 22.75, '2023-01-01'),
('South America', 15.25, '2023-01-01'),
('Asia', 16.80, '2023-01-01'),
('Oceania', 24.30, '2023-01-01'),
('Africa', 12.90, '2023-01-01');

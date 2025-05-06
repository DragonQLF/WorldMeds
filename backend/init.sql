
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

-- Insert example data with more countries
INSERT INTO paises (nome, moeda) 
VALUES 
    ('Argentina', 'ARS'), 
    ('Brazil', 'BRL'), 
    ('Chile', 'CLP'), 
    ('Mexico', 'MXN'), 
    ('USA', 'USD'),
    ('Canada', 'CAD'),
    ('Australia', 'AUD'),
    ('Russia', 'RUB'),
    ('India', 'INR'),
    ('South Korea', 'KRW'),
    ('Algeria', 'DZD'),
    ('Angola', 'AOA');

INSERT INTO medicamentos (nome, dosagem) 
VALUES 
    ('Paracetamol', '500 mg'), 
    ('Aspirin', '100 mg'), 
    ('Ibuprofen', '200 mg'), 
    ('Amoxicillin', '250 mg'), 
    ('Ciprofloxacin', '500 mg');

-- Insert historical data for trend analysis
-- March 2024
INSERT INTO medicamentos_paises (medicamento_id, pais_id, mes, preco_referencia, preco_venda, quantidade_comprada)
VALUES 
    (1, 1, '2024-03-01', 500.00, 600.00, 100),
    (2, 2, '2024-03-01', 1000.00, 18.00, 200),
    (3, 3, '2024-03-01', 300.00, 3500.00, 150),
    (4, 4, '2024-03-01', 800.00, 850.00, 250),
    (5, 5, '2024-03-01', 1200.00, 12.50, 300),
    (1, 2, '2024-03-01', 550.00, 14.50, 120),
    (1, 6, '2024-03-01', 5.00, 6.50, 200),
    (2, 7, '2024-03-01', 7.00, 8.50, 300),
    (3, 8, '2024-03-01', 200.00, 250.00, 100),
    (4, 9, '2024-03-01', 300.00, 350.00, 150),
    (5, 10, '2024-03-01', 2000.00, 2400.00, 80);

-- April 2024
INSERT INTO medicamentos_paises (medicamento_id, pais_id, mes, preco_referencia, preco_venda, quantidade_comprada)
VALUES 
    (1, 1, '2024-04-01', 520.00, 620.00, 110),
    (2, 2, '2024-04-01', 980.00, 17.50, 220),
    (3, 3, '2024-04-01', 310.00, 3600.00, 160),
    (4, 4, '2024-04-01', 820.00, 870.00, 240),
    (5, 5, '2024-04-01', 1180.00, 12.20, 310),
    (1, 6, '2024-04-01', 5.20, 6.80, 210),
    (2, 7, '2024-04-01', 6.80, 8.20, 290),
    (3, 8, '2024-04-01', 210.00, 260.00, 120),
    (4, 9, '2024-04-01', 320.00, 380.00, 160),
    (5, 10, '2024-04-01', 1950.00, 2350.00, 90);

-- May 2024 
INSERT INTO medicamentos_paises (medicamento_id, pais_id, mes, preco_referencia, preco_venda, quantidade_comprada)
VALUES 
    (1, 1, '2024-05-01', 540.00, 650.00, 120),
    (2, 2, '2024-05-01', 990.00, 16.80, 230),
    (3, 3, '2024-05-01', 315.00, 3650.00, 170),
    (4, 4, '2024-05-01', 840.00, 890.00, 260),
    (5, 5, '2024-05-01', 1160.00, 12.00, 320),
    (1, 6, '2024-05-01', 5.40, 7.20, 220),
    (2, 7, '2024-05-01', 6.50, 7.80, 310),
    (3, 8, '2024-05-01', 220.00, 280.00, 140),
    (4, 9, '2024-05-01', 340.00, 410.00, 170),
    (5, 10, '2024-05-01', 1900.00, 2250.00, 100),
    (1, 11, '2024-05-01', 80.00, 90.00, 50),
    (2, 12, '2024-05-01', 150.00, 180.00, 40);

-- Create the MySQL user if it doesn't exist and grant permissions
CREATE USER IF NOT EXISTS 'worldmeds_user'@'%' IDENTIFIED BY '1234';

GRANT ALL PRIVILEGES ON worldmeds_db.* TO 'worldmeds_user'@'%';

FLUSH PRIVILEGES;

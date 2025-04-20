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
  password VARCHAR(255)
);

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

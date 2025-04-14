
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
INSERT INTO paises (nome, moeda) VALUES ('Argentina', 'ARS'), ('Brazil', 'BRL');
INSERT INTO medicamentos (nome, dosagem) VALUES ('Paracetamol', '500 mg'), ('Aspirin', '100 mg');
INSERT INTO medicamentos_paises (medicamento_id, pais_id, mes, preco_referencia, preco_venda, quantidade_comprada)
VALUES (1, 1, '2024-03-01', 500.00, 600.00, 100),
       (2, 2, '2024-03-01', 1000.00, NULL, 200);

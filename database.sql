CREATE TABLE libros (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    autor VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 10,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE ventas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    libro_id INT NOT NULL,
    cantidad INT NOT NULL,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE CASCADE
);
INSERT INTO libros (titulo, autor, precio, stock, descripcion) VALUES
('Cien años de soledad', 'Gabriel García Márquez', 18.50, 15, 'Novela del realismo mágico'),
('1984', 'George Orwell', 14.99, 12, 'Novela distópica'),
('El principito', 'Antoine de Saint-Exupéry', 9.99, 20, 'Fábula filosófica'),
('Don Quijote de la Mancha', 'Miguel de Cervantes', 22.50, 8, 'Novela clásica española'),
('Harry Potter y la piedra filosofal', 'J.K. Rowling', 16.75, 18, 'Primer libro de la saga');
INSERT INTO ventas (libro_id, cantidad, total) VALUES
(1, 2, 37.00),
(3, 1, 9.99),
(2, 3, 44.97);
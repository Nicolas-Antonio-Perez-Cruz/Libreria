const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// CONEXIÓN A MYSQL DE RAILWAY
const db = mysql.createConnection({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'libreria_db',
    port: process.env.MYSQLPORT || 3306
});

db.connect((err) => {
    if (err) {
        console.error('Error conectando a MySQL:', err.message);
    } else {
        console.log('Conectado a MySQL de Railway');
    }
});

// RUTAS (todas las que ya tenías, PERO SIN /api)
app.get('/libros', (req, res) => {
    const sql = 'SELECT * FROM libros ORDER BY titulo';
    db.query(sql, (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

app.get('/libros/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM libros WHERE id = ?';
    db.query(sql, [id], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ error: 'Libro no encontrado' });
            return;
        }
        res.json(results[0]);
    });
});

app.post('/libros', (req, res) => {
    const { titulo, autor, precio, stock, descripcion } = req.body;
    
    if (!titulo || !autor || !precio || !stock) {
        res.status(400).json({ error: 'Faltan campos obligatorios' });
        return;
    }
    
    const sql = 'INSERT INTO libros (titulo, autor, precio, stock, descripcion) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [titulo, autor, precio, stock, descripcion || ''], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: result.insertId, mensaje: 'Libro creado' });
    });
});

app.put('/libros/:id', (req, res) => {
    const { id } = req.params;
    const { titulo, autor, precio, stock, descripcion } = req.body;
    
    const sql = 'UPDATE libros SET titulo = ?, autor = ?, precio = ?, stock = ?, descripcion = ? WHERE id = ?';
    db.query(sql, [titulo, autor, precio, stock, descripcion || '', id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Libro no encontrado' });
            return;
        }
        res.json({ mensaje: 'Libro actualizado' });
    });
});

app.delete('/libros/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM libros WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Libro no encontrado' });
            return;
        }
        res.json({ mensaje: 'Libro eliminado' });
    });
});

app.post('/comprar', (req, res) => {
    const { libro_id, cantidad } = req.body;
    
    if (!libro_id || !cantidad || cantidad <= 0) {
        res.status(400).json({ error: 'Datos inválidos' });
        return;
    }
    
    db.query('SELECT * FROM libros WHERE id = ?', [libro_id], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ error: 'Libro no encontrado' });
            return;
        }
        
        const libro = results[0];
        if (libro.stock < cantidad) {
            res.status(400).json({ error: 'Stock insuficiente' });
            return;
        }
        
        const total = libro.precio * cantidad;
        
        const sqlVenta = 'INSERT INTO ventas (libro_id, cantidad, total) VALUES (?, ?, ?)';
        db.query(sqlVenta, [libro_id, cantidad, total], (err, resultVenta) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const nuevoStock = libro.stock - cantidad;
            db.query('UPDATE libros SET stock = ? WHERE id = ?', [nuevoStock, libro_id], (err) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                res.json({ 
                    id: resultVenta.insertId, 
                    total: total,
                    mensaje: 'Venta registrada' 
                });
            });
        });
    });
});

app.get('/ventas', (req, res) => {
    const sql = `
        SELECT v.*, l.titulo, l.autor 
        FROM ventas v 
        JOIN libros l ON v.libro_id = l.id 
        ORDER BY v.fecha_venta DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
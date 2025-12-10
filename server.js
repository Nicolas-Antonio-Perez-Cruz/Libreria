const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

if (process.env.NODE_ENV === 'production') {
    console.log('🔧 Entorno: Railway (Producción)');
    if (process.env.MYSQL_URL) {
        const url = new URL(process.env.MYSQL_URL);
        process.env.DB_HOST = url.hostname;
        process.env.DB_USER = url.username;
        process.env.DB_PASSWORD = url.password;
        process.env.DB_NAME = url.pathname.slice(1);
        process.env.DB_PORT = url.port || '3306';
    }
} else {
    console.log('🔧 Entorno: Desarrollo Local');
    require('dotenv').config(); 
}

const pool = mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'libreria_db',
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((err, conn) => {
    if (err) {
        console.error('❌ Error MySQL:', err.message);
    } else {
        console.log('✅ MySQL Conectado');
        conn.release();
    }
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/libros', async (req, res) => {
    try {
        const [libros] = await pool.promise().query('SELECT * FROM libros ORDER BY id DESC');
        res.json(libros);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/libros/:id', async (req, res) => {
    try {
        const [libros] = await pool.promise().query('SELECT * FROM libros WHERE id = ?', [req.params.id]);
        if (libros.length === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json(libros[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/libros', async (req, res) => {
    try {
        const { titulo, autor, precio, stock, descripcion } = req.body;
        const [result] = await pool.promise().query(
            'INSERT INTO libros (titulo, autor, precio, stock, descripcion) VALUES (?, ?, ?, ?, ?)',
            [titulo, autor, precio, stock, descripcion || '']
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/libros/:id', async (req, res) => {
    try {
        const { titulo, autor, precio, stock, descripcion } = req.body;
        await pool.promise().query(
            'UPDATE libros SET titulo=?, autor=?, precio=?, stock=?, descripcion=? WHERE id=?',
            [titulo, autor, precio, stock, descripcion || '', req.params.id]
        );
        res.json({ mensaje: 'Actualizado', id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/libros/:id', async (req, res) => {
    try {
        await pool.promise().query('DELETE FROM libros WHERE id=?', [req.params.id]);
        res.json({ mensaje: 'Eliminado', id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/comprar', async (req, res) => {
    const conn = await pool.promise().getConnection();
    try {
        await conn.beginTransaction();
        const { libro_id, cantidad } = req.body;
        
        const [libros] = await conn.query('SELECT * FROM libros WHERE id=? FOR UPDATE', [libro_id]);
        if (libros.length === 0) throw new Error('Libro no existe');
        
        const libro = libros[0];
        if (libro.stock < cantidad) throw new Error(`Stock insuficiente: ${libro.stock}`);
        
        const total = libro.precio * cantidad;
        await conn.query('INSERT INTO ventas (libro_id, cantidad, total) VALUES (?, ?, ?)', 
            [libro_id, cantidad, total]);
        await conn.query('UPDATE libros SET stock=stock-? WHERE id=?', [cantidad, libro_id]);
        
        await conn.commit();
        res.json({ mensaje: 'Compra exitosa', total });
    } catch (err) {
        await conn.rollback();
        res.status(400).json({ error: err.message });
    } finally {
        conn.release();
    }
});

app.get('/ventas', async (req, res) => {
    try {
        const [ventas] = await pool.promise().query(
            'SELECT v.*, l.titulo FROM ventas v JOIN libros l ON v.libro_id = l.id ORDER BY v.fecha_venta DESC'
        );
        res.json(ventas);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/status', (req, res) => {
    res.json({ 
        status: 'online', 
        entorno: process.env.NODE_ENV || 'local',
        tiempo: new Date().toISOString()
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
    console.log(`📚 Entorno: ${process.env.NODE_ENV || 'local'}`);
});

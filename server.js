// ============================================================
// DULZURA EN TU HOGAR — Servidor Backend (Node.js + MySQL)
// ============================================================

const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 1. SERVIR EL FRONTEND
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.redirect('/html/index.html');
});

// 2. CONFIGURACIÓN DE CARPETAS (Estructura: /data/uploads/)
const dataDir = path.join(__dirname, 'data');
const uploadDir = path.join(dataDir, 'uploads');

if (!fs.existsSync(dataDir)){ fs.mkdirSync(dataDir); }
if (!fs.existsSync(uploadDir)){ fs.mkdirSync(uploadDir); }

app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'data/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});
const upload = multer({ storage: storage });

// 3. CONFIGURACIÓN DE MYSQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'dulzura_db' // CORREGIDO: Eliminado el punto extra
});

db.connect((err) => {
    if (err) {
        console.error('Error conectando a MySQL:', err.message);
        return;
    }
    console.log('Conectado exitosamente a la base de datos MySQL (dulzura_db).');

    // CORREGIDO: Sintaxis completa de la tabla
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS productos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            categoria VARCHAR(255) NOT NULL,
            precio VARCHAR(255) NOT NULL,
            descripcion TEXT,
            imagen VARCHAR(255)
        )
    `;
    
    db.query(createTableQuery, (err, result) => {
        if (err) console.error('Error creando la tabla:', err.message);
    });
});

/* ==========================================================
   RUTAS DE LA API
   ========================================================== */

app.get('/api/productos', (req, res) => {
    db.query("SELECT * FROM productos", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/productos', upload.single('imagen'), (req, res) => {
    const { nombre, categoria, precio, descripcion } = req.body;
    const imagenUrl = req.file ? `http://localhost:${PORT}/uploads/${req.file.filename}` : '';

    const sql = 'INSERT INTO productos (nombre, categoria, precio, descripcion, imagen) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [nombre, categoria, precio, descripcion, imagenUrl], function(err, result) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, nombre, categoria, precio, descripcion, imagen: imagenUrl });
    });
});

app.delete('/api/productos/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM productos WHERE id = ?', [id], function(err, result) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Producto eliminado", id: id });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
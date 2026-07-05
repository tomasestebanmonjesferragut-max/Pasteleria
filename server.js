// ============================================================
// DULZURA EN TU HOGAR — Servidor Backend Principal
// ============================================================

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Importamos la conexión a la base de datos desde db.js
const db = require('./db'); 

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

/* ==========================================================
   RUTAS DE AUTENTICACIÓN (LOGIN Y REGISTRO)
   ========================================================== */

// Registrar nuevo cliente
app.post('/api/register', (req, res) => {
    const { nombre, telefono, correo, password } = req.body;
    const sql = "INSERT INTO usuarios (rol, nombre, telefono, correo, password) VALUES ('cliente', ?, ?, ?, ?)";
    
    db.query(sql, [nombre, telefono, correo, password], function(err, result) {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "El correo ya está registrado" });
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: result.insertId, rol: 'cliente', nombre, telefono, correo });
    });
});

// Iniciar sesión
app.post('/api/login', (req, res) => {
    const { correo, password } = req.body;
    const sql = "SELECT id, rol, nombre, telefono, correo FROM usuarios WHERE correo = ? AND password = ?";
    
    db.query(sql, [correo, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(401).json({ error: "Credenciales incorrectas" });
        }
    });
});

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

// Actualizar producto existente (NUEVO)
app.put('/api/productos/:id', upload.single('imagen'), (req, res) => {
    const { nombre, categoria, precio, descripcion } = req.body;
    const id = req.params.id;
    
    // Si el usuario subió una nueva imagen, actualizamos todo
    if (req.file) {
        const imagenUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
        const sql = 'UPDATE productos SET nombre=?, categoria=?, precio=?, descripcion=?, imagen=? WHERE id=?';
        db.query(sql, [nombre, categoria, precio, descripcion, imagenUrl, id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Producto actualizado con nueva imagen", id });
        });
    } else {
        // Si no subió imagen, mantenemos la imagen anterior y actualizamos solo los textos
        const sql = 'UPDATE productos SET nombre=?, categoria=?, precio=?, descripcion=? WHERE id=?';
        db.query(sql, [nombre, categoria, precio, descripcion, id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Producto actualizado sin cambiar imagen", id });
        });
    }
});

app.delete('/api/productos/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM productos WHERE id = ?', [id], function(err, result) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Producto eliminado", id: id });
    });
});

// 3. INICIAR EL SERVIDOR
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
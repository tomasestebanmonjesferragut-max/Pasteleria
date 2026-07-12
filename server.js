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
// Antes: const PORT = 3000; -> fijo, solo servía en tu computador.
// Muchos hostings (Render, Railway, etc.) asignan el puerto automáticamente
// mediante process.env.PORT; si no existe (por ejemplo en tu PC), usa 3000.
const PORT = process.env.PORT || 3000;

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
    
    // CAMBIO CLAVE: Guardamos solo la ruta relativa para que funcione en PC y Celular
    const imagenUrl = req.file ? `/uploads/${req.file.filename}` : '';

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
    
    if (req.file) {
        // CAMBIO CLAVE: Guardamos solo la ruta relativa
        const imagenUrl = `/uploads/${req.file.filename}`;
        
        const sql = 'UPDATE productos SET nombre=?, categoria=?, precio=?, descripcion=?, imagen=? WHERE id=?';
        db.query(sql, [nombre, categoria, precio, descripcion, imagenUrl, id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Producto actualizado con nueva imagen", id });
        });
    } else {
        const sql = 'UPDATE productos SET nombre=?, categoria=?, precio=?, descripcion=? WHERE id=?';
        db.query(sql, [nombre, categoria, precio, descripcion, id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Producto actualizado sin cambiar imagen", id });
        });
    }
});

// ... aquí arriba está todo tu código de app.post('/api/productos'...) ...

// Última ruta de productos que ya tenías
app.delete('/api/productos/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM productos WHERE id = ?', [id], function(err, result) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Producto eliminado", id: id });
    });
});

// ==========================================================
// RUTAS PARA LOS MENSAJES (CONTACTO) - ¡PEGA ESTO AQUÍ!
// ==========================================================

// 1. POST: Guardar un nuevo mensaje del formulario
app.post('/api/mensajes', (req, res) => {
    const { nombre, mensaje } = req.body;
    
    if (!nombre || !mensaje) {
        return res.status(400).json({ error: 'El nombre y el mensaje son obligatorios.' });
    }

    const sql = 'INSERT INTO mensajes (nombre, mensaje) VALUES (?, ?)';
    db.query(sql, [nombre, mensaje], (err, result) => {
        if (err) {
            console.error('Error al guardar el mensaje:', err);
            return res.status(500).json({ error: 'Error de base de datos al guardar el mensaje.' });
        }
        res.status(201).json({ id: result.insertId, message: '¡Mensaje guardado con éxito!' });
    });
});

// 2. GET: Obtener todos los mensajes para el Panel de Control
app.get('/api/mensajes', (req, res) => {
    const sql = 'SELECT * FROM mensajes ORDER BY fecha DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener los mensajes:', err);
            return res.status(500).json({ error: 'Error al obtener los mensajes.' });
        }
        res.json(results);
    });
});

// 3. DELETE: Borrar un mensaje desde el Panel de Control
app.delete('/api/mensajes/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM mensajes WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al borrar el mensaje:', err);
            return res.status(500).json({ error: 'Error al borrar el mensaje.' });
        }
        res.json({ message: 'Mensaje borrado correctamente.' });
    });
});

// ==========================================================
// 3. INICIAR EL SERVIDOR (ESTO DEBE IR AL FINAL DE TODO)
// ==========================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en el puerto: ${PORT}`);
});
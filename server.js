// ============================================================
// DULZURA EN TU HOGAR — Servidor Backend Principal
// ============================================================

require('dotenv').config();

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// Importamos la conexión a la base de datos desde db.js
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('Falta JWT_SECRET en las variables de entorno (.env). El servidor no puede arrancar de forma segura.');
    process.exit(1);
}

const app = express();
// Antes: const PORT = 3000; -> fijo, solo servía en tu computador.
// Muchos hostings (Render, Railway, etc.) asignan el puerto automáticamente
// mediante process.env.PORT; si no existe (por ejemplo en tu PC), usa 3000.
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(helmet({
    // Los estilos/íconos/mapas se cargan desde CDNs externos (Google Fonts,
    // Bootstrap Icons, Google Maps), así que dejamos CSP desactivada por
    // defecto para no romperlos; si más adelante se define una lista fija
    // de dominios se puede activar una policy a medida aquí.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
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

if (!fs.existsSync(dataDir)) { fs.mkdirSync(dataDir); }
if (!fs.existsSync(uploadDir)) { fs.mkdirSync(uploadDir); }

app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'data/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB, igual que el límite del frontend
    fileFilter: function (req, file, cb) {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Solo se permiten imágenes'));
        }
        cb(null, true);
    }
});

/* ==========================================================
   SEGURIDAD: LIMITADORES DE INTENTOS (ANTI FUERZA BRUTA)
   ========================================================== */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20, // 20 intentos por IP cada 15 min entre login+registro
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' }
});

/* ==========================================================
   SEGURIDAD: VERIFICACIÓN DE TOKEN (JWT) Y ROL DE ADMIN
   ========================================================== */
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) return res.status(401).json({ error: 'No autorizado. Inicia sesión.' });

    jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err) return res.status(401).json({ error: 'Sesión inválida o expirada. Inicia sesión de nuevo.' });
        req.user = payload;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (req.user?.rol !== 'admin') return res.status(403).json({ error: 'No tienes permisos de administrador.' });
    next();
}

function signUser(user) {
    return jwt.sign(
        { id: user.id, rol: user.rol, nombre: user.nombre, correo: user.correo },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

/* ==========================================================
   RUTAS DE AUTENTICACIÓN (LOGIN Y REGISTRO)
   ========================================================== */

// Registrar nuevo cliente
app.post('/api/register', authLimiter, async (req, res) => {
    const { nombre, telefono, correo, password } = req.body;

    if (!nombre || !telefono || !correo || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO usuarios (rol, nombre, telefono, correo, password) VALUES ('cliente', ?, ?, ?, ?)";

        db.query(sql, [nombre, telefono, correo, hashedPassword], function (err, result) {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'El correo ya está registrado' });
                console.error('Error en /api/register:', err);
                return res.status(500).json({ error: 'Error al crear la cuenta.' });
            }
            const user = { id: result.insertId, rol: 'cliente', nombre, telefono, correo };
            res.json({ ...user, token: signUser(user) });
        });
    } catch (err) {
        console.error('Error en /api/register:', err);
        res.status(500).json({ error: 'Error al crear la cuenta.' });
    }
});

// Iniciar sesión
app.post('/api/login', authLimiter, (req, res) => {
    const { correo, password } = req.body;
    if (!correo || !password) return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });

    const sql = "SELECT id, rol, nombre, telefono, correo, password FROM usuarios WHERE correo = ?";

    db.query(sql, [correo], async (err, results) => {
        if (err) {
            console.error('Error en /api/login:', err);
            return res.status(500).json({ error: 'Error al iniciar sesión.' });
        }

        if (results.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });

        const row = results[0];
        const ok = await bcrypt.compare(password, row.password);
        if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });

        const user = { id: row.id, rol: row.rol, nombre: row.nombre, telefono: row.telefono, correo: row.correo };
        res.json({ ...user, token: signUser(user) });
    });
});

app.get('/api/productos', (req, res) => {
    db.query("SELECT * FROM productos", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Crear producto (solo admin)
app.post('/api/productos', verifyToken, requireAdmin, upload.single('imagen'), (req, res) => {
    const { nombre, categoria, precio, descripcion } = req.body;
    if (!nombre || !categoria || !precio || !descripcion) {
        return res.status(400).json({ error: 'Todos los campos del producto son obligatorios.' });
    }

    // Guardamos solo la ruta relativa para que funcione en PC y Celular
    const imagenUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const sql = 'INSERT INTO productos (nombre, categoria, precio, descripcion, imagen) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [nombre, categoria, precio, descripcion, imagenUrl], function (err, result) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, nombre, categoria, precio, descripcion, imagen: imagenUrl });
    });
});

// Actualizar producto existente (solo admin)
app.put('/api/productos/:id', verifyToken, requireAdmin, upload.single('imagen'), (req, res) => {
    const { nombre, categoria, precio, descripcion } = req.body;
    const id = req.params.id;

    if (req.file) {
        const imagenUrl = `/uploads/${req.file.filename}`;

        const sql = 'UPDATE productos SET nombre=?, categoria=?, precio=?, descripcion=?, imagen=? WHERE id=?';
        db.query(sql, [nombre, categoria, precio, descripcion, imagenUrl, id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Producto actualizado con nueva imagen', id });
        });
    } else {
        const sql = 'UPDATE productos SET nombre=?, categoria=?, precio=?, descripcion=? WHERE id=?';
        db.query(sql, [nombre, categoria, precio, descripcion, id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Producto actualizado sin cambiar imagen', id });
        });
    }
});

// Eliminar producto (solo admin)
app.delete('/api/productos/:id', verifyToken, requireAdmin, (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM productos WHERE id = ?', [id], function (err, result) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Producto eliminado', id: id });
    });
});

// ==========================================================
// RUTAS PARA LOS MENSAJES (CONTACTO)
// ==========================================================

// 1. POST: Guardar un nuevo mensaje del formulario (público, lo envía cualquier visitante)
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

// 2. GET: Obtener todos los mensajes para el Panel de Control (solo admin)
app.get('/api/mensajes', verifyToken, requireAdmin, (req, res) => {
    const sql = 'SELECT * FROM mensajes ORDER BY fecha DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener los mensajes:', err);
            return res.status(500).json({ error: 'Error al obtener los mensajes.' });
        }
        res.json(results);
    });
});

// 3. DELETE: Borrar un mensaje desde el Panel de Control (solo admin)
app.delete('/api/mensajes/:id', verifyToken, requireAdmin, (req, res) => {
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

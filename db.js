require('dotenv').config();
const mysql = require('mysql2');

// Pool de conexiones: soporta varias peticiones a la vez y se reconecta solo
// si una conexión se cae (a diferencia de una única conexión con .createConnection).
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'dulzura_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Error conectando a MySQL:', err.message);
        return;
    }
    console.log(`Conectado exitosamente a la base de datos MySQL (${process.env.DB_NAME || 'dulzura_db'}).`);
    connection.release();
});

// Exportamos el pool para que el servidor (server.js) pueda usarlo
module.exports = db;

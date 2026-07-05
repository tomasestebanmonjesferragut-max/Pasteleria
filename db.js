const mysql = require('mysql2');

// Configuración de las credenciales de MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root', // Cambia esto si tu contraseña de MySQL es diferente
    database: 'dulzura_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error conectando a MySQL:', err.message);
        return;
    }
    console.log('Conectado exitosamente a la base de datos MySQL (dulzura_db).');
});

// Exportamos la conexión para que el servidor (server.js) pueda usarla
module.exports = db;
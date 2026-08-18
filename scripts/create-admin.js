// ============================================================
// Crea (o actualiza) una cuenta de administrador con contraseña
// cifrada (bcrypt). Uso:
//
//   npm run create-admin -- "Nombre Apellido" correo@ejemplo.com +56900000000
//
// Te pedirá la contraseña de forma interactiva (no queda en el
// historial de la terminal ni en ningún archivo de texto plano).
// ============================================================

require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcryptjs');
const db = require('../db');

const [, , nombre, correo, telefono] = process.argv;

if (!nombre || !correo || !telefono) {
    console.error('Uso: npm run create-admin -- "Nombre Apellido" correo@ejemplo.com +56900000000');
    process.exit(1);
}

const KEY_ENTER = [10, 13]; // \n, \r
const KEY_CTRL_C = 3;
const KEY_BACKSPACE = [8, 127];

function askPasswordHidden(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const stdin = process.stdin;

        process.stdout.write(question);
        stdin.resume();
        stdin.setRawMode?.(true);

        let password = '';
        const onData = (buf) => {
            const code = buf[0];

            if (KEY_ENTER.includes(code)) {
                stdin.setRawMode?.(false);
                stdin.pause();
                stdin.removeListener('data', onData);
                process.stdout.write('\n');
                rl.close();
                resolve(password);
            } else if (code === KEY_CTRL_C) {
                process.stdout.write('\n');
                process.exit(1);
            } else if (KEY_BACKSPACE.includes(code)) {
                password = password.slice(0, -1);
            } else {
                password += buf.toString('utf8');
            }
        };
        stdin.on('data', onData);
    });
}

(async () => {
    const password = await askPasswordHidden('Contraseña para la nueva cuenta admin: ');
    if (password.length < 8) {
        console.error('La contraseña debe tener al menos 8 caracteres.');
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `
        INSERT INTO usuarios (rol, nombre, telefono, correo, password)
        VALUES ('admin', ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), telefono = VALUES(telefono), password = VALUES(password), rol = 'admin'
    `;

    db.query(sql, [nombre, telefono, correo, hashedPassword], (err) => {
        if (err) {
            console.error('Error al crear el administrador:', err.message);
            process.exit(1);
        }
        console.log(`Cuenta admin lista para ${correo}.`);
        process.exit(0);
    });
})();

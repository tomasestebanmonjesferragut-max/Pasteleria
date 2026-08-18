-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS dulzura_db;

-- Seleccionar la base de datos para trabajar en ella
USE dulzura_db;

-- Crear la tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(255) NOT NULL,
    precio VARCHAR(255) NOT NULL,
    descripcion TEXT,
    imagen VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rol VARCHAR(20) NOT NULL DEFAULT 'cliente',
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS mensajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Las cuentas de administrador YA NO se crean aquí en texto plano.
-- Antes este archivo traía 3 contraseñas de admin sin cifrar, y como el
-- repositorio es público en GitHub, quedaban visibles para cualquiera.
--
-- Para crear un administrador de forma segura (guarda la contraseña
-- cifrada con bcrypt), ejecuta desde la carpeta del proyecto:
--
--   npm run create-admin -- "Nombre Apellido" correo@ejemplo.com +56900000000
--
-- El script te pedirá la contraseña de forma interactiva.

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

-- Insertamos los 3 administradores maestros
INSERT INTO usuarios (rol, nombre, telefono, correo, password) VALUES 
('admin', 'Tomas Monjes', '+56900000000', 'tomas@dulzura.local', 'tomasmonjes'),
('admin', 'Admin Dos', '+56900000002', 'admin2@dulzura.local', 'admin123'),
('admin', 'Admin Tres', '+56900000003', 'admin3@dulzura.local', 'admin123');
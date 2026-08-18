# Dulzura en tu Hogar

Sitio web y backend de **Dulzura en tu Hogar**: pastelería artesanal, perfumería y almacén en Maipú, Santiago de Chile.

- Frontend: HTML/CSS/JS estático (`public/`), sin frameworks.
- Backend: Node.js + Express (`server.js`), API REST en `/api/*`.
- Base de datos: MySQL (`data/database.sql`).
- Autenticación: contraseñas cifradas con bcrypt + sesiones firmadas con JWT.

## Requisitos

- Node.js 18 o superior
- MySQL 8 (o compatible) corriendo localmente o en un hosting

## Puesta en marcha (desarrollo local)

1. Instala las dependencias:
   ```
   npm install
   ```
2. Crea la base de datos y las tablas:
   ```
   mysql -u root -p < data/database.sql
   ```
3. Copia `.env.example` a `.env` y completa tus datos (usuario/contraseña de MySQL y un `JWT_SECRET` propio):
   ```
   cp .env.example .env
   ```
4. Crea tu primera cuenta de administrador (te pide la contraseña de forma interactiva, nunca queda en texto plano):
   ```
   npm run create-admin -- "Tu Nombre" tu-correo@ejemplo.com +56900000000
   ```
5. Arranca el servidor:
   ```
   npm start
   ```
6. Abre `http://localhost:3000` en el navegador.

## Estructura del proyecto

```
public/          Frontend (HTML, CSS, JS, imágenes)
  html/          Páginas del sitio
  css/styles.css Estilos
  js/            core.js (estado/UI) → login.js (auth) → menu.js (catálogo) → admin.js (panel admin)
data/
  database.sql   Esquema de la base de datos
  uploads/       Fotos de productos subidas desde el panel admin
scripts/
  create-admin.js  Crea/actualiza una cuenta de administrador de forma segura
server.js        Servidor Express y rutas de la API
db.js            Conexión (pool) a MySQL
```

## Variables de entorno (`.env`)

| Variable      | Descripción                                              |
|---------------|-----------------------------------------------------------|
| `PORT`        | Puerto del servidor (los hostings lo asignan solos)       |
| `DB_HOST`     | Host de MySQL                                              |
| `DB_USER`     | Usuario de MySQL                                            |
| `DB_PASSWORD` | Contraseña de MySQL                                         |
| `DB_NAME`     | Nombre de la base de datos                                  |
| `JWT_SECRET`  | Secreto para firmar los tokens de sesión (obligatorio)       |

**Nunca subas el archivo `.env` a git** — ya está en `.gitignore`.

## Despliegue en producción

GitHub Pages **no sirve** para este proyecto porque solo publica archivos
estáticos y no puede correr el backend de Node/Express ni conectarse a
MySQL. Para que el login, el catálogo dinámico y el formulario de contacto
funcionen de verdad en el dominio propio, el proyecto necesita un hosting
que ejecute Node.js (por ejemplo Render, Railway o Fly.io) con una base de
datos MySQL asociada. En ese hosting:

1. Sube este repositorio (o conéctalo directo desde GitHub).
2. Define las variables de entorno de la tabla de arriba en el panel del hosting.
3. Configura el comando de arranque como `npm start`.
4. Apunta el DNS del dominio comprado hacia la URL/IP que te entregue el hosting.

## Seguridad

- Las contraseñas se guardan cifradas con `bcrypt`, nunca en texto plano.
- Las rutas de administración (crear/editar/borrar productos, ver/borrar
  mensajes) exigen un token JWT válido con rol `admin`; no basta con
  "verse" como admin en el navegador.
- Hay un límite de intentos de login/registro por IP (protección básica
  contra fuerza bruta).

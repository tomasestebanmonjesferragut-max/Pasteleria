# Dulzura en tu Hogar

Sitio web de **Dulzura en tu Hogar**: pastelería artesanal, perfumería y almacén en Maipú, Santiago de Chile.

Es un **sitio estático** (HTML, CSS y JavaScript, sin servidor ni base de datos). Se puede publicar gratis en GitHub Pages o en cualquier hosting de archivos. Los pedidos se envían por WhatsApp.

> La versión anterior, con servidor Node.js, MySQL, login y panel de administración, quedó en el commit `bdabbc4` del historial de git.

## Estructura

```
index.html               Solo redirige a pages/index.html (GitHub Pages exige uno en la raíz)
404.html                 Solo redirige a pages/404.html (GitHub Pages solo usa uno en la raíz)
pages/
  index.html             Portada
  productos.html         Catálogo con categorías y buscador
  contacto.html          Historia, formulario de contacto y ubicación
  403.html, 404.html, 500.html
assets/
  images/                Fotos (WebP) y negocio.jpg (solo para las vistas previas al compartir)
  icons/                 Favicon
  css/, js/              Vacías: reservadas para librerías de terceros
styles/main.css
scripts/
  core.js                Configuración, rutas, enlaces de contacto, scroll, FAQ, menú móvil, formulario de contacto
  modal-handler.js       Modal accesible y avisos de error (reemplaza alert/confirm)
  search.js              Buscador por nombre
  products.js            Catálogo, categorías y detalle de producto
  cart.js                "Mi pedido": arma el mensaje de WhatsApp
data/
  products.json          Catálogo de productos
  config.json            Teléfonos de contacto
  orders.json            Formato del mensaje de pedido y límites
robots.txt, sitemap.xml
```

## Errores

- Si un archivo de datos responde **403**, **404** o **5xx**, el sitio lleva a `pages/403.html`, `pages/404.html` o `pages/500.html`.
- Cualquier otro fallo (sin conexión, JSON dañado, error de un script) se muestra en un modal.
- Una ruta inexistente muestra `pages/404.html` (GitHub Pages usa el `404.html` de la raíz, que redirige a ella).

## Ver el sitio en tu computador

Abre una terminal en esta carpeta y ejecuta:

```
npx http-server . -p 8080
```

Luego entra a `http://localhost:8080`. No abras los `.html` con doble clic: el navegador bloquea la lectura de los archivos `.json`.

## Cambiar datos

**Teléfonos:** edita `data/config.json`, el único lugar donde están escritos. Ahí están el número principal y el de perfumes (Patty). Los botones y enlaces de WhatsApp y de llamada, los números visibles y el teléfono que se entrega a Google (JSON-LD) se arman desde ese archivo; ningún HTML los contiene.

**Mensaje del pedido:** edita `data/orders.json` para cambiar el saludo, el formato de cada línea o el máximo de unidades por producto. Los textos aceptan `{cantidad}`, `{nombre}`, `{precio}` y `{total}`.

**Productos:** edita `data/products.json` y agrega la foto en `assets/images/` (formato WebP).

```json
{
  "id": 8,
  "nombre": "Nombre del producto",
  "categoria": "perfume-mujer",
  "precio": "8000",
  "descripcion": "Texto corto.",
  "imagen": "assets/images/perfumes/mi-foto.webp"
}
```

- `id`: número único, no se repite.
- `precio`: solo dígitos (`"8000"`) o un texto como `"Consultar"`.
- `imagen`: ruta desde la raíz del proyecto.
- `categoria` define dónde aparece:
  - Dulce: `tortas`, `cupcakes`, `alfajores`
  - Perfume: `perfume-hombre`, `perfume-mujer`, `perfume-unisex`
  - Almacén: `almacen-abarrotes`, `almacen-bebidas`, `almacen-snacks`, `almacen-limpieza`
- Los productos de categoría `perfume-*` se piden al WhatsApp de perfumes; el resto, al principal.

## Huellas SHA-256 del pedido

Cuando un cliente agrega un producto a "Mi pedido", se guarda junto con una huella SHA-256 de su nombre, categoría y precio. Al abrir el pedido, el sitio la compara con el catálogo actual: si el precio o los datos cambiaron, actualiza el pedido y avisa al cliente; si el producto ya no existe, lo quita. No hay que mantener ninguna huella a mano: se calculan en el navegador (solo disponible en HTTPS o localhost).

## Publicar en GitHub Pages

En el repositorio: **Settings → Pages → Deploy from a branch → `main` / `(root)`**. El archivo `.nojekyll` evita que GitHub procese el sitio con Jekyll.

## Cuando tengan dominio propio

La dirección actual (`https://tomasestebanmonjesferragut-max.github.io/Pasteleria/`) aparece en las etiquetas `canonical`, `og:url`, `og:image` y el JSON-LD de cada página, en el `index.html` de la raíz, en `sitemap.xml` y en `robots.txt`. Para cambiarla, reemplaza ese texto por el dominio nuevo en todos esos archivos (buscar y reemplazar en todo el proyecto) y configura el dominio en **Settings → Pages**.

## Qué no hace este sitio

No tiene cuentas de cliente, panel de administración ni almacenamiento de mensajes o pedidos: todo lo que el cliente quiere se envía a WhatsApp. Si en el futuro se necesitan, hay que volver a incorporar un servidor.

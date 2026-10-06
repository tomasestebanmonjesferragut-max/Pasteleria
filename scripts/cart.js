/**
 * @file cart.js
 * @description "Mi pedido": junta productos y arma el mensaje de WhatsApp.
 * No hay servidor: el pedido vive en localStorage y se envía por WhatsApp.
 * El formato del mensaje y los límites están en data/orders.json. Si el pedido
 * mezcla perfumes con otras categorías, se arma un mensaje por cada número de
 * destino (ver data/config.json). Cada producto del pedido guarda una huella
 * SHA-256 para detectar si cambió en el catálogo desde que se agregó.
 */

'use strict';

(() => {
    const D = window.Dulzura;
    const { escapeHtml, formatearPrecio, esNumerico } = D;
    const CLAVE = 'dulzura_pedido';

    let ordenes = null;           // data/orders.json
    let avisosPedido = [];        // cambios detectados al abrir el pedido
    D.cargarJson('data/orders.json')
        .then((datos) => { ordenes = datos; })
        .catch((error) => {
            if (error instanceof D.Redirigido) return;
            console.error('[cart] No se pudo cargar data/orders.json:', error);
        });

    const valido = (i) => i && Number.isInteger(i.id) && typeof i.nombre === 'string'
        && Number.isInteger(i.cantidad) && i.cantidad > 0;

    function leer() {
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE));
            return Array.isArray(datos) ? datos.filter(valido) : [];
        } catch {
            return [];
        }
    }

    function guardar() {
        try {
            localStorage.setItem(CLAVE, JSON.stringify(items));
        } catch {
            // Sin almacenamiento disponible: el pedido dura solo mientras la página esté abierta.
        }
    }

    let items = leer();
    const totalUnidades = () => items.reduce((n, i) => n + i.cantidad, 0);
    const maxUnidades = () => ordenes?.maxUnidadesPorProducto ?? 99;
    const llenar = (plantilla, datos) => plantilla.replace(/\{(\w+)\}/g, (_, clave) => datos[clave] ?? '');

    /* ---------- Botón del encabezado ---------- */
    function montarBoton() {
        const cont = document.querySelector('.header-actions');
        if (!cont) return;
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.id = 'btnPedido';
        boton.className = 'icon-btn cart-btn';
        boton.innerHTML = '<i class="bi bi-bag" aria-hidden="true"></i><span class="cart-badge" hidden>0</span>';
        boton.addEventListener('click', abrirPedido);
        cont.insertBefore(boton, document.getElementById('btnMenu'));
        actualizarBoton();
    }

    function actualizarBoton() {
        const boton = document.getElementById('btnPedido');
        if (!boton) return;
        const n = totalUnidades();
        const badge = boton.querySelector('.cart-badge');
        badge.textContent = n;
        badge.hidden = n === 0;
        boton.setAttribute('aria-label', n ? `Ver mi pedido (${n} ${n === 1 ? 'producto' : 'productos'})` : 'Ver mi pedido');
    }

    /* ---------- Operaciones ---------- */
    async function agregar(producto) {
        const huella = await D.huella(producto);
        const existente = items.find((i) => i.id === producto.id);
        if (existente) existente.cantidad = Math.min(maxUnidades(), existente.cantidad + 1);
        else items.push({ id: producto.id, nombre: producto.nombre, precio: producto.precio, categoria: producto.categoria, huella, cantidad: 1 });
        guardar();
        actualizarBoton();
    }

    // Compara cada producto del pedido con el catálogo actual mediante su huella SHA-256.
    // Si cambió el nombre, la categoría o el precio, actualiza el pedido y lo avisa.
    async function sincronizar() {
        const avisos = [];
        let catalogo;
        try {
            catalogo = await D.cargarJson('data/products.json');
        } catch (error) {
            if (!(error instanceof D.Redirigido)) console.error('[cart] No se pudo verificar el catálogo:', error);
            return avisos;
        }

        for (const item of [...items]) {
            const actual = catalogo.find((p) => p.id === item.id);
            if (!actual) {
                items = items.filter((i) => i !== item);
                avisos.push(`«${item.nombre}» ya no está disponible y se quitó de tu pedido.`);
                continue;
            }
            const huella = await D.huella(actual);
            if (!huella) continue; // sin SHA-256 disponible (página sin HTTPS): no se verifica
            if (item.huella && item.huella !== huella) {
                const cambioPrecio = String(actual.precio) !== String(item.precio);
                avisos.push(cambioPrecio ? `Actualizamos el precio de «${actual.nombre}».` : `Actualizamos los datos de «${actual.nombre}».`);
            }
            Object.assign(item, { nombre: actual.nombre, categoria: actual.categoria, precio: actual.precio, huella });
        }
        guardar();
        actualizarBoton();
        return avisos;
    }

    // Agrupa por número de WhatsApp de destino.
    function agrupar() {
        const mapa = new Map();
        items.forEach((i) => {
            const tel = D.telefonoPara(i.categoria);
            if (!mapa.has(tel.numero)) mapa.set(tel.numero, { tel, items: [] });
            mapa.get(tel.numero).items.push(i);
        });
        return [...mapa.values()];
    }

    function totales(grupo) {
        let subtotal = 0;
        let porConsultar = 0;
        grupo.items.forEach((i) => {
            if (esNumerico(i.precio)) subtotal += Number(i.precio) * i.cantidad;
            else porConsultar++;
        });
        return { subtotal, porConsultar };
    }

    // Mensaje de WhatsApp según las plantillas de data/orders.json
    function mensaje(grupo) {
        const m = ordenes.mensaje;
        const lineas = grupo.items.map((i) => llenar(m.linea, {
            cantidad: i.cantidad,
            nombre: i.nombre,
            precio: esNumerico(i.precio) ? formatearPrecio(Number(i.precio) * i.cantidad) : m.precioPorConsultar
        }));
        const { subtotal, porConsultar } = totales(grupo);
        const total = subtotal
            ? llenar(porConsultar ? m.totalMasConsultar : m.total, { total: formatearPrecio(subtotal) })
            : m.sinTotal;
        return `${m.encabezado}\n${lineas.join('\n')}\n\n${total}`;
    }

    /* ---------- Vista ---------- */
    async function abrirPedido() {
        items = leer();
        avisosPedido = await sincronizar();
        renderizar();
    }

    function renderizar() {
        if (!D.cfg || !ordenes) {
            return window.mostrarModal('Los datos del pedido aún no están disponibles. Intenta de nuevo en unos segundos.', 'Un momento');
        }
        const avisos = avisosPedido.map((a) => `<p class="pedido-aviso" role="status">${escapeHtml(a)}</p>`).join('');

        if (!items.length) {
            return D.Modal.abrir(`
                <div class="pedido">
                    <h2>Mi pedido</h2>
                    ${avisos}
                    <p class="pedido-vacio">Aún no agregas productos. Abre un producto y presiona «Agregar al pedido».</p>
                </div>`, 'Mi pedido');
        }

        const grupos = agrupar().map((g) => {
            const { subtotal, porConsultar } = totales(g);
            const filas = g.items.map((i) => {
                const nombre = escapeHtml(i.nombre);
                return `
                    <li class="pedido-item">
                        <div class="pedido-item-info"><strong>${nombre}</strong><span>${escapeHtml(formatearPrecio(i.precio))}</span></div>
                        <div class="pedido-cant" role="group" aria-label="Cantidad de ${nombre}">
                            <button type="button" data-pedido-accion="menos" data-id="${i.id}" aria-label="Quitar una unidad de ${nombre}">−</button>
                            <span aria-live="polite">${i.cantidad}</span>
                            <button type="button" data-pedido-accion="mas" data-id="${i.id}" aria-label="Agregar una unidad de ${nombre}">+</button>
                        </div>
                        <button type="button" class="pedido-quitar" data-pedido-accion="quitar" data-id="${i.id}" aria-label="Quitar ${nombre} del pedido"><i class="bi bi-trash3" aria-hidden="true"></i></button>
                    </li>`;
            }).join('');

            const total = subtotal
                ? `Total estimado: <strong>${escapeHtml(formatearPrecio(subtotal))}</strong>${porConsultar ? ' + productos por consultar' : ''}`
                : 'Precios por consultar';
            const url = D.urlWhatsApp(g.tel.numero, mensaje(g));

            return `
                <section class="pedido-grupo">
                    <h3>${escapeHtml(g.tel.etiqueta)}</h3>
                    <ul class="pedido-lista">${filas}</ul>
                    <p class="pedido-total">${total}</p>
                    <a class="btn-pill btn-pill-solid" href="${escapeHtml(url)}" target="_blank" rel="noopener"><i class="bi bi-whatsapp" aria-hidden="true"></i>&nbsp;Enviar a ${escapeHtml(g.tel.etiqueta)}</a>
                </section>`;
        }).join('');

        D.Modal.abrir(`
            <div class="pedido">
                <h2>Mi pedido</h2>
                ${avisos}
                ${grupos}
                <button type="button" class="pedido-vaciar" data-pedido-accion="vaciar">Vaciar pedido</button>
            </div>`, 'Mi pedido');
    }

    function marcarAgregado(boton) {
        const original = boton.innerHTML;
        boton.innerHTML = '<i class="bi bi-check2" aria-hidden="true"></i>&nbsp;Agregado';
        setTimeout(() => { boton.innerHTML = original; }, 1500);
    }

    /* ---------- Eventos (delegados) ---------- */
    document.addEventListener('click', async (e) => {
        const btnAgregar = e.target.closest('[data-agregar]');
        if (btnAgregar) {
            const producto = D.State.productos.find((p) => p.id === Number(btnAgregar.dataset.agregar));
            if (producto) { await agregar(producto); marcarAgregado(btnAgregar); }
            return;
        }

        const btn = e.target.closest('[data-pedido-accion]');
        if (!btn) return;

        const accion = btn.dataset.pedidoAccion;
        const id = Number(btn.dataset.id);
        const item = items.find((i) => i.id === id);

        if (accion === 'mas' && item) item.cantidad = Math.min(maxUnidades(), item.cantidad + 1);
        else if (accion === 'menos' && item) item.cantidad = Math.max(1, item.cantidad - 1);
        else if (accion === 'quitar') items = items.filter((i) => i.id !== id);
        else if (accion === 'vaciar') items = [];

        guardar();
        actualizarBoton();
        renderizar();
        // Mantiene el foco en el mismo control al sumar/restar.
        document.querySelector(`.modal-contenido [data-pedido-accion="${accion}"][data-id="${id}"]`)?.focus();
    });

    D.Carrito = { agregar };
    montarBoton();
})();

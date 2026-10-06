/**
 * @file modal-handler.js
 * @description Modal único y accesible (foco, Esc, Tab atrapado) usado para el
 * detalle de producto, el pedido y los avisos de error. Reemplaza alert/confirm.
 */

'use strict';

(() => {
    let overlay = null;
    let caja = null;
    let focoPrevio = null;

    const FOCUSABLES = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function crear() {
        overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-box" role="dialog" aria-modal="true" tabindex="-1">
                <button type="button" class="modal-close" aria-label="Cerrar ventana"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
                <div class="modal-contenido"></div>
            </div>`;
        document.body.appendChild(overlay);
        caja = overlay.querySelector('.modal-box');

        overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrar(); });
        overlay.querySelector('.modal-close').addEventListener('click', cerrar);
        document.addEventListener('keydown', teclado);
    }

    // contenido: string HTML (ya escapado por quien llama) o Node.
    function abrir(contenido, etiqueta = 'Ventana de diálogo') {
        if (!overlay) crear();
        const zona = caja.querySelector('.modal-contenido');
        if (typeof contenido === 'string') zona.innerHTML = contenido;
        else zona.replaceChildren(contenido);

        caja.setAttribute('aria-label', etiqueta);
        if (!overlay.classList.contains('open')) focoPrevio = document.activeElement;
        overlay.classList.add('open');
        document.body.classList.add('modal-abierto');
        if (!caja.contains(document.activeElement)) caja.querySelector('.modal-close').focus();
    }

    function cerrar() {
        if (!overlay || !overlay.classList.contains('open')) return;
        overlay.classList.remove('open');
        document.body.classList.remove('modal-abierto');
        focoPrevio?.focus?.();
        focoPrevio = null;
    }

    function teclado(e) {
        if (!overlay.classList.contains('open')) return;
        if (e.key === 'Escape') return cerrar();
        if (e.key !== 'Tab') return;

        const items = [...caja.querySelectorAll(FOCUSABLES)];
        const primero = items[0];
        const ultimo = items[items.length - 1];
        if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }

    // Aviso para errores o mensajes al usuario.
    function mostrarModal(mensaje, titulo = 'Aviso') {
        const nodo = document.createElement('div');
        nodo.className = 'modal-aviso';

        const h = document.createElement('h2');
        h.textContent = titulo;
        const p = document.createElement('p');
        p.textContent = mensaje;
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'btn-pill btn-pill-solid';
        boton.textContent = 'Entendido';
        boton.addEventListener('click', cerrar);

        nodo.append(h, p, boton);
        abrir(nodo, titulo);
    }

    window.Dulzura.Modal = { abrir, cerrar };
    window.mostrarModal = mostrarModal;

    /* Errores no controlados de nuestros propios scripts -> modal en vez de fallar en silencio. */
    const MENSAJE_GENERICO = 'Ha ocurrido un error al procesar la solicitud.';
    const esNuestro = (texto = '') => String(texto).includes('/assets/js/');

    window.addEventListener('error', (e) => {
        if (esNuestro(e.filename)) mostrarModal(MENSAJE_GENERICO, 'Algo salió mal');
    });
    window.addEventListener('unhandledrejection', (e) => {
        if (esNuestro(e.reason?.stack)) mostrarModal(MENSAJE_GENERICO, 'Algo salió mal');
    });
})();

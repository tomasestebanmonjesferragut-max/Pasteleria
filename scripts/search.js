/**
 * @file search.js
 * @description Buscador por nombre sobre el catálogo (data/products.json).
 */

'use strict';

(() => {
    const { State } = window.Dulzura;

    // Sin tildes ni mayúsculas: "aroma" encuentra "Ároma".
    const normalizar = (texto = '') =>
        String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

    // Filtra por el campo `nombre`. Sin término devuelve la lista completa.
    function buscarProductos(productos, termino) {
        const q = normalizar(termino);
        return q ? productos.filter((p) => normalizar(p.nombre).includes(q)) : productos;
    }

    window.Dulzura.buscarProductos = buscarProductos;

    document.getElementById('buscador')?.addEventListener('input', (e) => {
        State.busqueda = e.target.value;
        window.Dulzura.Catalogo?.renderMenu();
    });
})();

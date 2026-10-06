/**
 * @file products.js
 * @description Catálogo: carga data/products.json, lo muestra en productos.html
 * (con categorías y buscador) y en "Nuestros favoritos" del inicio, y abre el
 * detalle de producto.
 */

'use strict';

(() => {
    const D = window.Dulzura;
    const { State, escapeHtml, formatearPrecio } = D;

    // Categorías del catálogo: grupo -> subcategorías (clave de products.json -> etiqueta).
    const GRUPOS = {
        dulce: { tortas: 'Tortas', cupcakes: 'Cupcakes', alfajores: 'Alfajores' },
        perfume: { 'perfume-hombre': 'Hombre', 'perfume-mujer': 'Mujer', 'perfume-unisex': 'Unisex' },
        almacen: {
            'almacen-abarrotes': 'Abarrotes', 'almacen-bebidas': 'Bebidas',
            'almacen-snacks': 'Snacks y Confites', 'almacen-limpieza': 'Limpieza y Aseo'
        }
    };
    const grupoDe = (categoria = '') =>
        categoria.startsWith('perfume') ? 'perfume' : categoria.startsWith('almacen') ? 'almacen' : 'dulce';

    // Ícono de respaldo para productos sin foto.
    const ICONOS = {
        tortas: 'bi-cake2-fill', cupcakes: 'bi-cup-hot-fill', alfajores: 'bi-cookie',
        'perfume-hombre': 'bi-droplet-fill', 'perfume-mujer': 'bi-flower2', 'perfume-unisex': 'bi-stars',
        'almacen-abarrotes': 'bi-basket2-fill', 'almacen-bebidas': 'bi-cup-straw',
        'almacen-snacks': 'bi-bag-fill', 'almacen-limpieza': 'bi-droplet'
    };
    const icono = (categoria) => ICONOS[categoria] || 'bi-cake2';

    const resumen = (texto = '', max = 60) => {
        const t = String(texto);
        return t.length > max ? t.slice(0, max).trimEnd() + '…' : t;
    };
    const imagen = (p) => D.recurso(p.imagen);

    const Catalogo = {
        async init() {
            this.aplicarFiltroUrl();
            await this.cargar();
            this.enlazarEventos();
        },

        // productos.html?cat=perfume&sub=perfume-mujer
        aplicarFiltroUrl() {
            const params = new URLSearchParams(window.location.search);
            const cat = params.get('cat');
            const sub = params.get('sub');
            State.grupo = GRUPOS[cat] ? cat : 'todos';
            State.filtro = State.grupo !== 'todos' && GRUPOS[State.grupo][sub] ? sub : 'todas';
        },

        async cargar() {
            try {
                State.productos = await D.cargarJson('data/products.json');
            } catch (error) {
                if (error instanceof D.Redirigido) return;
                console.error('[products] No se pudo cargar data/products.json:', error);
                const vacio = document.getElementById('menuEmpty');
                if (vacio) { vacio.textContent = 'No pudimos cargar el catálogo.'; vacio.style.display = 'block'; }
                window.mostrarModal('No pudimos cargar el catálogo. Intenta de nuevo en unos minutos o escríbenos por WhatsApp.', 'Catálogo no disponible');
                return;
            }
            this.renderControles();
            this.renderMenu();
            this.renderFeatured();
        },

        // Botones de categoría y subcategoría (productos.html)
        renderControles() {
            document.querySelectorAll('#menuGrupos [data-grupo]').forEach((b) => {
                const activo = b.dataset.grupo === State.grupo;
                b.classList.toggle('active', activo);
                b.setAttribute('aria-pressed', String(activo));
            });

            const subs = document.getElementById('menuFilters');
            if (!subs) return;
            const opciones = GRUPOS[State.grupo];
            subs.hidden = !opciones;
            if (!opciones) { subs.replaceChildren(); return; }

            const botones = [['todas', 'Todas'], ...Object.entries(opciones)].map(([clave, etiqueta]) => {
                const activo = clave === State.filtro;
                return `<button type="button" class="filter-chip${activo ? ' active' : ''}" data-sub="${escapeHtml(clave)}" aria-pressed="${activo}">${escapeHtml(etiqueta)}</button>`;
            });
            subs.innerHTML = botones.join('');

            // Los afiches del catálogo completo de perfumes solo se muestran en esa categoría.
            const afiches = document.getElementById('afichesPerfume');
            if (afiches) afiches.hidden = State.grupo !== 'perfume';
        },

        // Grilla de productos
        renderMenu() {
            const grid = document.getElementById('menuGrid');
            if (!grid) return;
            const vacio = document.getElementById('menuEmpty');
            grid.querySelectorAll('.menu-card').forEach((c) => c.remove());

            const porCategoria = State.productos.filter((p) =>
                (State.grupo === 'todos' || grupoDe(p.categoria) === State.grupo)
                && (State.filtro === 'todas' || p.categoria === State.filtro));
            const visibles = D.buscarProductos ? D.buscarProductos(porCategoria, State.busqueda) : porCategoria;

            if (vacio) {
                const termino = State.busqueda.trim();
                vacio.textContent = termino
                    ? `No encontramos productos que coincidan con «${termino}».`
                    : 'Aún no hay productos en esta categoría.';
                vacio.style.display = visibles.length ? 'none' : 'block';
            }

            const fragmento = document.createDocumentFragment();
            visibles.forEach((p) => {
                const card = document.createElement('article');
                card.className = 'menu-card reveal in-view';

                const media = p.imagen
                    ? `<img src="${escapeHtml(imagen(p))}" alt="${escapeHtml(p.nombre)}" loading="lazy" decoding="async" data-detalle="${p.id}">`
                    : `<i class="bi ${icono(p.categoria)} fallback-icon" aria-hidden="true" data-detalle="${p.id}"></i>`;

                card.innerHTML = `
                    <div class="menu-card-media">${media}</div>
                    <div class="menu-card-body">
                        <h3>${escapeHtml(p.nombre)}</h3>
                        <p class="menu-card-desc">${escapeHtml(resumen(p.descripcion))}</p>
                    </div>
                    <div class="menu-card-foot">
                        <span class="price-tag">${escapeHtml(formatearPrecio(p.precio))}</span>
                        <button type="button" class="btn-ghost" data-detalle="${p.id}" aria-label="Ver detalle de ${escapeHtml(p.nombre)}"><i class="bi bi-eye-fill" aria-hidden="true"></i> Ver</button>
                    </div>`;
                fragmento.appendChild(card);
            });
            grid.appendChild(fragmento);
        },

        // Últimos 4 productos en "Nuestros favoritos" (index.html)
        renderFeatured() {
            const grid = document.getElementById('featuredGrid');
            if (!grid) return;
            grid.replaceChildren();

            const fragmento = document.createDocumentFragment();
            State.productos.slice(-4).reverse().forEach((p) => {
                const card = document.createElement('article');
                card.className = 'polaroid-card reveal in-view';
                const media = p.imagen
                    ? `<img src="${escapeHtml(imagen(p))}" alt="${escapeHtml(p.nombre)}" loading="lazy" decoding="async">`
                    : `<i class="bi ${icono(p.categoria)} fs-1" aria-hidden="true"></i>`;
                card.innerHTML = `
                    <div class="polaroid-img-wrapper">${media}</div>
                    <h3 class="polaroid-title">${escapeHtml(p.nombre)}</h3>`;
                fragmento.appendChild(card);
            });
            grid.appendChild(fragmento);
        },

        // Mantiene la URL compartible (?cat=...&sub=...) sin recargar.
        actualizarUrl() {
            const params = new URLSearchParams();
            if (State.grupo !== 'todos') params.set('cat', State.grupo);
            if (State.filtro !== 'todas') params.set('sub', State.filtro);
            const qs = params.toString();
            history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : ''));
        },

        enlazarEventos() {
            document.getElementById('menuGrupos')?.addEventListener('click', (e) => {
                const boton = e.target.closest('[data-grupo]');
                if (!boton) return;
                State.grupo = boton.dataset.grupo;
                State.filtro = 'todas';
                this.renderControles();
                this.renderMenu();
                this.actualizarUrl();
            });

            document.getElementById('menuFilters')?.addEventListener('click', (e) => {
                const boton = e.target.closest('[data-sub]');
                if (!boton) return;
                State.filtro = boton.dataset.sub;
                this.renderControles();
                this.renderMenu();
                this.actualizarUrl();
                document.querySelector(`#menuFilters [data-sub="${State.filtro}"]`)?.focus();
            });

            // Un solo listener para abrir el detalle (foto o botón "Ver").
            document.getElementById('menuGrid')?.addEventListener('click', (e) => {
                const el = e.target.closest('[data-detalle]');
                if (el) this.abrirDetalle(Number(el.dataset.detalle));
            });
        },

        abrirDetalle(id) {
            const p = State.productos.find((x) => x.id === id);
            if (!p) return;
            if (!D.cfg) {
                return window.mostrarModal('Los datos de contacto aún no están disponibles. Intenta de nuevo en unos segundos.', 'Un momento');
            }

            const tel = D.telefonoPara(p.categoria);
            const url = D.urlWhatsApp(tel.numero, `¡Hola! Quiero pedir este producto: ${p.nombre}`);
            const foto = p.imagen
                ? `<img class="detalle-img" src="${escapeHtml(imagen(p))}" alt="${escapeHtml(p.nombre)}">`
                : '';

            D.Modal.abrir(`
                <div class="detalle">
                    ${foto}
                    <h2 class="detalle-nombre">${escapeHtml(p.nombre)}</h2>
                    <p class="detalle-precio">${escapeHtml(formatearPrecio(p.precio))}</p>
                    <p class="detalle-desc">${escapeHtml(p.descripcion)}</p>
                    <div class="detalle-acciones" aria-live="polite">
                        <button type="button" class="btn-pill btn-pill-solid" data-agregar="${p.id}"><i class="bi bi-bag-plus" aria-hidden="true"></i>&nbsp;Agregar al pedido</button>
                        <a class="btn-pill btn-pill-ghost" href="${escapeHtml(url)}" target="_blank" rel="noopener"><i class="bi bi-whatsapp" aria-hidden="true"></i>&nbsp;Pedir solo este por WhatsApp</a>
                    </div>
                </div>`, p.nombre);
        }
    };

    D.Catalogo = Catalogo;
    Catalogo.init();
})();

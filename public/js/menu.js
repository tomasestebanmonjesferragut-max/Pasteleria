/**
 * @file menu.js
 * @description Controlador del Catálogo, Menú y Productos Destacados.
 * @author GhostDev
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // Importamos las configuraciones y herramientas desde core.js
    const { CONFIG, State, UI, phoneFor } = window.Dulzura;

    // Páginas de categoría (dulce.html, perfume.html, almacen.html) marcan su
    // sección con data-scope="dulce|perfume|almacen"; cada scope solo debe
    // ver/gestionar los productos de las categorías que le corresponden.
    const SCOPES = {
        dulce: ['tortas', 'cupcakes', 'alfajores'],
        // 'perfumes' y 'almacen' quedan por compatibilidad con productos
        // guardados antes de tener subcategorías.
        perfume: ['perfumes', 'perfume-hombre', 'perfume-mujer', 'perfume-unisex'],
        almacen: ['almacen', 'almacen-abarrotes', 'almacen-bebidas', 'almacen-snacks', 'almacen-limpieza']
    };

    class MenuController {
        static async init() {
            this.applyUrlFilter();
            await this.fetchProducts();
            this.bindEvents();
        }

        static getScope() {
            return document.getElementById('menu')?.dataset.scope || null;
        }

        // Permite abrir el catálogo ya filtrado desde otras páginas
        // (ej: dulce.html?cat=cupcakes)
        static applyUrlFilter() {
            const params = new URLSearchParams(window.location.search);
            const cat = params.get('cat');
            const chips = document.querySelectorAll('.filter-chip[data-filter]');
            if (!chips.length) return;

            const match = cat && Array.from(chips).some(c => c.dataset.filter === cat);
            const targetFilter = match ? cat : 'todas';

            State.currentFilter = targetFilter;
            chips.forEach(c => c.classList.toggle('active', c.dataset.filter === targetFilter));
        }

        // Restringe State.productos a las categorías del scope de la página actual
        static applyScopeFilter() {
            const scope = this.getScope();
            const categorias = scope && SCOPES[scope];
            if (!categorias) return;
            State.productos = State.productos.filter(p => categorias.includes(p.categoria));
        }

        static async fetchProducts() {
            try {
                const res = await fetch(`${CONFIG.API_URL}/productos`);
                if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
                State.productos = await res.json();
                this.applyScopeFilter();

                // Renderizamos las vistas dependientes del catálogo
                this.renderMenu();
                this.renderFeatured();

                // Si el AdminController ya está cargado, refrescamos su lista
                if (window.AdminController) {
                    window.AdminController.renderAdminList();
                }
            } catch (error) {
                console.error('[MenuController] Error:', error);
                UI.showToast('Oops! No pudimos conectar con los postres 🍰', 'error');
            }
        }

        // Renderiza la grilla de productos (dulce.html, perfume.html, almacen.html)
        static renderMenu() {
            const grid = document.getElementById('menuGrid');
            const empty = document.getElementById('menuEmpty');
            if (!grid) return; 

            // Limpieza de Nodos DOM eficiente
            while (grid.lastChild && !grid.lastChild.classList?.contains('menu-empty')) {
                grid.removeChild(grid.lastChild);
            }

            const visibles = State.productos.filter(p => State.currentFilter === 'todas' || p.categoria === State.currentFilter);
            if(empty) empty.style.display = visibles.length ? 'none' : 'block';

            const fragment = document.createDocumentFragment();

            visibles.forEach(p => {
                const card = document.createElement('article');
                card.className = 'menu-card reveal in-view';
                
                const iconOrImage = p.imagen 
                    ? `<img src="${p.imagen}" loading="lazy" style="cursor: zoom-in;" onclick="window.abrirDetalle(${p.id})">` 
                    : `<i class="bi ${CONFIG.ICONS[p.categoria] || 'bi-cake2'} fallback-icon" onclick="window.abrirDetalle(${p.id})"></i>`;

                card.innerHTML = `
                    <div class="menu-card-media overflow-hidden">${iconOrImage}</div>
                    <div class="menu-card-body">
                        <h3>${UI.escapeHtml(p.nombre)}</h3>
                        <p class="menu-card-desc">${UI.escapeHtml(p.descripcion).substring(0, 60)}&hellip;</p>
                    </div>
                    <div class="menu-card-foot">
                        <span class="price-tag" style="color: #ff769b;">$${UI.escapeHtml(p.precio)}</span>
                        <button onclick="window.abrirDetalle(${p.id})" class="btn-ghost"><i class="bi bi-eye-fill"></i> Ver</button>
                    </div>
                `;
                fragment.appendChild(card);
            });

            grid.appendChild(fragment);
        }

        // Renderiza los últimos 3 productos en el index.html (estilo Polaroid)
        static renderFeatured() {
            const featuredGrid = document.getElementById('featuredGrid');
            if (!featuredGrid) return; 

            while (featuredGrid.firstChild) {
                featuredGrid.removeChild(featuredGrid.firstChild);
            }

            const destacados = State.productos.slice(-3).reverse(); 
            const fragment = document.createDocumentFragment();

            destacados.forEach(p => {
                const card = document.createElement('article');
                card.className = 'polaroid-card reveal in-view';
                
                const iconOrImage = p.imagen 
                    ? `<img src="${p.imagen}" loading="lazy">` 
                    : `<i class="bi ${CONFIG.ICONS[p.categoria] || 'bi-cake2'} fs-1" style="color: #ccc;"></i>`;

                card.innerHTML = `
                    <div class="polaroid-img-wrapper">${iconOrImage}</div>
                    <h3 class="polaroid-title">${UI.escapeHtml(p.nombre)}</h3>
                `;
                fragment.appendChild(card);
            });

            featuredGrid.appendChild(fragment);
        }

        static bindEvents() {
            document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    document.querySelectorAll('.filter-chip[data-filter]').forEach(c => c.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    State.currentFilter = e.currentTarget.dataset.filter;
                    this.renderMenu();
                });
            });
        }
    }

    // Exponer la clase para que otros módulos la utilicen
    window.MenuController = MenuController;

    // =========================================================
    // NUEVO: Función global para abrir el modal de detalles
    // =========================================================
    window.abrirDetalle = (id) => {
        const producto = State.productos.find(p => p.id === id);
        const modal = document.getElementById('productModal');
        if (!producto || !modal) return;

        // Llenar datos del modal
        document.getElementById('productModalName').textContent = producto.nombre;
        document.getElementById('productModalPrice').textContent = `$${producto.precio}`;
        document.getElementById('productModalDesc').textContent = producto.descripcion;

        // Manejar la imagen
        const img = document.getElementById('productModalImage');
        if (producto.imagen) { 
            img.src = producto.imagen; 
            img.style.display = 'block'; 
        } else { 
            img.style.display = 'none'; 
        }

        // Configurar botón de WhatsApp (Perfume va al WhatsApp de Patty, el resto al número principal)
        const btn = document.getElementById('productModalOrder');
        const msj = encodeURIComponent(`¡Hola! Me encantaría pedir este producto súper kiut: *${producto.nombre}* 🍰✨`);
        btn.href = `https://wa.me/${phoneFor(producto.categoria)}?text=${msj}`;

        // Abrir modal con la animación
        modal.classList.add('open');
    };

    // Inicializar el módulo
    MenuController.init();
});


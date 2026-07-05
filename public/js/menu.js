/**
 * @file menu.js
 * @description Controlador del Catálogo, Menú y Productos Destacados.
 * @author GhostDev
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // Importamos las configuraciones y herramientas desde core.js
    const { CONFIG, State, UI } = window.Dulzura;

    class MenuController {
        static async init() {
            await this.fetchProducts();
            this.bindEvents();
        }

        static async fetchProducts() {
            try {
                const res = await fetch(`${CONFIG.API_URL}/productos`);
                if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
                State.productos = await res.json();
                
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

        // Renderiza el catálogo completo en menu.html
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

    // Exponer para que otros módulos lo utilicen
    window.MenuController = MenuController;

    // Inicializar el módulo
    MenuController.init();
});
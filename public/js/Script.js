/**
 * @file Script.js
 * @description Motor Principal (Core Engine) para Dulzura en tu Hogar.
 * @author GhostDev
 * @version 5.0.0 (Versión Unificada y Completa ✨)
 */

'use strict';

/* ==========================================================
   0. INYECCIÓN DE ANIMACIONES "KIUT" (CSS DINÁMICO)
   ========================================================== */
const injectCuteAnimations = () => {
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes floatCute {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
        }
        @keyframes popKiut {
            0% { transform: scale(0.7) translateY(20px); opacity: 0; }
            70% { transform: scale(1.03); opacity: 1; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes pulseHeart {
            0% { transform: scale(1); }
            20% { transform: scale(1.2); color: #ff769b; }
            40% { transform: scale(1); }
            60% { transform: scale(1.2); color: #ff769b; }
            80% { transform: scale(1); }
        }
        
        /* ESTILOS TIPO POLAROID PARA PRODUCTOS DESTACADOS */
        .polaroid-card {
            background: white;
            padding: 12px 12px 20px 12px;
            border-radius: 4px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1), 0 6px 20px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .polaroid-card:nth-child(even) { transform: rotate(2deg); }
        .polaroid-card:nth-child(odd) { transform: rotate(-2deg); }
        .polaroid-card:hover { 
            transform: scale(1.05) rotate(0deg); 
            z-index: 10;
        }
        .polaroid-img-wrapper {
            width: 100%;
            aspect-ratio: 1/1;
            overflow: hidden;
            background: #f4f4f4;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .polaroid-img-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .polaroid-title {
            font-family: 'Fraunces', serif;
            font-size: 1.2rem;
            color: #333;
            margin: 0;
            font-weight: 600;
        }

        /* Aplicando las animaciones previas */
        .modal-box { 
            animation: popKiut 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important; 
            border: 3px solid var(--paper) !important;
        }
        .menu-card { transition: all 0.3s ease; }
        .menu-card:hover { 
            animation: floatCute 2.5s ease-in-out infinite; 
            border-color: #ffb6c1 !important; 
            box-shadow: 0 15px 25px rgba(255, 182, 193, 0.4) !important; 
        }
        #btnGlobalAdmin { 
            animation: floatCute 3s ease-in-out infinite; 
            background: linear-gradient(135deg, var(--berry), #ff769b) !important;
            border: none;
        }
        .bi-person-heart, .toast-icon { animation: pulseHeart 2s infinite; }
        .admin-list-item { transition: transform 0.2s ease; }
        .admin-list-item:hover {
            transform: scale(1.02); background-color: #fff9fa; border-left: 4px solid #ffb6c1;
        }
    `;
    document.head.appendChild(style);
};

/* ==========================================================
   1. ESTADO GLOBAL E INMUTABILIDAD
   ========================================================== */
const CONFIG = Object.freeze({
    API_URL: 'http://localhost:3000/api',
    MAX_FILE_SIZE: 2 * 1024 * 1024,
    PHONE_NUMBER: '56900000000',
    ICONS: Object.freeze({ 
        tortas: 'bi-cake2-fill', cupcakes: 'bi-cup-hot-fill', 
        alfajores: 'bi-cookie', cajas: 'bi-gift-fill' 
    })
});

const State = {
    productos: [],
    currentUser: JSON.parse(localStorage.getItem('dulzura_user')) || null,
    currentFilter: 'todas'
};

/* ==========================================================
   2. GESTOR DE INTERFAZ DE USUARIO (UI MANAGER)
   ========================================================== */
class UIManager {
    static escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    static showToast(message, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:9999; display:flex; flex-direction:column; gap:12px; pointer-events:none;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        const bgColor = type === 'success' ? '#a8e6cf' : (type === 'error' ? '#ff8b94' : '#fdffab');
        const color = type === 'info' ? '#333' : '#fff';
        const iconClass = type === 'success' ? 'bi-stars' : (type === 'error' ? 'bi-emoji-frown-fill' : 'bi-info-circle-fill');
        
        toast.style.cssText = `background-color: ${bgColor}; color: ${color}; padding: 14px 28px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); font-weight: 600; font-size: 0.95rem; transform: translateY(100px); opacity: 0; transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); display: flex; align-items: center; gap: 10px; border: 2px solid rgba(255,255,255,0.5);`;
        toast.innerHTML = `<i class="bi ${iconClass} fs-5 toast-icon"></i> <span>${message}</span>`;
        
        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        });

        setTimeout(() => {
            toast.style.transform = 'translateY(20px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }

    static closeAllModals() {
        document.querySelectorAll('.modal-overlay.open').forEach(modal => {
            const box = modal.querySelector('.modal-box');
            if(box) box.style.transform = 'scale(0.8)';
            setTimeout(() => {
                modal.classList.remove('open');
                if(box) box.style.transform = ''; 
            }, 150);
        });
    }
}

// Exponer de forma global para que login.js (si lo sigues usando separado) lo detecte
window.Dulzura = { CONFIG, State, UI: UIManager };

/* ==========================================================
   3. INICIALIZACIÓN DEL MOTOR (DOM READY)
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
    injectCuteAnimations();

    /* ==========================================================
       4. CONTROLADOR DEL CATÁLOGO (MENU CONTROLLER)
       ========================================================== */
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
                
                this.renderMenu();          
                this.renderFeatured();      
                AdminController.renderAdminList();
            } catch (error) {
                UIManager.showToast('Oops! No pudimos conectar con los postres 🍰', 'error');
            }
        }

        // Renderiza en la página del menú
        static renderMenu() {
            const grid = document.getElementById('menuGrid');
            const empty = document.getElementById('menuEmpty');
            if (!grid) return; 

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
                        <h3>${UIManager.escapeHtml(p.nombre)}</h3>
                        <p class="menu-card-desc">${UIManager.escapeHtml(p.descripcion).substring(0, 60)}&hellip;</p>
                    </div>
                    <div class="menu-card-foot">
                        <span class="price-tag" style="color: #ff769b;">$${UIManager.escapeHtml(p.precio)}</span>
                        <button onclick="window.abrirDetalle(${p.id})" class="btn-ghost"><i class="bi bi-eye-fill"></i> Ver</button>
                    </div>
                `;
                fragment.appendChild(card);
            });

            grid.appendChild(fragment);
        }

        // Renderiza estilo Polaroid en la página de inicio
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
                    <h3 class="polaroid-title">${UIManager.escapeHtml(p.nombre)}</h3>
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

    // Funciones Globales de la Interfaz
    window.abrirDetalle = (id) => {
        const producto = State.productos.find(p => p.id === id);
        const modal = document.getElementById('productModal');
        if (!producto || !modal) return;

        document.getElementById('productModalName').textContent = producto.nombre;
        document.getElementById('productModalPrice').textContent = `$${producto.precio}`;
        document.getElementById('productModalDesc').textContent = producto.descripcion;

        const img = document.getElementById('productModalImage');
        if (producto.imagen) { 
            img.src = producto.imagen; 
            img.style.display = 'block'; 
        } else { 
            img.style.display = 'none'; 
        }

        const btn = document.getElementById('productModalOrder');
        const msj = encodeURIComponent(`¡Hola! Me encantaría pedir este producto súper kiut: *${producto.nombre}* 🍰✨`);
        btn.href = `https://wa.me/${CONFIG.PHONE_NUMBER}?text=${msj}`;

        modal.classList.add('open');
    };

    /* ==========================================================
       5. CONTROLADOR DEL PANEL DE ADMINISTRADOR (ADMIN)
       ========================================================== */
    class AdminController {
        static init() {
            this.bindEvents();
        }

        // NUEVO: Renderiza los mensajes recibidos
        static renderAdminMessages() {
            const list = document.getElementById('adminMessagesList');
            if (!list) return;
            list.innerHTML = '';
            
            // Obtenemos los mensajes guardados localmente (puedes conectarlo a tu base de datos luego)
            const mensajes = JSON.parse(localStorage.getItem('dulzura_mensajes')) || [];

            if (mensajes.length === 0) {
                list.innerHTML = '<p style="text-align:center; color:#999; margin-top:20px;">No hay mensajes nuevos. 🕊️</p>';
                return;
            }

            mensajes.reverse().forEach(m => {
                const item = document.createElement('div');
                item.className = 'admin-list-item';
                item.style.alignItems = 'flex-start';
                
                item.innerHTML = `
                    <div class="admin-list-thumb" style="background: var(--rose); color: var(--berry);">
                        <i class="bi bi-envelope-paper-heart fs-4"></i>
                    </div>
                    <div class="admin-list-info" style="flex:1;">
                        <strong style="display:block;">${UIManager.escapeHtml(m.nombre)}</strong>
                        <span style="font-size:0.75rem; color:#888;">${m.fecha}</span>
                        <p style="margin: 6px 0 0; font-size:0.85rem; color: var(--choco); line-height: 1.4;">
                            ${UIManager.escapeHtml(m.mensaje)}
                        </p>
                    </div>
                    <button class="danger btn-icon" onclick="window.eliminarMensaje(${m.id})" title="Eliminar" style="background:#ff769b; color:white; border:none; padding:8px; border-radius:8px; cursor:pointer; flex-shrink: 0;">
                        <i class="bi bi-trash-fill"></i>
                    </button>
                `;
                list.appendChild(item);
            });
        }

        static async handleProductSubmit(e) {
            e.preventDefault();
            const form = e.target;
            const btnSubmit = form.querySelector('button[type="submit"]');
            const archivoFoto = document.getElementById('adminImagen').files[0];
            
            if (archivoFoto && archivoFoto.size > CONFIG.MAX_FILE_SIZE) {
                return UIManager.showToast('La imagen es muy pesada (Máx 2MB) ☁️', 'error');
            }

            const originalText = btnSubmit.innerHTML;
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Horneando... ✨';

            // Verificamos si estamos EDITANDO o CREANDO
            const editId = form.dataset.editId;
            const method = editId ? 'PUT' : 'POST';
            const endpoint = editId ? `${CONFIG.API_URL}/productos/${editId}` : `${CONFIG.API_URL}/productos`;

            try {
                const formData = new FormData();
                formData.append('nombre', document.getElementById('adminNombre').value);
                formData.append('categoria', document.getElementById('adminCategoria').value);
                formData.append('precio', document.getElementById('adminPrecio').value);
                formData.append('descripcion', document.getElementById('adminDesc').value);
                if (archivoFoto) formData.append('imagen', archivoFoto);

                const res = await fetch(endpoint, { method: method, body: formData });
                if (!res.ok) throw new Error('No pudimos guardar los cambios.');

                await MenuController.fetchProducts(); 
                
                AdminController.resetFormMode(form);
                UIManager.showToast(editId ? '¡Producto actualizado precioso! ✨' : '¡Nuevo producto listo! 🍰');

            } catch (err) {
                UIManager.showToast(err.message, 'error');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalText;
            }
        }

        static resetFormMode(form) {
            form.reset();
            delete form.dataset.editId; 
            form.querySelector('button[type="submit"]').innerHTML = 'Guardar Producto';
            
            const preview = document.getElementById('previewImagen');
            const dropzone = document.getElementById('dropzoneImage');
            if(preview && dropzone) {
                preview.style.display = 'none'; preview.src = "";
                dropzone.querySelector('i').style.display = 'block'; 
                dropzone.querySelector('span').style.display = 'block';
                dropzone.querySelector('span').textContent = "Haz clic para subir foto";
            }
        }

        static bindEvents() {
            const tabProductos = document.getElementById('tabAdminProductos');
            const tabMensajes = document.getElementById('tabAdminMensajes');
            const viewProductos = document.getElementById('adminViewProductos');
            const viewMensajes = document.getElementById('adminViewMensajes');

            if (tabProductos && tabMensajes) {
                tabProductos.addEventListener('click', () => {
                    tabProductos.classList.add('active'); tabMensajes.classList.remove('active');
                    viewProductos.style.display = 'block'; viewMensajes.style.display = 'none';
                });
                tabMensajes.addEventListener('click', () => {
                    tabMensajes.classList.add('active'); tabProductos.classList.remove('active');
                    viewProductos.style.display = 'none'; viewMensajes.style.display = 'block';
                    AdminController.renderAdminMessages(); // Actualiza la lista al abrir
                });
            }

            document.getElementById('formAdminProducto')?.addEventListener('submit', (e) => this.handleProductSubmit(e));
            document.getElementById('btnGlobalAdmin')?.addEventListener('click', () => {
                AdminController.resetFormMode(document.getElementById('formAdminProducto'));
                document.getElementById('adminModal')?.classList.add('open');
            });
        }
    }

    // Funciones globales de Admin
    window.editarProducto = (id) => {
        const producto = State.productos.find(p => p.id === id);
        if (!producto) return;

        const form = document.getElementById('formAdminProducto');
        form.dataset.editId = producto.id; 
        
        document.getElementById('adminNombre').value = producto.nombre;
        document.getElementById('adminCategoria').value = producto.categoria;
        document.getElementById('adminPrecio').value = producto.precio;
        document.getElementById('adminDesc').value = producto.descripcion;

        const preview = document.getElementById('previewImagen');
        const dropzone = document.getElementById('dropzoneImage');
        
        if (producto.imagen) {
            preview.src = producto.imagen;
            preview.style.display = 'block';
            dropzone.querySelector('i').style.display = 'none';
            dropzone.querySelector('span').style.display = 'none';
        } else {
            preview.style.display = 'none';
            dropzone.querySelector('i').style.display = 'block';
            dropzone.querySelector('span').style.display = 'block';
            dropzone.querySelector('span').textContent = "Subir nueva foto (Opcional)";
        }

        form.querySelector('button[type="submit"]').innerHTML = '<i class="bi bi-stars"></i> Actualizar Producto ✨';
        UIManager.showToast('Modo edición activado ✏️', 'info');
        
        document.querySelector('.modal-box').scrollTo({ top: 0, behavior: 'smooth' });
    };

   window.eliminarMensaje = (id) => {
        if(confirm('¿Eliminar este mensaje? 🗑️')) {
            let mensajes = JSON.parse(localStorage.getItem('dulzura_mensajes')) || [];
            mensajes = mensajes.filter(m => m.id !== id);
            localStorage.setItem('dulzura_mensajes', JSON.stringify(mensajes));
            AdminController.renderAdminMessages();
            UIManager.showToast('Mensaje eliminado 🧹');
        }
    };

    /* ==========================================================
       6. ENRUTAMIENTO Y LÓGICA DE FORMULARIOS (FORMS)
       ========================================================== */
    class FormController {
        static init() {
            // NUEVO: Guardar mensaje del formulario de contacto
            const contactForm = document.getElementById('contactForm');
            if (contactForm) {
                contactForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const nombre = document.getElementById('nombre').value;
                    const mensaje = document.getElementById('mensaje').value;
                    
                    const nuevoMensaje = {
                        id: Date.now(),
                        nombre: nombre,
                        mensaje: mensaje,
                        fecha: new Date().toLocaleString()
                    };

                    const mensajesGuardados = JSON.parse(localStorage.getItem('dulzura_mensajes')) || [];
                    mensajesGuardados.push(nuevoMensaje);
                    localStorage.setItem('dulzura_mensajes', JSON.stringify(mensajesGuardados));

                    UIManager.showToast('¡Mensaje enviado con éxito! 💌');
                    contactForm.reset();
                });
            }
        }
    }

    /* ==========================================================
       7. CONTROLADOR DE ACCESIBILIDAD Y UX (ACCESSIBILITY)
       ========================================================== */
    class UXController {
        static init() {
            document.addEventListener('keydown', (e) => { 
                if (e.key === 'Escape') UIManager.closeAllModals(); 
            });

            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    UIManager.closeAllModals();
                }
            });

            document.querySelectorAll('.modal-close').forEach(btn => {
                btn.addEventListener('click', UIManager.closeAllModals);
            });

            const btnMenu = document.getElementById('btnMenu');
            const mainNav = document.getElementById('mainNav');
            
            if (btnMenu && mainNav) {
                btnMenu.addEventListener('click', () => {
                    const isOpen = mainNav.classList.toggle('open');
                    btnMenu.setAttribute('aria-expanded', String(isOpen));
                });
            }

            if ('IntersectionObserver' in window) {
                const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };
                const io = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('in-view');
                            observer.unobserve(entry.target); 
                        }
                    });
                }, observerOptions);

                document.querySelectorAll('.reveal').forEach(el => io.observe(el));
            }
        }
    }

    /* ==========================================================
       8. SECUENCIA DE ARRANQUE (BOOTSTRAP)
       ========================================================== */
    MenuController.init();
    AdminController.init();
    FormController.init();
    UXController.init();
});
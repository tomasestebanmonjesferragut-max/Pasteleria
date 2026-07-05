/**
 * @file admin.js
 * @description Módulo de Administración, Formularios y Experiencia de Usuario (UX)
 * @author GhostDev
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // Importamos las configuraciones y herramientas visuales desde core.js
    const { CONFIG, State, UI } = window.Dulzura;

    /* ==========================================================
       5. CONTROLADOR DEL PANEL DE ADMINISTRADOR (ADMIN)
       ========================================================== */
    class AdminController {
        static init() {
            this.bindEvents();
        }

        static renderAdminList() {
            const adminList = document.getElementById('adminList');
            if (!adminList) return;
            adminList.innerHTML = '';
            
            State.productos.forEach(p => {
                const item = document.createElement('div');
                item.className = 'admin-list-item';
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.gap = '10px';
                item.style.padding = '10px';

                const mediaContent = p.imagen ? `<img src="${p.imagen}" style="width:40px; height:40px; border-radius:8px; object-fit:cover;">` : `<i class="bi ${CONFIG.ICONS[p.categoria]} fs-3" style="color:var(--berry);"></i>`;
                
                item.innerHTML = `
                    <div class="admin-list-thumb">${mediaContent}</div>
                    <div class="admin-list-info" style="flex:1;">
                        <strong style="display:block;">${UI.escapeHtml(p.nombre)}</strong>
                        <span style="font-size:0.85rem; color:#666;">$${UI.escapeHtml(p.precio)}</span>
                    </div>
                    <div class="admin-list-btns" style="display:flex; gap:5px;">
                        <!-- BOTÓN DE EDITAR -->
                        <button class="btn-icon" onclick="window.editarProducto(${p.id})" title="Editar" style="background:#ffeaa7; color:#d35400; border:none; padding:8px; border-radius:8px; cursor:pointer;"><i class="bi bi-pencil-fill"></i></button>
                        <!-- BOTÓN DE BORRAR -->
                        <button class="danger btn-icon" onclick="window.eliminarProducto(${p.id})" title="Eliminar" style="background:#ff769b; color:white; border:none; padding:8px; border-radius:8px; cursor:pointer;"><i class="bi bi-trash-fill"></i></button>
                    </div>
                `;
                adminList.appendChild(item);
            });
        }

        static async handleProductSubmit(e) {
            e.preventDefault();
            const form = e.target;
            const btnSubmit = form.querySelector('button[type="submit"]');
            const archivoFoto = document.getElementById('adminImagen').files[0];
            
            if (archivoFoto && archivoFoto.size > CONFIG.MAX_FILE_SIZE) {
                return UI.showToast('La imagen es muy pesada (Máx 2MB) ☁️', 'error');
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

                // Refrescamos el catálogo global (depende de menu.js)
                if (window.MenuController) {
                    await window.MenuController.fetchProducts(); 
                }
                
                // Reset de Interfaz
                AdminController.resetFormMode(form);
                UI.showToast(editId ? '¡Producto actualizado precioso! ✨' : '¡Nuevo producto listo! 🍰');

            } catch (err) {
                UI.showToast(err.message, 'error');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalText;
            }
        }

        static resetFormMode(form) {
            form.reset();
            delete form.dataset.editId; // Quitamos el modo edición
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
            const dropzone = document.getElementById('dropzoneImage');
            const inputImagen = document.getElementById('adminImagen');
            const previewImagen = document.getElementById('previewImagen');

            if (dropzone && inputImagen) {
                dropzone.addEventListener('click', () => inputImagen.click());
                inputImagen.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    if (file.size > CONFIG.MAX_FILE_SIZE) {
                        return UI.showToast('Imagen muy pesada (Máx 2MB) ☁️', 'error');
                    }
                    
                    previewImagen.src = URL.createObjectURL(file);
                    previewImagen.style.display = 'block';
                    dropzone.querySelector('i').style.display = 'none';
                    dropzone.querySelector('span').style.display = 'none';
                });
            }

            document.getElementById('formAdminProducto')?.addEventListener('submit', (e) => this.handleProductSubmit(e));
            document.getElementById('btnGlobalAdmin')?.addEventListener('click', () => {
                AdminController.resetFormMode(document.getElementById('formAdminProducto'));
                document.getElementById('adminModal')?.classList.add('open');
            });
        }
    }

    // Exponemos AdminController de forma global para que menu.js pueda actualizar la lista[cite: 14]
    window.AdminController = AdminController;

    // LÓGICA DE EDICIÓN: Rellena el formulario con los datos del producto seleccionado
    window.editarProducto = (id) => {
        const producto = State.productos.find(p => p.id === id);
        if (!producto) return;

        const form = document.getElementById('formAdminProducto');
        form.dataset.editId = producto.id; // Activamos el modo edición asignando el ID
        
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
        UI.showToast('Modo edición activado ✏️', 'info');
        
        // Hacer scroll automático hacia arriba donde está el formulario
        document.querySelector('.modal-box').scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.eliminarProducto = async (id) => {
        if(confirm('¿Seguro que deseas eliminar esta dulzura del catálogo? 😿')) {
            try {
                const res = await fetch(`${CONFIG.API_URL}/productos/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Desincronización con el servidor.');
                
                if (window.MenuController) {
                    await window.MenuController.fetchProducts();
                }
                
                UI.showToast('Borrado exitosamente 🧹');
            } catch (err) { 
                UI.showToast(err.message, 'error'); 
            }
        }
    };

    /* ==========================================================
       6. ENRUTAMIENTO Y LÓGICA DE FORMULARIOS (FORMS)
       ========================================================== */
    class FormController {
        static init() {
            const orderForm = document.getElementById('orderForm');
            if (orderForm) {
                orderForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const data = {
                        nombre: document.getElementById('pedidoNombre').value,
                        telefono: document.getElementById('pedidoTelefono')?.value || 'No proporcionado',
                        producto: document.getElementById('pedidoProducto').selectedOptions[0].text,
                        detalles: document.getElementById('pedidoDetalles').value
                    };
                    
                    const payload = `*NUEVO PEDIDO KIUT* 🌸%0A%0A👤 *Cliente:* ${data.nombre}%0A📱 *Teléfono:* ${data.telefono}%0A🛍️ *Antojo:* ${data.producto}%0A📝 *Detalles:* ${data.detalles}%0A%0A_Enviado con amor desde la web_ ✨`;
                    window.open(`https://wa.me/${CONFIG.PHONE_NUMBER}?text=${payload}`, '_blank');
                    
                    orderForm.reset();
                    UI.showToast('¡Llevándote a WhatsApp! 💖');
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
                if (e.key === 'Escape') UI.closeAllModals(); 
            });

            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    UI.closeAllModals();
                }
            });

            document.querySelectorAll('.modal-close').forEach(btn => {
                btn.addEventListener('click', UI.closeAllModals);
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
       8. SECUENCIA DE ARRANQUE PARA ADMINISTRACIÓN Y UX
       ========================================================== */
    AdminController.init();
    FormController.init();
    UXController.init();
});
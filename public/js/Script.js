// ============================================================
// DULZURA EN TU HOGAR — Cerebro Maestro (Conectado a Node.js)
// ============================================================

const CATEGORY_ICON = { tortas: 'bi-cake2-fill', cupcakes: 'bi-cup-hot-fill', alfajores: 'bi-cookie', cajas: 'bi-gift-fill' };
const PASS_SECRETA = "tomasmonjes15";

// URL de tu nuevo backend
const API_URL = 'http://localhost:3000/api/productos';
let productos = [];
let currentFilter = 'todas';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ----------------------------------------------------
// FETCH: CARGAR PRODUCTOS DESDE LA BASE DE DATOS
// ----------------------------------------------------
function cargarProductos() {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      productos = data; // Guardamos los datos de SQLite en memoria
      renderMenu();
      renderAdminList();
    })
    .catch(err => console.error("Error al cargar productos:", err));
}

// ----------------------------------------------------
// RENDER DEL MENÚ PÚBLICO
// ----------------------------------------------------
function renderMenu() {
  const grid = document.getElementById('menuGrid');
  const empty = document.getElementById('menuEmpty');
  if(!grid) return; 

  grid.querySelectorAll('.menu-card').forEach(el => el.remove());
  const visibles = productos.filter(p => currentFilter === 'todas' || p.categoria === currentFilter);
  empty.style.display = visibles.length ? 'none' : 'block';

  visibles.forEach(p => {
    const card = document.createElement('article');
    card.className = 'menu-card reveal in-view';
    const mediaContent = p.imagen ? `<img src="${p.imagen}">` : `<i class="bi ${CATEGORY_ICON[p.categoria]}"></i>`;
    const waMsg = encodeURIComponent(`Hola! Quiero pedir: ${p.nombre}`);

    card.innerHTML = `
      <div class="menu-card-media">${mediaContent}</div>
      <div class="menu-card-body">
        <h3>${escapeHtml(p.nombre)}</h3>
        <p class="menu-card-desc">${escapeHtml(p.descripcion)}</p>
      </div>
      <div class="menu-card-foot">
        <span>${escapeHtml(p.precio)}</span>
        <a class="menu-card-order" href="https://wa.me/56900000000?text=${waMsg}" target="_blank">
          <i class="bi bi-whatsapp"></i> Pedir
        </a>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ----------------------------------------------------
// RENDER PANEL DE ADMINISTRACIÓN
// ----------------------------------------------------
function renderAdminList() {
  const adminList = document.getElementById('adminList');
  if(!adminList) return;
  adminList.innerHTML = '';

  productos.forEach(p => {
    const item = document.createElement('div');
    item.className = 'admin-list-item';
    const mediaContent = p.imagen ? `<img src="${p.imagen}">` : `<i class="bi ${CATEGORY_ICON[p.categoria]}"></i>`;
    item.innerHTML = `
      <div class="admin-list-thumb">${mediaContent}</div>
      <div class="admin-list-info">
        <strong>${escapeHtml(p.nombre)}</strong>
        <span>${escapeHtml(p.precio)}</span>
      </div>
      <div class="admin-list-btns">
        <button class="danger" onclick="eliminarProducto(${p.id})"><i class="bi bi-trash-fill"></i></button>
      </div>
    `;
    adminList.appendChild(item);
  });
}

// ----------------------------------------------------
// DELETE: BORRAR PRODUCTO EN BASE DE DATOS
// ----------------------------------------------------
window.eliminarProducto = function(id) {
  if(confirm('¿Seguro que deseas eliminar este producto?')) {
    fetch(`${API_URL}/${id}`, { method: 'DELETE' })
      .then(() => cargarProductos()) // Recargamos la lista actualizada
      .catch(err => console.error("Error al eliminar:", err));
  }
};

// ====================================================
// INICIALIZACIÓN GLOBAL (DOM Ready)
// ====================================================
document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Cargar productos desde el Servidor
  cargarProductos();

  // 2. Menú Hamburguesa
  const btnMenu = document.getElementById('btnMenu');
  const mainNav = document.getElementById('mainNav');
  if(btnMenu && mainNav) {
    btnMenu.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      btnMenu.setAttribute('aria-expanded', isOpen);
    });
  }

  // 3. Animaciones Scroll
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }

  // 4. Filtros del Menú
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      renderMenu();
    });
  });

  // 5. Formularios Públicos (Contacto y Pedidos)
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = document.getElementById('nombre').value;
      const note = document.getElementById('formNote');
      note.textContent = `¡Gracias ${nombre}! Hemos recibido tu mensaje.`;
      note.style.color = 'var(--pistachio)';
      contactForm.reset();
      setTimeout(() => note.textContent = '', 5000);
    });
  }

  const orderForm = document.getElementById('orderForm');
  if(orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = document.getElementById('pedidoNombre').value;
      const select = document.getElementById('pedidoProducto');
      const producto = select.options[select.selectedIndex].text;
      const detalles = document.getElementById('pedidoDetalles').value;
      
      const msj = `¡Hola! Quiero hacer un pedido:%0A*Nombre:* ${nombre}%0A*Producto:* ${producto}%0A*Detalles:* ${detalles}`;
      window.open(`https://wa.me/56900000000?text=${msj}`, '_blank');
      orderForm.reset();
    });
  }

  // 6. Sistema Administrador (Modales)
  const authModal = document.getElementById('authModal');
  const adminModal = document.getElementById('adminModal');
  const authError = document.getElementById('authError');
  const passInput = document.getElementById('adminPasswordInput');

  document.getElementById('btnGlobalAdmin')?.addEventListener('click', () => {
    passInput.value = ''; 
    authError.style.display = 'none';
    authModal.classList.add('open');
  });

  document.getElementById('btnCloseAuth')?.addEventListener('click', () => authModal.classList.remove('open'));
  document.getElementById('btnCloseAdmin')?.addEventListener('click', () => adminModal.classList.remove('open'));

  document.getElementById('btnVerifyAuth')?.addEventListener('click', () => {
    if (passInput.value === PASS_SECRETA) {
      authModal.classList.remove('open');
      adminModal.classList.add('open');
    } else {
      authError.style.display = 'block';
    }
  });

  // 7. Previsualización de Imagen en Admin (Sin Base64, solo para ver antes de subir)
  const dropzone = document.getElementById('dropzoneImage');
  const inputImagen = document.getElementById('adminImagen');
  const previewImagen = document.getElementById('previewImagen');

  if(dropzone && inputImagen) {
    dropzone.addEventListener('click', () => inputImagen.click());
    inputImagen.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        previewImagen.src = URL.createObjectURL(file);
        previewImagen.style.display = 'block';
        dropzone.querySelector('i').style.display = 'none';
        dropzone.querySelector('span').style.display = 'none';
      }
    });
  }

  // 8. POST: ENVIAR NUEVO PRODUCTO AL SERVIDOR
  const formAdmin = document.getElementById('formAdminProducto');
  if(formAdmin) {
    formAdmin.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // FormData permite enviar archivos físicos (imágenes) junto con texto
      const formData = new FormData();
      formData.append('nombre', document.getElementById('adminNombre').value);
      formData.append('categoria', document.getElementById('adminCategoria').value);
      formData.append('precio', document.getElementById('adminPrecio').value);
      formData.append('descripcion', document.getElementById('adminDesc').value);
      
      const archivoFoto = document.getElementById('adminImagen').files[0];
      if (archivoFoto) {
        formData.append('imagen', archivoFoto);
      }

      // Enviar al Backend
      fetch(API_URL, {
        method: 'POST',
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        cargarProductos(); // Refrescar menú con el nuevo producto guardado en base de datos
        
        // Limpiar interfaz
        formAdmin.reset();
        previewImagen.style.display = 'none';
        previewImagen.src = "";
        dropzone.querySelector('i').style.display = 'block';
        dropzone.querySelector('span').style.display = 'block';
      })
      .catch(err => console.error("Error al guardar:", err));
    });
  }
});
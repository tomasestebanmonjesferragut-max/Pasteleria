/**
 * @file core.js
 * @description Configuración (data/config.json), estado compartido, enlaces de
 * contacto y comportamientos comunes de la interfaz. Se carga primero.
 */

'use strict';

(() => {
    const State = { productos: [], grupo: 'todos', filtro: 'todas', busqueda: '' };
    const Dulzura = window.Dulzura = { State, cfg: null };

    /* ---------- Rutas y errores HTTP ---------- */
    // Raíz del sitio, calculada desde la ubicación de este script (scripts/core.js):
    // funciona igual en localhost, en github.io/<repo>/ o en un dominio propio.
    Dulzura.raiz = new URL('../', document.currentScript.src).href;
    Dulzura.recurso = (ruta) => new URL(ruta, Dulzura.raiz).href;

    class Redirigido extends Error {}
    Dulzura.Redirigido = Redirigido;

    // 403, 404 y 5xx llevan a su página dedicada (pages/403.html, 404.html, 500.html).
    // Cualquier otro fallo (red caída, JSON dañado) lo maneja quien llama con un modal.
    Dulzura.cargarJson = async (ruta) => {
        const res = await fetch(Dulzura.recurso(ruta));
        if (res.status === 403 || res.status === 404 || res.status >= 500) {
            const codigo = res.status >= 500 ? 500 : res.status;
            location.replace(Dulzura.recurso(`pages/${codigo}.html`));
            throw new Redirigido(`HTTP ${res.status}`);
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    };

    /* ---------- Utilidades ---------- */
    const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    Dulzura.escapeHtml = (texto) => String(texto ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

    Dulzura.esNumerico = (precio) => /^\d+$/.test(String(precio).trim());
    Dulzura.formatearPrecio = (precio) =>
        Dulzura.esNumerico(precio) ? '$' + Number(precio).toLocaleString('es-CL') : String(precio);

    // Huella SHA-256 (16 primeros caracteres hex) de un producto: cambia si cambia su
    // nombre, categoría o precio. Devuelve null si el navegador no ofrece crypto.subtle
    // (solo existe en HTTPS o localhost).
    Dulzura.huella = async (producto) => {
        if (!window.crypto?.subtle) return null;
        const datos = new TextEncoder().encode(JSON.stringify([producto.id, producto.nombre, producto.categoria, String(producto.precio)]));
        const hash = await window.crypto.subtle.digest('SHA-256', datos);
        return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
    };

    Dulzura.urlWhatsApp = (numero, texto) =>
        `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;

    // Los perfumes los atiende su propio WhatsApp; el resto, el número principal.
    Dulzura.telefonoPara = (categoria = '') =>
        Dulzura.cfg.telefonos[categoria.startsWith('perfume') ? 'perfumes' : 'principal'];

    // Muestra un aviso con modal (modal-handler.js) aunque aún no haya cargado.
    const avisar = (mensaje, titulo) => {
        const mostrar = () => window.mostrarModal(mensaje, titulo);
        document.readyState === 'complete' ? mostrar() : window.addEventListener('load', mostrar);
    };

    /* ---------- Configuración y enlaces de contacto ---------- */
    // Los teléfonos viven solo en data/config.json. En el HTML se marcan con:
    //   data-wa="principal|perfumes" [data-wa-text="mensaje"]  -> enlace a WhatsApp
    //   data-tel="principal|perfumes"                          -> enlace tel:
    //   data-tel-text="principal|perfumes"                     -> número visible
    function conectarContactos() {
        const tel = Dulzura.cfg.telefonos;
        document.querySelectorAll('[data-wa]').forEach((a) => {
            const t = tel[a.dataset.wa];
            if (!t) return;
            a.href = a.dataset.waText
                ? Dulzura.urlWhatsApp(t.numero, a.dataset.waText)
                : `https://wa.me/${t.numero}`;
        });
        document.querySelectorAll('[data-tel]').forEach((a) => {
            const t = tel[a.dataset.tel];
            if (t) a.href = `tel:+${t.numero}`;
        });
        document.querySelectorAll('[data-tel-text]').forEach((el) => {
            const t = tel[el.dataset.telText];
            if (t) el.textContent = t.visible;
        });
        // El teléfono del JSON-LD (datos para Google) tampoco va escrito en el HTML.
        document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
            try {
                const datos = JSON.parse(script.textContent);
                datos.telephone = `+${tel.principal.numero}`;
                script.textContent = JSON.stringify(datos);
            } catch (error) {
                console.error('[core] JSON-LD inválido:', error);
            }
        });
    }

    Dulzura.cargarJson('data/config.json')
        .then((cfg) => {
            Dulzura.cfg = cfg;
            conectarContactos();
        })
        .catch((error) => {
            if (error instanceof Redirigido) return;
            console.error('[core] No se pudo cargar data/config.json:', error);
            avisar('No pudimos cargar los datos de contacto. Recarga la página o escríbenos directamente.', 'Contacto no disponible');
        });

    /* ---------- Barra de progreso y botón "subir" ---------- */
    function iniciarScroll() {
        const bar = document.getElementById('scrollProgress');
        const topBtn = document.getElementById('scrollTopBtn');

        const onScroll = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            if (bar) bar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
            if (topBtn) topBtn.classList.toggle('show', scrollTop > 400);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        topBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    /* ---------- Preguntas frecuentes (acordeón accesible) ---------- */
    function iniciarFaq() {
        document.querySelectorAll('.faq-item').forEach((item, i) => {
            const pregunta = item.querySelector('.faq-question');
            const respuesta = item.querySelector('.faq-answer');
            if (!pregunta || !respuesta) return;

            respuesta.id = respuesta.id || `faq-respuesta-${i}`;
            pregunta.setAttribute('aria-controls', respuesta.id);
            pregunta.setAttribute('aria-expanded', 'false');

            pregunta.addEventListener('click', () => {
                const abrir = !item.classList.contains('open');
                item.closest('.faq-list')?.querySelectorAll('.faq-item.open').forEach((otro) => {
                    otro.classList.remove('open');
                    otro.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
                });
                item.classList.toggle('open', abrir);
                pregunta.setAttribute('aria-expanded', String(abrir));
            });
        });
    }

    /* ---------- Menú móvil y aparición al hacer scroll ---------- */
    function iniciarNavegacion() {
        const btnMenu = document.getElementById('btnMenu');
        const mainNav = document.getElementById('mainNav');
        btnMenu?.addEventListener('click', () => {
            const abierto = mainNav.classList.toggle('open');
            btnMenu.setAttribute('aria-expanded', String(abierto));
        });

        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                });
            }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
            document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
        } else {
            document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in-view'));
        }
    }

    /* ---------- Formulario de contacto (informacion.html) -> WhatsApp ---------- */
    function iniciarContacto() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!Dulzura.cfg) {
                return window.mostrarModal('Los datos de contacto aún no están disponibles. Intenta de nuevo en unos segundos.', 'Un momento');
            }
            const nombre = document.getElementById('nombre').value.trim();
            const mensaje = document.getElementById('mensaje').value.trim();
            const url = Dulzura.urlWhatsApp(Dulzura.cfg.telefonos.principal.numero, `Hola, soy ${nombre}.\n${mensaje}`);
            window.open(url, '_blank', 'noopener');
            form.reset();
        });
    }

    iniciarScroll();
    iniciarFaq();
    iniciarNavegacion();
    iniciarContacto();
})();

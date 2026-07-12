/**
 * @file core.js
 * @description Núcleo de Configuración, Estado y UI para Dulzura en tu Hogar.
 * @author GhostDev
 */

'use strict';

/* ==========================================================
   0. INYECCIÓN DE ANIMACIONES "KIUT" (CSS DINÁMICO)
   ========================================================== */
const injectCuteAnimations = () => {
    const style = document.createElement('style');
    style.innerHTML = `
        /* Flotación suave y tierna */
        @keyframes floatCute {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
        }
        /* Efecto de aparición tipo burbuja/pop */
        @keyframes popKiut {
            0% { transform: scale(0.7) translateY(20px); opacity: 0; }
            70% { transform: scale(1.03); opacity: 1; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        /* Latido dulce para iconos */
        @keyframes pulseHeart {
            0% { transform: scale(1); }
            20% { transform: scale(1.2); color: #ff769b; }
            40% { transform: scale(1); }
            60% { transform: scale(1.2); color: #ff769b; }
            80% { transform: scale(1); }
        }
        
        /* ESTILOS TIPO POLAROID (NUEVO) */
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

/* ==========================================================
   3. MODO OSCURO / CLARO (persistente)
   ========================================================== */
const ThemeManager = {
    KEY: 'dulzura_theme',
    init() {
        const saved = localStorage.getItem(this.KEY);
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = saved || (prefersDark ? 'dark' : 'light');
        this.apply(theme);

        const btn = document.getElementById('btnTheme');
        if (btn) {
            btn.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
                this.apply(current === 'dark' ? 'light' : 'dark');
            });
        }
    },
    apply(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        localStorage.setItem(this.KEY, theme);
    }
};

/* ==========================================================
   4. BARRA DE PROGRESO DE SCROLL + BOTÓN "SUBIR"
   ========================================================== */
const ScrollFX = {
    init() {
        const bar = document.getElementById('scrollProgress');
        const topBtn = document.getElementById('scrollTopBtn');

        const onScroll = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

            if (bar) bar.style.width = pct + '%';
            if (topBtn) topBtn.classList.toggle('show', scrollTop > 400);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        if (topBtn) {
            topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        }
    }
};

/* ==========================================================
   5. ACORDEÓN DE PREGUNTAS FRECUENTES (FAQ)
   ========================================================== */
const FaqManager = {
    init() {
        document.querySelectorAll('.faq-item').forEach(item => {
            const question = item.querySelector('.faq-question');
            if (!question) return;
            question.addEventListener('click', () => {
                const wasOpen = item.classList.contains('open');
                item.closest('.faq-list')?.querySelectorAll('.faq-item.open').forEach(other => {
                    if (other !== item) other.classList.remove('open');
                });
                item.classList.toggle('open', !wasOpen);
            });
        });
    }
};

// Exponer las variables para que los otros archivos puedan leerlas
window.Dulzura = { CONFIG, State, UI: UIManager };

// Inicializar el estilo base al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    injectCuteAnimations();
    ThemeManager.init();
    ScrollFX.init();
    FaqManager.init();
});


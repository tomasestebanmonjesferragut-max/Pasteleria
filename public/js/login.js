// ============================================================
// DULZURA EN TU HOGAR — Módulo de Autenticación (login.js)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Importamos las herramientas globales definidas en Script.js
    const { CONFIG, State, UI } = window.Dulzura;

    const AuthController = {
        init: () => {
            AuthController.updateUI();
            AuthController.bindEvents();
        },

        updateUI: () => {
            const uiGuest = document.getElementById('ui-guest');
            const uiLogged = document.getElementById('ui-logged');
            const userNameDisplay = document.getElementById('userNameDisplay');
            const btnGlobalAdmin = document.getElementById('btnGlobalAdmin');

            if (State.currentUser) {
                if(uiGuest) uiGuest.style.display = 'none';
                if(uiLogged) {
                    uiLogged.style.display = 'flex';
                    const icon = State.currentUser.rol === 'admin' ? '<i class="bi bi-shield-lock-fill"></i>' : '<i class="bi bi-person-heart"></i>';
                    const firstName = State.currentUser.nombre.split(' ')[0]; 
                    userNameDisplay.innerHTML = `${icon} Hola, ${firstName}`;
                }
                
                // Mostrar modo Admin solo si el rol coincide
                if(btnGlobalAdmin) {
                    btnGlobalAdmin.style.display = State.currentUser.rol === 'admin' ? 'flex' : 'none';
                }

                // Autocompletar datos en la vista "Pedir"
                const pedidoNombre = document.getElementById('pedidoNombre');
                const campoTel = document.getElementById('campoTelefonoOculto');
                const pedidoTelefono = document.getElementById('pedidoTelefono');
                
                if (pedidoNombre) pedidoNombre.value = State.currentUser.nombre;
                if (campoTel) {
                    campoTel.style.display = 'block';
                    pedidoTelefono.value = State.currentUser.telefono || '';
                }
            } else {
                if(uiGuest) uiGuest.style.display = 'flex';
                if(uiLogged) uiLogged.style.display = 'none';
                if(btnGlobalAdmin) btnGlobalAdmin.style.display = 'none';
            }
        },

        login: async (e) => {
            e.preventDefault();
            try {
                const payload = {
                    correo: document.getElementById('loginCorreo').value,
                    password: document.getElementById('loginPassword').value
                };

                const res = await fetch(`${CONFIG.API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error('Credenciales incorrectas');

                State.currentUser = await res.json();
                localStorage.setItem('dulzura_user', JSON.stringify(State.currentUser));
                
                UI.closeAllModals();
                AuthController.updateUI();
                document.getElementById('formLogin').reset();
                UI.showToast(`¡Bienvenido de vuelta, ${State.currentUser.nombre.split(' ')[0]}!`);

            } catch (err) {
                const errBox = document.getElementById('loginError');
                errBox.style.display = 'block';
                errBox.textContent = err.message;
            }
        },

        register: async (e) => {
            e.preventDefault();
            try {
                const payload = {
                    nombre: document.getElementById('regNombre').value,
                    telefono: document.getElementById('regTelefono').value,
                    correo: document.getElementById('regCorreo').value,
                    password: document.getElementById('regPassword').value
                };

                const res = await fetch(`${CONFIG.API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Error al registrar');
                }

                State.currentUser = await res.json();
                localStorage.setItem('dulzura_user', JSON.stringify(State.currentUser));
                
                UI.closeAllModals();
                AuthController.updateUI();
                document.getElementById('formRegister').reset();
                UI.showToast('¡Cuenta creada exitosamente!');

            } catch (err) {
                const errBox = document.getElementById('regError');
                errBox.style.display = 'block';
                errBox.textContent = err.message;
            }
        },

        logout: () => {
            localStorage.removeItem('dulzura_user');
            State.currentUser = null;
            UI.showToast('Sesión cerrada correctamente', 'info');
            setTimeout(() => window.location.href = 'index.html', 800);
        },

        bindEvents: () => {
            document.getElementById('btnOpenLogin')?.addEventListener('click', () => document.getElementById('authModal').classList.add('open'));
            document.getElementById('btnLogout')?.addEventListener('click', AuthController.logout);
            document.getElementById('formLogin')?.addEventListener('submit', AuthController.login);
            document.getElementById('formRegister')?.addEventListener('submit', AuthController.register);
            
            // Pestañas Login/Registro
            const tabLogin = document.getElementById('tabLogin');
            const tabRegister = document.getElementById('tabRegister');
            
            tabLogin?.addEventListener('click', () => {
                tabLogin.classList.add('active'); tabRegister.classList.remove('active');
                document.getElementById('formLogin').style.display = 'block';
                document.getElementById('formRegister').style.display = 'none';
            });

            tabRegister?.addEventListener('click', () => {
                tabRegister.classList.add('active'); tabLogin.classList.remove('active');
                document.getElementById('formRegister').style.display = 'block';
                document.getElementById('formLogin').style.display = 'none';
            });
        }
    };

    // Inicializar el módulo
    AuthController.init();
});
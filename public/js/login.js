/**
 * @file login.js
 * @description Módulo de Autenticación, Registro y Control de Sesiones.
 * @author GhostDev
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // Importamos las configuraciones y estado desde core.js
    const { CONFIG, State, UI } = window.Dulzura;

    class AuthController {
        static init() {
            this.updateUI();
            this.bindEvents();
        }

        static updateUI() {
            const uiGuest = document.getElementById('ui-guest');
            const uiLogged = document.getElementById('ui-logged');
            const userNameDisplay = document.getElementById('userNameDisplay');
            const btnGlobalAdmin = document.getElementById('btnGlobalAdmin');

            if (State.currentUser) {
                // Usuario con sesión activa
                if (uiGuest) uiGuest.style.display = 'none';
                if (uiLogged) {
                    uiLogged.style.display = 'flex';
                    const icon = State.currentUser.rol === 'admin' ? '<i class="bi bi-shield-lock-fill"></i>' : '<i class="bi bi-person-heart"></i>';
                    const firstName = State.currentUser.nombre.split(' ')[0]; 
                    userNameDisplay.innerHTML = `${icon} Hola, ${firstName}`;
                }
                
                // Mostrar botón flotante de Admin solo si tiene los permisos
                if (btnGlobalAdmin) {
                    btnGlobalAdmin.style.display = State.currentUser.rol === 'admin' ? 'flex' : 'none';
                }

                // Autocompletar datos automáticamente en la página "Pedir"
                const pedidoNombre = document.getElementById('pedidoNombre');
                const campoTel = document.getElementById('campoTelefonoOculto');
                const pedidoTelefono = document.getElementById('pedidoTelefono');
                
                if (pedidoNombre) pedidoNombre.value = State.currentUser.nombre;
                if (campoTel) {
                    campoTel.style.display = 'block';
                    pedidoTelefono.value = State.currentUser.telefono || '';
                }
            } else {
                // Modo invitado (sin sesión)
                if (uiGuest) uiGuest.style.display = 'flex';
                if (uiLogged) uiLogged.style.display = 'none';
                if (btnGlobalAdmin) btnGlobalAdmin.style.display = 'none';
            }
        }

        static async login(e) {
            e.preventDefault();
            const btnSubmit = e.target.querySelector('button[type="submit"]');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Verificando...';
            btnSubmit.disabled = true;

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
                this.updateUI();
                document.getElementById('formLogin').reset();
                document.getElementById('loginError').style.display = 'none';
                
                UI.showToast(`¡Bienvenido de vuelta, ${State.currentUser.nombre.split(' ')[0]}! 🍰`);

            } catch (err) {
                const errBox = document.getElementById('loginError');
                errBox.style.display = 'block';
                errBox.textContent = 'Oops, los datos no coinciden 😿';
            } finally {
                btnSubmit.innerHTML = originalText;
                btnSubmit.disabled = false;
            }
        }

        static async register(e) {
            e.preventDefault();
            const btnSubmit = e.target.querySelector('button[type="submit"]');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Registrando...';
            btnSubmit.disabled = true;

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
                    throw new Error(errorData.error || 'Error al crear la cuenta');
                }

                State.currentUser = await res.json();
                localStorage.setItem('dulzura_user', JSON.stringify(State.currentUser));
                
                UI.closeAllModals();
                this.updateUI();
                document.getElementById('formRegister').reset();
                document.getElementById('regError').style.display = 'none';
                
                UI.showToast('¡Cuenta creada con mucho amor! 💖');

            } catch (err) {
                const errBox = document.getElementById('regError');
                errBox.style.display = 'block';
                errBox.textContent = err.message;
            } finally {
                btnSubmit.innerHTML = originalText;
                btnSubmit.disabled = false;
            }
        }

        static logout() {
            localStorage.removeItem('dulzura_user');
            State.currentUser = null;
            UI.showToast('Sesión cerrada correctamente 👋', 'info');
            setTimeout(() => window.location.href = 'index.html', 800);
        }

        static bindEvents() {
            document.getElementById('btnOpenLogin')?.addEventListener('click', () => document.getElementById('authModal').classList.add('open'));
            document.getElementById('btnLogout')?.addEventListener('click', () => this.logout());
            
            document.getElementById('formLogin')?.addEventListener('submit', (e) => this.login(e));
            document.getElementById('formRegister')?.addEventListener('submit', (e) => this.register(e));
            
            // Lógica de pestañas Login/Registro
            const tabLogin = document.getElementById('tabLogin');
            const tabRegister = document.getElementById('tabRegister');
            
            if (tabLogin && tabRegister) {
                tabLogin.addEventListener('click', () => {
                    tabLogin.classList.add('active'); 
                    tabRegister.classList.remove('active');
                    document.getElementById('formLogin').style.display = 'flex';
                    document.getElementById('formRegister').style.display = 'none';
                    document.getElementById('regError').style.display = 'none';
                    document.getElementById('loginError').style.display = 'none';
                });

                tabRegister.addEventListener('click', () => {
                    tabRegister.classList.add('active'); 
                    tabLogin.classList.remove('active');
                    document.getElementById('formRegister').style.display = 'flex';
                    document.getElementById('formLogin').style.display = 'none';
                    document.getElementById('regError').style.display = 'none';
                    document.getElementById('loginError').style.display = 'none';
                });
            }
        }
    }

    // Arrancamos el controlador de sesiones
    AuthController.init();
});
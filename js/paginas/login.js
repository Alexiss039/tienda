// HU-02 Inicio de sesión: redirige según el rol (RF-02).
UI.montar('login');

document.getElementById('form-login').addEventListener('submit', (evento) => {
  evento.preventDefault();
  try {
    const usuario = OCL.auth.iniciarSesion(
      document.getElementById('correo').value,
      document.getElementById('clave').value
    );
    const volver = new URLSearchParams(location.search).get('volver');
    location.href = usuario.rol === 'Admin' ? 'admin-pedidos.html' : (volver || 'index.html');
  } catch (error) {
    UI.aviso(error.message, 'error');
  }
});

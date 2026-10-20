// HU-01 Registro de cuenta: crea un usuario con rol Cliente y lo deja autenticado.
UI.montar('registro');

document.getElementById('form-registro').addEventListener('submit', (evento) => {
  evento.preventDefault();
  const valor = (id) => document.getElementById(id).value;
  try {
    OCL.auth.registrar({
      nombre: valor('nombre'), apellidos: valor('apellidos'), correo: valor('correo'),
      celular: valor('celular'), direccion: valor('direccion'), ciudad: valor('ciudad'),
      barrio: valor('barrio'), clave: valor('clave'), clave2: valor('clave2')
    });
    location.href = 'index.html';
  } catch (error) {
    UI.aviso(error.message, 'error');
  }
});

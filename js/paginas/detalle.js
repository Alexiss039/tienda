// HU-05 Detalle de producto y HU-07 Agregar al carrito (la cantidad la controla cantidad.js).
const usuarioDetalle = UI.montar('catalogo');
const producto = OCL.catalogo.obtener(new URLSearchParams(location.search).get('id'));

function pintarComentarios() {
  const lista = OCL.catalogo.comentarios(producto.id);
  document.getElementById('comentarios').innerHTML = lista.length
    ? lista.map((c) => '<div class="comentario"><strong>' + UI.escapar(c.usuario) + '</strong> <small>' +
        UI.escapar(c.fecha) + '</small><p>' + UI.escapar(c.texto) + '</p></div>').join('')
    : '<p class="pista">Aún no hay comentarios.</p>';
}

if (!producto || producto.estado !== 'disponible') {
  UI.aviso('El producto no existe o no está disponible.', 'error');
  document.querySelector('.detalle').hidden = true;
  document.getElementById('titulo-comentarios').hidden = true;
} else {
  document.title = 'O\'Clock Lens | ' + producto.nombre;
  document.getElementById('ruta-nombre').textContent = producto.nombre;
  document.getElementById('detalle-imagen').src = producto.imagen;
  document.getElementById('detalle-imagen').alt = producto.nombre;
  document.getElementById('detalle-categoria').textContent =
    producto.categoria + (producto.marca ? ' · ' + producto.marca : '');
  document.getElementById('titulo-producto').textContent = producto.nombre;
  document.getElementById('detalle-precio').textContent = UI.moneda(producto.precio);
  document.getElementById('detalle-descripcion').textContent = producto.descripcion;
  document.getElementById('detalle-ficha').innerHTML =
    producto.especificaciones.map((e) => '<li>' + UI.escapar(e) + '</li>').join('');
  pintarComentarios();

  document.getElementById('agregar').addEventListener('click', () => {
    const usuario = UI.requerirSesion();
    if (!usuario) return;
    OCL.carrito.agregar(usuario.id, producto.id, Number(document.getElementById('cantidad').value));
    UI.montar('catalogo');
    UI.aviso('Producto añadido al carrito.', 'exito');
  });

  // HU-06: solo usuarios autenticados pueden comentar
  const formulario = document.getElementById('form-comentario');
  if (usuarioDetalle) {
    formulario.hidden = false;
    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const campo = document.getElementById('texto-comentario');
      OCL.catalogo.comentar(producto.id, usuarioDetalle, campo.value.trim());
      campo.value = '';
      pintarComentarios();
    });
  } else {
    document.getElementById('aviso-comentario').innerHTML = '<a href="login.html">Inicia sesión</a> para comentar.';
  }
}

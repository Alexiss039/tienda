// HU-04 Explorar catálogo: solo productos disponibles, con imagen, nombre y precio.
const usuarioCatalogo = UI.montar('catalogo');
const productos = OCL.catalogo.listarDisponibles();

document.getElementById('conteo').textContent =
  productos.length + ' productos · encuentra el reloj o las gafas perfectas para ti.';

document.getElementById('rejilla').innerHTML = productos.map((p) =>
  '<article class="tarjeta">' +
    '<div class="tarjeta__imagen"><img src="' + UI.escapar(p.imagen) + '" alt="' + UI.escapar(p.nombre) + '"></div>' +
    '<div class="tarjeta__cuerpo">' +
      (p.oferta ? '<span class="etiqueta-oferta">' + UI.escapar(p.oferta) + '</span>' : '') +
      '<span class="tarjeta__categoria">' + UI.escapar(p.categoria) + (p.marca ? ' · ' + UI.escapar(p.marca) : '') + '</span>' +
      '<h3 class="tarjeta__nombre">' + UI.escapar(p.nombre) + '</h3>' +
      '<p class="tarjeta__precio">' + UI.moneda(p.precio) + '</p>' +
      '<div class="tarjeta__acciones">' +
        '<a class="boton boton--borde" href="producto.html?id=' + p.id + '">Ver detalle</a>' +
        '<button type="button" class="boton boton--primario" data-agregar="' + p.id + '">Añadir</button>' +
      '</div>' +
    '</div>' +
  '</article>'
).join('');

document.getElementById('rejilla').addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-agregar]');
  if (!boton) return;
  const usuario = UI.requerirSesion();
  if (!usuario) return;
  OCL.carrito.agregar(usuario.id, Number(boton.dataset.agregar), 1);
  UI.montar('catalogo');
  UI.aviso('Producto añadido al carrito.', 'exito');
});

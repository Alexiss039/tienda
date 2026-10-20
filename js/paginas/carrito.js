// HU-07 Ver/quitar productos del carrito y HU-08 Aplicar cupón de descuento.
const usuarioCarrito = UI.montar('carrito') && UI.requerirSesion();

function pintarCarrito() {
  const resumen = OCL.carrito.resumen(usuarioCarrito.id);
  const contenedor = document.getElementById('carrito');
  const unidades = resumen.items.reduce((suma, i) => suma + i.cantidad, 0);
  document.getElementById('conteo').textContent =
    unidades ? unidades + ' unidad(es) en tu carrito · revisa antes de pagar.' : 'Tu carrito está vacío.';

  if (!resumen.items.length) {
    contenedor.innerHTML = '<p><a class="boton boton--primario" href="index.html">Ir al catálogo</a></p>';
    return;
  }

  const items = resumen.items.map((i) =>
    '<li class="item-carrito">' +
      '<div class="item-carrito__imagen"><img src="' + UI.escapar(i.imagen) + '" alt="' + UI.escapar(i.nombre) + '"></div>' +
      '<div class="item-carrito__info"><h3>' + UI.escapar(i.nombre) + '</h3>' +
        '<p>Cantidad: ' + i.cantidad + '</p>' +
        '<p class="item-carrito__precio">' + UI.moneda(i.precio * i.cantidad) + '</p></div>' +
      '<button type="button" class="boton boton--borde" data-quitar="' + i.productoId + '">Quitar</button>' +
    '</li>').join('');

  contenedor.innerHTML =
    '<ul class="lista-carrito">' + items + '</ul>' +
    '<aside class="resumen" aria-labelledby="titulo-resumen">' +
      '<h2 id="titulo-resumen">Resumen del pedido</h2>' +
      '<form class="cupon" id="form-cupon"><input type="text" id="codigo-cupon" placeholder="Código de cupón" aria-label="Código de cupón">' +
        '<button type="submit" class="boton boton--secundario boton--pequeno">Aplicar</button></form>' +
      '<p class="resumen__linea"><span>Subtotal</span> <span>' + UI.moneda(resumen.subtotal) + '</span></p>' +
      '<p class="resumen__linea"><span>Descuento' + (resumen.cupon ? ' (' + UI.escapar(resumen.cupon.codigo) + ' · ' + UI.escapar(resumen.etiquetaDescuento) + ')' : '') + '</span> <span>-' + UI.moneda(resumen.descuento) + '</span></p>' +
      '<p class="resumen__linea"><span>Envío</span> <span>' + UI.moneda(resumen.envio) + '</span></p>' +
      '<p class="resumen__linea resumen__linea--total"><span>Total</span> <span>' + UI.moneda(resumen.total) + '</span></p>' +
      '<a class="boton boton--primario boton--bloque" href="checkout.html">Proceder al pago</a>' +
      '<a class="boton boton--borde boton--bloque" href="index.html" style="margin-top:.5rem">Seguir comprando</a>' +
    '</aside>';
}

if (usuarioCarrito) {
  pintarCarrito();

  document.getElementById('carrito').addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-quitar]');
    if (!boton) return;
    OCL.carrito.quitar(usuarioCarrito.id, Number(boton.dataset.quitar));
    UI.montar('carrito');
    pintarCarrito();
  });

  document.getElementById('carrito').addEventListener('submit', (evento) => {
    if (evento.target.id !== 'form-cupon') return;
    evento.preventDefault();
    try {
      OCL.carrito.aplicarCupon(usuarioCarrito.id, document.getElementById('codigo-cupon').value);
      pintarCarrito();
      UI.aviso('Cupón aplicado.', 'exito');
    } catch (error) {
      UI.aviso(error.message, 'error');
    }
  });
}

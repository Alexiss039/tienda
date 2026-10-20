// HU-09 Realizar pedido: pago con la pasarela Wompi (simulada).
const usuarioCheckout = UI.montar('carrito') && UI.requerirSesion();

if (usuarioCheckout) {
  const resumen = OCL.carrito.resumen(usuarioCheckout.id);
  if (!resumen.items.length) location.href = 'carrito.html';

  document.getElementById('resumen').innerHTML =
    '<h2 id="titulo-resumen">Resumen del pedido</h2>' +
    resumen.items.map((i) => '<p class="resumen__linea"><span>' + UI.escapar(i.nombre) + ' × ' + i.cantidad + '</span><span>' +
      UI.moneda(i.precio * i.cantidad) + '</span></p>').join('') +
    '<p class="resumen__linea"><span>Subtotal</span> <span>' + UI.moneda(resumen.subtotal) + '</span></p>' +
    '<p class="resumen__linea"><span>Descuento</span> <span>-' + UI.moneda(resumen.descuento) + '</span></p>' +
    '<p class="resumen__linea"><span>Envío</span> <span>' + UI.moneda(resumen.envio) + '</span></p>' +
    '<p class="resumen__linea resumen__linea--total"><span>Total</span> <span>' + UI.moneda(resumen.total) + '</span></p>';

  document.getElementById('form-pago').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const boton = document.getElementById('pagar');
    boton.disabled = true;
    boton.textContent = 'Procesando pago...';
    try {
      const pedido = await OCL.checkout.pagar(usuarioCheckout, document.getElementById('tarjeta').value);
      location.href = 'pedidos.html?ref=' + encodeURIComponent(pedido.referencia);
    } catch (error) {
      UI.aviso(error.message, 'error');
      boton.disabled = false;
      boton.textContent = 'Pagar';
    }
  });
}

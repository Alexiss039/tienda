// HU-10 Consultar estado de pedido (cliente). Muestra también el resultado del pago recién realizado.
const usuarioPedidos = UI.montar('pedidos') && UI.requerirSesion();

if (usuarioPedidos) {
  const lista = OCL.pedidos.listarDeCliente(usuarioPedidos.id).slice().reverse();
  const referencia = new URLSearchParams(location.search).get('ref');
  const nuevo = lista.find((p) => p.referencia === referencia);

  if (nuevo) {
    if (nuevo.estado === 'Exitoso') {
      UI.aviso('¡Pago aprobado! Pedido ' + nuevo.referencia + '. Te enviamos un correo de confirmación (simulado).', 'exito');
    } else {
      UI.aviso('El pago del pedido ' + nuevo.referencia + ' fue rechazado. Tu carrito se conserva para que lo intentes de nuevo.', 'error');
    }
  }

  document.getElementById('tabla-pedidos').innerHTML = lista.length
    ? '<thead><tr><th>Referencia</th><th>Fecha</th><th>Productos</th><th>Total</th><th>Estado</th><th>Guía</th></tr></thead><tbody>' +
      lista.map((p) => '<tr><td>' + UI.escapar(p.referencia) + '</td><td>' + UI.escapar(p.fecha) + '</td><td>' +
        p.items.map((i) => UI.escapar(i.nombre) + ' × ' + i.cantidad).join('<br>') + '</td><td>' + UI.moneda(p.total) +
        '</td><td><span class="insignia insignia--' + p.estado + '">' + p.estado + '</span></td><td>' +
        (p.guia ? UI.escapar(p.entidad) + ' · ' + UI.escapar(p.guia) : '—') + '</td></tr>').join('') + '</tbody>'
    : '<tbody><tr><td>Aún no tienes pedidos.</td></tr></tbody>';
}

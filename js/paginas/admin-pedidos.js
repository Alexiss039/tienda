// HU-13 Listado de pedidos y HU-14 Actualizar estado de envío (solo Admin).
const adminPedidos = UI.montar('admin-pedidos') && UI.requerirSesion('Admin');

function pintarPedidos() {
  const lista = OCL.pedidos.listar().slice().reverse();
  document.getElementById('tabla-pedidos').innerHTML =
    '<thead><tr><th>Referencia</th><th>Cliente</th><th>Productos</th><th>Total</th><th>Estado</th><th>Despacho</th></tr></thead><tbody>' +
    lista.map((p) => {
      const despachable = ['Exitoso', 'Enviado', 'Entregado'].includes(p.estado);
      return '<tr data-id="' + p.id + '"><td>' + UI.escapar(p.referencia) + '<br><small class="pista">' + UI.escapar(p.fecha) + '</small></td><td>' +
        UI.escapar(p.cliente) + '</td><td>' + p.items.map((i) => UI.escapar(i.nombre) + ' × ' + i.cantidad).join('<br>') +
        '</td><td>' + UI.moneda(p.total) + '</td><td><span class="insignia insignia--' + p.estado + '">' + p.estado + '</span></td><td>' +
        (despachable
          ? '<div class="acciones-fila"><select data-campo="estado" aria-label="Estado"><option' + (p.estado === 'Enviado' ? ' selected' : '') + '>Enviado</option><option' + (p.estado === 'Entregado' ? ' selected' : '') + '>Entregado</option></select>' +
            '<input data-campo="guia" placeholder="N.º de guía" value="' + UI.escapar(p.guia) + '" aria-label="Guía" size="10">' +
            '<input data-campo="entidad" placeholder="Entidad" value="' + UI.escapar(p.entidad) + '" aria-label="Entidad de envío" size="10">' +
            '<button type="button" class="boton boton--secundario boton--pequeno" data-guardar="' + p.id + '">Guardar</button></div>'
          : '—') + '</td></tr>';
    }).join('') + '</tbody>';
}

function pintarBitacora() {
  document.getElementById('tabla-bitacora').innerHTML =
    '<thead><tr><th>Fecha</th><th>Nivel</th><th>Evento</th></tr></thead><tbody>' +
    (OCL.bitacora.listar().map((r) => '<tr><td>' + UI.escapar(r.fecha) + '</td><td>' + UI.escapar(r.nivel) + '</td><td>' +
      UI.escapar(r.mensaje) + '</td></tr>').join('') || '<tr><td colspan="3">Sin eventos.</td></tr>') + '</tbody>';
}

if (adminPedidos) {
  pintarPedidos();
  pintarBitacora();

  document.getElementById('tabla-pedidos').addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-guardar]');
    if (!boton) return;
    const fila = boton.closest('tr');
    const leer = (nombre) => fila.querySelector('[data-campo="' + nombre + '"]').value.trim();
    try {
      OCL.pedidos.actualizarEnvio(Number(boton.dataset.guardar), {
        estado: leer('estado'), guia: leer('guia'), entidad: leer('entidad')
      });
      pintarPedidos();
      UI.aviso('Pedido actualizado.', 'exito');
    } catch (error) {
      UI.aviso(error.message, 'error');
    }
  });
}

// RNF-09 Auditabilidad: registro de los eventos relevantes del proceso de pago.
class Bitacora {
  constructor(almacen) {
    this.almacen = almacen;
  }

  registrar(nivel, mensaje) {
    const registros = this.almacen.leer('bitacora', []);
    registros.unshift({ fecha: new Date().toLocaleString('es-CO'), nivel, mensaje });
    this.almacen.guardar('bitacora', registros.slice(0, 50));
  }

  listar() {
    return this.almacen.leer('bitacora', []);
  }
}

// Observador: traduce cada evento del pedido en una línea de la bitácora
class RegistroEventosPedido extends Observador {
  constructor(bitacora) {
    super();
    this.bitacora = bitacora;
  }

  actualizar(evento, datos) {
    const ref = datos.pedido ? datos.pedido.referencia : datos.referencia;
    // Cada evento construye su mensaje solo cuando ocurre (no todos traen un pedido)
    const registro = {
      [EventosPedido.PAGO_APROBADO]: () => ['info', 'Pago aprobado para el pedido ' + ref],
      [EventosPedido.PAGO_RECHAZADO]: () => ['warning', 'Pago rechazado para el pedido ' + ref],
      [EventosPedido.FIRMA_INVALIDA]: () => ['error', 'Firma inválida en la notificación del pedido ' + ref],
      [EventosPedido.PEDIDO_NO_ENCONTRADO]: () => ['error', 'Notificación para un pedido no encontrado: ' + ref],
      [EventosPedido.TRANSICION_INVALIDA]: () => ['warning', 'Notificación ignorada para el pedido ' + ref + ': ' + datos.mensaje],
      [EventosPedido.PEDIDO_ENVIADO]: () => ['info', 'Pedido ' + ref + ' enviado (' + datos.pedido.entidad + ', guía ' + datos.pedido.guia + ')'],
      [EventosPedido.PEDIDO_ENTREGADO]: () => ['info', 'Pedido ' + ref + ' entregado']
    }[evento];
    if (registro) this.bitacora.registrar(...registro());
  }
}

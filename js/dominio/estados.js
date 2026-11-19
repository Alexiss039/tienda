// PATRÓN 4 - STATE: cada estado del pedido es un objeto que sabe qué transiciones permite (RN-04 y RN-05).
// El pedido guarda solo el nombre de su estado; PedidoService delega en el objeto estado para cambiarlo.
//
//   Pendiente --aprobarPago--> Exitoso --despachar--> Enviado --entregar--> Entregado
//        \--rechazarPago--> rechazado                    (Enviado puede volver a despacharse para corregir la guía)

class EstadoPedido {
  constructor(nombre) {
    this.nombre = nombre;
  }

  // Por defecto ninguna transición está permitida; cada estado concreto habilita las suyas.
  aprobarPago() { return this.noPermitida('Exitoso'); }
  rechazarPago() { return this.noPermitida('rechazado'); }
  despachar() { return this.noPermitida('Enviado'); }
  entregar() { return this.noPermitida('Entregado'); }

  // Estados a los que el administrador puede mover el pedido a mano (RN-05)
  siguientesManuales() { return []; }

  noPermitida(destino) {
    throw new Error('Transición no permitida: ' + this.nombre + ' → ' + destino);
  }

  // Devuelve el objeto estado que corresponde al nombre guardado en el pedido
  static de(nombre) {
    const estado = REGISTRO_ESTADOS[nombre];
    if (!estado) throw new Error('Estado de pedido desconocido: ' + nombre);
    return estado;
  }
}

// RN-04: solo la notificación del webhook mueve un pedido pendiente a Exitoso o rechazado
class EstadoPendiente extends EstadoPedido {
  constructor() { super('Pendiente'); }
  aprobarPago() { return EstadoPedido.de('Exitoso'); }
  rechazarPago() { return EstadoPedido.de('rechazado'); }
}

// RN-05: Enviado y Entregado solo los asigna el administrador
class EstadoExitoso extends EstadoPedido {
  constructor() { super('Exitoso'); }
  despachar() { return EstadoPedido.de('Enviado'); }
  siguientesManuales() { return ['Enviado']; }
}

class EstadoEnviado extends EstadoPedido {
  constructor() { super('Enviado'); }
  despachar() { return this; }                       // permite corregir guía o entidad de un pedido ya enviado
  entregar() { return EstadoPedido.de('Entregado'); }
  siguientesManuales() { return ['Enviado', 'Entregado']; }
}

class EstadoEntregado extends EstadoPedido {
  constructor() { super('Entregado'); }
}

class EstadoRechazado extends EstadoPedido {
  constructor() { super('rechazado'); }
}

const REGISTRO_ESTADOS = Object.fromEntries(
  [new EstadoPendiente(), new EstadoExitoso(), new EstadoEnviado(), new EstadoEntregado(), new EstadoRechazado()]
    .map((estado) => [estado.nombre, estado])
);

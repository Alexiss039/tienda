// Reglas de negocio constantes del Entregable 1.
const Reglas = {
  COSTO_ENVIO: 10000,                       // RN-02: envío fijo de $10.000
  ESTADO_INICIAL_PEDIDO: 'Pendiente',       // RN-04: todo pedido inicia en Pendiente
  ESTADOS_WEBHOOK: ['Exitoso', 'rechazado'],// RN-04: solo el webhook asigna estos estados
  ESTADOS_ENVIO: ['Enviado', 'Entregado']   // RN-05: solo el administrador asigna estos estados
};

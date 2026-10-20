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

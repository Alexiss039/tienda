// Almacén de datos simulado: reemplaza a la base de datos MySQL del sistema real.
// Cada "tabla" se guarda como un arreglo JSON en localStorage.
const Almacen = {
  prefijo: 'ocl.',

  leer(tabla, defecto) {
    try {
      const valor = localStorage.getItem(this.prefijo + tabla);
      return valor === null ? defecto : JSON.parse(valor);
    } catch (error) {
      return defecto;
    }
  },

  guardar(tabla, datos) {
    localStorage.setItem(this.prefijo + tabla, JSON.stringify(datos));
  },

  siguienteId(tabla) {
    const filas = this.leer(tabla, []);
    return filas.reduce((max, fila) => Math.max(max, fila.id || 0), 0) + 1;
  },

  reiniciar() {
    Object.keys(localStorage)
      .filter((clave) => clave.startsWith(this.prefijo))
      .forEach((clave) => localStorage.removeItem(clave));
  }
};

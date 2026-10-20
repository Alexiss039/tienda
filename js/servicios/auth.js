// HU-01 Registro, HU-02 Inicio de sesión, RF-17 Control de acceso por rol.
class AuthService {
  constructor(almacen) {
    this.almacen = almacen;
  }

  registrar(datos) {
    const usuarios = this.almacen.leer('usuarios', []);
    const correo = datos.correo.trim().toLowerCase();
    if (usuarios.some((u) => u.correo === correo)) {
      throw new Error('El correo ya está en uso');
    }
    if (datos.clave !== datos.clave2) {
      throw new Error('Las contraseñas no coinciden');
    }
    if (datos.clave.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
    const usuario = {
      id: this.almacen.siguienteId('usuarios'),
      nombre: datos.nombre.trim(),
      apellidos: datos.apellidos.trim(),
      correo,
      celular: datos.celular.trim(),
      direccion: datos.direccion.trim(),
      ciudad: datos.ciudad.trim(),
      barrio: datos.barrio.trim(),
      claveHash: sha256(datos.clave),   // RNF-01: nunca se guarda la clave en claro
      rol: 'Cliente'                    // HU-01: toda cuenta nueva es Cliente
    };
    usuarios.push(usuario);
    this.almacen.guardar('usuarios', usuarios);
    this.almacen.guardar('sesion', usuario.id);
    return this.publico(usuario);
  }

  iniciarSesion(correo, clave) {
    const usuario = this.almacen.leer('usuarios', []).find((u) => u.correo === correo.trim().toLowerCase());
    if (!usuario || usuario.claveHash !== sha256(clave)) {
      throw new Error('Correo o contraseña incorrectos');
    }
    this.almacen.guardar('sesion', usuario.id);
    return this.publico(usuario);
  }

  cerrarSesion() {
    localStorage.removeItem(this.almacen.prefijo + 'sesion');
  }

  usuarioActual() {
    const id = this.almacen.leer('sesion', null);
    if (id === null) return null;
    const usuario = this.almacen.leer('usuarios', []).find((u) => u.id === id);
    return usuario ? this.publico(usuario) : null;
  }

  // Nunca se expone el hash de la clave a la interfaz
  publico(usuario) {
    const { claveHash, ...resto } = usuario;
    return resto;
  }
}

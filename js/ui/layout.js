// Interfaz común: encabezado según el rol, pie de página, avisos y utilidades de formato.
const UI = {
  moneda(valor) {
    return '$' + String(Math.round(valor)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  },

  // Evita inyectar HTML con datos escritos por el usuario
  escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto == null ? '' : String(texto);
    return div.innerHTML;
  },

  aviso(mensaje, tipo, destino) {
    const contenedor = destino || document.getElementById('avisos');
    if (!contenedor) return;
    contenedor.innerHTML = '<p class="aviso aviso--' + (tipo || 'info') + '" role="alert">' + UI.escapar(mensaje) + '</p>';
  },

  // Exige sesión (y rol opcional); si no se cumple redirige y devuelve null
  requerirSesion(rol) {
    const usuario = OCL.auth.usuarioActual();
    if (!usuario) {
      location.href = 'login.html?volver=' + encodeURIComponent(location.pathname.split('/').pop() + location.search);
      return null;
    }
    if (rol && usuario.rol !== rol) {
      location.href = 'index.html';
      return null;
    }
    return usuario;
  },

  montar(paginaActiva) {
    const usuario = OCL.auth.usuarioActual();
    const enlace = (href, texto, clave) =>
      '<li><a' + (clave === paginaActiva ? ' class="activo"' : '') + ' href="' + href + '">' + texto + '</a></li>';

    let menu = enlace('index.html', 'Catálogo', 'catalogo');
    if (usuario) {
      const cantidad = OCL.carrito.cantidadTotal(usuario.id);
      menu += enlace('carrito.html', 'Carrito' + (cantidad ? ' (' + cantidad + ')' : ''), 'carrito');
      menu += enlace('pedidos.html', 'Mis pedidos', 'pedidos');
      if (usuario.rol === 'Admin') {
        menu += enlace('admin-productos.html', 'Admin: productos', 'admin-productos');
        menu += enlace('admin-pedidos.html', 'Admin: pedidos', 'admin-pedidos');
      }
      menu += '<li><span class="menu__usuario">Hola, ' + UI.escapar(usuario.nombre) + '</span></li>' +
              '<li><a href="#" id="cerrar-sesion">Salir</a></li>';
    } else {
      menu += enlace('login.html', 'Iniciar sesión', 'login') + enlace('registro.html', 'Crear cuenta', 'registro');
    }

    document.getElementById('encabezado').innerHTML =
      '<div class="contenedor encabezado__interno">' +
        '<a class="marca" href="index.html"><img src="img/logo.svg" alt="Logotipo de O\'Clock Lens">' +
        '<span>O\'CLOCK</span>&nbsp;LENS</a>' +
        '<nav aria-label="Navegación principal"><ul class="menu">' + menu + '</ul></nav>' +
      '</div>';

    document.getElementById('pie').innerHTML =
      '<div class="contenedor">' +
        '<div class="pie__columnas">' +
          '<div><h3>O\'Clock Lens</h3><p>Relojes y gafas · Medellín, Colombia</p></div>' +
          '<div><h3>Navegación</h3><ul><li><a href="index.html">Catálogo</a></li><li><a href="carrito.html">Carrito de compra</a></li></ul></div>' +
          '<div><h3>Prototipo académico</h3><p>Réplica estática con pasarela y correo simulados.</p></div>' +
        '</div>' +
        '<p class="pie__creditos">&copy; 2026 O\'Clock Lens. Proyecto de Análisis y Diseño de Software · ITM.</p>' +
      '</div>';

    const salir = document.getElementById('cerrar-sesion');
    if (salir) {
      salir.addEventListener('click', (evento) => {
        evento.preventDefault();
        OCL.auth.cerrarSesion();
        location.href = 'index.html';
      });
    }
    UI.panelPruebas();
    return usuario;
  },

  // Panel lateral con datos de demostración: cada vista muestra solo los datos que le sirven
  panelPruebas() {
    if (document.getElementById('panel-pruebas')) return;

    const boton = (clase, atributos, texto) => '<button type="button" class="' + clase + '" ' + atributos + '>' + texto + '</button>';
    const dato = (campo, valor) => boton('panel-pruebas__dato', 'data-rellenar="' + campo + '" data-valor="' + valor + '"', valor);

    const secciones = {
      usuarios:
        '<h3>Usuarios</h3>' +
        '<p><strong>Cliente</strong><br><code>cliente@oclocklens.com</code><br><code>Cliente123</code></p>' +
        boton('boton boton--secundario boton--pequeno', 'data-entrar="cliente@oclocklens.com|Cliente123"', 'Entrar como cliente') +
        '<p style="margin-top:.75rem"><strong>Administrador</strong><br><code>admin@oclocklens.com</code><br><code>Admin123</code></p>' +
        boton('boton boton--secundario boton--pequeno', 'data-entrar="admin@oclocklens.com|Admin123"', 'Entrar como admin') +
        '<p style="margin-top:.75rem">' + boton('boton boton--borde boton--pequeno', 'id="reiniciar-datos"', 'Reiniciar datos') + '</p>',
      cupones:
        '<h3>Cupones</h3>' +
        '<p>' + dato('#codigo-cupon', 'OCLOCK10') + ' 10 % de descuento<br>' +
        dato('#codigo-cupon', 'BIENVENIDO') + ' $20.000 de descuento</p>' +
        '<p class="pista">Un clic escribe el código en el campo del carrito.</p>',
      tarjetas:
        '<h3>Tarjetas (Wompi simulado)</h3>' +
        '<p>' + dato('#tarjeta', '4242 4242 4242 4242') + ' aprueba el pago<br>' +
        dato('#tarjeta', '4111 1111 1111 1111') + ' rechaza el pago</p>' +
        '<p class="pista">Un clic escribe el número en el formulario de pago.</p>'
    };
    // Qué muestra cada vista (las demás no tienen panel)
    const porVista = { 'login.html': 'usuarios', 'carrito.html': 'cupones', 'checkout.html': 'tarjetas' };
    const vista = location.pathname.split('/').pop();
    const clave = porVista[vista];
    if (!clave) return;

    // Abierto por defecto solo si hay espacio de sobra; la elección del usuario se recuerda
    let abierto = Almacen.leer('panel', window.innerWidth >= 1300);

    const panel = document.createElement('aside');
    panel.id = 'panel-pruebas';
    panel.className = 'panel-pruebas';
    panel.setAttribute('aria-label', 'Datos de prueba');
    panel.innerHTML =
      '<button type="button" class="panel-pruebas__pestana" id="panel-alternar" aria-expanded="true">Datos de prueba</button>' +
      '<div class="panel-pruebas__cuerpo"><h2>Datos de prueba</h2>' + secciones[clave] + '</div>';
    document.body.appendChild(panel);

    const aplicar = () => {
      panel.classList.toggle('panel-pruebas--cerrado', !abierto);
      document.getElementById('panel-alternar').setAttribute('aria-expanded', String(abierto));
    };
    aplicar();

    panel.addEventListener('click', (evento) => {
      const alternar = evento.target.closest('#panel-alternar');
      const entrar = evento.target.closest('[data-entrar]');
      const rellenar = evento.target.closest('[data-rellenar]');
      const reiniciar = evento.target.closest('#reiniciar-datos');

      if (alternar) {
        abierto = !abierto;
        Almacen.guardar('panel', abierto);
        aplicar();
      }
      if (entrar) {
        const [correo, clave] = entrar.dataset.entrar.split('|');
        OCL.auth.cerrarSesion();
        const usuario = OCL.auth.iniciarSesion(correo, clave);
        location.href = usuario.rol === 'Admin' ? 'admin-pedidos.html' : 'index.html';
      }
      if (rellenar) {
        const campo = document.querySelector(rellenar.dataset.rellenar);
        if (campo) {
          campo.value = rellenar.dataset.valor;
          campo.focus();
        } else {
          UI.aviso('Ese dato se usa en ' + (rellenar.dataset.rellenar === '#tarjeta' ? 'la página de pago.' : 'el carrito.'), 'info');
        }
      }
      if (reiniciar && confirm('Se borrarán los pedidos, usuarios y cambios hechos en el prototipo. ¿Continuar?')) {
        Almacen.reiniciar();
        location.href = 'index.html';
      }
    });
  }
};

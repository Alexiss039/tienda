// Pruebas de State y Observer (flujo del pedido). Ejecutar: node tests/pedidos.test.js
const fs = require('fs');
const vm = require('vm');
process.chdir(require('path').join(__dirname, '..'));

const mem = {};
const localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; }
};
// Almacen.reiniciar usa Object.keys(localStorage): se simula con las claves de mem
Object.defineProperty(localStorage, 'keysSim', { value: () => Object.keys(mem), enumerable: false });
const sandbox = { localStorage, TextEncoder, console, Date, JSON, Math, Promise, setTimeout, Error };
sandbox.Object = Object.assign(Object.create(Object), Object);
sandbox.Object = new Proxy(Object, { get: (o, p) => (p === 'keys' ? (x) => (x === localStorage ? Object.keys(mem) : Object.keys(x)) : o[p]) });
vm.createContext(sandbox);

const capas = ['infra/sha256', 'infra/almacen', 'infra/semilla', 'dominio/reglas', 'dominio/estados', 'dominio/eventos',
  'dominio/descuentos', 'dominio/pasarela', 'servicios/bitacora', 'servicios/notificador', 'servicios/auth', 'servicios/catalogo',
  'servicios/carrito', 'servicios/pedidos', 'servicios/checkout', 'app'];
let codigo = capas.map((c) => fs.readFileSync('js/' + c + '.js', 'utf8')).join('\n;\n');
codigo += '\n;globalThis.__E = { OCL, EstadoPedido, EventosPedido, Almacen };';
vm.runInContext(codigo, sandbox);
const { OCL, EstadoPedido } = sandbox.__E;

let ok = 0, fail = 0;
const t = (nombre, cond) => { if (cond) ok++; else fail++; console.log((cond ? 'OK    ' : 'FALLA '), nombre); };
const lanza = (fn) => { try { fn(); return null; } catch (e) { return e.message; } };
const E = (n) => EstadoPedido.de(n);

// ---------------- State
t('Pendiente -> aprobarPago = Exitoso', E('Pendiente').aprobarPago().nombre === 'Exitoso');
t('Pendiente -> rechazarPago = rechazado', E('Pendiente').rechazarPago().nombre === 'rechazado');
t('Pendiente no puede despacharse', /no permitida/.test(lanza(() => E('Pendiente').despachar())));
t('Exitoso -> despachar = Enviado', E('Exitoso').despachar().nombre === 'Enviado');
t('Exitoso no puede entregarse directo', /Exitoso → Entregado/.test(lanza(() => E('Exitoso').entregar())));
t('Enviado -> entregar = Entregado', E('Enviado').entregar().nombre === 'Entregado');
t('Entregado es final', E('Entregado').siguientesManuales().length === 0 && !!lanza(() => E('Entregado').despachar()));
t('rechazado es final', E('rechazado').siguientesManuales().length === 0 && !!lanza(() => E('rechazado').aprobarPago()));
t('Exitoso solo ofrece Enviado', JSON.stringify(E('Exitoso').siguientesManuales()) === '["Enviado"]');
t('estado desconocido lanza', /desconocido/.test(lanza(() => EstadoPedido.de('Raro'))));

// ---------------- Flujo completo (State + Observer)
(async () => {
  const u = OCL.auth.iniciarSesion('cliente@oclocklens.com', 'Cliente123');
  OCL.carrito.agregar(u.id, 1, 1);
  const log0 = OCL.bitacora.listar().length;
  const p = await OCL.checkout.pagar(u, '4242 4242 4242 4242');
  t('pago aprobado -> Exitoso', p.estado === 'Exitoso');
  const nuevos = OCL.bitacora.listar().slice(0, OCL.bitacora.listar().length - log0).map((r) => r.mensaje).reverse();
  t('Observer: bitácora registró el pago aprobado', nuevos.some((m) => /Pago aprobado/.test(m)));
  t('Observer: correo al cliente y al admin', nuevos.some((m) => /confirmación/.test(m)) && nuevos.some((m) => /nueva venta/.test(m)));
  t('Observer: la bitácora va antes que el correo', nuevos.findIndex((m) => /Pago aprobado/.test(m)) < nuevos.findIndex((m) => /confirmación/.test(m)));
  t('carrito vacío tras pago aprobado', OCL.carrito.leer(u.id).items.length === 0);

  t('despachar sin guía falla', /guía/.test(lanza(() => OCL.pedidos.actualizarEnvio(p.id, { estado: 'Enviado', guia: '', entidad: '' }))));
  t('Exitoso -> Entregado directo falla', /no permitida/.test(lanza(() => OCL.pedidos.actualizarEnvio(p.id, { estado: 'Entregado', guia: 'G1', entidad: 'X' }))));
  t('Exitoso -> Enviado', OCL.pedidos.actualizarEnvio(p.id, { estado: 'Enviado', guia: 'G1', entidad: 'Servientrega' }).estado === 'Enviado');
  t('Enviado -> Enviado (corregir guía)', OCL.pedidos.actualizarEnvio(p.id, { estado: 'Enviado', guia: 'G2', entidad: 'Servientrega' }).guia === 'G2');
  t('Enviado -> Entregado', OCL.pedidos.actualizarEnvio(p.id, { estado: 'Entregado', guia: 'G2', entidad: 'Servientrega' }).estado === 'Entregado');
  t('Entregado -> Enviado falla', /no permitida/.test(lanza(() => OCL.pedidos.actualizarEnvio(p.id, { estado: 'Enviado', guia: 'G3', entidad: 'X' }))));
  const msgs = OCL.bitacora.listar().map((r) => r.mensaje);
  t('Observer: bitácora registró envío y entrega', msgs.some((m) => /enviado \(Servientrega, guía G1\)/.test(m)) && msgs.some((m) => /entregado/.test(m)));

  OCL.carrito.agregar(u.id, 4, 1);
  const r = await OCL.checkout.pagar(u, '4111 1111 1111 1111');
  t('pago rechazado -> rechazado y conserva el carrito', r.estado === 'rechazado' && OCL.carrito.leer(u.id).items.length === 1);
  t('rechazado: no se puede despachar', /no permitida/.test(lanza(() => OCL.pedidos.actualizarEnvio(r.id, { estado: 'Enviado', guia: 'G', entidad: 'X' }))));

  const pasarela = OCL.checkout.pasarela;
  const real = pasarela.validarNotificacion;
  const dup = { referencia: p.referencia, transaccionId: 'x', aprobado: true, crudo: null };
  pasarela.validarNotificacion = () => true;
  const antes = OCL.pedidos.listar().find((x) => x.id === p.id).estado;
  OCL.pedidos.aplicarNotificacionPago(dup, pasarela, u.correo);
  t('notificación repetida no cambia el estado (State)', OCL.pedidos.listar().find((x) => x.id === p.id).estado === antes);
  t('Observer: transición inválida auditada', OCL.bitacora.listar()[0].mensaje.includes('Notificación ignorada'));
  pasarela.validarNotificacion = () => false;
  OCL.pedidos.aplicarNotificacionPago({ ...dup, referencia: r.referencia }, pasarela, u.correo);
  t('Observer: firma inválida auditada', OCL.bitacora.listar()[0].mensaje.startsWith('Firma inválida'));
  OCL.pedidos.aplicarNotificacionPago({ ...dup, referencia: 'NOEXISTE' }, pasarela, u.correo);
  t('Observer: pedido no encontrado auditado', OCL.bitacora.listar()[0].mensaje.includes('no encontrado'));
  pasarela.validarNotificacion = real;

  let llamadas = 0;
  const cancelar = OCL.eventos.suscribir('pago.aprobado', { actualizar() { llamadas++; } });
  OCL.eventos.emitir('pago.aprobado', { pedido: { referencia: 'X' }, correoCliente: 'a@b.c' });
  cancelar();
  OCL.eventos.emitir('pago.aprobado', { pedido: { referencia: 'X' }, correoCliente: 'a@b.c' });
  t('Observer: suscribir y cancelar', llamadas === 1);

  console.log('\n' + ok + ' OK, ' + fail + ' fallas');
  process.exit(fail ? 1 : 0);
})();

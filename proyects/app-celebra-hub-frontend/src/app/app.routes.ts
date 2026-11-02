import { Routes } from '@angular/router';

/**
 * Rutas de la aplicación.
 *
 * ISS-01B presenta el router con una pantalla real. `loadComponent` descarga
 * `Inicio` solo cuando se visita su URL: el bundle inicial no lo incluye.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        title: 'Inicio · CelebraHub',
        loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio),
      },
      {
        path: 'clientes',
        title: 'Clientes · CelebraHub',
        loadComponent: () =>
          import('./features/clientes/cliente-list/cliente-list').then((m) => m.ClienteList),
      },
      {
        path: 'proveedores',
        title: 'Proveedores · CelebraHub',
        loadComponent: () =>
          import('./features/proveedores/proveedor-list/proveedor-list').then(
            (m) => m.ProveedorList,
          ),
      },
      {
        path: 'servicios',
        title: 'Servicios · CelebraHub',
        data: { crudId: 'servicios' },
        loadComponent: () =>
          import('./features/servicios/servicio-list/servicio-list').then((m) => m.ServicioList),
      },
      {
        path: 'salones',
        title: 'Salones · CelebraHub',
        data: { crudId: 'salones' },
        loadComponent: () =>
          import('./features/salones/salon-list/salon-list').then((m) => m.SalonList),
      },
      {
        path: 'reservas',
        title: 'Reservas · CelebraHub',
        data: { crudId: 'reservas' },
        loadComponent: () =>
          import('./features/reservas/reserva-list/reserva-list').then((m) => m.ReservaList),
      },
      {
        path: 'contratos',
        title: 'Contratos · CelebraHub',
        data: { crudId: 'contratos' },
        loadComponent: () =>
          import('./features/contratos/contrato-list/contrato-list').then((m) => m.ContratoList),
      },
      {
        path: 'pagos',
        title: 'Pagos · CelebraHub',
        data: { crudId: 'pagos' },
        loadComponent: () => import('./features/pagos/pago-list/pago-list').then((m) => m.PagoList),
      },
      {
        path: 'cambios-contrato',
        title: 'Cambios de contrato · CelebraHub',
        data: { crudId: 'cambios-contrato' },
        loadComponent: () =>
          import('./features/cambios-contrato/cambio-contrato-list/cambio-contrato-list').then(
            (m) => m.CambioContratoList,
          ),
      },
      {
        path: 'evento-servicios',
        title: 'Servicios de evento · CelebraHub',
        data: { crudId: 'evento-servicios' },
        loadComponent: () =>
          import('./features/evento-servicios/evento-servicio-list/evento-servicio-list').then(
            (m) => m.EventoServicioList,
          ),
      },
      {
        path: 'cancelaciones',
        title: 'Cancelaciones · CelebraHub',
        data: { crudId: 'cancelaciones' },
        loadComponent: () =>
          import('./features/cancelaciones/cancelacion-list/cancelacion-list').then(
            (m) => m.CancelacionList,
          ),
      },
      {
        path: 'eventos',
        title: 'Eventos · CelebraHub',
        data: { crudId: 'eventos' },
        loadComponent: () =>
          import('./features/eventos/evento-list/evento-list').then((m) => m.EventoList),
      },
    ],
  },
  { path: '**', redirectTo: 'inicio' },
];

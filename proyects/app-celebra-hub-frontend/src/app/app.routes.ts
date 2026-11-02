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
    ],
  },
  { path: '**', redirectTo: 'inicio' },
];

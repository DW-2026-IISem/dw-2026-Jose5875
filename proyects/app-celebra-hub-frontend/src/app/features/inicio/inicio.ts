

import { Component, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DrawerModule } from 'primeng/drawer';
import { watchMediaQuery } from '../../core/utils/media-query';
import { Aside } from '../../layout/aside/aside';
import { Footer } from '../../layout/footer/footer';
import { Header } from '../../layout/header/header';

/**
 * Pantalla inicial de CelebraHub.
 *
 * Es el único componente con estado local en ISS-01B: guarda el título elegido y el
 * estado del menú. El layout solo recibe datos por `input()`; así las siguientes
 * pantallas pueden reutilizarlo sin duplicar Header, Aside ni Footer.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-inicio',
  imports: [Aside, ButtonModule, CardModule, DrawerModule, Footer, Header],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  /** `lg` de Tailwind: desde aquí el Aside es fijo y el botón lo alterna. */
  private readonly isDesktop = watchMediaQuery('(min-width: 1024px)');

  /** Escritorio: el Aside fijo se oculta y el contenido se ensancha. */
  readonly sidebarCollapsed = signal(false);

  /** Móvil: el Drawer se abre desde el botón y se cierra al elegir una opción. */
  readonly mobileOpen = signal(false);

  /** Título del contenido. Cambia al elegir una opción del menú, sin HTTP. */
  readonly title = signal('Inicio');

  /**
   * Menú en el formato `MenuItem` de PrimeNG.
   *
   * `command` ejecuta una función al elegir la opción. Todavía no navega: solo
   * cambia el título. En la fase de rutas, cada opción apuntará a una pantalla real.
   */
  readonly items: MenuItem[] = [
    {
      label: 'Gestión de eventos',
      icon: 'pi pi-calendar',
      items: [
        { label: 'Clientes', icon: 'pi pi-users', command: () => this.seleccionar('Clientes') },
        { label: 'Servicios', icon: 'pi pi-list', command: () => this.seleccionar('Servicios') },
        { label: 'Salones', icon: 'pi pi-building', command: () => this.seleccionar('Salones') },
        { label: 'Reservas', icon: 'pi pi-calendar-plus', command: () => this.seleccionar('Reservas') },
        { label: 'Proveedores', icon: 'pi pi-truck', command: () => this.seleccionar('Proveedores') },
        { label: 'Contratos', icon: 'pi pi-file', command: () => this.seleccionar('Contratos') },
        {
          label: 'Cambios de contrato',
          icon: 'pi pi-file-edit',
          command: () => this.seleccionar('Cambios de contrato'),
        },
        {
          label: 'Pagos',
          icon: 'pi pi-credit-card',
          command: () => this.seleccionar('Pagos'),
        },
        {
          label: 'Cancelaciones',
          icon: 'pi pi-times-circle',
          command: () => this.seleccionar('Cancelaciones'),
        },
        {
          label: 'Servicios de evento',
          icon: 'pi pi-ticket',
          command: () => this.seleccionar('Servicios de evento'),
        },
        { label: 'Eventos', icon: 'pi pi-star', command: () => this.seleccionar('Eventos') },
      ],
    },
    {
      label: 'Administración',
      icon: 'pi pi-shield',
      items: [
        { label: 'Usuarios', icon: 'pi pi-users', command: () => this.seleccionar('Usuarios') },
        { label: 'Roles', icon: 'pi pi-key', command: () => this.seleccionar('Roles') },
        { label: 'Recursos', icon: 'pi pi-list', command: () => this.seleccionar('Recursos') },
        {
          label: 'Asignaciones de rol',
          icon: 'pi pi-user-plus',
          command: () => this.seleccionar('Asignaciones de rol'),
        },
        {
          label: 'Concesiones de rol',
          icon: 'pi pi-lock',
          command: () => this.seleccionar('Concesiones de rol'),
        },
        { label: 'Sesiones', icon: 'pi pi-history', command: () => this.seleccionar('Sesiones') },
      ],
    },
  ];

  /**
   * Un solo botón, dos disposiciones: en escritorio alterna el Aside fijo; por
   * debajo de `lg` abre el Drawer (donde el Aside fijo no cabe).
   */
  protected onMenuToggle(): void {
    if (this.isDesktop()) {
      this.sidebarCollapsed.update((collapsed) => !collapsed);
      return;
    }
    this.mobileOpen.set(true);
  }

  /** Una sola puerta de entrada al estado: la usan las opciones seleccionables. */
  protected seleccionar(titulo: string): void {
    this.title.set(titulo);
    this.mobileOpen.set(false);
  }
}
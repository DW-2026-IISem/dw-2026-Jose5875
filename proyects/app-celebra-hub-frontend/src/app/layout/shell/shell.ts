import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
import { watchMediaQuery } from '../../core/utils/media-query';
import { Aside } from '../aside/aside';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';
import { businessCrudConfigs } from '../../features/business-crud/business-crud.config';

@Component({
  host: { class: 'block' },
  selector: 'app-shell',
  imports: [RouterOutlet, Header, Aside, Footer, ConfirmDialogModule, DrawerModule, ToastModule],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly isDesktop = watchMediaQuery('(min-width: 1024px)');

  readonly sidebarCollapsed = signal(false);
  readonly mobileOpen = signal(false);

  readonly items: MenuItem[] = [
    { label: 'Inicio', icon: 'pi pi-home', routerLink: '/inicio' },
    { label: 'Clientes', icon: 'pi pi-users', routerLink: '/clientes' },
    { label: 'Proveedores', icon: 'pi pi-truck', routerLink: '/proveedores' },
    ...Object.values(businessCrudConfigs).map((config) => ({
      label: config.title,
      icon: config.icon,
      routerLink: `/${config.path}`,
    })),
  ];

  protected onMenuToggle(): void {
    if (this.isDesktop()) {
      this.sidebarCollapsed.update((collapsed) => !collapsed);
      return;
    }

    this.mobileOpen.set(true);
  }
}

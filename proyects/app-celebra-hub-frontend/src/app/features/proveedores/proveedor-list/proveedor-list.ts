import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Proveedor, ProveedorPayload } from '../../../core/models/proveedor.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { filterRows } from '../../../core/utils/filter-rows';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../shared/ui/status-tag/status-tag';
import { ProveedorApi } from '../proveedor-api';
import { ProveedorForm } from '../proveedor-form/proveedor-form';

@Component({
  host: { class: 'block' },
  selector: 'app-proveedor-list',
  imports: [
    ButtonModule,
    DialogModule,
    EmptyState,
    InputTextModule,
    MessageModule,
    PageHeader,
    ProveedorForm,
    StatusTag,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './proveedor-list.html',
  styleUrl: './proveedor-list.css',
})
export class ProveedorList {
  private readonly api = inject(ProveedorApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<Proveedor[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');

  readonly visibleRows = computed(() =>
    filterRows(this.rows(), this.filter(), (row) => [
      row.nit,
      row.razon_social,
      row.contacto,
      row.telefono,
      row.email,
    ]),
  );

  readonly dialogVisible = signal(false);
  readonly editing = signal<Proveedor | null>(null);
  readonly resetKey = signal(0);
  readonly title = computed(() => (this.editing() ? 'Editar proveedor' : 'Nuevo proveedor'));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.list().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.rows.set([]);
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }

  setFilter(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.filter.set(target.value);
    }
  }

  openCreate(): void {
    this.editing.set(null);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  openEdit(proveedor: Proveedor): void {
    this.editing.set(proveedor);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  save(payload: ProveedorPayload): void {
    if (this.saving()) {
      return;
    }

    const current = this.editing();
    this.saving.set(true);

    const request = current
      ? this.api.update(current.id, payload)
      : this.api.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(current ? 'Proveedor actualizado' : 'Proveedor creado');
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar el proveedor', toApiMessage(error));
      },
    });
  }

  deactivate(proveedor: Proveedor): void {
    this.confirmation.confirm({
      header: 'Desactivar proveedor',
      message: `¿Desactivar ${proveedor.razon_social}? Dejará de aparecer en el listado de activos.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.api.deactivate(proveedor.id).subscribe({
          next: () => {
            this.notify.warn('Proveedor desactivado');
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo desactivar el proveedor', toApiMessage(error));
          },
        });
      },
    });
  }

  remove(proveedor: Proveedor): void {
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se eliminará permanentemente a ${proveedor.razon_social}. Esta acción no se puede deshacer.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.remove(proveedor.id).subscribe({
          next: () => {
            this.notify.success('Proveedor eliminado');
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo eliminar el proveedor', toApiMessage(error));
          },
        });
      },
    });
  }
}

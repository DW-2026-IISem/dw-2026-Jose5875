import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Cliente, ClientePayload } from '../../../core/models/cliente.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { filterRows } from '../../../core/utils/filter-rows';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../shared/ui/status-tag/status-tag';
import { ClienteApi } from '../cliente-api';
import { ClienteForm } from '../cliente-form/cliente-form';

@Component({
  host: { class: 'block' },
  selector: 'app-cliente-list',
  imports: [
    ButtonModule,
    ClienteForm,
    DialogModule,
    EmptyState,
    InputTextModule,
    MessageModule,
    PageHeader,
    StatusTag,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './cliente-list.html',
  styleUrl: './cliente-list.css',
})
export class ClienteList {
  private readonly api = inject(ClienteApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<Cliente[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');

  readonly visibleRows = computed(() =>
    filterRows(this.rows(), this.filter(), (row) => [
      row.tipo_documento,
      row.numero_documento,
      row.nombre,
      row.telefono,
      row.email,
    ]),
  );

  readonly dialogVisible = signal(false);
  readonly editing = signal<Cliente | null>(null);
  readonly resetKey = signal(0);
  readonly title = computed(() => (this.editing() ? 'Editar cliente' : 'Nuevo cliente'));

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

  openEdit(cliente: Cliente): void {
    this.editing.set(cliente);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  save(payload: ClientePayload): void {
    const current = this.editing();
    this.saving.set(true);

    const request = current ? this.api.update(current.id, payload) : this.api.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(current ? 'Cliente actualizado' : 'Cliente creado');
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(error));
      },
    });
  }

  deactivate(cliente: Cliente): void {
    this.confirmation.confirm({
      header: 'Desactivar cliente',
      message: `¿Desactivar a ${cliente.nombre}? Ya no aparecerá en el listado de clientes activos.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.api.deactivate(cliente.id).subscribe({
          next: () => {
            this.notify.warn('Cliente desactivado');
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo desactivar', toApiMessage(error));
          },
        });
      },
    });
  }

  remove(cliente: Cliente): void {
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se eliminará permanentemente a ${cliente.nombre}. Esta acción no se puede deshacer.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.remove(cliente.id).subscribe({
          next: () => {
            this.notify.success('Cliente eliminado');
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo eliminar', toApiMessage(error));
          },
        });
      },
    });
  }
}

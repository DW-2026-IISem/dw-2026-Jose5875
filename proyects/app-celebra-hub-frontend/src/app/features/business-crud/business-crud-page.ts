import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import {
  BusinessCrudConfig,
  BusinessCrudField,
  BusinessRecord,
  BusinessValue,
} from '../../core/models/business-domain.model';
import { NotificationService } from '../../core/services/notification';
import { toApiMessage } from '../../core/utils/api-error';
import { filterRows } from '../../core/utils/filter-rows';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { StatusTag } from '../../shared/ui/status-tag/status-tag';
import { BusinessCrudApi } from './business-crud-api';
import { businessCrudConfigs } from './business-crud.config';

@Component({
  host: { class: 'block' },
  selector: 'app-business-crud-page',
  imports: [
    ButtonModule,
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
  templateUrl: './business-crud-page.html',
})
export class BusinessCrudPage {
  private readonly api = inject(BusinessCrudApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly config: BusinessCrudConfig;
  readonly rows = signal<BusinessRecord[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');
  readonly dialogVisible = signal(false);
  readonly editing = signal<BusinessRecord | null>(null);
  readonly values = signal<Record<string, BusinessValue>>({});

  readonly visibleRows = computed(() =>
    filterRows(this.rows(), this.filter(), (row) =>
      this.config.searchKeys.map((key) => String(row[key] ?? '')),
    ),
  );
  readonly title = computed(() =>
    this.editing() ? `Editar ${this.config.singular}` : `Nuevo ${this.config.singular}`,
  );

  constructor() {
    const configId = inject(ActivatedRoute).snapshot.data['crudId'];
    const config = typeof configId === 'string' ? businessCrudConfigs[configId] : undefined;
    if (!config) {
      throw new Error(`No existe la configuración CRUD "${String(configId)}".`);
    }

    this.config = config;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.list<BusinessRecord>(this.config.path, this.config.collectionKey).subscribe({
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
    if (event.target instanceof HTMLInputElement) {
      this.filter.set(event.target.value);
    }
  }

  openCreate(): void {
    this.editing.set(null);
    this.values.set(this.defaultValues());
    this.dialogVisible.set(true);
  }

  openEdit(row: BusinessRecord): void {
    this.editing.set(row);
    this.values.set(
      Object.fromEntries(
        this.config.fields.map((field) => [field.key, this.inputValue(field, row[field.key])]),
      ),
    );
    this.dialogVisible.set(true);
  }

  setField(field: BusinessCrudField, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }

    let value: BusinessValue;
    if (field.type === 'checkbox' && target instanceof HTMLInputElement) {
      value = target.checked;
    } else if (field.type === 'number' && target instanceof HTMLInputElement) {
      value = target.value === '' ? null : target.valueAsNumber;
    } else {
      value = target.value;
    }

    this.values.update((current) => ({ ...current, [field.key]: value }));
  }

  save(): void {
    const payload = this.toPayload();
    const current = this.editing();
    this.saving.set(true);

    const request = current
      ? this.api.update<BusinessRecord>(
          this.config.path,
          this.config.entityKey,
          current.id,
          payload,
        )
      : this.api.create<BusinessRecord>(this.config.path, this.config.entityKey, payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(
          current ? `${this.config.singular} actualizado` : `${this.config.singular} creado`,
        );
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(error));
      },
    });
  }

  deactivate(row: BusinessRecord): void {
    this.confirmation.confirm({
      header: `Desactivar ${this.config.singular}`,
      message: `¿Desactivar este registro de ${this.config.singular}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.api.deactivate(this.config.path, row.id).subscribe({
          next: () => {
            this.notify.warn(`${this.config.singular} desactivado`);
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo desactivar', toApiMessage(error));
          },
        });
      },
    });
  }

  remove(row: BusinessRecord): void {
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se eliminará permanentemente este registro de ${this.config.singular}. Esta acción no se puede deshacer.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.remove(this.config.path, row.id).subscribe({
          next: () => {
            this.notify.success(`${this.config.singular} eliminado`);
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo eliminar', toApiMessage(error));
          },
        });
      },
    });
  }

  displayValue(row: BusinessRecord, key: string, type = 'text'): string {
    const value = row[key];
    if (value === undefined || value === null || value === '') {
      return '—';
    }
    if (type === 'datetime') {
      const date = new Date(String(value));
      return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('es-CO');
    }
    return String(value);
  }

  statusSeverity(row: BusinessRecord, key: string): 'success' | 'danger' {
    return String(row[key] ?? '').trim().toLowerCase() === 'inactivo' ? 'danger' : 'success';
  }

  private defaultValues(): Record<string, BusinessValue> {
    return Object.fromEntries(
      this.config.fields.map((field) => [
        field.key,
        field.type === 'checkbox' ? true : field.type === 'number' ? null : '',
      ]),
    );
  }

  private inputValue(field: BusinessCrudField, value: BusinessValue): BusinessValue {
    if (field.type !== 'datetime' || value === null || value === undefined || value === '') {
      return value ?? (field.type === 'checkbox' ? false : '');
    }

    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const pad = (part: number) => String(part).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private toPayload(): Partial<BusinessRecord> {
    const current = this.values();
    return Object.fromEntries(
      this.config.fields.map((field) => {
        let value = current[field.key];
        if (typeof value === 'string') {
          value = value.trim();
        }
        if (field.type === 'datetime' && typeof value === 'string' && value) {
          value = new Date(value).toISOString();
        }
        return [field.key, value];
      }),
    );
  }
}

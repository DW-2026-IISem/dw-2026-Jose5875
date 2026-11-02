import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { Proveedor, ProveedorPayload } from '../../../core/models/proveedor.model';

@Component({
  host: { class: 'block' },
  selector: 'app-proveedor-form',
  imports: [ButtonModule, InputTextModule, MessageModule, ReactiveFormsModule, SelectModule],
  templateUrl: './proveedor-form.html',
  styleUrl: './proveedor-form.css',
})
export class ProveedorForm {
  readonly proveedor = input<Proveedor | null>(null);
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<ProveedorPayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly activeOptions = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ];

  readonly form = this.fb.group({
    nit: ['', [Validators.required, Validators.maxLength(50)]],
    razon_social: ['', [Validators.required, Validators.maxLength(150)]],
    contacto: ['', [Validators.required, Validators.maxLength(150)]],
    telefono: ['', [Validators.required, Validators.maxLength(30)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    is_active: [true],
  });

  constructor() {
    effect(() => {
      const current = this.proveedor();
      this.resetKey();

      this.form.reset({
        nit: current?.nit ?? '',
        razon_social: current?.razon_social ?? '',
        contacto: current?.contacto ?? '',
        telefono: current?.telefono ?? '',
        email: current?.email ?? '',
        is_active: current?.is_active ?? true,
      });

      if (current) {
        this.form.controls.is_active.disable();
      } else {
        this.form.controls.is_active.enable();
      }
    });
  }

  submit(): void {
    if (this.saving()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: ProveedorPayload = {
      nit: value.nit.trim(),
      razon_social: value.razon_social.trim(),
      contacto: value.contacto.trim(),
      telefono: value.telefono.trim(),
      email: value.email.trim(),
    };

    this.saved.emit(
      this.proveedor() ? payload : { ...payload, is_active: value.is_active },
    );
  }
}

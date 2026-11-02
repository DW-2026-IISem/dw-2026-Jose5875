import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { Cliente, ClientePayload } from '../../../core/models/cliente.model';

@Component({
  host: { class: 'block' },
  selector: 'app-cliente-form',
  imports: [ButtonModule, InputTextModule, MessageModule, ReactiveFormsModule, SelectModule],
  templateUrl: './cliente-form.html',
  styleUrl: './cliente-form.css',
})
export class ClienteForm {
  readonly cliente = input<Cliente | null>(null);
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<ClientePayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly documentTypes = [
    { label: 'Cédula de ciudadanía (CC)', value: 'CC' },
    { label: 'Cédula de extranjería (CE)', value: 'CE' },
    { label: 'Tarjeta de identidad (TI)', value: 'TI' },
    { label: 'NIT', value: 'NIT' },
  ];

  readonly form = this.fb.group({
    tipo_documento: ['CC', Validators.required],
    numero_documento: ['', [Validators.required, Validators.maxLength(30)]],
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    telefono: ['', [Validators.required, Validators.maxLength(30)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
  });

  constructor() {
    effect(() => {
      const current = this.cliente();
      this.resetKey();

      this.form.reset({
        tipo_documento: current?.tipo_documento ?? 'CC',
        numero_documento: current?.numero_documento ?? '',
        nombre: current?.nombre ?? '',
        telefono: current?.telefono ?? '',
        email: current?.email ?? '',
      });
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saved.emit({
      tipo_documento: value.tipo_documento,
      numero_documento: value.numero_documento.trim(),
      nombre: value.nombre.trim(),
      telefono: value.telefono.trim(),
      email: value.email.trim(),
    });
  }
}

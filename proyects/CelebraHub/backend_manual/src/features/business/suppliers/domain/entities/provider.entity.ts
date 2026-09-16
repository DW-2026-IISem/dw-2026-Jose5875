import { isValidNit } from '../validators/provider-nit.validator';
import { isValidEmail } from '../validators/provider-email.validator';

export interface ProviderProps {
  id?: number;
  nit: string;
  razonSocial: string;
  contacto: string;
  telefono: string;
  email: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Provider {
  id?: number;
  nit: string;
  razonSocial: string;
  contacto: string;
  telefono: string;
  email: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  private constructor(props: ProviderProps) {
    this.id = props.id;
    this.nit = props.nit;
    this.razonSocial = props.razonSocial;
    this.contacto = props.contacto;
    this.telefono = props.telefono;
    this.email = props.email;
    this.isActive = props.isActive ?? true;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    props: Omit<ProviderProps, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>,
  ): Provider {
    if (!props.nit?.trim()) {
      throw new Error('El NIT del proveedor es requerido');
    }

    if (!isValidNit(props.nit)) {
      throw new Error('El NIT del proveedor no es válido');
    }

    if (!props.razonSocial?.trim()) {
      throw new Error('La razón social del proveedor es requerida');
    }

    if (!props.contacto?.trim()) {
      throw new Error('El contacto del proveedor es requerido');
    }

    if (!props.telefono?.trim()) {
      throw new Error('El teléfono del proveedor es requerido');
    }

    if (!props.email?.trim()) {
      throw new Error('El email del proveedor es requerido');
    }

    if (!isValidEmail(props.email)) {
      throw new Error('El email del proveedor no es válido');
    }

    return new Provider(props);
  }

  static reconstitute(props: ProviderProps): Provider {
    return new Provider(props);
  }

  update(
    props: Partial<
      Omit<ProviderProps, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>
    >,
  ): void {
    if (props.nit !== undefined) {
      if (!props.nit.trim()) {
        throw new Error('El NIT del proveedor es requerido');
      }
      if (!isValidNit(props.nit)) {
        throw new Error('El NIT del proveedor no es válido');
      }
      this.nit = props.nit;
    }

    if (props.razonSocial !== undefined) {
      if (!props.razonSocial.trim()) {
        throw new Error('La razón social del proveedor es requerida');
      }
      this.razonSocial = props.razonSocial;
    }

    if (props.contacto !== undefined) {
      if (!props.contacto.trim()) {
        throw new Error('El contacto del proveedor es requerido');
      }
      this.contacto = props.contacto;
    }

    if (props.telefono !== undefined) {
      if (!props.telefono.trim()) {
        throw new Error('El teléfono del proveedor es requerido');
      }
      this.telefono = props.telefono;
    }

    if (props.email !== undefined) {
      if (!props.email.trim()) {
        throw new Error('El email del proveedor es requerido');
      }
      if (!isValidEmail(props.email)) {
        throw new Error('El email del proveedor no es válido');
      }
      this.email = props.email;
    }
  }

  deactivate(): void {
    this.isActive = false;
  }

  activate(): void {
    this.isActive = true;
  }
}

export interface VenueProps {
  id?: number;
  nombre: string;
  descripcion?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Venue {
  id?: number;
  nombre: string;
  descripcion?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  private constructor(props: VenueProps) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.descripcion = props.descripcion;
    this.isActive = props.isActive ?? true;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    props: Omit<VenueProps, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>,
  ): Venue {
    if (!props.nombre?.trim()) {
      throw new Error('El nombre del salón es requerido');
    }

    return new Venue(props);
  }

  static reconstitute(props: VenueProps): Venue {
    return new Venue(props);
  }

  update(
    props: Partial<
      Omit<VenueProps, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>
    >,
  ): void {
    if (props.nombre !== undefined) {
      if (!props.nombre.trim()) {
        throw new Error('El nombre del salón es requerido');
      }
      this.nombre = props.nombre;
    }

    if (props.descripcion !== undefined) {
      this.descripcion = props.descripcion;
    }
  }

  deactivate(): void {
    this.isActive = false;
  }

  activate(): void {
    this.isActive = true;
  }
}

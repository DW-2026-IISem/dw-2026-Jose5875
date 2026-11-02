export type BusinessValue = string | number | boolean | null | undefined;

export interface BusinessRecord extends Record<string, BusinessValue> {
  id: number;
}

export interface CatalogRecord extends BusinessRecord {
  nombre: string;
  descripcion?: string | null;
  is_active: boolean;
}

export interface Servicio extends CatalogRecord {}

export interface Salon extends CatalogRecord {}

export interface Reserva extends BusinessRecord {
  cliente_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  observaciones?: string | null;
}

export interface Contrato extends BusinessRecord {
  cliente_id: number;
  numero: string;
  fecha_inicio: string;
  fecha_fin: string;
  valor: number;
  estado: string;
}

export interface Pago extends BusinessRecord {
  referencia_tipo: string;
  referencia_id: number;
  metodo: string;
  monto: number;
  fecha: string;
  estado: string;
}

export interface CambioContrato extends CatalogRecord {}

export interface EventoServicio extends BusinessRecord {
  referencia_id: number;
  tipo: string;
  fecha: string;
  cantidad: number;
  observaciones?: string | null;
  estado: string;
}

export interface Cancelacion extends CatalogRecord {}

export interface Evento extends BusinessRecord {
  referencia_id: number;
  tipo: string;
  fecha: string;
  cantidad: number;
  observaciones: string;
  estado: string;
}

export type BusinessFieldType = 'text' | 'email' | 'number' | 'datetime' | 'textarea' | 'checkbox';

export interface BusinessCrudField {
  key: string;
  label: string;
  type: BusinessFieldType;
  required?: boolean;
  step?: string;
  placeholder?: string;
}

export interface BusinessCrudColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'datetime' | 'active' | 'status';
}

export interface BusinessCrudConfig {
  id: string;
  path: string;
  collectionKey: string | null;
  entityKey: string | null;
  title: string;
  singular: string;
  plural: string;
  description: string;
  icon: string;
  supportsDeactivate: boolean;
  fields: readonly BusinessCrudField[];
  columns: readonly BusinessCrudColumn[];
  searchKeys: readonly string[];
}

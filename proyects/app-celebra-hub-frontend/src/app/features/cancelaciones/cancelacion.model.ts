import { BusinessRecord } from '../../core/models/business-domain.model';

export interface Cancelacion extends BusinessRecord {
  nombre: string;
  descripcion: string;
  is_active: boolean;
}

export type CancelacionPayload = Pick<Cancelacion, 'nombre' | 'descripcion'> &
  Partial<Pick<Cancelacion, 'is_active'>>;

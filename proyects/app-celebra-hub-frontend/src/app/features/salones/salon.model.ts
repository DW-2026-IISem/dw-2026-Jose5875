import { BusinessRecord } from '../../core/models/business-domain.model';

export interface Salon extends BusinessRecord {
  nombre: string;
  descripcion?: string | null;
  is_active: boolean;
}

export type SalonPayload = Pick<Salon, 'nombre'> &
  Partial<Pick<Salon, 'descripcion' | 'is_active'>>;

import { BusinessRecord } from '../../core/models/business-domain.model';

export interface Servicio extends BusinessRecord {
  nombre: string;
  descripcion?: string | null;
  is_active: boolean;
}

export type ServicioPayload = Pick<Servicio, 'nombre'> & Partial<Pick<Servicio, 'descripcion'>>;

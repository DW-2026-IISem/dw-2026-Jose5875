import { BusinessRecord } from '../../core/models/business-domain.model';

export interface Reserva extends BusinessRecord {
  cliente_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  observaciones?: string | null;
}

export type ReservaPayload = Omit<Reserva, 'id'>;

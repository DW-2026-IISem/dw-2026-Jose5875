import { BusinessRecord } from '../../core/models/business-domain.model';

export interface EventoServicio extends BusinessRecord {
  referencia_id: number;
  tipo: string;
  fecha: string;
  cantidad: number;
  observaciones?: string | null;
  estado?: string;
}

export type EventoServicioPayload = Omit<EventoServicio, 'id'>;

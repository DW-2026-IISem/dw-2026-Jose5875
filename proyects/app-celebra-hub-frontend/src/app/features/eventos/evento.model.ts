import { BusinessRecord } from '../../core/models/business-domain.model';

export interface Evento extends BusinessRecord {
  referencia_id: number;
  tipo: string;
  fecha: string;
  cantidad: number;
  observaciones: string;
  estado: string;
}

export type EventoPayload = Omit<Evento, 'id'>;

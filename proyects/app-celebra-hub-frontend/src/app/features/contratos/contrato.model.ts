import { BusinessRecord } from '../../core/models/business-domain.model';

export interface Contrato extends BusinessRecord {
  cliente_id: number;
  numero: string;
  fecha_inicio: string;
  fecha_fin: string;
  valor: number;
  estado: string;
}

export type ContratoPayload = Omit<Contrato, 'id'>;

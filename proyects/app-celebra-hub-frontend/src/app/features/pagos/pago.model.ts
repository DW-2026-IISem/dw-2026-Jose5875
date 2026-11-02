import { BusinessRecord } from '../../core/models/business-domain.model';

export interface Pago extends BusinessRecord {
  referencia_tipo: string;
  referencia_id: number;
  metodo: string;
  monto: number;
  fecha: string;
  estado: string;
}

export type PagoPayload = Omit<Pago, 'id'>;

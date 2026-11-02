import { BusinessRecord } from '../../core/models/business-domain.model';

export interface CambioContrato extends BusinessRecord {
  nombre: string;
  descripcion: string;
  is_active: boolean;
}

export type CambioContratoPayload = Pick<CambioContrato, 'nombre' | 'descripcion'> &
  Partial<Pick<CambioContrato, 'is_active'>>;

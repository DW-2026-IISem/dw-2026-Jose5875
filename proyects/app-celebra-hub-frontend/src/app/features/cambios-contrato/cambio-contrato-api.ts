import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BusinessCrudApi } from '../business-crud/business-crud-api';
import { CambioContrato, CambioContratoPayload } from './cambio-contrato.model';

@Injectable()
export class CambioContratoApi extends BusinessCrudApi {
  listCambios(): Observable<CambioContrato[]> {
    return this.list<CambioContrato>('cambios-contrato', null);
  }

  getCambio(id: number): Observable<CambioContrato> {
    return this.get<CambioContrato>('cambios-contrato', null, id);
  }

  createCambio(payload: CambioContratoPayload): Observable<CambioContrato> {
    return this.create<CambioContrato>('cambios-contrato', null, payload);
  }

  updateCambio(id: number, payload: Partial<CambioContratoPayload>): Observable<CambioContrato> {
    return this.update<CambioContrato>('cambios-contrato', null, id, payload);
  }

  replaceCambio(id: number, payload: CambioContratoPayload): Observable<CambioContrato> {
    return this.replace<CambioContrato>('cambios-contrato', null, id, payload);
  }

  removeCambio(id: number): Observable<unknown> {
    return this.remove('cambios-contrato', id);
  }
}

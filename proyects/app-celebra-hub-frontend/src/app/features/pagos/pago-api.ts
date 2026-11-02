import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BusinessCrudApi } from '../business-crud/business-crud-api';
import { Pago, PagoPayload } from './pago.model';

@Injectable()
export class PagoApi extends BusinessCrudApi {
  listPagos(): Observable<Pago[]> {
    return this.list<Pago>('pagos', null);
  }

  getPago(id: number): Observable<Pago> {
    return this.get<Pago>('pagos', null, id);
  }

  createPago(payload: PagoPayload): Observable<Pago> {
    return this.create<Pago>('pagos', null, payload);
  }

  updatePago(id: number, payload: Partial<PagoPayload>): Observable<Pago> {
    return this.update<Pago>('pagos', null, id, payload);
  }

  replacePago(id: number, payload: PagoPayload): Observable<Pago> {
    return this.replace<Pago>('pagos', null, id, payload);
  }

  removePago(id: number): Observable<unknown> {
    return this.remove('pagos', id);
  }
}

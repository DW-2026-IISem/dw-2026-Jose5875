import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BusinessCrudApi } from '../business-crud/business-crud-api';
import { Cancelacion, CancelacionPayload } from './cancelacion.model';

@Injectable()
export class CancelacionApi extends BusinessCrudApi {
  listCancelaciones(): Observable<Cancelacion[]> {
    return this.list<Cancelacion>('cancelaciones', null);
  }

  getCancelacion(id: number): Observable<Cancelacion> {
    return this.get<Cancelacion>('cancelaciones', null, id);
  }

  createCancelacion(payload: CancelacionPayload): Observable<Cancelacion> {
    return this.create<Cancelacion>('cancelaciones', null, payload);
  }

  updateCancelacion(id: number, payload: Partial<CancelacionPayload>): Observable<Cancelacion> {
    return this.update<Cancelacion>('cancelaciones', null, id, payload);
  }

  replaceCancelacion(id: number, payload: CancelacionPayload): Observable<Cancelacion> {
    return this.replace<Cancelacion>('cancelaciones', null, id, payload);
  }

  removeCancelacion(id: number): Observable<unknown> {
    return this.remove('cancelaciones', id);
  }
}

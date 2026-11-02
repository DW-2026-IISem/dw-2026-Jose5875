import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BusinessCrudApi } from '../business-crud/business-crud-api';
import { Servicio, ServicioPayload } from './servicio.model';

@Injectable()
export class ServicioApi extends BusinessCrudApi {
  listServicios(): Observable<Servicio[]> {
    return this.list<Servicio>('servicios', 'servicios');
  }

  getServicio(id: number): Observable<Servicio> {
    return this.get<Servicio>('servicios', 'servicio', id);
  }

  createServicio(payload: ServicioPayload): Observable<Servicio> {
    return this.create<Servicio>('servicios', 'servicio', payload);
  }

  updateServicio(id: number, payload: Partial<ServicioPayload>): Observable<Servicio> {
    return this.update<Servicio>('servicios', 'servicio', id, payload);
  }

  replaceServicio(id: number, payload: ServicioPayload): Observable<Servicio> {
    return this.replace<Servicio>('servicios', 'servicio', id, payload);
  }

  deactivateServicio(id: number): Observable<unknown> {
    return this.deactivate('servicios', id);
  }

  removeServicio(id: number): Observable<unknown> {
    return this.remove('servicios', id);
  }
}

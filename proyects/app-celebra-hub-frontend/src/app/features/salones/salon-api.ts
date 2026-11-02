import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BusinessCrudApi } from '../business-crud/business-crud-api';
import { Salon, SalonPayload } from './salon.model';

@Injectable()
export class SalonApi extends BusinessCrudApi {
  listSalones(): Observable<Salon[]> {
    return this.list<Salon>('salones', 'salones');
  }

  getSalon(id: number): Observable<Salon> {
    return this.get<Salon>('salones', 'salon', id);
  }

  createSalon(payload: SalonPayload): Observable<Salon> {
    return this.create<Salon>('salones', 'salon', payload);
  }

  updateSalon(id: number, payload: Partial<SalonPayload>): Observable<Salon> {
    return this.update<Salon>('salones', 'salon', id, payload);
  }

  replaceSalon(id: number, payload: SalonPayload): Observable<Salon> {
    return this.replace<Salon>('salones', 'salon', id, payload);
  }

  deactivateSalon(id: number): Observable<unknown> {
    return this.deactivate('salones', id);
  }

  removeSalon(id: number): Observable<unknown> {
    return this.remove('salones', id);
  }
}

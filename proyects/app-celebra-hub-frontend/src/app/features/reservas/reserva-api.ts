import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BusinessCrudApi } from '../business-crud/business-crud-api';
import { Reserva, ReservaPayload } from './reserva.model';

@Injectable()
export class ReservaApi extends BusinessCrudApi {
  listReservas(): Observable<Reserva[]> {
    return this.list<Reserva>('reservas', 'reservas');
  }

  getReserva(id: number): Observable<Reserva> {
    return this.get<Reserva>('reservas', 'reserva', id);
  }

  createReserva(payload: ReservaPayload): Observable<Reserva> {
    return this.create<Reserva>('reservas', 'reserva', payload);
  }

  updateReserva(id: number, payload: Partial<ReservaPayload>): Observable<Reserva> {
    return this.update<Reserva>('reservas', 'reserva', id, payload);
  }

  replaceReserva(id: number, payload: ReservaPayload): Observable<Reserva> {
    return this.replace<Reserva>('reservas', 'reserva', id, payload);
  }

  removeReserva(id: number): Observable<unknown> {
    return this.remove('reservas', id);
  }
}

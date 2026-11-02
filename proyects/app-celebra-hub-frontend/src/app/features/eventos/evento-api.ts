import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BusinessCrudApi } from '../business-crud/business-crud-api';
import { Evento, EventoPayload } from './evento.model';

@Injectable()
export class EventoApi extends BusinessCrudApi {
  listEventos(): Observable<Evento[]> {
    return this.list<Evento>('eventos', null);
  }

  getEvento(id: number): Observable<Evento> {
    return this.get<Evento>('eventos', null, id);
  }

  createEvento(payload: EventoPayload): Observable<Evento> {
    return this.create<Evento>('eventos', null, payload);
  }

  updateEvento(id: number, payload: Partial<EventoPayload>): Observable<Evento> {
    return this.update<Evento>('eventos', null, id, payload);
  }

  replaceEvento(id: number, payload: EventoPayload): Observable<Evento> {
    return this.replace<Evento>('eventos', null, id, payload);
  }

  removeEvento(id: number): Observable<unknown> {
    return this.remove('eventos', id);
  }
}

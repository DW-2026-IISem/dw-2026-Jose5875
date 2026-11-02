import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BusinessCrudApi } from '../business-crud/business-crud-api';
import { EventoServicio, EventoServicioPayload } from './evento-servicio.model';

@Injectable()
export class EventoServicioApi extends BusinessCrudApi {
  listEventoServicios(): Observable<EventoServicio[]> {
    return this.list<EventoServicio>('evento-servicios', 'eventoServicios');
  }

  getEventoServicio(id: number): Observable<EventoServicio> {
    return this.get<EventoServicio>('evento-servicios', 'eventoServicio', id);
  }

  createEventoServicio(payload: EventoServicioPayload): Observable<EventoServicio> {
    return this.create<EventoServicio>('evento-servicios', 'eventoServicio', payload);
  }

  updateEventoServicio(
    id: number,
    payload: Partial<EventoServicioPayload>,
  ): Observable<EventoServicio> {
    return this.update<EventoServicio>('evento-servicios', 'eventoServicio', id, payload);
  }

  replaceEventoServicio(id: number, payload: EventoServicioPayload): Observable<EventoServicio> {
    return this.replace<EventoServicio>('evento-servicios', 'eventoServicio', id, payload);
  }

  deactivateEventoServicio(id: number): Observable<unknown> {
    return this.deactivate('evento-servicios', id);
  }

  removeEventoServicio(id: number): Observable<unknown> {
    return this.remove('evento-servicios', id);
  }
}

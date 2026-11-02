import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cliente, ClientePayload } from '../../core/models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/clientes`;

  list(): Observable<Cliente[]> {
    return this.http
      .get<{ clientes: Cliente[] }>(this.base)
      .pipe(map((response) => response.clientes));
  }

  get(id: number): Observable<Cliente> {
    return this.http
      .get<{ cliente: Cliente }>(`${this.base}/${id}`)
      .pipe(map((response) => response.cliente));
  }

  create(payload: ClientePayload): Observable<Cliente> {
    return this.http
      .post<{ cliente: Cliente }>(this.base, payload)
      .pipe(map((response) => response.cliente));
  }

  update(id: number, payload: Partial<ClientePayload>): Observable<Cliente> {
    return this.http
      .patch<{ cliente: Cliente }>(`${this.base}/${id}`, payload)
      .pipe(map((response) => response.cliente));
  }

  replace(id: number, payload: ClientePayload): Observable<Cliente> {
    return this.http
      .put<{ cliente: Cliente }>(`${this.base}/${id}`, payload)
      .pipe(map((response) => response.cliente));
  }

  deactivate(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Proveedor,
  ProveedorPayload,
  ProveedorUpdatePayload,
} from '../../core/models/proveedor.model';

@Injectable({ providedIn: 'root' })
export class ProveedorApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/proveedores`;

  list(): Observable<Proveedor[]> {
    return this.http
      .get<{ proveedores: Proveedor[] }>(this.base)
      .pipe(map((response) => response.proveedores));
  }

  get(id: number): Observable<Proveedor> {
    return this.http
      .get<{ proveedor: Proveedor }>(`${this.base}/${id}`)
      .pipe(map((response) => response.proveedor));
  }

  create(payload: ProveedorPayload): Observable<Proveedor> {
    return this.http
      .post<{ proveedor: Proveedor }>(this.base, payload)
      .pipe(map((response) => response.proveedor));
  }

  update(id: number, payload: Partial<ProveedorPayload>): Observable<Proveedor> {
    return this.http
      .patch<{ proveedor: Proveedor }>(`${this.base}/${id}`, payload)
      .pipe(map((response) => response.proveedor));
  }

  replace(id: number, payload: ProveedorUpdatePayload): Observable<Proveedor> {
    return this.http
      .put<{ proveedor: Proveedor }>(`${this.base}/${id}`, payload)
      .pipe(map((response) => response.proveedor));
  }

  deactivate(id: number): Observable<{ proveedor: Proveedor }> {
    return this.http.patch<{ proveedor: Proveedor }>(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }
}

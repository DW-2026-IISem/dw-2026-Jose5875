import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BusinessRecord } from '../../core/models/business-domain.model';

@Injectable({ providedIn: 'root' })
export class BusinessCrudApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  list<T extends BusinessRecord>(path: string, collectionKey: string | null): Observable<T[]> {
    return this.http
      .get<unknown>(`${this.base}/${path}`)
      .pipe(map((response) => this.readValue<T[]>(response, collectionKey, Array.isArray)));
  }

  get<T extends BusinessRecord>(path: string, entityKey: string | null, id: number): Observable<T> {
    return this.http
      .get<unknown>(`${this.base}/${path}/${id}`)
      .pipe(map((response) => this.readValue<T>(response, entityKey, this.isObject)));
  }

  create<T extends BusinessRecord>(
    path: string,
    entityKey: string | null,
    payload: Partial<T>,
  ): Observable<T> {
    return this.http
      .post<unknown>(`${this.base}/${path}`, payload)
      .pipe(map((response) => this.readValue<T>(response, entityKey, this.isObject)));
  }

  update<T extends BusinessRecord>(
    path: string,
    entityKey: string | null,
    id: number,
    payload: Partial<T>,
  ): Observable<T> {
    return this.http
      .patch<unknown>(`${this.base}/${path}/${id}`, payload)
      .pipe(map((response) => this.readValue<T>(response, entityKey, this.isObject)));
  }

  replace<T extends BusinessRecord>(
    path: string,
    entityKey: string | null,
    id: number,
    payload: Partial<T>,
  ): Observable<T> {
    return this.http
      .put<unknown>(`${this.base}/${path}/${id}`, payload)
      .pipe(map((response) => this.readValue<T>(response, entityKey, this.isObject)));
  }

  deactivate(path: string, id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/${path}/${id}/deactivate`, {});
  }

  remove(path: string, id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${path}/${id}`);
  }

  private readValue<T>(
    response: unknown,
    key: string | null,
    isExpected: (value: unknown) => boolean,
  ): T {
    const value = key === null ? response : this.isObject(response) ? response[key] : undefined;
    if (
      value === undefined ||
      (key !== null && (!this.isObject(response) || !(key in response))) ||
      !isExpected(value)
    ) {
      const expected = key === null ? 'un recurso válido' : `la propiedad "${key}"`;
      throw new Error(`La respuesta de la API no contiene ${expected}.`);
    }

    return value as T;
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}

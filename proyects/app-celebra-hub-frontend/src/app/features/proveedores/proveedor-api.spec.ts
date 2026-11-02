import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import {
  Proveedor,
  ProveedorPayload,
  ProveedorUpdatePayload,
} from '../../core/models/proveedor.model';
import { ProveedorApi } from './proveedor-api';

const PROVEEDOR: Proveedor = {
  id: 1,
  nit: '900123456-7',
  razon_social: 'Eventos y Suministros S.A.S.',
  contacto: 'María Pérez',
  telefono: '3011234567',
  email: 'maria@example.com',
  is_active: true,
};

const PAYLOAD: ProveedorPayload = {
  nit: PROVEEDOR.nit,
  razon_social: PROVEEDOR.razon_social,
  contacto: PROVEEDOR.contacto,
  telefono: PROVEEDOR.telefono,
  email: PROVEEDOR.email,
};

const UPDATE_PAYLOAD: ProveedorUpdatePayload = {
  ...PAYLOAD,
  is_active: true,
};

describe('ProveedorApi', () => {
  let api: ProveedorApi;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/proveedores`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    api = TestBed.inject(ProveedorApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('unwraps the proveedores collection from the list response', () => {
    let result: Proveedor[] | undefined;

    api.list().subscribe((proveedores) => (result = proveedores));

    const request = http.expectOne(base);
    expect(request.request.method).toBe('GET');
    request.flush({ proveedores: [PROVEEDOR] });

    expect(result).toEqual([PROVEEDOR]);
  });

  it('unwraps a single proveedor from the read response', () => {
    let result: Proveedor | undefined;

    api.get(PROVEEDOR.id).subscribe((proveedor) => (result = proveedor));

    const request = http.expectOne(`${base}/${PROVEEDOR.id}`);
    expect(request.request.method).toBe('GET');
    request.flush({ proveedor: PROVEEDOR });

    expect(result).toEqual(PROVEEDOR);
  });

  it('sends and unwraps create and partial update payloads', () => {
    let result: Proveedor | undefined;

    api.create(PAYLOAD).subscribe((proveedor) => (result = proveedor));
    const createRequest = http.expectOne(base);
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(PAYLOAD);
    createRequest.flush({ proveedor: PROVEEDOR });
    expect(result).toEqual(PROVEEDOR);

    api.update(PROVEEDOR.id, { contacto: 'María P.' }).subscribe((proveedor) => (result = proveedor));
    const updateRequest = http.expectOne(`${base}/${PROVEEDOR.id}`);
    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({ contacto: 'María P.' });
    updateRequest.flush({ proveedor: { ...PROVEEDOR, contacto: 'María P.' } });
    expect(result?.contacto).toBe('María P.');
  });

  it('uses PUT with a complete provider payload', () => {
    let result: Proveedor | undefined;

    api.replace(PROVEEDOR.id, UPDATE_PAYLOAD).subscribe((proveedor) => (result = proveedor));

    const request = http.expectOne(`${base}/${PROVEEDOR.id}`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(UPDATE_PAYLOAD);
    request.flush({ proveedor: PROVEEDOR });

    expect(result).toEqual(PROVEEDOR);
  });

  it('uses the documented deactivate and physical delete routes', () => {
    let deactivated: { proveedor: Proveedor } | undefined;
    let deleted: { message: string } | undefined;

    api.deactivate(PROVEEDOR.id).subscribe((response) => (deactivated = response));
    const deactivateRequest = http.expectOne(`${base}/${PROVEEDOR.id}/deactivate`);
    expect(deactivateRequest.request.method).toBe('PATCH');
    deactivateRequest.flush({ proveedor: { ...PROVEEDOR, is_active: false } });
    expect(deactivated?.proveedor.is_active).toBe(false);

    api.remove(PROVEEDOR.id).subscribe((response) => (deleted = response));
    const deleteRequest = http.expectOne(`${base}/${PROVEEDOR.id}`);
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush({ message: 'Proveedor eliminado correctamente' });
    expect(deleted).toEqual({ message: 'Proveedor eliminado correctamente' });
  });

  it('propagates HTTP errors without turning them into successful responses', () => {
    let receivedError: unknown;

    api.list().subscribe({ error: (error: unknown) => (receivedError = error) });
    const request = http.expectOne(base);
    request.flush({ error: 'No tienes permiso para realizar esta operación.' }, {
      status: 403,
      statusText: 'Forbidden',
    });

    expect(receivedError).toBeDefined();
  });
});

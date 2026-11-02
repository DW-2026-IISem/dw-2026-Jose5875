import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Cliente, ClientePayload } from '../../core/models/cliente.model';
import { ClienteApi } from './cliente-api';

const CLIENTE: Cliente = {
  id: 1,
  tipo_documento: 'CC',
  numero_documento: '1234567890',
  nombre: 'María Pérez',
  telefono: '3011234567',
  email: 'maria@example.com',
  is_active: true,
};

const PAYLOAD: ClientePayload = {
  tipo_documento: CLIENTE.tipo_documento,
  numero_documento: CLIENTE.numero_documento,
  nombre: CLIENTE.nombre,
  telefono: CLIENTE.telefono,
  email: CLIENTE.email,
};

describe('ClienteApi', () => {
  let api: ClienteApi;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/clientes`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    api = TestBed.inject(ClienteApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('unwraps the clientes collection from the backend response', () => {
    let result: Cliente[] | undefined;

    api.list().subscribe((clientes) => (result = clientes));

    const request = http.expectOne(base);
    expect(request.request.method).toBe('GET');
    request.flush({ clientes: [CLIENTE] });

    expect(result).toEqual([CLIENTE]);
  });

  it('uses the singular cliente response for reads and replacements', () => {
    let result: Cliente | undefined;

    api.get(CLIENTE.id).subscribe((cliente) => (result = cliente));
    const getRequest = http.expectOne(`${base}/${CLIENTE.id}`);
    expect(getRequest.request.method).toBe('GET');
    getRequest.flush({ cliente: CLIENTE });
    expect(result).toEqual(CLIENTE);

    api.replace(CLIENTE.id, PAYLOAD).subscribe((cliente) => (result = cliente));
    const replaceRequest = http.expectOne(`${base}/${CLIENTE.id}`);
    expect(replaceRequest.request.method).toBe('PUT');
    expect(replaceRequest.request.body).toEqual(PAYLOAD);
    replaceRequest.flush({ cliente: CLIENTE });
    expect(result).toEqual(CLIENTE);
  });

  it('unwraps singular cliente responses and sends the CelebraHub payload', () => {
    let result: Cliente | undefined;

    api.create(PAYLOAD).subscribe((cliente) => (result = cliente));

    const request = http.expectOne(base);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(PAYLOAD);
    request.flush({ cliente: CLIENTE });

    expect(result).toEqual(CLIENTE);
  });

  it('uses the supported client update and deactivation routes', () => {
    api.update(CLIENTE.id, { nombre: 'María P.' }).subscribe();
    const updateRequest = http.expectOne(`${base}/${CLIENTE.id}`);
    expect(updateRequest.request.method).toBe('PATCH');
    updateRequest.flush({ cliente: { ...CLIENTE, nombre: 'María P.' } });

    api.deactivate(CLIENTE.id).subscribe();
    const deactivateRequest = http.expectOne(`${base}/${CLIENTE.id}/deactivate`);
    expect(deactivateRequest.request.method).toBe('PATCH');
    deactivateRequest.flush({ message: 'Cliente desactivado correctamente', cliente: CLIENTE });

    api.remove(CLIENTE.id).subscribe();
    const deleteRequest = http.expectOne(`${base}/${CLIENTE.id}`);
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush({ message: 'Cliente eliminado permanentemente', id: CLIENTE.id });
  });
});

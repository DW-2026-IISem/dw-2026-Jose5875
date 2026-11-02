import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { BusinessRecord } from '../../core/models/business-domain.model';
import { BusinessCrudApi } from './business-crud-api';

const RECORD: BusinessRecord = { id: 8, nombre: 'Salón principal' };

describe('BusinessCrudApi', () => {
  let api: BusinessCrudApi;
  let http: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    api = TestBed.inject(BusinessCrudApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('unwraps the wrapped collection responses used by servicios and salones', () => {
    let result: BusinessRecord[] | undefined;

    api.list<BusinessRecord>('servicios', 'servicios').subscribe((records) => (result = records));
    const request = http.expectOne(`${base}/servicios`);
    expect(request.request.method).toBe('GET');
    request.flush({ servicios: [RECORD] });

    expect(result).toEqual([RECORD]);
  });

  it('accepts raw array responses from pagos and other unwrapped resources', () => {
    let result: BusinessRecord[] | undefined;

    api.list<BusinessRecord>('pagos', null).subscribe((records) => (result = records));
    const request = http.expectOne(`${base}/pagos`);
    request.flush([RECORD]);

    expect(result).toEqual([RECORD]);
  });

  it('uses the correct routes and unwraps raw resource writes', () => {
    let result: BusinessRecord | undefined;

    api.create<BusinessRecord>('pagos', null, { nombre: 'Pago' }).subscribe((record) => {
      result = record;
    });
    const createRequest = http.expectOne(`${base}/pagos`);
    expect(createRequest.request.method).toBe('POST');
    createRequest.flush(RECORD);
    expect(result).toEqual(RECORD);

    api
      .update<BusinessRecord>('pagos', null, RECORD.id, { nombre: 'Pago editado' })
      .subscribe((record) => (result = record));
    const updateRequest = http.expectOne(`${base}/pagos/${RECORD.id}`);
    expect(updateRequest.request.method).toBe('PATCH');
    updateRequest.flush({ ...RECORD, nombre: 'Pago editado' });
    expect(result?.['nombre']).toBe('Pago editado');
  });

  it('unwraps wrapped writes and calls deactivate and delete routes', () => {
    let result: BusinessRecord | undefined;

    api.get<BusinessRecord>('servicios', 'servicio', RECORD.id).subscribe((record) => {
      result = record;
    });
    const getRequest = http.expectOne(`${base}/servicios/${RECORD.id}`);
    expect(getRequest.request.method).toBe('GET');
    getRequest.flush({ servicio: RECORD });
    expect(result).toEqual(RECORD);

    api
      .create<BusinessRecord>('servicios', 'servicio', { nombre: 'Decoración' })
      .subscribe((record) => (result = record));
    const createRequest = http.expectOne(`${base}/servicios`);
    createRequest.flush({ servicio: RECORD });
    expect(result).toEqual(RECORD);

    api
      .replace<BusinessRecord>('servicios', 'servicio', RECORD.id, RECORD)
      .subscribe((record) => (result = record));
    const replaceRequest = http.expectOne(`${base}/servicios/${RECORD.id}`);
    expect(replaceRequest.request.method).toBe('PUT');
    replaceRequest.flush({ servicio: RECORD });
    expect(result).toEqual(RECORD);

    api.deactivate('servicios', RECORD.id).subscribe();
    const deactivateRequest = http.expectOne(`${base}/servicios/${RECORD.id}/deactivate`);
    expect(deactivateRequest.request.method).toBe('PATCH');
    deactivateRequest.flush({ message: 'Servicio desactivado' });

    api.remove('servicios', RECORD.id).subscribe();
    const deleteRequest = http.expectOne(`${base}/servicios/${RECORD.id}`);
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush({ message: 'Servicio eliminado' });
  });

  it('rejects malformed response envelopes instead of returning empty data', () => {
    let receivedError: unknown;

    api
      .list<BusinessRecord>('servicios', 'servicios')
      .subscribe({ error: (error: unknown) => (receivedError = error) });
    http.expectOne(`${base}/servicios`).flush({ items: [RECORD] });

    expect(receivedError).toBeInstanceOf(Error);
  });
});

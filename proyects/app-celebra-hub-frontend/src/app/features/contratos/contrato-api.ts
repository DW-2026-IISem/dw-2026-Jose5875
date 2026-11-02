import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BusinessCrudApi } from '../business-crud/business-crud-api';
import { Contrato, ContratoPayload } from './contrato.model';

@Injectable()
export class ContratoApi extends BusinessCrudApi {
  listContratos(): Observable<Contrato[]> {
    return this.list<Contrato>('contratos', 'contratos');
  }

  getContrato(id: number): Observable<Contrato> {
    return this.get<Contrato>('contratos', 'contrato', id);
  }

  createContrato(payload: ContratoPayload): Observable<Contrato> {
    return this.create<Contrato>('contratos', 'contrato', payload);
  }

  updateContrato(id: number, payload: Partial<ContratoPayload>): Observable<Contrato> {
    return this.update<Contrato>('contratos', 'contrato', id, payload);
  }

  replaceContrato(id: number, payload: ContratoPayload): Observable<Contrato> {
    return this.replace<Contrato>('contratos', 'contrato', id, payload);
  }

  removeContrato(id: number): Observable<unknown> {
    return this.remove('contratos', id);
  }
}

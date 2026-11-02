import { Component } from '@angular/core';
import { BusinessCrudApi } from '../../business-crud/business-crud-api';
import { BusinessCrudPage } from '../../business-crud/business-crud-page';
import { ContratoApi } from '../contrato-api';

@Component({
  host: { class: 'block' },
  selector: 'app-contrato-list',
  imports: [BusinessCrudPage],
  providers: [{ provide: BusinessCrudApi, useClass: ContratoApi }],
  templateUrl: './contrato-list.html',
})
export class ContratoList {}

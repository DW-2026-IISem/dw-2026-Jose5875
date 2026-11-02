import { Component } from '@angular/core';
import { BusinessCrudApi } from '../../business-crud/business-crud-api';
import { BusinessCrudPage } from '../../business-crud/business-crud-page';
import { CambioContratoApi } from '../cambio-contrato-api';

@Component({
  host: { class: 'block' },
  selector: 'app-cambio-contrato-list',
  imports: [BusinessCrudPage],
  providers: [{ provide: BusinessCrudApi, useClass: CambioContratoApi }],
  templateUrl: './cambio-contrato-list.html',
})
export class CambioContratoList {}

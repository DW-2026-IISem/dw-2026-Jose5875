import { Component } from '@angular/core';
import { BusinessCrudApi } from '../../business-crud/business-crud-api';
import { BusinessCrudPage } from '../../business-crud/business-crud-page';
import { PagoApi } from '../pago-api';

@Component({
  host: { class: 'block' },
  selector: 'app-pago-list',
  imports: [BusinessCrudPage],
  providers: [{ provide: BusinessCrudApi, useClass: PagoApi }],
  templateUrl: './pago-list.html',
})
export class PagoList {}

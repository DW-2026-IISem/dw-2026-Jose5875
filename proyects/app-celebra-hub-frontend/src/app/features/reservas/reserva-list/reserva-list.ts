import { Component } from '@angular/core';
import { BusinessCrudApi } from '../../business-crud/business-crud-api';
import { BusinessCrudPage } from '../../business-crud/business-crud-page';
import { ReservaApi } from '../reserva-api';

@Component({
  host: { class: 'block' },
  selector: 'app-reserva-list',
  imports: [BusinessCrudPage],
  providers: [{ provide: BusinessCrudApi, useClass: ReservaApi }],
  templateUrl: './reserva-list.html',
})
export class ReservaList {}

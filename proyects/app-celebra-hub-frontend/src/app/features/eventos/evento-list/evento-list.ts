import { Component } from '@angular/core';
import { BusinessCrudApi } from '../../business-crud/business-crud-api';
import { BusinessCrudPage } from '../../business-crud/business-crud-page';
import { EventoApi } from '../evento-api';

@Component({
  host: { class: 'block' },
  selector: 'app-evento-list',
  imports: [BusinessCrudPage],
  providers: [{ provide: BusinessCrudApi, useClass: EventoApi }],
  templateUrl: './evento-list.html',
})
export class EventoList {}

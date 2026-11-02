import { Component } from '@angular/core';
import { BusinessCrudApi } from '../../business-crud/business-crud-api';
import { BusinessCrudPage } from '../../business-crud/business-crud-page';
import { EventoServicioApi } from '../evento-servicio-api';

@Component({
  host: { class: 'block' },
  selector: 'app-evento-servicio-list',
  imports: [BusinessCrudPage],
  providers: [{ provide: BusinessCrudApi, useClass: EventoServicioApi }],
  templateUrl: './evento-servicio-list.html',
})
export class EventoServicioList {}

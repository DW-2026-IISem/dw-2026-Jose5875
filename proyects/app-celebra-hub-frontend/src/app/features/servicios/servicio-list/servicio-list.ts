import { Component } from '@angular/core';
import { BusinessCrudApi } from '../../business-crud/business-crud-api';
import { BusinessCrudPage } from '../../business-crud/business-crud-page';
import { ServicioApi } from '../servicio-api';

@Component({
  host: { class: 'block' },
  selector: 'app-servicio-list',
  imports: [BusinessCrudPage],
  providers: [{ provide: BusinessCrudApi, useClass: ServicioApi }],
  templateUrl: './servicio-list.html',
})
export class ServicioList {}

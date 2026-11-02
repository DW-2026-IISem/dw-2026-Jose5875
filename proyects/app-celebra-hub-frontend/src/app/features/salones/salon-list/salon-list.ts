import { Component } from '@angular/core';
import { BusinessCrudApi } from '../../business-crud/business-crud-api';
import { BusinessCrudPage } from '../../business-crud/business-crud-page';
import { SalonApi } from '../salon-api';

@Component({
  host: { class: 'block' },
  selector: 'app-salon-list',
  imports: [BusinessCrudPage],
  providers: [{ provide: BusinessCrudApi, useClass: SalonApi }],
  templateUrl: './salon-list.html',
})
export class SalonList {}

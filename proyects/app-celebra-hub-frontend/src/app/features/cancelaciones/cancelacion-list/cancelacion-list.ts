import { Component } from '@angular/core';
import { BusinessCrudApi } from '../../business-crud/business-crud-api';
import { BusinessCrudPage } from '../../business-crud/business-crud-page';
import { CancelacionApi } from '../cancelacion-api';

@Component({
  host: { class: 'block' },
  selector: 'app-cancelacion-list',
  imports: [BusinessCrudPage],
  providers: [{ provide: BusinessCrudApi, useClass: CancelacionApi }],
  templateUrl: './cancelacion-list.html',
})
export class CancelacionList {}

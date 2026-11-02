import { Component, input } from '@angular/core';

@Component({
  host: { class: 'block' },
  selector: 'app-page-header',
  styleUrl: './page-header.css',
  templateUrl: './page-header.html',
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input('');
}

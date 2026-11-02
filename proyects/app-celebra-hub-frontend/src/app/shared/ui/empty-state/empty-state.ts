import { Component, input } from '@angular/core';

@Component({
  host: { class: 'block' },
  selector: 'app-empty-state',
  styleUrl: './empty-state.css',
  templateUrl: './empty-state.html',
})
export class EmptyState {
  readonly icon = input('pi pi-inbox');
  readonly title = input('Sin registros');
  readonly message = input('Todavía no hay datos para mostrar.');
}

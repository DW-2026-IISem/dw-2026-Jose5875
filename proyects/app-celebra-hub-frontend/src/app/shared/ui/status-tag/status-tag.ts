import { Component, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';

@Component({
  host: { class: 'inline-block' },
  selector: 'app-status-tag',
  imports: [TagModule],
  styleUrl: './status-tag.css',
  templateUrl: './status-tag.html',
})
export class StatusTag {
  readonly isActive = input.required<boolean>();
  readonly label = computed(() => (this.isActive() ? 'Activo' : 'Inactivo'));
  readonly severity = computed<'success' | 'danger'>(() =>
    this.isActive() ? 'success' : 'danger',
  );
}

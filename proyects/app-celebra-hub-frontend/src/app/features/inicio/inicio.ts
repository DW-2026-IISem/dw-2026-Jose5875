

import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { PageHeader } from '../../shared/ui/page-header/page-header';

/**
 * Pantalla inicial de CelebraHub. El layout persistente vive en Shell.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-inicio',
  imports: [CardModule, PageHeader],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {}
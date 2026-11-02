import { TestBed } from '@angular/core/testing';
import { PageHeader } from './page-header';

describe('PageHeader', () => {
  it('should render its required title and optional subtitle', async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeader],
    }).compileComponents();

    const fixture = TestBed.createComponent(PageHeader);
    fixture.componentRef.setInput('title', 'Clientes');
    fixture.componentRef.setInput('subtitle', 'Gestión de clientes');
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Clientes');
    expect(compiled.textContent).toContain('Gestión de clientes');
  });
});

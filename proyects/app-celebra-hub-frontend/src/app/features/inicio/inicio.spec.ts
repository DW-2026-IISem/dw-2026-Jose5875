import { TestBed } from '@angular/core/testing';
import { Inicio } from './inicio';

describe('Inicio', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inicio],
    }).compileComponents();
  });

  it('should render the CelebraHub welcome content without duplicating the shell', async () => {
    const fixture = TestBed.createComponent(Inicio);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-page-header h1')?.textContent).toContain('Inicio');
    expect(compiled.textContent).toContain('Bienvenido a CelebraHub');
    expect(compiled.querySelector('app-header')).toBeNull();
    expect(compiled.querySelector('app-aside')).toBeNull();
    expect(compiled.querySelector('app-footer')).toBeNull();
  });
});

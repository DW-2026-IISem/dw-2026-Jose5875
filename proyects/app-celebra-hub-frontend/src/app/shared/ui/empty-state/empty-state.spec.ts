import { TestBed } from '@angular/core/testing';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('should render default empty-state text', async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyState],
    }).compileComponents();

    const fixture = TestBed.createComponent(EmptyState);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Sin registros');
    expect(compiled.textContent).toContain('Todavía no hay datos para mostrar.');
  });
});

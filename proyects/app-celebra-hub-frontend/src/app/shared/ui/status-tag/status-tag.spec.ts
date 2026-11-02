import { TestBed } from '@angular/core/testing';
import { StatusTag } from './status-tag';

describe('StatusTag', () => {
  it('should derive active and inactive labels and severity', async () => {
    await TestBed.configureTestingModule({
      imports: [StatusTag],
    }).compileComponents();

    const fixture = TestBed.createComponent(StatusTag);
    fixture.componentRef.setInput('isActive', true);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.label()).toBe('Activo');
    expect(fixture.componentInstance.severity()).toBe('success');
    expect(fixture.nativeElement.textContent).toContain('Activo');
    expect(fixture.nativeElement.querySelector('p-tag')?.classList).toContain(
      'p-tag-success',
    );

    fixture.componentRef.setInput('isActive', false);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.label()).toBe('Inactivo');
    expect(fixture.componentInstance.severity()).toBe('danger');
    expect(fixture.nativeElement.textContent).toContain('Inactivo');
    expect(fixture.nativeElement.querySelector('p-tag')?.classList).toContain(
      'p-tag-danger',
    );
  });
});

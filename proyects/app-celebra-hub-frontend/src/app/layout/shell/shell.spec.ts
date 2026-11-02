import { TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';
import { provideRouter } from '@angular/router';
import { Shell } from './shell';

function stubDesktopMedia(matches: boolean): () => void {
  const original = window.matchMedia;

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) =>
      ({
        matches,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) satisfies MediaQueryList,
  });

  return () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: original,
    });
  };
}

describe('Shell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([]),
        MessageService,
        ConfirmationService,
      ],
    }).compileComponents();
  });

  async function createShell() {
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    return { fixture, compiled: fixture.nativeElement as HTMLElement };
  }

  it('should compose the layout and outlet once', async () => {
    const { compiled } = await createShell();

    expect(compiled.querySelectorAll('app-header')).toHaveLength(1);
    expect(compiled.querySelectorAll('aside app-aside')).toHaveLength(1);
    expect(compiled.querySelector('main#contenido router-outlet')).toBeTruthy();
    expect(compiled.querySelectorAll('app-footer')).toHaveLength(1);
    expect(compiled.querySelectorAll('p-toast')).toHaveLength(1);
    expect(compiled.querySelectorAll('p-confirmdialog')).toHaveLength(1);
  });

  it('should open the mobile drawer from the header button', async () => {
    const { fixture, compiled } = await createShell();
    const button = compiled.querySelector(
      'app-header button[aria-label="Mostrar u ocultar el menú"]',
    ) as HTMLButtonElement;

    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.mobileOpen()).toBe(true);
  });

  it('should toggle the desktop sidebar without opening the drawer', async () => {
    const restoreMedia = stubDesktopMedia(true);

    try {
      const { fixture, compiled } = await createShell();
      const button = compiled.querySelector(
        'app-header button[aria-label="Mostrar u ocultar el menú"]',
      ) as HTMLButtonElement;

      button.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.componentInstance.sidebarCollapsed()).toBe(true);
      expect(compiled.querySelector('aside')).toBeNull();
      expect(fixture.componentInstance.mobileOpen()).toBe(false);
    } finally {
      restoreMedia();
    }
  });
});

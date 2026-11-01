import { TestBed } from '@angular/core/testing';
import { Inicio } from './inicio';

/**
 * jsdom no implementa `matchMedia`, así que `watchMediaQuery` devuelve `false`
 * y el componente se comporta como móvil. El caso de escritorio se prueba aquí
 * sustituyendo la función antes de crear el componente.
 */
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

describe('Inicio', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inicio],
    }).compileComponents();
  });

  async function crearPantalla() {
    const fixture = TestBed.createComponent(Inicio);
    await fixture.whenStable();
    return { fixture, compilado: fixture.nativeElement as HTMLElement };
  }

  function botonMenu(compilado: HTMLElement): HTMLButtonElement {
    const boton = compilado.querySelector(
      'app-header button[aria-label="Mostrar u ocultar el menú"]',
    );
    expect(boton).toBeTruthy();
    return boton as HTMLButtonElement;
  }

  function opcionDelMenu(compilado: HTMLElement, etiqueta: string): HTMLElement {
    const opcion = [...compilado.querySelectorAll('a, button')].find(
      (elemento) => elemento.textContent?.trim() === etiqueta,
    );
    expect(opcion).toBeTruthy();
    return opcion as HTMLElement;
  }

  it('should compose the layout and start on Inicio', async () => {
    const { compilado } = await crearPantalla();

    expect(compilado.querySelector('app-header')).toBeTruthy();
    expect(compilado.querySelector('aside app-aside')).toBeTruthy();
    expect(compilado.querySelector('app-footer')).toBeTruthy();
    expect(compilado.querySelector('main h1')?.textContent).toContain('Inicio');
  });

  it('should render backend entity options in their menu groups', async () => {
    const { fixture, compilado } = await crearPantalla();

    for (const etiqueta of ['Inicio', 'Gestión de eventos', 'Administración']) {
      expect(compilado.textContent).toContain(etiqueta);
    }

    opcionDelMenu(compilado, 'Gestión de eventos').click();
    fixture.detectChanges();
    await fixture.whenStable();
    for (const etiqueta of [
      'Clientes',
      'Servicios',
      'Salones',
      'Reservas',
      'Proveedores',
      'Contratos',
      'Cambios de contrato',
      'Pagos',
      'Cancelaciones',
      'Servicios de evento',
      'Eventos',
    ]) {
      expect(compilado.textContent).toContain(etiqueta);
    }

    opcionDelMenu(compilado, 'Administración').click();
    fixture.detectChanges();
    await fixture.whenStable();
    for (const etiqueta of [
      'Usuarios',
      'Roles',
      'Recursos',
      'Asignaciones de rol',
      'Concesiones de rol',
      'Sesiones',
    ]) {
      expect(compilado.textContent).toContain(etiqueta);
    }
  });

  it('should always show the menu button, not only on small screens', async () => {
    const { compilado } = await crearPantalla();

    expect(botonMenu(compilado).classList.contains('lg:hidden')).toBe(false);
  });

  it('should change the title without navigating when an option is chosen', async () => {
    const { fixture, compilado } = await crearPantalla();

    opcionDelMenu(compilado, 'Gestión de eventos').click();
    fixture.detectChanges();
    await fixture.whenStable();
    opcionDelMenu(compilado, 'Clientes').click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compilado.querySelector('main h1')?.textContent).toContain('Clientes');
    expect(compilado.querySelector('app-inicio, main')).toBeTruthy();
  });

  it('should open the mobile drawer when the header requests it', async () => {
    const { fixture, compilado } = await crearPantalla();

    expect(fixture.componentInstance.mobileOpen()).toBe(false);

    botonMenu(compilado).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.mobileOpen()).toBe(true);
  });

  it('should hide the fixed aside on desktop instead of opening the drawer', async () => {
    const restaurar = stubDesktopMedia(true);

    try {
      const { fixture, compilado } = await crearPantalla();
      expect(compilado.querySelector('aside app-aside')).toBeTruthy();

      botonMenu(compilado).click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.componentInstance.sidebarCollapsed()).toBe(true);
      expect(compilado.querySelector('aside')).toBeNull();
      expect(fixture.componentInstance.mobileOpen()).toBe(false);
    } finally {
      restaurar();
    }
  });

  it('should close the drawer after choosing an option', async () => {
    const { fixture, compilado } = await crearPantalla();

    botonMenu(compilado).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.mobileOpen()).toBe(true);

    opcionDelMenu(compilado, 'Gestión de eventos').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.mobileOpen()).toBe(true);

    opcionDelMenu(compilado, 'Eventos').click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.mobileOpen()).toBe(false);
    expect(compilado.querySelector('main h1')?.textContent).toContain('Eventos');
  });
});

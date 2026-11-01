## Bitacora manual de creación del fronted usando express  
## ISS-00 · Requisitos previos

``` bash
node -v
npm -v
npx @angular/cli@22 version
```

---------------------------------------------------------------------------------------------

## 0.2 Backend en marcha

``` bash
cd ~/ia-lab/dw2026-2/dw-2026-Jose5875/proyects/app-celebra-hub$
npm install
npm run db:seed
npm run dev
```

---------------------------------------------------------------------------------------------

## 0.3 Login y permisos

``` bash
# 1. Login (OPEN)
curl -s -X POST http://localhost:4000/api/sesion/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"Admin123!"}'
```

Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-21 105140.png">
</p>


---------------------------------------------------------------------------------------------

## 0.4 Login y permisos

``` bash
# 1. Login (OPEN)
curl -s -X POST http://localhost:4000/api/sesion/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"Admin123!"}'
```
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-21 105140.png">
</p>

``` bash
# 2. Perfil (JWT)
curl -s http://localhost:4000/api/sesion/perfil \
  -H "Authorization: Bearer $TOKEN"
``` 
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-21 110455.png">
</p>

``` bash
# 3. Permisos efectivos (JWT)
curl -s http://localhost:4000/api/permisos \
  -H "Authorization: Bearer $TOKEN"
``` 
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-21 110608.png">
</p>





---------------------------------------------------------------------------------------------
## 0.3 Login y permisos

``` bash
# 1. Login (OPEN)
curl -s -X POST http://localhost:4000/api/sesion/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"Admin123!"}'
```

Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-21 105140.png">
</p>


---------------------------------------------------------------------------------------------

## ISS-01 · Bootstrap Angular 22 con CLI, Tailwind y PrimeNG

## 1.1 Crear el proyecto en la carpeta actual

``` bash

new frontend-celebra-hub \
  --style=tailwind \
  --ssr=false \
  --routing \
  --zoneless \
  --skip-git \ 
  --package-manager=npm
```

Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-28 100724.png">
</p>


---------------------------------------------------------------------------------------------

---------------------------------------------------------------------------------------------

## ISS-01 · Bootstrap Angular 22 con CLI, Tailwind y PrimeNG

## 1.2 Instalar PrimeNG compatible con Angular 

``` bash
ng version
npm view primeng version peerDependencies --json
npm install primeng @primeuix/themes primeicons @angular/cdk
```

Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-28 101643.png">
</p>

## vereifcamos las versiones.
``` bash
npm ls primeng @primeuix/themes primeicons @angular/cdk --depth=0
```
Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-28 101902.png">
</p>

---------------------------------------------------------------------------------------------


---------------------------------------------------------------------------------------------

## ISS-01 · Bootstrap Angular 22 con CLI, Tailwind y PrimeNG

## 1.3 Estilos globales

``` bash
cat > src/styles.css <<'EOF'
@layer theme, base, primeng, utilities;
@import 'tailwindcss';
@import 'primeicons/primeicons.css';
EOF
```

Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-28 102112.png">
</p>


---------------------------------------------------------------------------------------------

---------------------------------------------------------------------------------------------

## ISS-01 · Bootstrap Angular 22 con CLI, Tailwind y PrimeNG

## 1.4 Configurar PrimeNG en app.config.ts

``` bash
cat > src/app/app.config.ts <<'EOF'
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),

    // PrimeNG 22: tema Aura. El modo oscuro se activa con la clase .app-dark.
    providePrimeNG({
      license: environment.primeUiLicense || undefined,
      ripple: true,
      inputVariant: 'outlined',
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.app-dark',
          cssLayer: { name: 'primeng', order: 'theme, base, primeng, utilities' },
        },
      },
    }),

    MessageService,
    ConfirmationService,
  ],
};
EOF
```

Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-28 102349.png">
</p>

## 1.4.1 Licencia de PrimeNG 22

---------------------------------------------------------------------------------------------

---------------------------------------------------------------------------------------------

## ISS-01 · Bootstrap Angular 22 con CLI, Tailwind y PrimeNG

## 1.5 Pantalla de arranque: App compone el componente demo/ejemplo

## src/app/app.ts
``` bash
cat > src/app/app.ts <<'EOF'
import { Component } from '@angular/core';
import { Ejemplo } from './demo/ejemplo/ejemplo';

/**
 * Componente principal (`<app-root>`).
 *
 * Es el primero que Angular dibuja. En ISS-01 solo compone el componente de
 * ejemplo, para que se vea en pantalla con una etiqueta. Las rutas llegan en
 * ISS-01B, cuando existe una pantalla de negocio que mostrar.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-root',
  imports: [Ejemplo],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
EOF
```

Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-28 105652.png">
</p>

## src/app/app.html
``` bash
cat > src/app/app.html <<'EOF'
<!-- Marco de la aplicación: fondo, ancho máximo y padding con utilidades Tailwind. -->
<main class="min-h-dvh bg-slate-50 p-6 text-slate-900">
  <div class="mx-auto w-full max-w-4xl">
    <!-- Composición: una etiqueta en la plantilla pinta el componente Ejemplo. -->
    <app-ejemplo />
  </div>
</main>
EOF
```
Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-28 105718.png">
</p>

## src/app/app.routes.ts
``` bash
cat > src/app/app.routes.ts <<'EOF'
import { Routes } from '@angular/router';

/**
 * Rutas de la aplicación.
 *
 * Vacío a propósito: en ISS-01 la pantalla se compone con etiquetas en `app.html`
 * (`<app-ejemplo />`). El router se presenta en ISS-01B, con una pantalla real.
 */
export const routes: Routes = [];
EOF
```
Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-28 105747.png">
</p>

## src/app/app.css
``` bash
cat > src/app/app.css <<'EOF'
/*
 * Estilos propios del componente App.
 *
 * Queda VACÍO a propósito: el aspecto se resuelve con utilidades Tailwind en el
 * HTML y con el tema Aura de PrimeNG (PATRON-VISUAL). Angular mantiene el archivo
 * porque `styleUrl` lo referencia y solo afecta a `<app-root>`.
 */
EOF
```
Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-28 105823.png">
</p>

---------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------

## ISS-01 · Bootstrap Angular 22 con CLI, Tailwind y PrimeNG

## 1.6 Personalizar index.html

``` bash
cat > src/index.html <<'EOF'
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>CelebraHub Express II · Angular 22</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Frontend Angular 22 con Signals, PrimeNG y Tailwind para StoreLab Express.">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body class="m-0 bg-slate-100 font-sans text-slate-900">
  <app-root></app-root>
</body>
</html>
EOF
```

Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-28 110109.png">
</p>

---------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------

## ISS-01 · Bootstrap Angular 22 con CLI, Tailwind y PrimeNG

## 1.7 Ajustar el presupuesto de build

``` bash
{
  "type": "initial",
  "maximumWarning": "750kB",
  "maximumError": "1MB"
}
```

Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-28 111249.png">
</p>

---------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------

## ISS-01 · Bootstrap Angular 22 con CLI, Tailwind y PrimeNG

## 1.8 Primera ejecución

``` bash
npm start
```

Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-28 113602.png">
</p>

Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-28 113437.png">
</p>

---------------------------------------------------------------------------------------------

## ISS-01 · Bootstrap Angular 22 con CLI, Tailwind y PrimeNG

## 1.9.3 Leer ejemplo.ts línea a línea
```  bash

// 1. Se importan solo las piezas que se usan.
import { Component, computed, effect, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';

// 2. El objeto que se muestra y se modifica.
export interface Producto {
  nombre: string;
  precio: number;
  activo: boolean;
}

// 3. @Component describe CÓMO se pinta la clase.
@Component({
  host: { class: 'block' },              // <app-ejemplo> se comporta como bloque
  selector: 'app-ejemplo',               // se usa como <app-ejemplo></app-ejemplo>
  imports: [ButtonModule, CardModule, InputTextModule, MessageModule, TagModule],
  templateUrl: './ejemplo.html',
  styleUrl: './ejemplo.css',
})
export class Ejemplo {
  // 4. ESTADO: el signal guarda un objeto completo.
  protected readonly producto = signal<Producto>(productoInicial());

  // 5. DERIVADOS: se calculan desde `producto()`, nunca se asignan.
  protected readonly precioFinal = computed(() =>
    Math.round(this.producto().precio * 1.19),
  );
  protected readonly estadoTexto = computed(() =>
    this.producto().activo ? 'Activo' : 'Inactivo',
  );

  // 6. EFECTO: se ejecuta al crear y en cada cambio del objeto.
  private readonly registro = effect(() => {
    const { nombre, precio, activo } = this.producto();
    console.log(`[ejemplo] ${nombre} · precio ${precio} · ${activo ? 'activo' : 'inactivo'}`);
  });

  // 7. Métodos que la plantilla llama desde los eventos.
  protected cambiarNombre(event: Event): void {
    const nombre = (event.target as HTMLInputElement).value;
    this.producto.update((actual) => ({ ...actual, nombre }));
  }

  protected variarPrecio(delta: number): void {
    this.producto.update((actual) => ({
      ...actual,
      precio: Math.max(0, actual.precio + delta),
    }));
  }

  protected alternarEstado(): void {
    this.producto.update((actual) => ({ ...actual, activo: !actual.activo }));
  }

  protected reiniciar(): void {
    this.producto.set(productoInicial());
  }
}
```
``` bash
La función auxiliar evita compartir el mismo objeto entre el estado inicial y el reinicio:


function productoInicial(): Producto {
  return { nombre: 'Café molido 500 g', precio: 18000, activo: true };
}
```
``` bash
Las piezas de la plantilla que producen lo que se ve:


<!-- 1. Interpolación: muestra un campo del objeto. -->
<p class="text-2xl font-bold text-slate-900">{{ producto().precio }}</p>

<!-- 2. Property binding + event binding sobre un campo editable. -->
<input pInputText [value]="producto().nombre" (input)="cambiarNombre($event)" />

<!-- 3. Event binding con argumento: el botón llama al método con 1000. -->
<button pButton type="button" (click)="variarPrecio(1000)">
  <span pButtonLabel>+1000</span>
</button>

<!-- 4. Property binding booleano: el tag cambia de color según `activo`. -->
<p-tag [value]="estadoTexto()" [severity]="producto().activo ? 'success' : 'danger'"
```
---------------------------------------------------------------------------------------------

## 1.9.4 Las cuatro formas de conectar la clase con el HTML
``` bash

Forma	Sintaxis	Dirección	Ejemplo en demo/ejemplo
Interpolación	{{ expresion }}	TS → HTML (texto)	<p>{{ producto().precio }}</p>
Property binding	[propiedad]="expresion"	TS → HTML (atributo/propiedad)	[value]="producto().nombre"
Event binding	(evento)="metodo()"	HTML → TS	(click)="variarPrecio(1000)"
Two-way binding	[(ngModel)]="campo"	ambos sentidos (formularios)	no se usa aquí: el campo usa [value] + (input)
[(ngModel)] requiere FormsModule y se usa en formularios sencillos. En este curso los formularios de negocio usan Reactive Forms (FormGroup y formControlName), que se presentan en ISS-03. El ejemplo escribe el binding a mano ([value] + (input)) para que se vea de dónde sale el valor nuevo.

Y el flujo de control moderno, que reemplaza a *ngIf y *ngFor. El ejemplo lo usa para elegir el mensaje según el estado del producto:


@if (producto().activo) {
  <p-message severity="success" variant="simple">
    Producto activo: la API lo devolvería en <code>GET /api/productos</code>.
  </p-message>
} @else {
  <p-message severity="warn" variant="simple">
    Producto inactivo: el borrado lógico lo oculta de las listas.
  </p-message>
}

<!-- El mismo bloque aplica a una lista del negocio. -->
@if (clients().length === 0) {
  <p>No hay clientes activos.</p>
} @else {
  <ul>
    @for (client of clients(); track client.id) {
      <li>{{ client.name }}</li>
    }
  </ul>
}
```
## 1.9.5 Signals: el estado que avisa a la vista
```bash
Dónde está en Ejemplo. El estado es un objeto Producto; la plantilla lee sus campos y los botones lo cambian:


// ejemplo.ts — declaración y cambios del estado
protected readonly producto = signal<Producto>(productoInicial());

protected variarPrecio(delta: number): void {
  this.producto.update((actual) => ({
    ...actual,                              // conserva nombre y activo
    precio: Math.max(0, actual.precio + delta),
  }));
}

protected reiniciar(): void {
  this.producto.set(productoInicial());     // valor nuevo, no depende del anterior
}

<!-- ejemplo.html — lectura del signal: siempre con paréntesis -->
<p class="text-2xl font-bold text-slate-900">{{ producto().precio }}</p>
<p class="text-sm text-slate-500">
  Precio final con IVA (19 %): <strong>{{ precioFinal() }}</strong>
</p>
<p-tag [value]="estadoTexto()" [severity]="producto().activo ? 'success' : 'danger'" 

// MAL: muta el objeto y conserva la misma referencia.
const actual = this.producto();
actual.precio = actual.precio + 1000;   // el signal no notifica: nadie llamó a set/update

// BIEN: crea un objeto nuevo y entrégaselo al signal.
this.producto.update((actual) => ({ ...actual, precio: actual.precio + 1000 }));
```

## 1.9.6 computed y effect: derivar y reaccionar
```bash
// ejemplo.ts — dos valores derivados y un efecto secundario
protected readonly precioFinal = computed(() =>
  Math.round(this.producto().precio * 1.19),
);

protected readonly estadoTexto = computed(() =>
  this.producto().activo ? 'Activo' : 'Inactivo',
);

private readonly registro = effect(() => {
  const { nombre, precio, activo } = this.producto();
  console.log(`[ejemplo] ${nombre} · precio ${precio} · ${activo ? 'activo' : 'inactivo'}`);
});

<!-- ejemplo.html — los derivados se leen igual que un signal -->
<p class="text-sm text-slate-500">
  Precio final con IVA (19 %): <strong>{{ precioFinal() }}</strong>
</p>
<p-tag [value]="estadoTexto()" [severity]="producto().activo ? 'success' : 'danger'"
```

## 1.9.8 Zoneless: por qué la vista se actualiza sin Zone.js

```bash
/* src/app/demo/ejemplo/ejemplo.css — únicamente demostrativo. */
.ejemplo-alcance {
  border: 2px dashed #0f766e;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: #f0fdfa;
}

<!-- La misma caja, con el resto del contenido en Tailwind. -->
<div class="ejemplo-alcance mt-4 text-sm text-slate-700">…</div>
```
---------------------------------------------------------------------------------------------


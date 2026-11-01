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

Al configurar `primeUiLicense` en `src/environments/environment.ts`, copia el token tal cual, sin agregar `<` ni `>`; esos caracteres hacen que PrimeNG lo rechace como inválido.

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
## Verificación del ISS
```bash


# 1. El servidor debe compilar
ng build

# 2. Debe imprimir la configuración de Tailwind/PrimeNG
grep -R "providePrimeNG\|@import 'tailwindcss'" src | head

# 3. Versiones compatibles
npm ls primeng @primeuix/themes primeicons @angular/cdk --depth=0

# 4. Presupuesto y estilos
node -e "const a=require('./angular.json');const p=a.projects[Object.keys(a.projects)[0]];console.log(p.architect.build.configurations.production.budgets[0])"
cat src/styles.css

# 5. La composición y el componente de ejemplo declaran signals
grep -n "imports: \[Ejemplo\]" src/app/app.ts
grep -n "app-ejemplo" src/app/app.html
grep -n "signal(\|computed(\|effect(" src/app/demo/ejemplo/ejemplo.ts

# 6. Pruebas de App y del componente de ejemplo
npm test -- --watch=false
```
Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-11-01 112150.png">
</p>


---------------------------------------------------------------------------------------------

---------------------------------------------------------------------------------------------

---------------------------------------------------------------------------------------------
## Fase I: Frontend — ISS-01A — Esqueleto Header / Aside / contenido / Footer

```bash
**Objetivo:** construir primero la pantalla. Al terminar, http://localhost:4200 muestra Header arriba, Aside a la izquierda del contenido y Footer abajo a todo el ancho, con datos fijos y sin llamadas a la API.

**Bloqueado por:** ISS-01.

**Criterios de aceptación (ISS-01A) — consolidados**

- [X] 1.1 Explica por qué un componente generado no aparece hasta que el padre lo declara en imports y usa su selector
- [X] 1.2 Existen src/app/layout/header/, src/app/layout/aside/ y src/app/layout/footer/, cada una con .ts, .html y .css
- [X] 1.3 header.ts declara title y header.html lo muestra con {{ title }}
- [X] 1.3 Los tres .css de layout/ no contienen reglas: solo un comentario que explica por qué están vacíos
- [X] 1.4 app.ts importa Header, Aside y Footer y los declara en imports
- [X] 1.4 app.html compone las cuatro regiones: `<app-header />`, `<aside>`con `<app-aside />`, `<main>` con el contenido y `<app-footer />`
- [X] 1.4 app.html ya no contiene `<app-ejemplo />`: demo/ejemplo no forma parte de la aplicación
- [X] 1.5 Se ven las cuatro regiones, el Footer queda abajo y no hay desplazamiento horizontal
- [X] 1.5 En Network no aparece ninguna petición /api
- [X] ng build termina con código 0 y las pruebas pasan

> **demo/ejemplo** no se usa en ningún ISS posterior. Fue la introducción a Angular de ISS-01. No está en el menú, no tiene ruta, no se compone en el layout y no se reutiliza. Al reemplazar app.html en 1.4 deja de verse; el componente y su prueba siguen en el proyecto solo como material de consulta de ISS-01.

### 1.1 Qué es un componente y por qué el padre debe importarlo

Un componente reúne una clase TypeScript (datos y lógica), una plantilla HTML (lo que se ve) y un archivo de estilos. `@Component` relaciona esos archivos:

|Campo	|Pregunta que responde	|Ejemplo en este ISS|
|-------|-----------------------|-------------------|
|selector	|¿Con qué etiqueta se usa en otra plantilla?	|selector: 'app-header' → <app-header />|
|imports|	¿Qué usa su plantilla?|	[] en Header de ISS-01A|
|templateUrl	|¿Dónde está el HTML?|	./header.html|
|styleUrl|	¿Dónde están los estilos privados?	|./header.css|
|host|	¿Qué clases lleva el elemento anfitrión?	|host: { class: |'block' }|

**Regla que resuelve el error más común:** un componente generado existe, pero no se ve hasta que otro componente lo declara en su imports y escribe su etiqueta en su plantilla. Son dos pasos, no uno:

```typescript
// app.ts — paso 1: declarar el componente para que la plantilla lo reconozca
imports: [Header, Aside, Footer],
```
### 1.2 Generar las tres piezas de layout/
Criterios de este sub-ítem


```bash
ng generate component layout/header --skip-tests --defaults
ng generate component layout/aside --skip-tests --defaults
ng generate component layout/footer --skip-tests --defaults
```

En una reconstrucción desde cero, el CLI crea además un `header.spec.ts` si no usas `--skip-tests`. En este curso esas pruebas no se necesitan: el comportamiento de la pantalla se comprueba desde `app.spec.ts`.

Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-11-01 122459.png">
</p>

### 1.3 Contenido de cada componente
Criterios de este sub-ítem


Los tres componentes son de presentación: no inyectan servicios, no consultan la API y no conocen permisos. Esa frontera es la que permite reutilizar el layout en ISS-02 sin duplicarlo.

**Header**

`src/app/layout/header/header.ts`

```typescript
import { Component } from '@angular/core';

/**
 * Barra superior de la aplicación.
 *
 * ISS-01A: solo muestra el nombre. En ISS-01B recibe datos por `input()`, emite
 * `menuRequested` y añade el menú de usuario. No consulta la API.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  readonly title = 'CelebraHub';
}


```
`src/app/layout/header/header.html`

```html
<header
  class="flex h-16 items-center border-b border-slate-200 bg-white px-6 font-semibold"
>
  <!-- Interpolación: `title` es una propiedad de la clase Header. -->
  <p class="truncate text-sm font-semibold text-slate-900">{{ title }}</p>
</header>
```

`{{ title }}` es interpolación: Angular lee la propiedad de la clase y escribe su texto. Cambia el valor en header.ts y comprueba que cambia el encabezado sin tocar el HTML. Ese es el primer enlace entre clase y plantilla.

h-16 fija la altura, border-b dibuja la separación y truncate evita que un texto largo rompa la barra. Todo es Tailwind: no hay CSS propio.

**Aside**

`src/app/layout/aside/aside.ts`

```typescript
import { Component } from '@angular/core';

/**
 * Menú lateral de la aplicación.
 *
 * ISS-01A: solo el contenedor. En ISS-01B recibe `items` por `input()` y pinta
 * `p-panelmenu`. No conoce rutas ni permisos: eso llega en ISS-02/ISS-08.
 */
@Component({
  host: { class: 'block h-full' },
  selector: 'app-aside',
  templateUrl: './aside.html',
  styleUrl: './aside.css',
})
export class Aside {}
```

`src/app/layout/aside/aside.html`

```html
<nav aria-label="Navegación principal" class="h-full bg-slate-950 p-6 text-white">
  <p class="text-xs font-medium uppercase tracking-wider text-slate-400">Navegación</p>
  <p class="mt-2 text-sm">Menú de EnlaceExpress</p>
  <p class="mt-4 text-xs text-slate-400">
    En ISS-01B este bloque pasa a ser un <code>p-panelmenu</code>.
  </p>
</nav>
```
**Footer**

`src/app/layout/footer/footer.ts`

```typescript
import { Component } from '@angular/core';

/**
 * Pie de página de la aplicación.
 *
 * Presentación pura: no tiene estado ni depende de servicios.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {}
```

`src/app/layout/footer/footer.html`

```html
<footer
  class="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500 sm:px-6"
>
  CelebraHub · Centro de eventos
</footer>
```
---------------------------------------------------------------------------------------------
## ## Fase I: Frontend — ISS-01A — Esqueleto Header / Aside / contenido / Footer

## ### 1.4 Componer las cuatro regiones en App
Criterios de este sub-ítem


`src/app/app.ts`

```typescript
import { Component } from '@angular/core';
import { Header } from './layout/header/header';
import { Aside } from './layout/aside/aside';
import { Footer } from './layout/footer/footer';

/**
 * Componente principal (`<app-root>`).
 *
 * Es el primero que Angular dibuja. Compone las cuatro regiones de la pantalla:
 * Header arriba, Aside a la izquierda, el contenido del centro y Footer abajo.
 * El contenido del centro todavía es fijo; en ISS-01B pasa a cambiar con el menú
 * y en ISS-02 llega el router.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-root',
  imports: [Header, Aside, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  /** Título de la pantalla inicial. En ISS-01B cambia al elegir el menú. */
  protected readonly title = 'Inicio';
}
```

`src/app/app.html`

```html
<!-- Contenedor de las cuatro regiones: Tailwind para el alto y la dirección. -->
<div class="flex min-h-screen flex-col bg-slate-100">
  <app-header />

  <div class="flex flex-1">
    <!-- Aside fijo de 16rem; en ISS-01B se oculta en pantallas pequeñas. -->
    <aside class="w-64 shrink-0">
      <app-aside />
    </aside>

    <!-- min-w-0 evita que un contenido ancho desborde el flex y cree scroll. -->
    <main id="contenido" class="min-w-0 flex-1 p-6">
      <h1 class="text-2xl font-semibold text-slate-900">{{ title }}</h1>
      <p class="mt-2 text-slate-600">Bienvenido a Celebrahub.</p>
    </main>
  </div>

  <app-footer />
</div>
```
**Prueba de la composición**

`src/app/app.spec.ts` no busca el `<h1>` de la plantilla por defecto: comprueba las regiones y el texto inicial.

```typescript
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  async function crearApp() {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should compose the three layout regions', async () => {
    const compilado = await crearApp();
    expect(compilado.querySelector('app-header')).toBeTruthy();
    expect(compilado.querySelector('aside app-aside')).toBeTruthy();
    expect(compilado.querySelector('app-footer')).toBeTruthy();
  });

  it('should render the application name in the header', async () => {
    const compilado = await crearApp();
    const header = compilado.querySelector('app-header') as HTMLElement;
    expect(header.textContent).toContain('Celebrahub');
  });

  it('should render the initial title in the content', async () => {
    const compilado = await crearApp();
    const main = compilado.querySelector('main') as HTMLElement;
    expect(main.textContent).toContain('Inicio');
    expect(main.textContent).toContain('Bienvenido a Celebrahub.');
  });
});
```

La consulta `aside app-aside` verifica dos cosas a la vez: que el Aside está dentro del elemento que fija su ancho y que el componente se pintó.

### 1.5 Comprobar antes de avanzar
Criterios de este sub-ítem


```bash
npm start
```
Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-11-01 124551.png">
</p>

---------------------------------------------------------------------------------------------

## Fase I: Frontend — ISS-01B — Menú PrimeNG y primera interacción

**Objetivo:** pasar de una maqueta a una pantalla que responde. Al terminar: PanelMenu en el Aside, botón de menú en el Header, Drawer en pantalla pequeña y selección que cambia el contenido local. Sin rutas de negocio y sin API.

**Bloqueado por:** ISS-01A.

**Criterios de aceptación (ISS-01B) — consolidados**

- [X] 1.1 Explica la diferencia entre input() (dato del padre al hijo), output() (aviso del hijo al padre) y signal() (estado propio)
- [X] 1.2 aside.ts declara `items = input<MenuItem[]>([])` y aside.html lo pinta con `<p-panelmenu [model]="items()" [multiple]="true" />`
- [X] 1.2 aside.css sigue sin reglas: la apariencia es de Aura y Tailwind
- [X] 1.3 El Header emite menuRequested y su botón está siempre visible: por debajo de lg abre el Drawer, desde lg alterna el Aside fijo
- [X] 1.4 Existe src/app/features/construir/ con construir.ts, construir.html, construir.css y construir.spec.ts
- [X] 1.4 mobileOpen, sidebarCollapsed y title son signal; elegir una opción cambia el título y cierra el Drawer
- [X] 1.4 El layout se compone una sola vez en construir.html y se reutiliza en el Drawer
- [X] 1.5 app.ts importa RouterOutlet y app.html contiene solo `<router-outlet />`
- [X] 1.5 app.routes.ts declara construir con loadComponent, redirige '' y ** a construir
- [X] 1.6 A 1280 px se ve Inicio, 11 opciones de Operación y 6 de Administración; a 390 px se oculta y el botón abre el Drawer
- [X] 1.6 A 1280 px el botón de menú se ve y oculta/muestra el Aside sin abrir el Drawer
- [X] 1.6 La URL no cambia al elegir una opción y Network no registra llamadas /api
- [X] ng build termina con código 0, construir se empaqueta como chunk diferido y las pruebas pasan

> demo/ejemplo no participa. La introducción a Angular quedó en ISS-01. No tiene ruta, no está en el menú y no se compone en este ISS.

### 1.1 Los conceptos que se agregan, uno por vez

`Criterios de este sub-ítem`

- [X] Distingue los tres canales de datos: entrada, salida y estado
- [X] Reconoce `MenuItem[]` como el contrato del menú de PrimeNG
- [X] Explica `[(visible)]` como ida y vuelta en un solo atributo

|Concepto	|Qué resuelve	|Dónde se ve en este ISS|
|--------|-------------|-----------------------|
|input()	|Dato que el padre entrega al hijo; el hijo no lo modifica|	items en Aside, appName en Header|
|output()	|Aviso del hijo al padre; el hijo no navega ni cierra nada por su cuenta	|menuRequested, |navigated
|signal()|	Estado propio del componente, observado por la plantilla|	title, mobileOpen en Construir|
|[propiedad]|	Enlace de la clase a la plantilla|	[model]="items()" en PanelMenu|
|(evento)|	Acción al recibir un aviso	|(menuRequested)="mobileOpen.set(true)"|
|[(visible)]|	Ida y vuelta: el Drawer abre y también actualiza el estado al cerrarse|	[(visible)]|="mobileOpen"
|MenuItem[]	|Forma tipada del menú de PrimeNG: label, icon, command|	items en Construir|

**La frontera del ISS**. Los tres componentes de `layout/` son presentación: reciben datos y avisan. El único con estado es Construir. Esa separación es la que permite reutilizar el layout en `ISS-02` sin duplicar `Header`, `Aside` ni `Footer`, y la que evita inyectar servicios de autenticación en componentes visuales.

**PARCHE** — standalone: true sobra. Angular 22 genera componentes standalone por defecto. Los ejemplos de material antiguo lo incluyen; es válido, pero redundante. Este curso no lo escribe.

`src/app/layout/aside/aside.ts`

```typescript
import { Component, input, output } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { PanelMenuModule } from 'primeng/panelmenu';

/**
 * Menú lateral de la aplicación.
 *
 * Presentación pura: recibe el menú ya construido por `input()` y avisa de la
 * navegación con `output()`. No conoce rutas, permisos ni la API.
 */
@Component({
  host: { class: 'block h-full' },
  selector: 'app-aside',
  imports: [ButtonModule, PanelMenuModule],
  templateUrl: './aside.html',
  styleUrl: './aside.css',
})
export class Aside {
  readonly appName = input('CelebraHub');

  /** Opciones del menú, en el formato `MenuItem` de PrimeNG. */
  readonly items = input<MenuItem[]>([]);

  /** Datos de sesión con valores por defecto: ISS-08 los completa. */
  readonly showSession = input(false);
  readonly username = input('');
  readonly roleLabel = input('Sin rol');
  readonly permissionCount = input(0);

  /** Aviso al padre: se seleccionó una opción (lo usa el Drawer en móvil). */
  readonly navigated = output<void>();

  /** Aviso al padre: se pidió cerrar sesión. */
  readonly logoutRequested = output<void>();

  /**
   * Un clic dentro del menú puede caer en el propio ítem o en un hijo suyo.
   * `closest` resuelve ambos casos con un solo listener en el `<nav>`.
   */
  onNavigationClick(event: Event): void {
    const target = event.target;
    if (target instanceof Element && target.closest('.p-panelmenu-item-link')) {
      this.navigated.emit();
    }
  }
}
```

`src/app/layout/aside/aside.html`

```html
<div class="flex h-full flex-col border-r border-slate-200 bg-white text-slate-900">
  <div class="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
    <i class="pi pi-link text-lg text-teal-700" aria-hidden="true"></i>
    <div class="min-w-0">
      <p class="truncate text-sm font-semibold text-slate-900">{{ appName() }}</p>
      <p class="text-[11px] uppercase tracking-wider text-slate-400">
        Panel administrativo
      </p>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-3">
    <nav aria-label="Navegación principal" (click)="onNavigationClick($event)">
      <p-panelmenu [model]="items()" [multiple]="true" />
    </nav>
  </div>

  @if (showSession()) {
    <div class="border-t border-slate-200 p-4">
      <p class="text-sm font-medium text-slate-900">{{ username() || 'Invitado' }}</p>
      <p class="text-xs text-slate-400">{{ roleLabel() }}</p>
      <div class="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>{{ permissionCount() }} permisos</span>
        <button
          pButton
          type="button"
          text
          rounded
          aria-label="Cerrar sesión"
          (click)="logoutRequested.emit()"
        >
          <i pButtonIcon class="pi pi-sign-out"></i>
        </button>
      </div>
    </div>
  }
</div>
```

### 1.3 El Header avisa al padre con output()
Criterios de este sub-ítem

- [ ] El botón de menú lleva `aria-label="Mostrar u ocultar el menú"` y no lleva `lg:hidden`
- [ ] Al pulsarlo emite menuRequested; el Header no abre nada ni consulta el ancho
- [ ] showSession sigue en false: no hay datos de sesión hasta ISS-08
- [ ] header.css no contiene reglas

`src/app/layout/header/header.ts`

```typescript
import { Component, input, output } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { TagModule } from 'primeng/tag';

/**
 * Barra superior de la aplicación.
 *
 * Es presentación pura: recibe los datos por `input()` y avisa al padre con
 * `output()`. No inyecta servicios, no consulta la API y no conoce permisos.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-header',
  imports: [AvatarModule, ButtonModule, MenuModule, TagModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  /** Nombre visible de la aplicación. */
  readonly appName = input('CelebraHub');

  /** Datos de sesión con valores por defecto: ISS-08 los completa. */
  readonly username = input('');
  readonly initials = input('IN');
  readonly roleLabel = input('Sin rol');
  readonly authEnabled = input(true);
  readonly showSession = input(false);
  readonly userItems = input<MenuItem[]>([]);

  /** Aviso al padre: el botón de menú se pulsó. */
  readonly menuRequested = output<void>();
}
```
`src/app/layout/header/header.html`

```html
<header
  class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6"
>
  <!-- Botón de menú: siempre visible; el padre decide qué hacer (aside fijo o Drawer). -->
  <button
    pButton
    type="button"
    text
    rounded
    aria-label="Mostrar u ocultar el menú"
    (click)="menuRequested.emit()"
  >
    <i pButtonIcon class="pi pi-bars"></i>
  </button>

  <div class="min-w-0 flex-1">
    <p class="truncate text-sm font-semibold text-slate-900">{{ appName() }}</p>
    <p class="truncate text-xs text-slate-500">
      Gestión de eventos y reservas
    </p>
  </div>

  @if (showSession() && !authEnabled()) {
    <p-tag value="Fase I · sin auth" severity="warn" [rounded]="true" />
  }
  @if (username()) {
    <p-tag
      [value]="roleLabel()"
      severity="info"
      [rounded]="true"
      class="hidden sm:inline-flex"
    />
  }

  @if (showSession()) {
    <button
      pButton
      type="button"
      severity="secondary"
      outlined
      (click)="userMenuPanel.toggle($event)"
      aria-label="Menú de usuario"
    >
      <p-avatar [label]="initials()" shape="circle" size="normal" />
      <span class="hidden max-w-32 truncate text-sm font-medium text-slate-700 sm:block">
        {{ username() }}
      </span>
      <i class="pi pi-chevron-down pr-1 text-[10px] text-slate-400"></i>
    </button>
    <p-menu #userMenuPanel [model]="userItems()" [popup]="true" appendTo="body" />
  }
</header>
```
**Por qué el hijo no abre el Drawer**. El Drawer vive en Inicio. Si el Header lo abriera, tendría que conocer el estado de otra pantalla. Con `output()` el Header solo dice «se pulsó el botón»; quien decide qué hacer es el padre:

```html
<app-header (menuRequested)="onMenuToggle()" />
```

Esa es la diferencia entre un componente reutilizable y uno acoplado.

> **PARCHE** — `<class="lg:hidden">` era un error de diseño. La primera versión ocultaba el botón con `lg:hidden`, así que desaparecía justo desde 1024 px, que es donde el Aside fijo ya se ve. Resultado: en escritorio el menú no se podía ocultar y en pantallas anchas el usuario no encontraba el botón. El botón debe estar siempre; lo que cambia es qué hace según el ancho. El Header no consulta el ancho (sigue siendo presentación pura): quien decide es el padre, con `onMenuToggle()`.

`sticky top-0 z-30` mantiene la barra visible al hacer scroll y por encima del contenido. El `@if (showSession())` deja el bloque de usuario fuera del DOM hasta ISS-08: no se pinta un avatar vacío que luego haya que ocultar.

### 1.4 features/inicio: navegación local y Drawer móvil
Criterios de este sub-ítem

- [ ] mobileOpen, sidebarCollapsed y title son signal, no propiedades normales
- [ ] Todas las opciones seleccionables del menú llaman a un único método seleccionar
- [ ] seleccionar cambia el título y cierra el Drawer
- [ ] onMenuToggle alterna el Aside fijo en escritorio y abre el Drawer en móvil
- [ ] El Aside aparece una vez en el layout de escritorio y otra en el Drawer, con el mismo items
- [ ] inicio.css no contiene reglas

```bash
ng generate component features/inicio --skip-tests --defaults
```

El `--skip-tests` no es para evitar pruebas: la prueba de esta pantalla se escribe completa en este ISS (más abajo) y sustituye a la plantilla vacía del CLI.
Verifica la estructura:

<p align="center">
  <img src="capturas/Captura de pantalla 2026-11-01 133816.png">
</p>

`src/app/features/inicio/inicio.ts`

```typescript
import { Component, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DrawerModule } from 'primeng/drawer';
import { watchMediaQuery } from '../../core/utils/media-query';
import { Aside } from '../../layout/aside/aside';
import { Footer } from '../../layout/footer/footer';
import { Header } from '../../layout/header/header';

/**
 * Pantalla inicial de CelebraHub.
 *
 * Es el único componente con estado local en ISS-01B: guarda el título elegido y el
 * estado del menú. El layout solo recibe datos por `input()`; así las siguientes
 * pantallas pueden reutilizarlo sin duplicar Header, Aside ni Footer.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-inicio',
  imports: [Aside, ButtonModule, CardModule, DrawerModule, Footer, Header],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  /** `lg` de Tailwind: desde aquí el Aside es fijo y el botón lo alterna. */
  private readonly isDesktop = watchMediaQuery('(min-width: 1024px)');

  /** Escritorio: el Aside fijo se oculta y el contenido se ensancha. */
  readonly sidebarCollapsed = signal(false);

  /** Móvil: el Drawer se abre desde el botón y se cierra al elegir una opción. */
  readonly mobileOpen = signal(false);

  /** Título del contenido. Cambia al elegir una opción del menú, sin HTTP. */
  readonly title = signal('Inicio');

  /**
   * Menú en el formato `MenuItem` de PrimeNG.
   *
   * `command` ejecuta una función al elegir la opción. Todavía no navega: solo
   * cambia el título. En la fase de rutas, cada opción apuntará a una pantalla real.
   */
  readonly items: MenuItem[] = [
    {
      label: 'Gestión de eventos',
      icon: 'pi pi-calendar',
      items: [
        { label: 'Clientes', icon: 'pi pi-users', command: () => this.seleccionar('Clientes') },
        { label: 'Servicios', icon: 'pi pi-list', command: () => this.seleccionar('Servicios') },
        { label: 'Salones', icon: 'pi pi-building', command: () => this.seleccionar('Salones') },
        { label: 'Reservas', icon: 'pi pi-calendar-plus', command: () => this.seleccionar('Reservas') },
        { label: 'Proveedores', icon: 'pi pi-truck', command: () => this.seleccionar('Proveedores') },
        { label: 'Contratos', icon: 'pi pi-file', command: () => this.seleccionar('Contratos') },
        {
          label: 'Cambios de contrato',
          icon: 'pi pi-file-edit',
          command: () => this.seleccionar('Cambios de contrato'),
        },
        {
          label: 'Pagos',
          icon: 'pi pi-credit-card',
          command: () => this.seleccionar('Pagos'),
        },
        {
          label: 'Cancelaciones',
          icon: 'pi pi-times-circle',
          command: () => this.seleccionar('Cancelaciones'),
        },
        {
          label: 'Servicios de evento',
          icon: 'pi pi-ticket',
          command: () => this.seleccionar('Servicios de evento'),
        },
        { label: 'Eventos', icon: 'pi pi-star', command: () => this.seleccionar('Eventos') },
      ],
    },
    {
      label: 'Administración',
      icon: 'pi pi-shield',
      items: [
        { label: 'Usuarios', icon: 'pi pi-users', command: () => this.seleccionar('Usuarios') },
        { label: 'Roles', icon: 'pi pi-key', command: () => this.seleccionar('Roles') },
        { label: 'Recursos', icon: 'pi pi-list', command: () => this.seleccionar('Recursos') },
        {
          label: 'Asignaciones de rol',
          icon: 'pi pi-user-plus',
          command: () => this.seleccionar('Asignaciones de rol'),
        },
        {
          label: 'Concesiones de rol',
          icon: 'pi pi-lock',
          command: () => this.seleccionar('Concesiones de rol'),
        },
        { label: 'Sesiones', icon: 'pi pi-history', command: () => this.seleccionar('Sesiones') },
      ],
    },
  ];

  /**
   * Un solo botón, dos disposiciones: en escritorio alterna el Aside fijo; por
   * debajo de `lg` abre el Drawer (donde el Aside fijo no cabe).
   */
  protected onMenuToggle(): void {
    if (this.isDesktop()) {
      this.sidebarCollapsed.update((collapsed) => !collapsed);
      return;
    }
    this.mobileOpen.set(true);
  }

  /** Una sola puerta de entrada al estado: la usan las opciones seleccionables. */
  protected seleccionar(titulo: string): void {
    this.title.set(titulo);
    this.mobileOpen.set(false);
  }
}
```
**El helper que decide el ancho**

`src/app/core/utils/media-query.ts`

```typescript
import { DestroyRef, Signal, inject, signal } from '@angular/core';

/**
 * Observa una media query CSS y la expone como signal de solo lectura.
 */
export function watchMediaQuery(query: string): Signal<boolean> {
  const destroyRef = inject(DestroyRef);

  const media =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query)
      : null;

  const matches = signal(media?.matches ?? false);

  if (media) {
    const listener = (event: MediaQueryListEvent): void => matches.set(event.matches);
    media.addEventListener('change', listener);
    destroyRef.onDestroy(() => media.removeEventListener('change', listener));
  }

  return matches.asReadonly();
}
```
`src/app/features/inicio/inicio.html`

```html
<div class="flex min-h-screen flex-col bg-slate-100">
  <app-header (menuRequested)="onMenuToggle()" />

  <div class="flex flex-1">
    <!--
      Escritorio: Aside fijo que el botón del Header puede ocultar.
      Por debajo de lg no se pinta: el menú vive en el Drawer.
    -->
    @if (!sidebarCollapsed()) {
      <aside class="hidden w-72 shrink-0 lg:block">
        <app-aside [items]="items" (navigated)="mobileOpen.set(false)" />
      </aside>
    }

    <main id="contenido" class="min-w-0 flex-1 p-4 sm:p-6">
      <p-card class="block">
        <h1 class="text-2xl font-semibold text-slate-900">{{ title() }}</h1>
        <p class="mt-3 text-slate-600">
          Bienvenido a CelebraHub. Elige una sección para explorar la gestión de eventos.
        </p>
        <p class="mt-2 text-sm text-slate-500">
          Esta primera pantalla usa datos locales. Las pantallas de negocio se conectarán
          después con la API de CelebraHub.
        </p>
      </p-card>
    </main>
  </div>

  <app-footer />
</div>

<!-- Móvil: el mismo Aside, otra disposición. -->
<p-drawer [(visible)]="mobileOpen" header="Menú" position="left" styleClass="w-72">
  <app-aside [items]="items" (navigated)="mobileOpen.set(false)" />
</p-drawer>
```
**El flujo de un clic, de principio a fin**

```
clic en «Eventos» (dentro del Aside)
  ├─ PanelMenu ejecuta item.command()
  │     └─ seleccionar('Eventos') → title.set('Eventos') y mobileOpen.set(false)
  └─ el clic burbujea al <nav>, que emite navigated
        └─ Inicio: (navigated)="mobileOpen.set(false)"   ← idempotente
```

Dos caminos que terminan en el mismo estado. No es redundancia inútil: el `command` funciona también con teclado, y `navigated` cubre el caso en que el Aside se reutilice con enlaces reales en ISS-02. Ambos llaman a .`set(false)`, así que no puede quedar desincronizado.

**El flujo del botón de menú, según el ancho**

        └─ Inicio: (navigated)="mobileOpen.set(false)"   ← idempotente
```
clic en el botón del Header
  ├─ Header: (click)="menuRequested.emit()"        ← no sabe dónde está
  └─ Inicio: onMenuToggle()
        ├─ ancho ≥ 1024px  → sidebarCollapsed.update(v => !v)   ← aside fijo
        └─ ancho < 1024px  → mobileOpen.set(true)               ← Drawer
        └─ Inicio: (navigated)="mobileOpen.set(false)"   ← idempotente
```

`@if (!sidebarCollapsed())` envuelve el `<aside>:` en escritorio desaparece del DOM, no se oculta con una clase. Así el contenido recupera el ancho real y no queda un hueco de 288 px.

**Prueba de la pantalla**

`src/app/features/inicio/inicio.spec.ts`

```typescript
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
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
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

    // `lg:hidden` ocultaba el botón justo cuando el Aside ya era visible.
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
    // Sigue en la misma pantalla: no hay recarga ni petición HTTP.
    expect(compilado.querySelector('app-inicio, main')).toBeTruthy();
  });

  it('should open the mobile drawer when the header requests it', async () => {
    const { fixture, compilado } = await crearPantalla();
    const componente = fixture.componentInstance as unknown as {
      mobileOpen: () => boolean;
    };

    expect(componente.mobileOpen()).toBe(false);

    const botonMenu = compilado.querySelector(
      'app-header button[aria-label="Mostrar u ocultar el menú"]',
    ) as HTMLButtonElement;
    expect(botonMenu).toBeTruthy();

    botonMenu.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(componente.mobileOpen()).toBe(true);
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
    const componente = fixture.componentInstance as unknown as {
      mobileOpen: () => boolean;
    };

    const botonMenu = compilado.querySelector(
      'app-header button[aria-label="Mostrar u ocultar el menú"]',
    ) as HTMLButtonElement;
    botonMenu.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(componente.mobileOpen()).toBe(true);

    opcionDelMenu(compilado, 'Gestión de eventos').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(componente.mobileOpen()).toBe(true);

    opcionDelMenu(compilado, 'Eventos').click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(componente.mobileOpen()).toBe(false);
    expect(compilado.querySelector('main h1')?.textContent).toContain('Eventos');
  });
});
```
La prueba del Drawer lee el signal desde la instancia (mobileOpen()), no del DOM: el Drawer de PrimeNG se monta en un overlay y comprobar su visibilidad con selectores es frágil. Se verifica el estado, que es lo que el componente controla.

La prueba de escritorio sustituye window.matchMedia antes de crear el componente, porque watchMediaQuery lee la media query al construirse. Así se comprueban las dos ramas del mismo botón: Drawer en móvil, Aside alternado en escritorio.

### 1.5 App pasa a ser punto de entrada con router-outlet

**Criterios de este sub-ítem**

- [ ] app.ts importa solo RouterOutlet
- [ ] app.html contiene únicamente <router-outlet />
- [ ] app.routes.ts usa loadComponent para inicio
- [ ] '' y ** redirigen a inicio

Este es el momento de presentar RouterOutlet, no ISS-01: ahora existe una pantalla real que mostrar por URL. La idea en una frase: `<router-outlet />` es un ancla; el router inserta a su lado el componente de la ruta activa.

`src/app/app.ts`

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Componente principal (`<app-root>`).
 *
 * Desde ISS-01B es solo el punto de entrada: el router elige qué componente se
 * dibuja dentro de `<router-outlet />` según la URL.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
```

`src/app/app.html`

```html
<!-- El router dibuja aquí el componente de la ruta activa (app.routes.ts). -->
<router-outlet />
```

`src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';

/**
 * Rutas de la aplicación.
 *
 * ISS-01B presenta el router con una pantalla real. `loadComponent` descarga
 * `Inicio` solo cuando se visita su URL: el bundle inicial no lo incluye.
 */
export const routes: Routes = [
  {
    path: 'inicio',
    loadComponent: () =>
      import('./features/inicio/inicio').then((m) => m.Inicio),
  },
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  { path: '**', redirectTo: 'inicio' },
];
```
El enlace a `/login` todavía no existe en esta fase. El inicio de sesión de CelebraHub será ISS-08 y usará `POST /api/sesion/login`; el perfil autenticado se consulta en `GET /api/sesion/perfil` y los permisos efectivos en `GET /api/permisos`. Este ISS no ofrece enlaces a pantallas que aún no existen ni hace llamadas HTTP.

**Prueba del punto de entrada**

`src/app/app.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // Sin rutas: esta prueba comprueba el punto de entrada, no las pantallas.
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.querySelector('router-outlet')).toBeTruthy();
  });
});
```
### 1.6 Comprobar antes de avanzar

**Criterios de este sub-ítem**

- [ ] A 1280 px se ven los recursos de Gestión de eventos y Administración y no hay scroll horizontal
- [ ] A 1280 px el botón de menú se ve y al pulsarlo oculta el Aside (sin abrir el Drawer)
- [ ] A 390 px el Aside no se ve y el botón del Header abre el Drawer
- [ ] Elegir una opción cambia el título y cierra el Drawer
- [ ] La URL no cambia y Network no registra /api
- [ ] Con teclado se recorre el menú y se activa con Enter
- [ ] ng build termina con código 0

```
npm start
```
Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-11-01 181007.png">
</p>

---------------------------------------------------------------------------------------------


---------------------------------------------------------------------------------------------
## Fase I: Frontend — ISS-02 — Núcleo: environment, modelos, servicios y layout

## 2.1 environment: una sola URL para todo el frente
```bash
src/environments/environment.ts — lo usa ng build, es el base:

/**
 * Entorno de producción (`ng build`).
 *
 * `apiUrl` termina en `/api` SIN slash final: con uno, las llamadas saldrían
 * como `//clientes` y Express las trataría como otra ruta.
 *
 * `requireAuth`: mitad frontal del interruptor de fases. Nadie lo lee hasta
 * ISS-08 (Fase II). Se empareja con `AUTH_ENABLED` del backend: mover una sola
 * mitad produce `401 Missing Bearer token` (ISS-11 §11.1).
 *
 * `primeUiLicense`: clave **Community** de PrimeUI (PrimeNG 22). Solicítala en
 * https://primeui.dev · requisitos en https://primeui.dev/licenses. Déjala en `''`
 * si aún no la tienes (aviso en consola; la app funciona). No subas claves
 * comerciales al repo.
 */
export const environment = {
  production: true,
  appName: 'StoreLab Express II',
  apiUrl: 'http://localhost:4000/api',
  requireAuth: true,
  primeUiLicense: '',
};
```
Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-11-01 114654.png">
</p>


---------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------
## Fase I: Frontend — ISS-02 — Núcleo: environment, modelos, servicios y layout

## 2.1.1 Licencia PrimeUI (primeUiLicense)
```bash
Tras ISS-01, app.config.ts registra PrimeNG así:


providePrimeNG({
  license: environment.primeUiLicense || undefined,
  // ...
```
Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-11-01 115117.png">
</p>


---------------------------------------------------------------------------------------------

## Fase I: Frontend — ISS-02 — Núcleo: environment, modelos, servicios y layout

## 2.2 Modelos: reflejar el backend, no inventarlo
```bash
Tras ISS-01, app.config.ts registra PrimeNG así:


providePrimeNG({
  license: environment.primeUiLicense || undefined,
  // ...
```
Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-11-01 115117.png">
</p>


---------------------------------------------------------------------------------------------
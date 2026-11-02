# FrontendCelebraHub

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.3.

## Módulo de clientes

La ruta `/clientes` permite consultar, buscar, crear, editar, desactivar y eliminar clientes mediante la API pública de CelebraHub (`/api/clientes`); no requiere iniciar sesión.

## Módulo de proveedores

La ruta `/proveedores` ofrece búsqueda y operaciones CRUD para proveedores mediante la API pública `/api/proveedores`; no requiere iniciar sesión.

## Módulos de operación

Las rutas `/servicios`, `/salones`, `/reservas`, `/contratos`, `/pagos`,
`/cambios-contrato`, `/evento-servicios`, `/cancelaciones` y `/eventos`
incluyen consulta, búsqueda, formularios de creación/edición y acciones de
eliminación conforme a los campos y respuestas de la API CelebraHub. Servicios,
salones y servicios de evento también incluyen desactivación cuando el backend
ofrece esa operación.

En desarrollo local, el backend permite estos CRUD desde `localhost` sin
iniciar sesión. En otros entornos o desde conexiones remotas se mantienen la
autenticación y los permisos del backend. Las rutas administrativas no forman
parte de estos CRUD.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

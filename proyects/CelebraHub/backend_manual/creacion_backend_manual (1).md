# Manual de creación del Backend — NestJS + Sequelize (Clean Architecture)

> Proyecto de referencia: `backend_ia`  
> Basado en: `docs/guia_del_backend.md`  
> Destino: construir el mismo backend **desde cero**, fase por fase.

## Cómo usar este manual

1. Cada **FASE** es un epígrafo grande (épica).
2. Cada **subítem** (ej. `1.3`, `7.4`) es un **issue** que termina en un **commit**.
3. Copia y pega los bloques `bash` en la terminal: crean carpetas/archivos con `mkdir`/`cat`, no edites a mano.
4. Sigue el orden: **no te adelantes**. El cableado (`app.module`, factory Sequelize, seeders) evoluciona por fase.
5. Después de cada verificación (`npm run start:dev`) confirma logs y, si aplica, la tabla en BD.

### Reglas de arquitectura (no negociables)

1. Entidad de dominio = TypeScript puro (NO `extends Model`).
2. Modelo Sequelize solo en `infrastructure/persistence/models`.
3. Casos de uso en `application/use-cases`; controllers delgados.
4. Contrato de repositorio en `domain/interfaces`; implementación en infrastructure.
5. **Business primero**, Auth después.
6. Una entidad ≈ una fase (después de la base).
7. Cada entidad: seeder + verificación física en BD cuando ya esté cableada.
8. **Multi-base:** `DB_DIALECT` elige el motor (`mysql` | `postgres` | `mssql` | `oracle`). Cada motor tiene su bloque (`DB_MYSQL_*`, `DB_POSTGRES_*`, `DB_MSSQL_*`, `DB_ORACLE_*`). No uses un `DB_HOST` genérico.

### Roadmap

| Fase | Código | Contenido |
|------|--------|-----------|
| 1 | `00_BASE_INIT_NESTJS` | Crear proyecto NestJS |
| 2 | `01_BASE_DEPS_Y_PUERTO` | Dependencias + free-port |
| 3 | `02_BASE_ESTRUCTURA_CA` | Árbol Clean Architecture |
| 4 | `03_BASE_ENTORNO_ENV` | `.env` tipado: `DB_DIALECT` + un bloque por motor |
| 5 | `04_BASE_DATABASE_SEQUELIZE` | Multi-dialecto Sequelize (usa el bloque activo) |
| 6 | `05_BASE_APP_COMMON_SECURITY` | App/Logger/Common/Security + bootstrap |
| 7 | `06_BUSINESS_CLIENTS` | Clients (patrón completo) |
| 8 | `07_BUSINESS_PRODUCT_TYPES` | ProductTypes |
| 9 | `08_BUSINESS_PRODUCTS` | Products |
| 10 | `09_BUSINESS_SALES` | Sales + ProductSale |
| 11 | `10_AUTH_USERS` | Users |
| 12 | `11_AUTH_ROLES` | Roles |
| 13 | `12_AUTH_ROLE_USERS` | RoleUsers |
| 14 | `13_AUTH_RESOURCES` | Resources |
| 15 | `14_AUTH_RESOURCE_ROLES` | ResourceRoles |
| 16 | `15_AUTH_REFRESH_TOKENS` | RefreshTokens |
| 17 | `16_AUTH_JWT_LOGIN` | Login / refresh / logout |
| 18 | `17_AUTH_RBAC_GUARDS` | Guards RBAC globales |
| 19 | `18_SWAGGER_BEARER` | Swagger Bearer (ajuste final) |
| 20 | `19_INTEGRACION_FINAL` | Checklist e integración |


------------------------------------------------------------------------

## FASE 1 — `00_BASE_INIT_NESTJS`

### Inicialización del proyecto NestJS

> **Objetivo de la fase:** Dejar el esqueleto oficial Nest corriendo en un puerto libre, con Git inicial.

#### 1.1 — Crear carpetas padre y permisos

Prepara la ruta de trabajo en WSL. Los permisos evitan fallos de escritura del CLI.

```bash
mkdir -p /home/portatiljq/apps/dlloweb/nestjs/express_sequelize
chmod -R 755 /home/portatiljq/apps/dlloweb/nestjs/express_sequelize
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: prepare workspace folders for nest backend"
```

#### 1.2 — Instalar Nest CLI (si no existe)

El CLI genera `main.ts`, `app.module.ts`, `tsconfig`, scripts npm, etc.

```bash
npm install -g @nestjs/cli
nest --version
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: ensure nest cli available locally"
```

#### 1.3 — Crear proyecto NestJS

Usamos el nombre `backend_ia` (workspace didáctico). Responde las preguntas del CLI (package manager: npm).

```bash
cd /home/portatiljq/apps/dlloweb/nestjs/express_sequelize
nest new backend_ia
cd backend_ia
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: scaffold nestjs project backend_ia"
```

#### 1.4 — Crear `.env` mínimo (puerto)

El puerto `3002` evita choques con el 3000. Más adelante el `.env` crecerá con BD y JWT.

```bash
cat > .env <<'EOF_BACKEND_IA'
PORT=3002
NODE_ENV=development
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add initial .env with PORT=3002"
```

#### 1.5 — Commit inicial del esqueleto

Congela el punto de partida reproducible.

```bash
git init
git add .
git commit -m "chore: inicialización del proyecto NestJS"
```


------------------------------------------------------------------------

## FASE 2 — `01_BASE_DEPS_Y_PUERTO`

### Dependencias + manejo de puerto (EADDRINUSE)

> **Objetivo de la fase:** Instalar el stack profesional y evitar que un `start:dev` colgado bloquee el puerto.

#### 2.1 — Dependencias de producción

Config, Swagger, JWT/Passport, Sequelize + drivers de 4 motores, validación, bcrypt y utilidades HTTP.

```bash
npm install @nestjs/config @nestjs/swagger @nestjs/jwt @nestjs/passport @nestjs/mapped-types \
  passport passport-jwt sequelize sequelize-typescript mysql2 pg tedious oracledb \
  class-validator class-transformer bcrypt reflect-metadata express compression helmet
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: install production dependencies for ca backend"
```

#### 2.2 — Dependencias de desarrollo

Tipados y sequelize-cli para herramientas de BD.

```bash
npm install -D @types/bcrypt @types/passport-jwt sequelize-cli
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: install auth and sequelize-cli devDependencies"
```

#### 2.3 — Script para liberar puerto (evita EADDRINUSE)

Si reinicias Nest sin matar el proceso anterior, Node lanza `listen EADDRINUSE`. Este script lee `PORT` del `.env` y libera el puerto en Linux/WSL.

```bash
mkdir -p scripts
cat > scripts/free-port.js <<'EOF_BACKEND_IA'
/**
 * Libera el puerto configurado en .env (PORT) antes de arrancar Nest.
 * Evita EADDRINUSE cuando queda una instancia previa de start:dev.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function readPortFromEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  let port = 3002;

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^\s*PORT\s*=\s*(\d+)\s*$/m);
    if (match) {
      port = parseInt(match[1], 10);
    }
  }

  if (process.env.PORT) {
    port = parseInt(process.env.PORT, 10) || port;
  }

  return port;
}

function freePort(port) {
  try {
    // Linux/WSL: mata el proceso que escucha en el puerto
    execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
    console.log(`✅ Puerto ${port} liberado`);
  } catch {
    // No había proceso escuchando: ok
    console.log(`ℹ️  Puerto ${port} disponible`);
  }
}

const port = readPortFromEnv();
freePort(port);
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add scripts/free-port.js to avoid EADDRINUSE"
```

#### 2.4 — Actualizar scripts npm en package.json

Integra `free:port` en `start:dev` / `start:debug`. Aplica el cambio con Node para no editar JSON a mano.

```bash
node <<'EOF_BACKEND_IA'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = {
  ...pkg.scripts,
  'free:port': 'node scripts/free-port.js',
  'start:dev': 'npm run free:port && nest start --watch',
  'start:debug': 'npm run free:port && nest start --debug --watch',
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ package.json scripts actualizados');
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: wire free:port into nest start scripts"
```

#### 2.5 — Verificar arranque base

Debe levantar el Hello World de Nest en el puerto del `.env`.

```bash
npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "test: verify nest boots after dependency install"
```


------------------------------------------------------------------------

## FASE 3 — `02_BASE_ESTRUCTURA_CA`

### Estructura de carpetas Clean Architecture

> **Objetivo de la fase:** Crear el mapa mental: config / common / infrastructure / features (business + auth).

#### 3.1 — Crear árbol base de carpetas

Aún no hay código de dominio. Solo directorios y módulos vacíos de features para anclar imports futuros.

```bash
mkdir -p src/config/{app,database,environment,jwt,logger,swagger}
mkdir -p src/common/{constants,decorators,enums,exceptions,filters,guards,interceptors,interfaces,pipes,types,utils,validators}
mkdir -p src/infrastructure/database/{sequelize,migrations,seeders}
mkdir -p src/infrastructure/{logging,security/hashing,security/tokens}
mkdir -p src/features/business/{clients,product-types,products,sales}/{application/{dto,mappers,use-cases},domain/{entities,enums,exceptions,interfaces,services,validators},infrastructure/persistence/{models,repositories,migrations,seeders},presentation/http/{controllers,decorators,serializers,swagger},tests}
mkdir -p src/features/auth/{users,roles,role-users,resources,resource-roles,refresh-tokens}/{application/{dto,mappers,use-cases},domain/{entities,enums,exceptions,interfaces,services,validators},infrastructure/persistence/{models,repositories,migrations,seeders},presentation/http/{controllers,decorators,serializers,swagger},tests}
mkdir -p src/features/auth/authentication/{application/{dto,mappers,use-cases},domain/{entities,enums,exceptions,interfaces,services,validators},infrastructure/{jwt,password},presentation/http/{controllers,decorators,serializers,swagger},tests}
mkdir -p src/features/auth/infrastructure/database
cat > src/features/business/business.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  exports: [],
})
export class BusinessModule {}
EOF_BACKEND_IA
cat > src/features/auth/auth.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  exports: [],
})
export class AuthModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: create clean architecture folder tree and empty feature modules"
```

#### 3.2 — Recordatorio de responsabilidades

| Carpeta | Responsabilidad |
|---------|------------------|
| `config/` | Cómo se configura la app (env, jwt, swagger) |
| `common/` | Piezas transversales reutilizables |
| `infrastructure/` | Detalles técnicos (Sequelize, bcrypt, JWT) |
| `features/*` | Dominios (business/auth) con CA interna |

**Error típico:** poner `@Table` de Sequelize dentro de `domain/entities`.

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "docs: note clean architecture folder responsibilities"
```


------------------------------------------------------------------------

## FASE 4 — `03_BASE_ENTORNO_ENV`

### Configuración del entorno tipado (multi-base)

> **Objetivo de la fase:** Centralizar variables en `.env`: selector `DB_DIALECT` y un bloque de credenciales por motor (MySQL, PostgreSQL, SQL Server, Oracle). Validar antes del boot.

#### 4.1 — Crear `.env.example` y actualizar `.env` completo

El `.env` real NO se sube a Git. Usa BD dedicada `tecnogua_ia`.

**Contrato multi-base (igual que `docs/Prompt.md`):**
- `DB_DIALECT` = `mysql` | `postgres` | `mssql` | `oracle` (elige qué motor corre).
- MySQL: `DB_MYSQL_HOST`, `DB_MYSQL_PORT`, `DB_MYSQL_USERNAME`, `DB_MYSQL_PASSWORD`, `DB_MYSQL_NAME`.
- PostgreSQL: `DB_POSTGRES_*` (puerto lab 5432).
- SQL Server: `DB_MSSQL_*` (puerto lab 1433, usuario `sa`).
- Oracle: `DB_ORACLE_*` + `DB_ORACLE_CONNECT_STRING` (puerto lab 1521).
- Para cambiar de motor, cambia **solo** `DB_DIALECT`. No uses `DB_HOST` / `DB_USERNAME` genéricos.

```bash
cat > .env.example <<'EOF_BACKEND_IA'
# ==========================================
# APP
# ==========================================
PORT=3002
NODE_ENV=development

# ==========================================
# DATABASE
# ==========================================
# Selector del motor en ejecución (un solo valor):
# mysql | postgres | mssql | oracle
DB_DIALECT=mysql

# --- MYSQL ---
DB_MYSQL_HOST=localhost
DB_MYSQL_PORT=3306
DB_MYSQL_USERNAME=root
DB_MYSQL_PASSWORD=root
DB_MYSQL_NAME=tecnogua_ia

# --- POSTGRES ---
DB_POSTGRES_HOST=localhost
DB_POSTGRES_PORT=5432
DB_POSTGRES_USERNAME=postgres
DB_POSTGRES_PASSWORD=postgres
DB_POSTGRES_NAME=tecnogua_ia

# --- MSSQL (SQL Server) ---
DB_MSSQL_HOST=localhost
DB_MSSQL_PORT=1433
DB_MSSQL_USERNAME=sa
DB_MSSQL_PASSWORD=YourStrong@Passw0rd
DB_MSSQL_NAME=tecnogua_ia

# --- ORACLE ---
DB_ORACLE_HOST=localhost
DB_ORACLE_PORT=1521
DB_ORACLE_USERNAME=system
DB_ORACLE_PASSWORD=oracle
DB_ORACLE_NAME=tecnogua_ia
DB_ORACLE_CONNECT_STRING=localhost:1521/XEPDB1

# ==========================================
# JWT (pista completa; el guion simple no implementa login)
# ==========================================
JWT_SECRET=lab-jwt-secret-tecnogua-ia
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=lab-jwt-refresh-tecnogua-ia
JWT_REFRESH_EXPIRES_IN=7d
EOF_BACKEND_IA
```

```bash
cp .env.example .env
# Laboratorio: DB_DIALECT + un bloque por motor (MYSQL/POSTGRES/MSSQL/ORACLE).
# Cambia solo el bloque del motor que uses. Mantén DB_*_NAME=tecnogua_ia
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add typed env template and local .env for tecnogua_ia"
```

#### 4.2 — Interface de entorno

Tipos TypeScript de las variables de entorno (APP, DB, JWT) y enum de dialectos.

**Archivo:** `src/config/environment/env.interface.ts`

```bash
mkdir -p src/config/environment
cat > src/config/environment/env.interface.ts <<'EOF_BACKEND_IA'
export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export enum DatabaseDialect {
  MySQL = 'mysql',
  Postgres = 'postgres',
  MSSQL = 'mssql',
  Oracle = 'oracle',
}

export interface AppConfig {
  port: number;
  nodeEnv: Environment;
}

export interface DatabaseConfig {
  dialect: DatabaseDialect;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  connectString?: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

export interface EnvironmentConfig {
  app: AppConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add environment interfaces and DatabaseDialect enum"
```

#### 4.3 — Validación de entorno con class-validator

Si falta JWT_SECRET o DB_DIALECT es inválido, o el bloque del motor activo está vacío, el boot falla con mensaje claro.

**Archivo:** `src/config/environment/env.validation.ts`

```bash
mkdir -p src/config/environment
cat > src/config/environment/env.validation.ts <<'EOF_BACKEND_IA'
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';
import {
  assertActiveDialectCredentials,
  resolveDialectCredentials,
} from './db-env';
import { DatabaseDialect, Environment } from './env.interface';

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(0)
  @Max(65535)
  @IsOptional()
  PORT: number = 3002;

  @IsEnum(DatabaseDialect)
  DB_DIALECT: DatabaseDialect;

  @IsString()
  @IsOptional()
  DB_MYSQL_HOST?: string;

  @IsNumber()
  @IsOptional()
  DB_MYSQL_PORT?: number;

  @IsString()
  @IsOptional()
  DB_MYSQL_USERNAME?: string;

  @IsString()
  @IsOptional()
  DB_MYSQL_PASSWORD?: string;

  @IsString()
  @IsOptional()
  DB_MYSQL_NAME?: string;

  @IsString()
  @IsOptional()
  DB_POSTGRES_HOST?: string;

  @IsNumber()
  @IsOptional()
  DB_POSTGRES_PORT?: number;

  @IsString()
  @IsOptional()
  DB_POSTGRES_USERNAME?: string;

  @IsString()
  @IsOptional()
  DB_POSTGRES_PASSWORD?: string;

  @IsString()
  @IsOptional()
  DB_POSTGRES_NAME?: string;

  @IsString()
  @IsOptional()
  DB_MSSQL_HOST?: string;

  @IsNumber()
  @IsOptional()
  DB_MSSQL_PORT?: number;

  @IsString()
  @IsOptional()
  DB_MSSQL_USERNAME?: string;

  @IsString()
  @IsOptional()
  DB_MSSQL_PASSWORD?: string;

  @IsString()
  @IsOptional()
  DB_MSSQL_NAME?: string;

  @IsString()
  @IsOptional()
  DB_ORACLE_HOST?: string;

  @IsNumber()
  @IsOptional()
  DB_ORACLE_PORT?: number;

  @IsString()
  @IsOptional()
  DB_ORACLE_USERNAME?: string;

  @IsString()
  @IsOptional()
  DB_ORACLE_PASSWORD?: string;

  @IsString()
  @IsOptional()
  DB_ORACLE_NAME?: string;

  @IsString()
  @IsOptional()
  DB_ORACLE_CONNECT_STRING?: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '1d';

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string = '7d';
}

function formatValidationErrors(
  errors: ReturnType<typeof validateSync>,
): string {
  return errors
    .map((error) => {
      const constraints = error.constraints
        ? Object.values(error.constraints).join(', ')
        : 'valor inválido';
      return `${error.property}: ${constraints}`;
    })
    .join('; ');
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Error de configuración: variable(s) crítica(s) inválida(s) o ausente(s). ${formatValidationErrors(errors)}. Copia .env.example a .env y completa el bloque del motor elegido (DB_DIALECT).`,
    );
  }

  assertActiveDialectCredentials(resolveDialectCredentials(validatedConfig));

  return validatedConfig;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: validate environment variables with class-validator"
```

#### 4.4 — Resolver de credenciales por motor

Lee el bloque DB_MYSQL_* / DB_POSTGRES_* / DB_MSSQL_* / DB_ORACLE_* según DB_DIALECT.

**Archivo:** `src/config/environment/db-env.ts`

```bash
mkdir -p src/config/environment
cat > src/config/environment/db-env.ts <<'EOF_BACKEND_IA'
import { DatabaseConfig, DatabaseDialect } from './env.interface';

export const DEFAULT_DB_PORTS: Record<DatabaseDialect, number> = {
  [DatabaseDialect.MySQL]: 3306,
  [DatabaseDialect.Postgres]: 5432,
  [DatabaseDialect.MSSQL]: 1433,
  [DatabaseDialect.Oracle]: 1521,
};

export type DialectEnvSource = {
  DB_DIALECT: DatabaseDialect;
  DB_MYSQL_HOST?: string;
  DB_MYSQL_PORT?: string | number;
  DB_MYSQL_USERNAME?: string;
  DB_MYSQL_PASSWORD?: string;
  DB_MYSQL_NAME?: string;
  DB_POSTGRES_HOST?: string;
  DB_POSTGRES_PORT?: string | number;
  DB_POSTGRES_USERNAME?: string;
  DB_POSTGRES_PASSWORD?: string;
  DB_POSTGRES_NAME?: string;
  DB_MSSQL_HOST?: string;
  DB_MSSQL_PORT?: string | number;
  DB_MSSQL_USERNAME?: string;
  DB_MSSQL_PASSWORD?: string;
  DB_MSSQL_NAME?: string;
  DB_ORACLE_HOST?: string;
  DB_ORACLE_PORT?: string | number;
  DB_ORACLE_USERNAME?: string;
  DB_ORACLE_PASSWORD?: string;
  DB_ORACLE_NAME?: string;
  DB_ORACLE_CONNECT_STRING?: string;
};

function toPort(value: string | number | undefined, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function text(value: string | undefined): string {
  return value?.trim() ?? '';
}

export function resolveDialectCredentials(
  env: DialectEnvSource,
): DatabaseConfig {
  const dialect = env.DB_DIALECT;
  const port = DEFAULT_DB_PORTS[dialect];

  switch (dialect) {
    case DatabaseDialect.MySQL:
      return {
        dialect,
        host: text(env.DB_MYSQL_HOST),
        port: toPort(env.DB_MYSQL_PORT, port),
        username: text(env.DB_MYSQL_USERNAME),
        password: text(env.DB_MYSQL_PASSWORD),
        database: text(env.DB_MYSQL_NAME),
      };
    case DatabaseDialect.Postgres:
      return {
        dialect,
        host: text(env.DB_POSTGRES_HOST),
        port: toPort(env.DB_POSTGRES_PORT, port),
        username: text(env.DB_POSTGRES_USERNAME),
        password: text(env.DB_POSTGRES_PASSWORD),
        database: text(env.DB_POSTGRES_NAME),
      };
    case DatabaseDialect.MSSQL:
      return {
        dialect,
        host: text(env.DB_MSSQL_HOST),
        port: toPort(env.DB_MSSQL_PORT, port),
        username: text(env.DB_MSSQL_USERNAME),
        password: text(env.DB_MSSQL_PASSWORD),
        database: text(env.DB_MSSQL_NAME),
      };
    case DatabaseDialect.Oracle:
      return {
        dialect,
        host: text(env.DB_ORACLE_HOST),
        port: toPort(env.DB_ORACLE_PORT, port),
        username: text(env.DB_ORACLE_USERNAME),
        password: text(env.DB_ORACLE_PASSWORD),
        database: text(env.DB_ORACLE_NAME),
        connectString: text(env.DB_ORACLE_CONNECT_STRING) || undefined,
      };
    default:
      throw new Error(
        `Error de configuración: DB_DIALECT inválido. Use mysql, postgres, mssql u oracle.`,
      );
  }
}

export function assertActiveDialectCredentials(config: DatabaseConfig): void {
  const prefix: Record<DatabaseDialect, string> = {
    [DatabaseDialect.MySQL]: 'DB_MYSQL',
    [DatabaseDialect.Postgres]: 'DB_POSTGRES',
    [DatabaseDialect.MSSQL]: 'DB_MSSQL',
    [DatabaseDialect.Oracle]: 'DB_ORACLE',
  };
  const tag = prefix[config.dialect];
  const missing: string[] = [];

  if (!config.host) missing.push(`${tag}_HOST`);
  if (!config.username) missing.push(`${tag}_USERNAME`);
  if (!config.database) missing.push(`${tag}_NAME`);
  if (config.dialect === DatabaseDialect.Oracle && !config.connectString) {
    missing.push('DB_ORACLE_CONNECT_STRING');
  }

  if (missing.length > 0) {
    throw new Error(
      `Error de configuración: variable(s) crítica(s) inválida(s) o ausente(s) para ${config.dialect}: ${missing.join(', ')}. Completa el bloque de ese motor en .env (no commitees secretos).`,
    );
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: resolve database credentials per dialect"
```

#### 4.5 — Factory registerAs de entorno

Expone `environment.*` vía ConfigService (`registerAs`).

**Archivo:** `src/config/environment/env.config.ts`

```bash
mkdir -p src/config/environment
cat > src/config/environment/env.config.ts <<'EOF_BACKEND_IA'
import { registerAs } from '@nestjs/config';
import { resolveDialectCredentials } from './db-env';
import { Environment } from './env.interface';
import { validate } from './env.validation';

export const ENV_CONFIG_NAME = 'environment';

export const envConfig = registerAs(ENV_CONFIG_NAME, () => {
  const validated = validate(process.env);

  return {
    app: {
      port: validated.PORT,
      nodeEnv: validated.NODE_ENV ?? Environment.Development,
    },
    database: resolveDialectCredentials(validated),
    jwt: {
      secret: validated.JWT_SECRET,
      expiresIn: validated.JWT_EXPIRES_IN,
      refreshSecret: validated.JWT_REFRESH_SECRET,
      refreshExpiresIn: validated.JWT_REFRESH_EXPIRES_IN,
    },
  };
});
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: register environment config factory"
```


------------------------------------------------------------------------

## FASE 5 — `04_BASE_DATABASE_SEQUELIZE`

### Base de datos multi-dialecto (Sequelize)

> **Objetivo de la fase:** Conectar Sequelize al motor de `DB_DIALECT` usando el bloque `DB_MYSQL_*` / `DB_POSTGRES_*` / `DB_MSSQL_*` / `DB_ORACLE_*`. Aún sin features (ALL_MODELS vacío).

#### 5.1 — Constante SEQUELIZE_TOKEN

Token DI para inyectar la instancia Sequelize en repositorios.

**Archivo:** `src/common/constants/database.constants.ts`

```bash
mkdir -p src/common/constants
cat > src/common/constants/database.constants.ts <<'EOF_BACKEND_IA'
export const SEQUELIZE_TOKEN = 'SEQUELIZE';
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add SEQUELIZE_TOKEN constant"
```

#### 5.2 — Tipos auxiliares de database config

Tipos auxiliares del bloque config/database (legado/compat).

**Archivo:** `src/config/database/database.types.ts`

```bash
mkdir -p src/config/database
cat > src/config/database/database.types.ts <<'EOF_BACKEND_IA'
import { Options as SequelizeOptions } from 'sequelize';

export type DialectOptions =
  | { dialect: 'mysql'; options?: SequelizeOptions }
  | { dialect: 'postgres'; options?: SequelizeOptions }
  | { dialect: 'mssql'; options?: SequelizeOptions }
  | { dialect: 'oracle'; options?: SequelizeOptions };
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add database.types helpers"
```

#### 5.3 — database.config.ts

Factory registerAs opcional para namespace `database` (complementa environment).

**Archivo:** `src/config/database/database.config.ts`

```bash
mkdir -p src/config/database
cat > src/config/database/database.config.ts <<'EOF_BACKEND_IA'
import { registerAs } from '@nestjs/config';
import { resolveDialectCredentials } from '../environment/db-env';
import { DatabaseDialect } from '../environment/env.interface';

export const DATABASE_CONFIG_NAME = 'database';

const dialectModuleMap: Record<DatabaseDialect, string> = {
  [DatabaseDialect.MySQL]: 'mysql2',
  [DatabaseDialect.Postgres]: 'pg',
  [DatabaseDialect.MSSQL]: 'tedious',
  [DatabaseDialect.Oracle]: 'oracledb',
};

export const databaseConfig = registerAs(DATABASE_CONFIG_NAME, () => {
  const dialect =
    (process.env.DB_DIALECT as DatabaseDialect) || DatabaseDialect.MySQL;
  const credentials = resolveDialectCredentials({
    DB_DIALECT: dialect,
    ...process.env,
  });

  return {
    ...credentials,
    dialectModulePath: dialectModuleMap[dialect],
    autoLoadModels: true,
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  };
});
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add database.config registerAs"
```

#### 5.4 — database.module.ts / providers

Módulo de configuración de BD (forFeature). Los providers quedan vacíos a propósito.

**Archivo:** `src/config/database/database.module.ts`

```bash
mkdir -p src/config/database
cat > src/config/database/database.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig } from './database.config';

@Module({
  imports: [ConfigModule.forFeature(databaseConfig)],
  exports: [ConfigModule],
})
export class DatabaseConfigModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add DatabaseConfigModule"
```

#### 5.5 — database.providers.ts

Placeholder de providers de config/database.

**Archivo:** `src/config/database/database.providers.ts`

```bash
mkdir -p src/config/database
cat > src/config/database/database.providers.ts <<'EOF_BACKEND_IA'
export const DATABASE_PROVIDERS = [];
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add empty DATABASE_PROVIDERS"
```

#### 5.6 — Opciones Sequelize por dialecto

Arma host/port/user/password/logging con el bloque del motor seleccionado por DB_DIALECT.

**Archivo:** `src/infrastructure/database/sequelize/sequelize.options.ts`

```bash
mkdir -p src/infrastructure/database/sequelize
cat > src/infrastructure/database/sequelize/sequelize.options.ts <<'EOF_BACKEND_IA'
import { SequelizeOptions } from 'sequelize-typescript';
import { resolveDialectCredentials } from '../../../config/environment/db-env';
import { DatabaseDialect } from '../../../config/environment/env.interface';

export function getSequelizeOptions(
  dialect: DatabaseDialect,
): Partial<SequelizeOptions> {
  const credentials = resolveDialectCredentials({
    DB_DIALECT: dialect,
    ...process.env,
  });

  const base: SequelizeOptions = {
    dialect: dialect as SequelizeOptions['dialect'],
    host: credentials.host,
    port: credentials.port,
    username: credentials.username,
    password: credentials.password,
    database: credentials.database,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      underscored: false,
      freezeTableName: true,
    },
  };

  switch (dialect) {
    case DatabaseDialect.MSSQL:
      return {
        ...base,
        dialectOptions: {
          options: {
            encrypt: true,
            trustServerCertificate: true,
          },
        },
      };
    case DatabaseDialect.Oracle:
      return {
        ...base,
        dialectOptions: {
          connectString: credentials.connectString,
        },
      };
    default:
      return base;
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add getSequelizeOptions multi-dialect"
```

#### 5.7 — Factory Sequelize (sin modelos aún)

Crea la instancia Sequelize. `ALL_MODELS` empieza vacío: se llena al crear cada entidad.

**Archivo:** `src/infrastructure/database/sequelize/sequelize.factory.ts`

```bash
mkdir -p src/infrastructure/database/sequelize
cat > src/infrastructure/database/sequelize/sequelize.factory.ts <<'EOF_BACKEND_IA'
import { Sequelize } from 'sequelize-typescript';
import { DatabaseDialect } from '../../../config/environment/env.interface';
import { getSequelizeOptions } from './sequelize.options';


export const ALL_MODELS = [
  // (aún sin modelos — se agregan por feature)
];

export async function createSequelizeInstance(
  dialect: DatabaseDialect,
): Promise<Sequelize> {
  const options = getSequelizeOptions(dialect);

  let dialectModule: any;

  switch (dialect) {
    case DatabaseDialect.MySQL:
      dialectModule = require('mysql2');
      break;
    case DatabaseDialect.Postgres:
      dialectModule = require('pg');
      break;
    case DatabaseDialect.MSSQL:
      dialectModule = require('tedious');
      break;
    case DatabaseDialect.Oracle:
      dialectModule = require('oracledb');
      break;
    default:
      throw new Error(`Dialecto no soportado: ${dialect}`);
  }

  const sequelize = new Sequelize({
    ...options,
    dialectModule,
    models: ALL_MODELS,
  } as any);

  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión exitosa a ${dialect.toUpperCase()}`);
  } catch (error: any) {
    console.error(
      `❌ Error conectando a ${dialect.toUpperCase()}:`,
      error.message,
    );
    throw error;
  }

  if (process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: false });
    console.log('✅ Tablas sincronizadas');
  }

  return sequelize;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add createSequelizeInstance with empty ALL_MODELS"
```

#### 5.8 — DatabaseSeederService (sin seeders aún)

Hook OnModuleInit para seeders. Todavía no llama a ningún seeder de feature.

**Archivo:** `src/infrastructure/database/seeders/database-seeder.service.ts`

```bash
mkdir -p src/infrastructure/database/seeders
cat > src/infrastructure/database/seeders/database-seeder.service.ts <<'EOF_BACKEND_IA'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';


/**
 * Ejecuta seeders en orden de dependencias.
 * Solo en entornos no productivos.
 */
@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    try {
      // sin seeders aún
      this.logger.log('✅ Seeders ejecutados');
    } catch (error: any) {
      this.logger.error(`❌ Error en seeders: ${error.message}`, error.stack);
      throw error;
    }
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add DatabaseSeederService scaffold"
```

#### 5.9 — Módulo global Sequelize

Módulo `@Global()` que provee `SEQUELIZE_TOKEN` + ejecuta seeders.

**Archivo:** `src/infrastructure/database/sequelize/sequelize.module.ts`

```bash
mkdir -p src/infrastructure/database/sequelize
cat > src/infrastructure/database/sequelize/sequelize.module.ts <<'EOF_BACKEND_IA'
import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Sequelize } from 'sequelize-typescript';
import { DatabaseDialect } from '../../../config/environment/env.interface';
import { SEQUELIZE_TOKEN } from '../../../common/constants/database.constants';
import { createSequelizeInstance } from './sequelize.factory';
import { DatabaseSeederService } from '../seeders/database-seeder.service';

@Global()
@Module({
  providers: [
    {
      provide: SEQUELIZE_TOKEN,
      useFactory: async (configService: ConfigService): Promise<Sequelize> => {
        const dialect = configService.get<DatabaseDialect>(
          'environment.database.dialect',
          DatabaseDialect.MySQL,
        );
        return createSequelizeInstance(dialect);
      },
      inject: [ConfigService],
    },
    DatabaseSeederService,
  ],
  exports: [SEQUELIZE_TOKEN],
})
export class SequelizeDatabaseModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add global SequelizeDatabaseModule"
```

#### 5.10 — Verificar conexión a BD

Crea la BD vacía `tecnogua_ia` en el motor que indica `DB_DIALECT`. Aún no hay tablas de negocio. Si falla el authenticate, corrige el **bloque de ese motor** en `.env` (no el de otro).

```bash
# mysql:
# mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS tecnogua_ia;"
# postgres:
# createdb tecnogua_ia
# mssql (sqlcmd):
# sqlcmd -S localhost -U sa -Q "CREATE DATABASE tecnogua_ia;"
# oracle: crea el schema/PDB que apunte DB_ORACLE_CONNECT_STRING
npm run start:dev
# Busca: ✅ Conexión exitosa a MYSQL (o POSTGRES / MSSQL / ORACLE según DB_DIALECT)
# Ctrl+C
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "test: verify sequelize authenticates against tecnogua_ia"
```


------------------------------------------------------------------------

## FASE 6 — `05_BASE_APP_COMMON_SECURITY`

### App config + Logger + Common + Security + bootstrap

> **Objetivo de la fase:** Dejar la infraestructura transversal lista antes de la primera entidad de negocio. Aún sin Business/Auth en AppModule y sin guards globales.

#### 6.1 — config/app/app.constants.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/config/app/app.constants.ts`

```bash
mkdir -p src/config/app
cat > src/config/app/app.constants.ts <<'EOF_BACKEND_IA'
export const APP_CONFIG_NAME = 'app';

export const APP_DEFAULTS = {
  PORT: 3002,
  NODE_ENV: 'development',
};
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add app.constants.ts"
```

#### 6.2 — config/app/app.config.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/config/app/app.config.ts`

```bash
mkdir -p src/config/app
cat > src/config/app/app.config.ts <<'EOF_BACKEND_IA'
import { registerAs } from '@nestjs/config';
import { APP_CONFIG_NAME, APP_DEFAULTS } from './app.constants';
import { Environment } from '../environment/env.interface';

export const appConfig = registerAs(APP_CONFIG_NAME, () => ({
  port: parseInt(process.env.PORT || String(APP_DEFAULTS.PORT), 10),
  nodeEnv: (process.env.NODE_ENV as Environment) || APP_DEFAULTS.NODE_ENV,
}));
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add app.config.ts"
```

#### 6.3 — config/logger/logger.config.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/config/logger/logger.config.ts`

```bash
mkdir -p src/config/logger
cat > src/config/logger/logger.config.ts <<'EOF_BACKEND_IA'
import { LogLevel } from '@nestjs/common';

export function getLoggerConfig(): { logLevels: LogLevel[] } {
  const isDev = process.env.NODE_ENV === 'development';

  return {
    logLevels: isDev
      ? ['log', 'error', 'warn', 'debug', 'verbose', 'fatal']
      : ['log', 'error', 'warn'],
  };
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add logger.config.ts"
```

#### 6.4 — config/logger/logger.module.ts

Módulo Nest del feature: cablea providers, tokens DI y controller.

**Archivo:** `src/config/logger/logger.module.ts`

```bash
mkdir -p src/config/logger
cat > src/config/logger/logger.module.ts <<'EOF_BACKEND_IA'
import { Module, Global, Logger } from '@nestjs/common';

@Global()
@Module({
  providers: [Logger],
  exports: [Logger],
})
export class LoggerModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: wire nest module logger.module.ts"
```

#### 6.5 — config/jwt/jwt.constants.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/config/jwt/jwt.constants.ts`

```bash
mkdir -p src/config/jwt
cat > src/config/jwt/jwt.constants.ts <<'EOF_BACKEND_IA'
export const JWT_CONFIG_NAME = 'jwt';

export const JWT_DEFAULTS = {
  EXPIRES_IN: '1d',
  REFRESH_EXPIRES_IN: '7d',
};
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add jwt.constants.ts"
```

#### 6.6 — config/jwt/jwt.config.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/config/jwt/jwt.config.ts`

```bash
mkdir -p src/config/jwt
cat > src/config/jwt/jwt.config.ts <<'EOF_BACKEND_IA'
import { registerAs } from '@nestjs/config';
import { JWT_CONFIG_NAME, JWT_DEFAULTS } from './jwt.constants';

export const jwtConfig = registerAs(JWT_CONFIG_NAME, () => ({
  secret: process.env.JWT_SECRET || '',
  expiresIn: process.env.JWT_EXPIRES_IN || JWT_DEFAULTS.EXPIRES_IN,
  refreshSecret: process.env.JWT_REFRESH_SECRET || '',
  refreshExpiresIn:
    process.env.JWT_REFRESH_EXPIRES_IN || JWT_DEFAULTS.REFRESH_EXPIRES_IN,
}));
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add jwt.config.ts"
```

#### 6.7 — config/swagger/swagger.constants.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/config/swagger/swagger.constants.ts`

```bash
mkdir -p src/config/swagger
cat > src/config/swagger/swagger.constants.ts <<'EOF_BACKEND_IA'
export const SWAGGER_TITLE = 'Backend NestJS + Sequelize API';
export const SWAGGER_DESCRIPTION =
  'API profesional con Clean Architecture / DDD, JWT y RBAC';
export const SWAGGER_VERSION = '1.0';
export const SWAGGER_PATH = 'api/docs';
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add swagger.constants.ts"
```

#### 6.8 — config/swagger/swagger.config.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/config/swagger/swagger.config.ts`

```bash
mkdir -p src/config/swagger
cat > src/config/swagger/swagger.config.ts <<'EOF_BACKEND_IA'
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  SWAGGER_DESCRIPTION,
  SWAGGER_PATH,
  SWAGGER_TITLE,
  SWAGGER_VERSION,
} from './swagger.constants';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle(SWAGGER_TITLE)
    .setDescription(SWAGGER_DESCRIPTION)
    .setVersion(SWAGGER_VERSION)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document);
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add swagger.config.ts"
```

#### 6.9 — common/enums/status.enum.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/enums/status.enum.ts`

```bash
mkdir -p src/common/enums
cat > src/common/enums/status.enum.ts <<'EOF_BACKEND_IA'
export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add status.enum.ts"
```

#### 6.10 — common/enums/http-method.enum.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/enums/http-method.enum.ts`

```bash
mkdir -p src/common/enums
cat > src/common/enums/http-method.enum.ts <<'EOF_BACKEND_IA'
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add http-method.enum.ts"
```

#### 6.11 — common/enums/sort-order.enum.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/enums/sort-order.enum.ts`

```bash
mkdir -p src/common/enums
cat > src/common/enums/sort-order.enum.ts <<'EOF_BACKEND_IA'
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sort-order.enum.ts"
```

#### 6.12 — common/constants/app.constants.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/constants/app.constants.ts`

```bash
mkdir -p src/common/constants
cat > src/common/constants/app.constants.ts <<'EOF_BACKEND_IA'
export const APP_NAME = 'backend_ia';
export const GLOBAL_PREFIX = 'api';
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add app.constants.ts"
```

#### 6.13 — common/constants/pagination.constants.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/constants/pagination.constants.ts`

```bash
mkdir -p src/common/constants
cat > src/common/constants/pagination.constants.ts <<'EOF_BACKEND_IA'
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add pagination.constants.ts"
```

#### 6.14 — common/exceptions/application.exception.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/exceptions/application.exception.ts`

```bash
mkdir -p src/common/exceptions
cat > src/common/exceptions/application.exception.ts <<'EOF_BACKEND_IA'
export class ApplicationException extends Error {
  public readonly timestamp: string;

  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add application.exception.ts"
```

#### 6.15 — common/exceptions/domain.exception.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/exceptions/domain.exception.ts`

```bash
mkdir -p src/common/exceptions
cat > src/common/exceptions/domain.exception.ts <<'EOF_BACKEND_IA'
import { ApplicationException } from './application.exception';

export class DomainException extends ApplicationException {
  constructor(message: string) {
    super(message, 400);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain.exception.ts"
```

#### 6.16 — common/exceptions/entity-not-found.exception.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/exceptions/entity-not-found.exception.ts`

```bash
mkdir -p src/common/exceptions
cat > src/common/exceptions/entity-not-found.exception.ts <<'EOF_BACKEND_IA'
import { ApplicationException } from './application.exception';

export class EntityNotFoundException extends ApplicationException {
  constructor(entityName: string, identifier: string | number) {
    super(`${entityName} con ID ${identifier} no encontrado`, 404);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add entity-not-found.exception.ts"
```

#### 6.17 — common/exceptions/validation.exception.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/exceptions/validation.exception.ts`

```bash
mkdir -p src/common/exceptions
cat > src/common/exceptions/validation.exception.ts <<'EOF_BACKEND_IA'
import { ApplicationException } from './application.exception';

export class ValidationException extends ApplicationException {
  constructor(message: string = 'Error de validación') {
    super(message, 422);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add validation.exception.ts"
```

#### 6.18 — common/filters/global-exception.filter.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/filters/global-exception.filter.ts`

```bash
mkdir -p src/common/filters
cat > src/common/filters/global-exception.filter.ts <<'EOF_BACKEND_IA'
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApplicationException } from '../exceptions/application.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';

    if (exception instanceof ApplicationException) {
      status = exception.statusCode;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message;
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add global-exception.filter.ts"
```

#### 6.19 — common/filters/sequelize-exception.filter.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/filters/sequelize-exception.filter.ts`

```bash
mkdir -p src/common/filters
cat > src/common/filters/sequelize-exception.filter.ts <<'EOF_BACKEND_IA'
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class SequelizeExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const sequelizeErrors = [
      'SequelizeUniqueConstraintError',
      'SequelizeForeignKeyConstraintError',
      'SequelizeConnectionError',
      'SequelizeValidationError',
      'SequelizeDatabaseError',
    ];

    if (!exception?.name || !sequelizeErrors.includes(exception.name)) {
      throw exception;
    }

    let status = 500;
    let message = 'Error de base de datos';

    if (exception.name === 'SequelizeUniqueConstraintError') {
      status = 409;
      message = 'El recurso ya existe (violación de unicidad)';
    } else if (exception.name === 'SequelizeForeignKeyConstraintError') {
      status = 400;
      message = 'Violación de clave foránea';
    } else if (exception.name === 'SequelizeConnectionError') {
      status = 503;
      message = 'No se pudo conectar a la base de datos';
    } else if (exception.name === 'SequelizeValidationError') {
      status = 422;
      message = exception.message || 'Error de validación en base de datos';
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize-exception.filter.ts"
```

#### 6.20 — common/interceptors/response.interceptor.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/interceptors/response.interceptor.ts`

```bash
mkdir -p src/common/interceptors
cat > src/common/interceptors/response.interceptor.ts <<'EOF_BACKEND_IA'
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => ({
        statusCode,
        message: 'Operación exitosa',
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add response.interceptor.ts"
```

#### 6.21 — common/interceptors/logging.interceptor.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/interceptors/logging.interceptor.ts`

```bash
mkdir -p src/common/interceptors
cat > src/common/interceptors/logging.interceptor.ts <<'EOF_BACKEND_IA'
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        const delay = Date.now() - now;
        this.logger.log(`${method} ${url} ${res.statusCode} - ${delay}ms`);
      }),
    );
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add logging.interceptor.ts"
```

#### 6.22 — common/interceptors/timeout.interceptor.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/interceptors/timeout.interceptor.ts`

```bash
mkdir -p src/common/interceptors
cat > src/common/interceptors/timeout.interceptor.ts <<'EOF_BACKEND_IA'
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(30000),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => err);
      }),
    );
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add timeout.interceptor.ts"
```

#### 6.23 — common/pipes/validation.pipe.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/pipes/validation.pipe.ts`

```bash
mkdir -p src/common/pipes
cat > src/common/pipes/validation.pipe.ts <<'EOF_BACKEND_IA'
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors.map(
        (err) =>
          `${err.property}: ${Object.values(err.constraints || {}).join(', ')}`,
      );
      throw new BadRequestException(messages);
    }

    return object;
  }

  private toValidate(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add validation.pipe.ts"
```

#### 6.24 — common/pipes/parse-positive-int.pipe.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/pipes/parse-positive-int.pipe.ts`

```bash
mkdir -p src/common/pipes
cat > src/common/pipes/parse-positive-int.pipe.ts <<'EOF_BACKEND_IA'
import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const parsed = parseInt(value, 10);

    if (isNaN(parsed) || parsed <= 0) {
      throw new BadRequestException(
        `El valor '${value}' no es un entero positivo`,
      );
    }

    return parsed;
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add parse-positive-int.pipe.ts"
```

#### 6.25 — common/decorators/public.decorator.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/decorators/public.decorator.ts`

```bash
mkdir -p src/common/decorators
cat > src/common/decorators/public.decorator.ts <<'EOF_BACKEND_IA'
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add public.decorator.ts"
```

#### 6.26 — common/decorators/roles.decorator.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/decorators/roles.decorator.ts`

```bash
mkdir -p src/common/decorators
cat > src/common/decorators/roles.decorator.ts <<'EOF_BACKEND_IA'
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add roles.decorator.ts"
```

#### 6.27 — common/decorators/current-user.decorator.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/decorators/current-user.decorator.ts`

```bash
mkdir -p src/common/decorators
cat > src/common/decorators/current-user.decorator.ts <<'EOF_BACKEND_IA'
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add current-user.decorator.ts"
```

#### 6.28 — common/decorators/resource.decorator.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/decorators/resource.decorator.ts`

```bash
mkdir -p src/common/decorators
cat > src/common/decorators/resource.decorator.ts <<'EOF_BACKEND_IA'
import { SetMetadata } from '@nestjs/common';

export const RESOURCE_KEY = 'resource';
export const ResourceMeta = (path: string, method: string) =>
  SetMetadata(RESOURCE_KEY, { path, method });
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add resource.decorator.ts"
```

#### 6.29 — common/interfaces/authenticated-user.interface.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/interfaces/authenticated-user.interface.ts`

```bash
mkdir -p src/common/interfaces
cat > src/common/interfaces/authenticated-user.interface.ts <<'EOF_BACKEND_IA'
export interface AuthenticatedUser {
  id: number;
  email: string;
  username: string;
  roles: string[];
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add authenticated-user.interface.ts"
```

#### 6.30 — common/interfaces/pagination.interface.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/interfaces/pagination.interface.ts`

```bash
mkdir -p src/common/interfaces
cat > src/common/interfaces/pagination.interface.ts <<'EOF_BACKEND_IA'
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add pagination.interface.ts"
```

#### 6.31 — common/interfaces/api-response.interface.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/interfaces/api-response.interface.ts`

```bash
mkdir -p src/common/interfaces
cat > src/common/interfaces/api-response.interface.ts <<'EOF_BACKEND_IA'
export interface ApiResponseBody<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add api-response.interface.ts"
```

#### 6.32 — common/types/nullable.type.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/types/nullable.type.ts`

```bash
mkdir -p src/common/types
cat > src/common/types/nullable.type.ts <<'EOF_BACKEND_IA'
export type Nullable<T> = T | null;
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add nullable.type.ts"
```

#### 6.33 — common/types/optional.type.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/types/optional.type.ts`

```bash
mkdir -p src/common/types
cat > src/common/types/optional.type.ts <<'EOF_BACKEND_IA'
export type Optional<T> = T | undefined;
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add optional.type.ts"
```

#### 6.34 — common/utils/pagination.util.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/utils/pagination.util.ts`

```bash
mkdir -p src/common/utils
cat > src/common/utils/pagination.util.ts <<'EOF_BACKEND_IA'
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
} from '../constants/pagination.constants';
import { PaginatedResult } from '../interfaces/pagination.interface';

export function normalizePagination(page?: number, limit?: number) {
  const safePage = !page || page < 1 ? DEFAULT_PAGE : page;
  const safeLimit = !limit || limit < 1 ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT);
  const offset = (safePage - 1) * safeLimit;
  return { page: safePage, limit: safeLimit, offset };
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add pagination.util.ts"
```

#### 6.35 — common/utils/date.util.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/utils/date.util.ts`

```bash
mkdir -p src/common/utils
cat > src/common/utils/date.util.ts <<'EOF_BACKEND_IA'
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) {
    return 24 * 60 * 60 * 1000;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add date.util.ts"
```

#### 6.36 — common/utils/string.util.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/common/utils/string.util.ts`

```bash
mkdir -p src/common/utils
cat > src/common/utils/string.util.ts <<'EOF_BACKEND_IA'
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isBlank(value?: string | null): boolean {
  return !value || value.trim().length === 0;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add string.util.ts"
```

#### 6.37 — infrastructure/security/hashing/password-hasher.interface.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/infrastructure/security/hashing/password-hasher.interface.ts`

```bash
mkdir -p src/infrastructure/security/hashing
cat > src/infrastructure/security/hashing/password-hasher.interface.ts <<'EOF_BACKEND_IA'
export const PASSWORD_HASHER = 'PASSWORD_HASHER';

export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add password-hasher.interface.ts"
```

#### 6.38 — infrastructure/security/hashing/bcrypt-password-hasher.service.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/infrastructure/security/hashing/bcrypt-password-hasher.service.ts`

```bash
mkdir -p src/infrastructure/security/hashing
cat > src/infrastructure/security/hashing/bcrypt-password-hasher.service.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IPasswordHasher } from './password-hasher.interface';

@Injectable()
export class BcryptPasswordHasherService implements IPasswordHasher {
  private readonly rounds = 10;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add bcrypt-password-hasher.service.ts"
```

#### 6.39 — infrastructure/security/tokens/token.interface.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/infrastructure/security/tokens/token.interface.ts`

```bash
mkdir -p src/infrastructure/security/tokens
cat > src/infrastructure/security/tokens/token.interface.ts <<'EOF_BACKEND_IA'
export const TOKEN_SERVICE = 'TOKEN_SERVICE';

export interface TokenPayload {
  sub: number;
  email: string;
  username: string;
  roles: string[];
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface ITokenService {
  signAccessToken(payload: TokenPayload): Promise<string>;
  signRefreshToken(payload: TokenPayload): Promise<string>;
  verifyAccessToken(token: string): Promise<TokenPayload>;
  verifyRefreshToken(token: string): Promise<TokenPayload>;
  issueTokens(payload: TokenPayload): Promise<IssuedTokens>;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add token.interface.ts"
```

#### 6.40 — infrastructure/security/tokens/token.service.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/infrastructure/security/tokens/token.service.ts`

```bash
mkdir -p src/infrastructure/security/tokens
cat > src/infrastructure/security/tokens/token.service.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ITokenService,
  IssuedTokens,
  TokenPayload,
} from './token.interface';

@Injectable()
export class TokenService implements ITokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signAccessToken(payload: TokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('environment.jwt.secret'),
      expiresIn: this.configService.get<string>('environment.jwt.expiresIn') as any,
    });
  }

  async signRefreshToken(payload: TokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('environment.jwt.refreshSecret'),
      expiresIn: this.configService.get<string>(
        'environment.jwt.refreshExpiresIn',
      ) as any,
    });
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync<TokenPayload>(token, {
      secret: this.configService.get<string>('environment.jwt.secret'),
    });
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync<TokenPayload>(token, {
      secret: this.configService.get<string>('environment.jwt.refreshSecret'),
    });
  }

  async issueTokens(payload: TokenPayload): Promise<IssuedTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload),
      this.signRefreshToken(payload),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn:
        this.configService.get<string>('environment.jwt.expiresIn') || '1d',
    };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add token.service.ts"
```

#### 6.41 — infrastructure/security/security.module.ts

Módulo Nest del feature: cablea providers, tokens DI y controller.

**Archivo:** `src/infrastructure/security/security.module.ts`

```bash
mkdir -p src/infrastructure/security
cat > src/infrastructure/security/security.module.ts <<'EOF_BACKEND_IA'
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PASSWORD_HASHER } from './hashing/password-hasher.interface';
import { BcryptPasswordHasherService } from './hashing/bcrypt-password-hasher.service';
import { TOKEN_SERVICE } from './tokens/token.interface';
import { TokenService } from './tokens/token.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('environment.jwt.secret') ?? '',
        signOptions: {
          expiresIn: (configService.get<string>('environment.jwt.expiresIn') ??
            '1d') as any,
        },
      }),
    }),
  ],
  providers: [
    BcryptPasswordHasherService,
    {
      provide: PASSWORD_HASHER,
      useExisting: BcryptPasswordHasherService,
    },
    TokenService,
    {
      provide: TOKEN_SERVICE,
      useExisting: TokenService,
    },
  ],
  exports: [
    JwtModule,
    BcryptPasswordHasherService,
    PASSWORD_HASHER,
    TokenService,
    TOKEN_SERVICE,
  ],
})
export class SecurityModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: wire nest module security.module.ts"
```

#### 6.42 — Actualizar main.ts (bootstrap completo)

Prefix global, filters, interceptors, pipes, Swagger y manejo amigable de EADDRINUSE.

**Archivo:** `src/main.ts`

```bash
mkdir -p src
cat > src/main.ts <<'EOF_BACKEND_IA'
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { getLoggerConfig } from './config/logger/logger.config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { CustomValidationPipe } from './common/pipes/validation.pipe';
import { setupSwagger } from './config/swagger/swagger.config';
import { GLOBAL_PREFIX } from './common/constants/app.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: getLoggerConfig().logLevels,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3002);

  app.setGlobalPrefix(GLOBAL_PREFIX);

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new LoggingInterceptor(),
    new TimeoutInterceptor(),
  );

  app.useGlobalPipes(new CustomValidationPipe());

  setupSwagger(app);

  try {
    await app.listen(port);
    console.log(`🚀 Application running on: http://localhost:${port}`);
    console.log(`📘 Swagger: http://localhost:${port}/api/docs`);
  } catch (error: any) {
    if (error?.code === 'EADDRINUSE') {
      console.error(
        `❌ El puerto ${port} ya está en uso (EADDRINUSE).\n` +
          `   Solución rápida:\n` +
          `   1) npm run free:port\n` +
          `   2) npm run start:dev\n` +
          `   O cambia PORT en el archivo .env`,
      );
      await app.close();
      process.exit(1);
    }
    throw error;
  }
}
bootstrap();
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: harden main.ts bootstrap with swagger and global pipes"
```

#### 6.43 — Actualizar app.module.ts (base sin features ni guards)

Cablea Config + Sequelize + Security + Logger. Business/Auth y guards llegan en fases posteriores.

**Archivo:** `src/app.module.ts`

```bash
mkdir -p src
cat > src/app.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './config/environment/env.config';
import { appConfig } from './config/app/app.config';
import { jwtConfig } from './config/jwt/jwt.config';
import { LoggerModule } from './config/logger/logger.module';
import { SequelizeDatabaseModule } from './infrastructure/database/sequelize/sequelize.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig, appConfig, jwtConfig],
      envFilePath: '.env',
    }),
    SequelizeDatabaseModule,
    SecurityModule,
    LoggerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: wire AppModule with config database security logger"
```

#### 6.44 — Verificar bootstrap transversal

La app debe arrancar, mostrar Swagger en `/api/docs` y conectar a BD. Todavía no hay endpoints de negocio.

```bash
npm run start:dev
# Abre http://localhost:3002/api/docs
# Ctrl+C
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "test: verify base infrastructure bootstrap"
```


------------------------------------------------------------------------

## FASE 7 — `06_BUSINESS_CLIENTS`

### Business — Clients (patrón completo CA)

> **Objetivo de la fase:** Primera entidad de negocio. Orden lógico: dominio → infraestructura → aplicación → presentación → módulo → cableado → verificación.

#### 7.1 — features/business/clients/domain/entities/client.entity.ts

Entidad de dominio (TypeScript puro). No extiende Sequelize `Model`. Aquí viven las reglas del negocio.

**Archivo:** `src/features/business/clients/domain/entities/client.entity.ts`

```bash
mkdir -p src/features/business/clients/domain/entities
cat > src/features/business/clients/domain/entities/client.entity.ts <<'EOF_BACKEND_IA'
import { Status } from '../../../../../common/enums/status.enum';
import { isValidEmail } from '../validators/client-email.validator';
import { isValidPhone } from '../validators/client-phone.validator';

export interface ClientProps {
  id?: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  password?: string;
  status?: Status;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Client {
  id?: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  password?: string;
  status: Status;
  createdAt?: Date;
  updatedAt?: Date;

  private constructor(props: ClientProps) {
    this.id = props.id;
    this.name = props.name;
    this.address = props.address;
    this.phone = props.phone;
    this.email = props.email;
    this.password = props.password;
    this.status = props.status ?? Status.ACTIVE;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    props: Omit<ClientProps, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
  ): Client {
    if (!props.name?.trim()) {
      throw new Error('El nombre del cliente es requerido');
    }

    if (props.email && !isValidEmail(props.email)) {
      throw new Error('El email del cliente no es válido');
    }

    if (props.phone && !isValidPhone(props.phone)) {
      throw new Error('El teléfono del cliente no es válido');
    }

    return new Client(props);
  }

  static reconstitute(props: ClientProps): Client {
    return new Client(props);
  }

  update(
    props: Partial<
      Omit<ClientProps, 'id' | 'status' | 'createdAt' | 'updatedAt'>
    >,
  ): void {
    if (props.name !== undefined) {
      if (!props.name.trim()) {
        throw new Error('El nombre del cliente es requerido');
      }
      this.name = props.name;
    }

    if (props.address !== undefined) {
      this.address = props.address;
    }

    if (props.phone !== undefined) {
      if (props.phone && !isValidPhone(props.phone)) {
        throw new Error('El teléfono del cliente no es válido');
      }
      this.phone = props.phone;
    }

    if (props.email !== undefined) {
      if (props.email && !isValidEmail(props.email)) {
        throw new Error('El email del cliente no es válido');
      }
      this.email = props.email;
    }

    if (props.password !== undefined) {
      this.password = props.password;
    }
  }

  deactivate(): void {
    this.status = Status.INACTIVE;
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain entity client.entity.ts"
```

#### 7.2 — features/business/clients/domain/exceptions/client-email-already-exists.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/business/clients/domain/exceptions/client-email-already-exists.exception.ts`

```bash
mkdir -p src/features/business/clients/domain/exceptions
cat > src/features/business/clients/domain/exceptions/client-email-already-exists.exception.ts <<'EOF_BACKEND_IA'
import { DomainException } from '../../../../../common/exceptions/domain.exception';

export class ClientEmailAlreadyExistsException extends DomainException {
  constructor(email: string) {
    super(`El email '${email}' ya está registrado`);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception client-email-already-exists.exception.ts"
```

#### 7.3 — features/business/clients/domain/exceptions/client-not-found.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/business/clients/domain/exceptions/client-not-found.exception.ts`

```bash
mkdir -p src/features/business/clients/domain/exceptions
cat > src/features/business/clients/domain/exceptions/client-not-found.exception.ts <<'EOF_BACKEND_IA'
import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception';

export class ClientNotFoundException extends EntityNotFoundException {
  constructor(id: number) {
    super('Cliente', id);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception client-not-found.exception.ts"
```

#### 7.4 — features/business/clients/domain/interfaces/client-repository.interface.ts

Puerto (contrato) del repositorio. La aplicación depende de esta interface, no de Sequelize.

**Archivo:** `src/features/business/clients/domain/interfaces/client-repository.interface.ts`

```bash
mkdir -p src/features/business/clients/domain/interfaces
cat > src/features/business/clients/domain/interfaces/client-repository.interface.ts <<'EOF_BACKEND_IA'
import { PaginatedResult } from '../../../../../common/interfaces/pagination.interface';
import { Client } from '../entities/client.entity';

export const CLIENT_REPOSITORY = 'CLIENT_REPOSITORY';

export interface ClientFindAllParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface IClientRepository {
  create(client: Client): Promise<Client>;
  update(client: Client): Promise<Client>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<Client | null>;
  findByEmail(email: string): Promise<Client | null>;
  findAll(params: ClientFindAllParams): Promise<PaginatedResult<Client>>;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add repository port client-repository.interface.ts"
```

#### 7.5 — features/business/clients/domain/validators/client-email.validator.ts

Validador de dominio reutilizable (reglas independientes del framework HTTP).

**Archivo:** `src/features/business/clients/domain/validators/client-email.validator.ts`

```bash
mkdir -p src/features/business/clients/domain/validators
cat > src/features/business/clients/domain/validators/client-email.validator.ts <<'EOF_BACKEND_IA'
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain validator client-email.validator.ts"
```

#### 7.6 — features/business/clients/domain/validators/client-phone.validator.ts

Validador de dominio reutilizable (reglas independientes del framework HTTP).

**Archivo:** `src/features/business/clients/domain/validators/client-phone.validator.ts`

```bash
mkdir -p src/features/business/clients/domain/validators
cat > src/features/business/clients/domain/validators/client-phone.validator.ts <<'EOF_BACKEND_IA'
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;
  return phoneRegex.test(phone);
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain validator client-phone.validator.ts"
```

#### 7.7 — features/business/clients/infrastructure/persistence/models/client.model.ts

Modelo Sequelize (`@Table`). Solo infraestructura: mapeo a tabla física.

**Archivo:** `src/features/business/clients/infrastructure/persistence/models/client.model.ts`

```bash
mkdir -p src/features/business/clients/infrastructure/persistence/models
cat > src/features/business/clients/infrastructure/persistence/models/client.model.ts <<'EOF_BACKEND_IA'
import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Status } from '../../../../../../common/enums/status.enum';

@Table({ tableName: 'clients' })
export class ClientModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare address: string | null;

  @Column({ type: DataType.STRING(30), allowNull: true })
  declare phone: string | null;

  @Column({ type: DataType.STRING(150), allowNull: true, unique: true })
  declare email: string | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare password: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(Status)),
    allowNull: false,
    defaultValue: Status.ACTIVE,
  })
  declare status: Status;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @HasMany(() => require('../../../../sales/infrastructure/persistence/models/sale.model').SaleModel)
  declare sales: unknown[];
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize model client.model.ts"
```

#### 7.8 — features/business/clients/infrastructure/persistence/repositories/client.repository.ts

Adaptador del repositorio: implementa el puerto de dominio con Sequelize.

**Archivo:** `src/features/business/clients/infrastructure/persistence/repositories/client.repository.ts`

```bash
mkdir -p src/features/business/clients/infrastructure/persistence/repositories
cat > src/features/business/clients/infrastructure/persistence/repositories/client.repository.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import {
  buildPaginatedResult,
  normalizePagination,
} from '../../../../../../common/utils/pagination.util';
import { Client } from '../../../domain/entities/client.entity';
import {
  ClientFindAllParams,
  IClientRepository,
} from '../../../domain/interfaces/client-repository.interface';
import { ClientMapper } from '../../../application/mappers/client.mapper';
import { ClientModel } from '../models/client.model';

@Injectable()
export class ClientRepository implements IClientRepository {
  async create(client: Client): Promise<Client> {
    const model = await ClientModel.create(ClientMapper.toPersistence(client));
    return ClientMapper.toDomain(model);
  }

  async update(client: Client): Promise<Client> {
    await ClientModel.update(ClientMapper.toPersistence(client), {
      where: { id: client.id },
    });
    const updated = await ClientModel.findByPk(client.id!);
    return ClientMapper.toDomain(updated!);
  }

  async delete(id: number): Promise<void> {
    await ClientModel.destroy({ where: { id } });
  }

  async findById(id: number): Promise<Client | null> {
    const model = await ClientModel.findByPk(id);
    return model ? ClientMapper.toDomain(model) : null;
  }

  async findByEmail(email: string): Promise<Client | null> {
    const model = await ClientModel.findOne({ where: { email } });
    return model ? ClientMapper.toDomain(model) : null;
  }

  async findAll(params: ClientFindAllParams) {
    const { page, limit, offset } = normalizePagination(
      params.page,
      params.limit,
    );

    const where = params.search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${params.search}%` } },
            { email: { [Op.like]: `%${params.search}%` } },
          ],
        }
      : {};

    const { rows, count } = await ClientModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return buildPaginatedResult(
      rows.map((row) => ClientMapper.toDomain(row)),
      count,
      page,
      limit,
    );
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize repository client.repository.ts"
```

#### 7.9 — features/business/clients/infrastructure/persistence/migrations/create-clients-table.migration.ts

Migración documental/auxiliar de la tabla. En dev el sync de Sequelize crea el esquema.

**Archivo:** `src/features/business/clients/infrastructure/persistence/migrations/create-clients-table.migration.ts`

```bash
mkdir -p src/features/business/clients/infrastructure/persistence/migrations
cat > src/features/business/clients/infrastructure/persistence/migrations/create-clients-table.migration.ts <<'EOF_BACKEND_IA'
export const createClientsTableMigration = {
  name: 'create-clients-table',
  async up(): Promise<void> {
    // Sequelize sync handles table creation in development.
    // Production: CREATE TABLE clients (id, name, address, phone, email, password, status, createdAt, updatedAt)
  },
  async down(): Promise<void> {
    // Production: DROP TABLE clients
  },
};
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add migration create-clients-table.migration.ts"
```

#### 7.10 — features/business/clients/infrastructure/persistence/seeders/clients.seeder.ts

Seeder de datos iniciales para desarrollo y verificación física en BD.

**Archivo:** `src/features/business/clients/infrastructure/persistence/seeders/clients.seeder.ts`

```bash
mkdir -p src/features/business/clients/infrastructure/persistence/seeders
cat > src/features/business/clients/infrastructure/persistence/seeders/clients.seeder.ts <<'EOF_BACKEND_IA'
import { ClientModel } from '../models/client.model';
import { BcryptPasswordHasherService } from '../../../../../../infrastructure/security/hashing/bcrypt-password-hasher.service';
import { Status } from '../../../../../../common/enums/status.enum';

export async function seedClients(): Promise<void> {
  const count = await ClientModel.count();
  if (count > 0) {
    return;
  }

  const hasher = new BcryptPasswordHasherService();

  await ClientModel.bulkCreate([
    {
      name: 'Juan Pérez',
      address: 'Calle Principal 123',
      phone: '+57 300 1234567',
      email: 'juan.perez@example.com',
      password: await hasher.hash('password123'),
      status: Status.ACTIVE,
    },
    {
      name: 'María García',
      address: 'Av. Central 456',
      phone: '+57 310 9876543',
      email: 'maria.garcia@example.com',
      password: await hasher.hash('password123'),
      status: Status.ACTIVE,
    },
  ]);
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add seeder clients.seeder.ts"
```

#### 7.11 — features/business/clients/application/dto/client-filter.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/business/clients/application/dto/client-filter.dto.ts`

```bash
mkdir -p src/features/business/clients/application/dto
cat > src/features/business/clients/application/dto/client-filter.dto.ts <<'EOF_BACKEND_IA'
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class ClientFilterDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number;

  @ApiPropertyOptional({ example: 'juan' })
  @IsOptional()
  @IsString()
  search?: string;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto client-filter.dto.ts"
```

#### 7.12 — features/business/clients/application/dto/client-response.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/business/clients/application/dto/client-response.dto.ts`

```bash
mkdir -p src/features/business/clients/application/dto
cat > src/features/business/clients/application/dto/client-response.dto.ts <<'EOF_BACKEND_IA'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '../../../../../common/enums/status.enum';

export class ClientResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Juan Pérez' })
  name: string;

  @ApiPropertyOptional({ example: 'Calle Principal 123' })
  address?: string;

  @ApiPropertyOptional({ example: '+57 300 1234567' })
  phone?: string;

  @ApiPropertyOptional({ example: 'juan.perez@example.com' })
  email?: string;

  @ApiProperty({ enum: Status, example: Status.ACTIVE })
  status: Status;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto client-response.dto.ts"
```

#### 7.13 — features/business/clients/application/dto/create-client.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/business/clients/application/dto/create-client.dto.ts`

```bash
mkdir -p src/features/business/clients/application/dto
cat > src/features/business/clients/application/dto/create-client.dto.ts <<'EOF_BACKEND_IA'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'Calle Principal 123' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: '+57 300 1234567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'juan.perez@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ example: 'password123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password?: string;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto create-client.dto.ts"
```

#### 7.14 — features/business/clients/application/dto/update-client.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/business/clients/application/dto/update-client.dto.ts`

```bash
mkdir -p src/features/business/clients/application/dto
cat > src/features/business/clients/application/dto/update-client.dto.ts <<'EOF_BACKEND_IA'
import { PartialType } from '@nestjs/mapped-types';
import { CreateClientDto } from './create-client.dto';

export class UpdateClientDto extends PartialType(CreateClientDto) {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto update-client.dto.ts"
```

#### 7.15 — features/business/clients/application/mappers/client.mapper.ts

Mapper entre entidad de dominio y DTO de respuesta.

**Archivo:** `src/features/business/clients/application/mappers/client.mapper.ts`

```bash
mkdir -p src/features/business/clients/application/mappers
cat > src/features/business/clients/application/mappers/client.mapper.ts <<'EOF_BACKEND_IA'
import { Status } from '../../../../../common/enums/status.enum';
import { Client } from '../../domain/entities/client.entity';
import { ClientResponseDto } from '../dto/client-response.dto';
import { ClientModel } from '../../infrastructure/persistence/models/client.model';

export class ClientMapper {
  static toDomain(model: ClientModel): Client {
    return Client.reconstitute({
      id: model.id,
      name: model.name,
      address: model.address ?? undefined,
      phone: model.phone ?? undefined,
      email: model.email ?? undefined,
      password: model.password ?? undefined,
      status: model.status,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toResponse(entity: Client): ClientResponseDto {
    return {
      id: entity.id!,
      name: entity.name,
      address: entity.address,
      phone: entity.phone,
      email: entity.email,
      status: entity.status,
      createdAt: entity.createdAt!,
      updatedAt: entity.updatedAt!,
    };
  }

  static toPersistence(entity: Client): Partial<ClientModel> {
    return {
      id: entity.id,
      name: entity.name,
      address: entity.address ?? null,
      phone: entity.phone ?? null,
      email: entity.email ?? null,
      password: entity.password ?? null,
      status: entity.status ?? Status.ACTIVE,
    };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add mapper client.mapper.ts"
```

#### 7.16 — features/business/clients/application/use-cases/create-client.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/business/clients/application/use-cases/create-client.use-case.ts`

```bash
mkdir -p src/features/business/clients/application/use-cases
cat > src/features/business/clients/application/use-cases/create-client.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import {
  type IPasswordHasher,
  PASSWORD_HASHER,
} from '../../../../../infrastructure/security/hashing/password-hasher.interface';
import { ClientEmailAlreadyExistsException } from '../../domain/exceptions/client-email-already-exists.exception';
import { Client } from '../../domain/entities/client.entity';
import {
  CLIENT_REPOSITORY,
  type IClientRepository,
} from '../../domain/interfaces/client-repository.interface';
import { CreateClientDto } from '../dto/create-client.dto';
import { ClientMapper } from '../mappers/client.mapper';

@Injectable()
export class CreateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(dto: CreateClientDto) {
    if (dto.email) {
      const existing = await this.clientRepository.findByEmail(dto.email);
      if (existing) {
        throw new ClientEmailAlreadyExistsException(dto.email);
      }
    }

    let password = dto.password;
    if (password) {
      password = await this.passwordHasher.hash(password);
    }

    const client = Client.create({
      name: dto.name,
      address: dto.address,
      phone: dto.phone,
      email: dto.email,
      password,
    });

    const created = await this.clientRepository.create(client);
    return ClientMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case create-client.use-case.ts"
```

#### 7.17 — features/business/clients/application/use-cases/delete-client.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/business/clients/application/use-cases/delete-client.use-case.ts`

```bash
mkdir -p src/features/business/clients/application/use-cases
cat > src/features/business/clients/application/use-cases/delete-client.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ClientNotFoundException } from '../../domain/exceptions/client-not-found.exception';
import {
  CLIENT_REPOSITORY,
  type IClientRepository,
} from '../../domain/interfaces/client-repository.interface';

@Injectable()
export class DeleteClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new ClientNotFoundException(id);
    }

    await this.clientRepository.delete(id);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case delete-client.use-case.ts"
```

#### 7.18 — features/business/clients/application/use-cases/get-client.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/business/clients/application/use-cases/get-client.use-case.ts`

```bash
mkdir -p src/features/business/clients/application/use-cases
cat > src/features/business/clients/application/use-cases/get-client.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ClientNotFoundException } from '../../domain/exceptions/client-not-found.exception';
import {
  CLIENT_REPOSITORY,
  type IClientRepository,
} from '../../domain/interfaces/client-repository.interface';
import { ClientMapper } from '../mappers/client.mapper';

@Injectable()
export class GetClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
  ) {}

  async execute(id: number) {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new ClientNotFoundException(id);
    }

    return ClientMapper.toResponse(client);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case get-client.use-case.ts"
```

#### 7.19 — features/business/clients/application/use-cases/list-clients.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/business/clients/application/use-cases/list-clients.use-case.ts`

```bash
mkdir -p src/features/business/clients/application/use-cases
cat > src/features/business/clients/application/use-cases/list-clients.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import {
  CLIENT_REPOSITORY,
  type IClientRepository,
} from '../../domain/interfaces/client-repository.interface';
import { ClientFilterDto } from '../dto/client-filter.dto';
import { ClientMapper } from '../mappers/client.mapper';

@Injectable()
export class ListClientsUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
  ) {}

  async execute(filter: ClientFilterDto) {
    const result = await this.clientRepository.findAll(filter);
    return {
      items: result.items.map((client) => ClientMapper.toResponse(client)),
      meta: result.meta,
    };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case list-clients.use-case.ts"
```

#### 7.20 — features/business/clients/application/use-cases/update-client.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/business/clients/application/use-cases/update-client.use-case.ts`

```bash
mkdir -p src/features/business/clients/application/use-cases
cat > src/features/business/clients/application/use-cases/update-client.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import {
  type IPasswordHasher,
  PASSWORD_HASHER,
} from '../../../../../infrastructure/security/hashing/password-hasher.interface';
import { ClientEmailAlreadyExistsException } from '../../domain/exceptions/client-email-already-exists.exception';
import { ClientNotFoundException } from '../../domain/exceptions/client-not-found.exception';
import {
  CLIENT_REPOSITORY,
  type IClientRepository,
} from '../../domain/interfaces/client-repository.interface';
import { UpdateClientDto } from '../dto/update-client.dto';
import { ClientMapper } from '../mappers/client.mapper';

@Injectable()
export class UpdateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(id: number, dto: UpdateClientDto) {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new ClientNotFoundException(id);
    }

    if (dto.email && dto.email !== client.email) {
      const existing = await this.clientRepository.findByEmail(dto.email);
      if (existing) {
        throw new ClientEmailAlreadyExistsException(dto.email);
      }
    }

    const updateData = { ...dto };
    if (dto.password) {
      updateData.password = await this.passwordHasher.hash(dto.password);
    }

    client.update(updateData);
    const updated = await this.clientRepository.update(client);
    return ClientMapper.toResponse(updated);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case update-client.use-case.ts"
```

#### 7.21 — features/business/clients/presentation/http/serializers/client.serializer.ts

Serializer de presentación (forma estable de la respuesta HTTP).

**Archivo:** `src/features/business/clients/presentation/http/serializers/client.serializer.ts`

```bash
mkdir -p src/features/business/clients/presentation/http/serializers
cat > src/features/business/clients/presentation/http/serializers/client.serializer.ts <<'EOF_BACKEND_IA'
import { Client } from '../../../domain/entities/client.entity';
import { ClientResponseDto } from '../../../application/dto/client-response.dto';
import { ClientMapper } from '../../../application/mappers/client.mapper';

export class ClientSerializer {
  static serialize(entity: Client): ClientResponseDto {
    return ClientMapper.toResponse(entity);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add serializer client.serializer.ts"
```

#### 7.22 — features/business/clients/presentation/http/controllers/clients.controller.ts

Controller delgado: valida DTO, llama use-case, devuelve respuesta.

**Archivo:** `src/features/business/clients/presentation/http/controllers/clients.controller.ts`

```bash
mkdir -p src/features/business/clients/presentation/http/controllers
cat > src/features/business/clients/presentation/http/controllers/clients.controller.ts <<'EOF_BACKEND_IA'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ParsePositiveIntPipe } from '../../../../../../common/pipes/parse-positive-int.pipe';
import { CreateClientDto } from '../../../application/dto/create-client.dto';
import { UpdateClientDto } from '../../../application/dto/update-client.dto';
import { ClientFilterDto } from '../../../application/dto/client-filter.dto';
import { ClientResponseDto } from '../../../application/dto/client-response.dto';
import { CreateClientUseCase } from '../../../application/use-cases/create-client.use-case';
import { UpdateClientUseCase } from '../../../application/use-cases/update-client.use-case';
import { DeleteClientUseCase } from '../../../application/use-cases/delete-client.use-case';
import { GetClientUseCase } from '../../../application/use-cases/get-client.use-case';
import { ListClientsUseCase } from '../../../application/use-cases/list-clients.use-case';

@ApiTags('Clients')
@Controller('clients')
export class ClientsController {
  constructor(
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly updateClientUseCase: UpdateClientUseCase,
    private readonly deleteClientUseCase: DeleteClientUseCase,
    private readonly getClientUseCase: GetClientUseCase,
    private readonly listClientsUseCase: ListClientsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un cliente' })
  @ApiCreatedResponse({ type: ClientResponseDto })
  create(@Body() dto: CreateClientDto) {
    return this.createClientUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes' })
  @ApiOkResponse({ type: [ClientResponseDto] })
  findAll(@Query() filter: ClientFilterDto) {
    return this.listClientsUseCase.execute(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cliente por ID' })
  @ApiOkResponse({ type: ClientResponseDto })
  findOne(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.getClientUseCase.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un cliente' })
  @ApiOkResponse({ type: ClientResponseDto })
  update(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Body() dto: UpdateClientDto,
  ) {
    return this.updateClientUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un cliente' })
  @ApiNoContentResponse()
  remove(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.deleteClientUseCase.execute(id);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add controller clients.controller.ts"
```

#### 7.23 — features/business/clients/index.ts

Barrel export del feature para imports limpios.

**Archivo:** `src/features/business/clients/index.ts`

```bash
mkdir -p src/features/business/clients
cat > src/features/business/clients/index.ts <<'EOF_BACKEND_IA'
export { ClientsModule } from './clients.module';
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add barrel export clients"
```

#### 7.24 — features/business/clients/clients.module.ts

Módulo Nest del feature: cablea providers, tokens DI y controller.

**Archivo:** `src/features/business/clients/clients.module.ts`

```bash
mkdir -p src/features/business/clients
cat > src/features/business/clients/clients.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { BcryptPasswordHasherService } from '../../../infrastructure/security/hashing/bcrypt-password-hasher.service';
import { PASSWORD_HASHER } from '../../../infrastructure/security/hashing/password-hasher.interface';
import { CLIENT_REPOSITORY } from './domain/interfaces/client-repository.interface';
import { ClientRepository } from './infrastructure/persistence/repositories/client.repository';
import { CreateClientUseCase } from './application/use-cases/create-client.use-case';
import { UpdateClientUseCase } from './application/use-cases/update-client.use-case';
import { DeleteClientUseCase } from './application/use-cases/delete-client.use-case';
import { GetClientUseCase } from './application/use-cases/get-client.use-case';
import { ListClientsUseCase } from './application/use-cases/list-clients.use-case';
import { ClientsController } from './presentation/http/controllers/clients.controller';

@Module({
  controllers: [ClientsController],
  providers: [
    ClientRepository,
    { provide: CLIENT_REPOSITORY, useExisting: ClientRepository },
    BcryptPasswordHasherService,
    { provide: PASSWORD_HASHER, useExisting: BcryptPasswordHasherService },
    CreateClientUseCase,
    UpdateClientUseCase,
    DeleteClientUseCase,
    GetClientUseCase,
    ListClientsUseCase,
  ],
  exports: [CLIENT_REPOSITORY],
})
export class ClientsModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: wire nest module clients.module.ts"
```

#### 7.25 — Actualizar sequelize.factory.ts (registrar modelos)

Registra en ALL_MODELS solo los modelos ya creados (orden de dependencias).

**Archivo:** `src/infrastructure/database/sequelize/sequelize.factory.ts`

```bash
mkdir -p src/infrastructure/database/sequelize
cat > src/infrastructure/database/sequelize/sequelize.factory.ts <<'EOF_BACKEND_IA'
import { Sequelize } from 'sequelize-typescript';
import { DatabaseDialect } from '../../../config/environment/env.interface';
import { getSequelizeOptions } from './sequelize.options';

import { ClientModel } from '../../../features/business/clients/infrastructure/persistence/models/client.model';

export const ALL_MODELS = [
  ClientModel,
];

export async function createSequelizeInstance(
  dialect: DatabaseDialect,
): Promise<Sequelize> {
  const options = getSequelizeOptions(dialect);

  let dialectModule: any;

  switch (dialect) {
    case DatabaseDialect.MySQL:
      dialectModule = require('mysql2');
      break;
    case DatabaseDialect.Postgres:
      dialectModule = require('pg');
      break;
    case DatabaseDialect.MSSQL:
      dialectModule = require('tedious');
      break;
    case DatabaseDialect.Oracle:
      dialectModule = require('oracledb');
      break;
    default:
      throw new Error(`Dialecto no soportado: ${dialect}`);
  }

  const sequelize = new Sequelize({
    ...options,
    dialectModule,
    models: ALL_MODELS,
  } as any);

  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión exitosa a ${dialect.toUpperCase()}`);
  } catch (error: any) {
    console.error(
      `❌ Error conectando a ${dialect.toUpperCase()}:`,
      error.message,
    );
    throw error;
  }

  if (process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: false });
    console.log('✅ Tablas sincronizadas');
  }

  return sequelize;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: register ClientModel in sequelize factory"
```

#### 7.26 — Actualizar business.module.ts

Agrega el feature module de negocio recién terminado.

**Archivo:** `src/features/business/business.module.ts`

```bash
mkdir -p src/features/business
cat > src/features/business/business.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ClientsModule } from './clients/clients.module';

@Module({
  imports: [ClientsModule],
  exports: [ClientsModule],
})
export class BusinessModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: export ClientsModule from BusinessModule"
```

#### 7.27 — Actualizar database-seeder.service.ts

Ejecuta seeders en orden de dependencias al arrancar (dev).

**Archivo:** `src/infrastructure/database/seeders/database-seeder.service.ts`

```bash
mkdir -p src/infrastructure/database/seeders
cat > src/infrastructure/database/seeders/database-seeder.service.ts <<'EOF_BACKEND_IA'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { seedClients } from '../../../features/business/clients/infrastructure/persistence/seeders/clients.seeder';

/**
 * Ejecuta seeders en orden de dependencias.
 * Solo en entornos no productivos.
 */
@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    try {
      await seedClients();
      this.logger.log('✅ Seeders ejecutados');
    } catch (error: any) {
      this.logger.error(`❌ Error en seeders: ${error.message}`, error.stack);
      throw error;
    }
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: run seedClients on bootstrap"
```

#### 7.28 — Actualizar app.module.ts

Importa BusinessModule y/o AuthModule según el avance. Los guards globales llegan en la fase RBAC.

**Archivo:** `src/app.module.ts`

```bash
mkdir -p src
cat > src/app.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './config/environment/env.config';
import { appConfig } from './config/app/app.config';
import { jwtConfig } from './config/jwt/jwt.config';
import { LoggerModule } from './config/logger/logger.module';
import { SequelizeDatabaseModule } from './infrastructure/database/sequelize/sequelize.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { BusinessModule } from './features/business/business.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig, appConfig, jwtConfig],
      envFilePath: '.env',
    }),
    SequelizeDatabaseModule,
    SecurityModule,
    LoggerModule,
    BusinessModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: import BusinessModule into AppModule"
```

#### 7.29 — Verificar tabla física `clients` y API

Arranca la app. Debe crear/sync tabla `clients`, correr seeder y exponer `/api/clients`. Prueba list/create en Swagger o curl.

```bash
npm run start:dev
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "test: verify clients table and crud endpoints"
```


------------------------------------------------------------------------

## FASE 8 — `07_BUSINESS_PRODUCT_TYPES`

### Business — ProductTypes

> **Objetivo de la fase:** Catálogo de tipos de producto. Misma plantilla CA que Clients.

#### 8.1 — features/business/product-types/domain/entities/product-type.entity.ts

Entidad de dominio (TypeScript puro). No extiende Sequelize `Model`. Aquí viven las reglas del negocio.

**Archivo:** `src/features/business/product-types/domain/entities/product-type.entity.ts`

```bash
mkdir -p src/features/business/product-types/domain/entities
cat > src/features/business/product-types/domain/entities/product-type.entity.ts <<'EOF_BACKEND_IA'
import { Status } from '../../../../../common/enums/status.enum';

export interface ProductTypeProps {
  id?: number;
  name: string;
  description?: string;
  status?: Status;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProductType {
  id?: number;
  name: string;
  description?: string;
  status: Status;
  createdAt?: Date;
  updatedAt?: Date;

  private constructor(props: ProductTypeProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.status = props.status ?? Status.ACTIVE;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    props: Omit<ProductTypeProps, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
  ): ProductType {
    if (!props.name?.trim()) {
      throw new Error('El nombre del tipo de producto es requerido');
    }

    return new ProductType(props);
  }

  static reconstitute(props: ProductTypeProps): ProductType {
    return new ProductType(props);
  }

  update(
    props: Partial<
      Omit<ProductTypeProps, 'id' | 'status' | 'createdAt' | 'updatedAt'>
    >,
  ): void {
    if (props.name !== undefined) {
      if (!props.name.trim()) {
        throw new Error('El nombre del tipo de producto es requerido');
      }
      this.name = props.name;
    }

    if (props.description !== undefined) {
      this.description = props.description;
    }
  }

  deactivate(): void {
    this.status = Status.INACTIVE;
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain entity product-type.entity.ts"
```

#### 8.2 — features/business/product-types/domain/exceptions/product-type-not-found.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/business/product-types/domain/exceptions/product-type-not-found.exception.ts`

```bash
mkdir -p src/features/business/product-types/domain/exceptions
cat > src/features/business/product-types/domain/exceptions/product-type-not-found.exception.ts <<'EOF_BACKEND_IA'
import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception';

export class ProductTypeNotFoundException extends EntityNotFoundException {
  constructor(id: number) {
    super('Tipo de producto', id);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception product-type-not-found.exception.ts"
```

#### 8.3 — features/business/product-types/domain/interfaces/product-type-repository.interface.ts

Puerto (contrato) del repositorio. La aplicación depende de esta interface, no de Sequelize.

**Archivo:** `src/features/business/product-types/domain/interfaces/product-type-repository.interface.ts`

```bash
mkdir -p src/features/business/product-types/domain/interfaces
cat > src/features/business/product-types/domain/interfaces/product-type-repository.interface.ts <<'EOF_BACKEND_IA'
import { PaginatedResult } from '../../../../../common/interfaces/pagination.interface';
import { ProductType } from '../entities/product-type.entity';

export const PRODUCT_TYPE_REPOSITORY = 'PRODUCT_TYPE_REPOSITORY';

export interface ProductTypeFindAllParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface IProductTypeRepository {
  create(productType: ProductType): Promise<ProductType>;
  update(productType: ProductType): Promise<ProductType>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<ProductType | null>;
  findAll(params: ProductTypeFindAllParams): Promise<PaginatedResult<ProductType>>;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add repository port product-type-repository.interface.ts"
```

#### 8.4 — features/business/product-types/infrastructure/persistence/models/product-type.model.ts

Modelo Sequelize (`@Table`). Solo infraestructura: mapeo a tabla física.

**Archivo:** `src/features/business/product-types/infrastructure/persistence/models/product-type.model.ts`

```bash
mkdir -p src/features/business/product-types/infrastructure/persistence/models
cat > src/features/business/product-types/infrastructure/persistence/models/product-type.model.ts <<'EOF_BACKEND_IA'
import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Status } from '../../../../../../common/enums/status.enum';

@Table({ tableName: 'product_types' })
export class ProductTypeModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(Status)),
    allowNull: false,
    defaultValue: Status.ACTIVE,
  })
  declare status: Status;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @HasMany(
    () =>
      require('../../../../products/infrastructure/persistence/models/product.model')
        .ProductModel,
  )
  declare products: unknown[];
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize model product-type.model.ts"
```

#### 8.5 — features/business/product-types/infrastructure/persistence/repositories/product-type.repository.ts

Adaptador del repositorio: implementa el puerto de dominio con Sequelize.

**Archivo:** `src/features/business/product-types/infrastructure/persistence/repositories/product-type.repository.ts`

```bash
mkdir -p src/features/business/product-types/infrastructure/persistence/repositories
cat > src/features/business/product-types/infrastructure/persistence/repositories/product-type.repository.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import {
  buildPaginatedResult,
  normalizePagination,
} from '../../../../../../common/utils/pagination.util';
import { ProductType } from '../../../domain/entities/product-type.entity';
import {
  IProductTypeRepository,
  ProductTypeFindAllParams,
} from '../../../domain/interfaces/product-type-repository.interface';
import { ProductTypeMapper } from '../../../application/mappers/product-type.mapper';
import { ProductTypeModel } from '../models/product-type.model';

@Injectable()
export class ProductTypeRepository implements IProductTypeRepository {
  async create(productType: ProductType): Promise<ProductType> {
    const model = await ProductTypeModel.create(
      ProductTypeMapper.toPersistence(productType),
    );
    return ProductTypeMapper.toDomain(model);
  }

  async update(productType: ProductType): Promise<ProductType> {
    await ProductTypeModel.update(
      ProductTypeMapper.toPersistence(productType),
      { where: { id: productType.id } },
    );
    const updated = await ProductTypeModel.findByPk(productType.id!);
    return ProductTypeMapper.toDomain(updated!);
  }

  async delete(id: number): Promise<void> {
    await ProductTypeModel.destroy({ where: { id } });
  }

  async findById(id: number): Promise<ProductType | null> {
    const model = await ProductTypeModel.findByPk(id);
    return model ? ProductTypeMapper.toDomain(model) : null;
  }

  async findAll(params: ProductTypeFindAllParams) {
    const { page, limit, offset } = normalizePagination(
      params.page,
      params.limit,
    );

    const where = params.search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${params.search}%` } },
            { description: { [Op.like]: `%${params.search}%` } },
          ],
        }
      : {};

    const { rows, count } = await ProductTypeModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return buildPaginatedResult(
      rows.map((row) => ProductTypeMapper.toDomain(row)),
      count,
      page,
      limit,
    );
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize repository product-type.repository.ts"
```

#### 8.6 — features/business/product-types/infrastructure/persistence/migrations/create-product-types-table.migration.ts

Migración documental/auxiliar de la tabla. En dev el sync de Sequelize crea el esquema.

**Archivo:** `src/features/business/product-types/infrastructure/persistence/migrations/create-product-types-table.migration.ts`

```bash
mkdir -p src/features/business/product-types/infrastructure/persistence/migrations
cat > src/features/business/product-types/infrastructure/persistence/migrations/create-product-types-table.migration.ts <<'EOF_BACKEND_IA'
export const createProductTypesTableMigration = {
  name: 'create-product-types-table',
  async up(): Promise<void> {
    // Sequelize sync handles table creation in development.
    // Production: CREATE TABLE product_types (id, name, description, status, createdAt, updatedAt)
  },
  async down(): Promise<void> {
    // Production: DROP TABLE product_types
  },
};
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add migration create-product-types-table.migration.ts"
```

#### 8.7 — features/business/product-types/infrastructure/persistence/seeders/product-types.seeder.ts

Seeder de datos iniciales para desarrollo y verificación física en BD.

**Archivo:** `src/features/business/product-types/infrastructure/persistence/seeders/product-types.seeder.ts`

```bash
mkdir -p src/features/business/product-types/infrastructure/persistence/seeders
cat > src/features/business/product-types/infrastructure/persistence/seeders/product-types.seeder.ts <<'EOF_BACKEND_IA'
import { ProductTypeModel } from '../models/product-type.model';
import { Status } from '../../../../../../common/enums/status.enum';

export async function seedProductTypes(): Promise<void> {
  const count = await ProductTypeModel.count();
  if (count > 0) {
    return;
  }

  await ProductTypeModel.bulkCreate([
    {
      name: 'Electronics',
      description: 'Electronic devices and accessories',
      status: Status.ACTIVE,
    },
    {
      name: 'Clothing',
      description: 'Apparel and fashion items',
      status: Status.ACTIVE,
    },
  ]);
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add seeder product-types.seeder.ts"
```

#### 8.8 — features/business/product-types/application/dto/create-product-type.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/business/product-types/application/dto/create-product-type.dto.ts`

```bash
mkdir -p src/features/business/product-types/application/dto
cat > src/features/business/product-types/application/dto/create-product-type.dto.ts <<'EOF_BACKEND_IA'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProductTypeDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Electronic devices and accessories' })
  @IsOptional()
  @IsString()
  description?: string;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto create-product-type.dto.ts"
```

#### 8.9 — features/business/product-types/application/dto/product-type-filter.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/business/product-types/application/dto/product-type-filter.dto.ts`

```bash
mkdir -p src/features/business/product-types/application/dto
cat > src/features/business/product-types/application/dto/product-type-filter.dto.ts <<'EOF_BACKEND_IA'
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class ProductTypeFilterDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number;

  @ApiPropertyOptional({ example: 'electronics' })
  @IsOptional()
  @IsString()
  search?: string;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto product-type-filter.dto.ts"
```

#### 8.10 — features/business/product-types/application/dto/product-type-response.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/business/product-types/application/dto/product-type-response.dto.ts`

```bash
mkdir -p src/features/business/product-types/application/dto
cat > src/features/business/product-types/application/dto/product-type-response.dto.ts <<'EOF_BACKEND_IA'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '../../../../../common/enums/status.enum';

export class ProductTypeResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Electronics' })
  name: string;

  @ApiPropertyOptional({ example: 'Electronic devices and accessories' })
  description?: string;

  @ApiProperty({ enum: Status, example: Status.ACTIVE })
  status: Status;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto product-type-response.dto.ts"
```

#### 8.11 — features/business/product-types/application/dto/update-product-type.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/business/product-types/application/dto/update-product-type.dto.ts`

```bash
mkdir -p src/features/business/product-types/application/dto
cat > src/features/business/product-types/application/dto/update-product-type.dto.ts <<'EOF_BACKEND_IA'
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductTypeDto } from './create-product-type.dto';

export class UpdateProductTypeDto extends PartialType(CreateProductTypeDto) {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto update-product-type.dto.ts"
```

#### 8.12 — features/business/product-types/application/mappers/product-type.mapper.ts

Mapper entre entidad de dominio y DTO de respuesta.

**Archivo:** `src/features/business/product-types/application/mappers/product-type.mapper.ts`

```bash
mkdir -p src/features/business/product-types/application/mappers
cat > src/features/business/product-types/application/mappers/product-type.mapper.ts <<'EOF_BACKEND_IA'
import { Status } from '../../../../../common/enums/status.enum';
import { ProductType } from '../../domain/entities/product-type.entity';
import { ProductTypeResponseDto } from '../dto/product-type-response.dto';
import { ProductTypeModel } from '../../infrastructure/persistence/models/product-type.model';

export class ProductTypeMapper {
  static toDomain(model: ProductTypeModel): ProductType {
    return ProductType.reconstitute({
      id: model.id,
      name: model.name,
      description: model.description ?? undefined,
      status: model.status,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toResponse(entity: ProductType): ProductTypeResponseDto {
    return {
      id: entity.id!,
      name: entity.name,
      description: entity.description,
      status: entity.status,
      createdAt: entity.createdAt!,
      updatedAt: entity.updatedAt!,
    };
  }

  static toPersistence(entity: ProductType): Partial<ProductTypeModel> {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description ?? null,
      status: entity.status ?? Status.ACTIVE,
    };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add mapper product-type.mapper.ts"
```

#### 8.13 — features/business/product-types/application/use-cases/create-product-type.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/business/product-types/application/use-cases/create-product-type.use-case.ts`

```bash
mkdir -p src/features/business/product-types/application/use-cases
cat > src/features/business/product-types/application/use-cases/create-product-type.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ProductType } from '../../domain/entities/product-type.entity';
import {
  type IProductTypeRepository,
  PRODUCT_TYPE_REPOSITORY,
} from '../../domain/interfaces/product-type-repository.interface';
import { CreateProductTypeDto } from '../dto/create-product-type.dto';
import { ProductTypeMapper } from '../mappers/product-type.mapper';

@Injectable()
export class CreateProductTypeUseCase {
  constructor(
    @Inject(PRODUCT_TYPE_REPOSITORY)
    private readonly productTypeRepository: IProductTypeRepository,
  ) {}

  async execute(dto: CreateProductTypeDto) {
    const productType = ProductType.create(dto);
    const created = await this.productTypeRepository.create(productType);
    return ProductTypeMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case create-product-type.use-case.ts"
```

#### 8.14 — features/business/product-types/application/use-cases/delete-product-type.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/business/product-types/application/use-cases/delete-product-type.use-case.ts`

```bash
mkdir -p src/features/business/product-types/application/use-cases
cat > src/features/business/product-types/application/use-cases/delete-product-type.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ProductTypeNotFoundException } from '../../domain/exceptions/product-type-not-found.exception';
import {
  type IProductTypeRepository,
  PRODUCT_TYPE_REPOSITORY,
} from '../../domain/interfaces/product-type-repository.interface';

@Injectable()
export class DeleteProductTypeUseCase {
  constructor(
    @Inject(PRODUCT_TYPE_REPOSITORY)
    private readonly productTypeRepository: IProductTypeRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const productType = await this.productTypeRepository.findById(id);
    if (!productType) {
      throw new ProductTypeNotFoundException(id);
    }

    await this.productTypeRepository.delete(id);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case delete-product-type.use-case.ts"
```

#### 8.15 — features/business/product-types/application/use-cases/get-product-type.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/business/product-types/application/use-cases/get-product-type.use-case.ts`

```bash
mkdir -p src/features/business/product-types/application/use-cases
cat > src/features/business/product-types/application/use-cases/get-product-type.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ProductTypeNotFoundException } from '../../domain/exceptions/product-type-not-found.exception';
import {
  type IProductTypeRepository,
  PRODUCT_TYPE_REPOSITORY,
} from '../../domain/interfaces/product-type-repository.interface';
import { ProductTypeMapper } from '../mappers/product-type.mapper';

@Injectable()
export class GetProductTypeUseCase {
  constructor(
    @Inject(PRODUCT_TYPE_REPOSITORY)
    private readonly productTypeRepository: IProductTypeRepository,
  ) {}

  async execute(id: number) {
    const productType = await this.productTypeRepository.findById(id);
    if (!productType) {
      throw new ProductTypeNotFoundException(id);
    }

    return ProductTypeMapper.toResponse(productType);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case get-product-type.use-case.ts"
```

#### 8.16 — features/business/product-types/application/use-cases/list-product-types.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/business/product-types/application/use-cases/list-product-types.use-case.ts`

```bash
mkdir -p src/features/business/product-types/application/use-cases
cat > src/features/business/product-types/application/use-cases/list-product-types.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import {
  type IProductTypeRepository,
  PRODUCT_TYPE_REPOSITORY,
} from '../../domain/interfaces/product-type-repository.interface';
import { ProductTypeFilterDto } from '../dto/product-type-filter.dto';
import { ProductTypeMapper } from '../mappers/product-type.mapper';

@Injectable()
export class ListProductTypesUseCase {
  constructor(
    @Inject(PRODUCT_TYPE_REPOSITORY)
    private readonly productTypeRepository: IProductTypeRepository,
  ) {}

  async execute(filter: ProductTypeFilterDto) {
    const result = await this.productTypeRepository.findAll(filter);
    return {
      items: result.items.map((pt) => ProductTypeMapper.toResponse(pt)),
      meta: result.meta,
    };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case list-product-types.use-case.ts"
```

#### 8.17 — features/business/product-types/application/use-cases/update-product-type.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/business/product-types/application/use-cases/update-product-type.use-case.ts`

```bash
mkdir -p src/features/business/product-types/application/use-cases
cat > src/features/business/product-types/application/use-cases/update-product-type.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ProductTypeNotFoundException } from '../../domain/exceptions/product-type-not-found.exception';
import {
  type IProductTypeRepository,
  PRODUCT_TYPE_REPOSITORY,
} from '../../domain/interfaces/product-type-repository.interface';
import { UpdateProductTypeDto } from '../dto/update-product-type.dto';
import { ProductTypeMapper } from '../mappers/product-type.mapper';

@Injectable()
export class UpdateProductTypeUseCase {
  constructor(
    @Inject(PRODUCT_TYPE_REPOSITORY)
    private readonly productTypeRepository: IProductTypeRepository,
  ) {}

  async execute(id: number, dto: UpdateProductTypeDto) {
    const productType = await this.productTypeRepository.findById(id);
    if (!productType) {
      throw new ProductTypeNotFoundException(id);
    }

    productType.update(dto);
    const updated = await this.productTypeRepository.update(productType);
    return ProductTypeMapper.toResponse(updated);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case update-product-type.use-case.ts"
```

#### 8.18 — features/business/product-types/presentation/http/serializers/product-type.serializer.ts

Serializer de presentación (forma estable de la respuesta HTTP).

**Archivo:** `src/features/business/product-types/presentation/http/serializers/product-type.serializer.ts`

```bash
mkdir -p src/features/business/product-types/presentation/http/serializers
cat > src/features/business/product-types/presentation/http/serializers/product-type.serializer.ts <<'EOF_BACKEND_IA'
import { ProductType } from '../../../domain/entities/product-type.entity';
import { ProductTypeResponseDto } from '../../../application/dto/product-type-response.dto';
import { ProductTypeMapper } from '../../../application/mappers/product-type.mapper';

export class ProductTypeSerializer {
  static serialize(entity: ProductType): ProductTypeResponseDto {
    return ProductTypeMapper.toResponse(entity);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add serializer product-type.serializer.ts"
```

#### 8.19 — features/business/product-types/presentation/http/controllers/product-types.controller.ts

Controller delgado: valida DTO, llama use-case, devuelve respuesta.

**Archivo:** `src/features/business/product-types/presentation/http/controllers/product-types.controller.ts`

```bash
mkdir -p src/features/business/product-types/presentation/http/controllers
cat > src/features/business/product-types/presentation/http/controllers/product-types.controller.ts <<'EOF_BACKEND_IA'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ParsePositiveIntPipe } from '../../../../../../common/pipes/parse-positive-int.pipe';
import { CreateProductTypeDto } from '../../../application/dto/create-product-type.dto';
import { UpdateProductTypeDto } from '../../../application/dto/update-product-type.dto';
import { ProductTypeFilterDto } from '../../../application/dto/product-type-filter.dto';
import { ProductTypeResponseDto } from '../../../application/dto/product-type-response.dto';
import { CreateProductTypeUseCase } from '../../../application/use-cases/create-product-type.use-case';
import { UpdateProductTypeUseCase } from '../../../application/use-cases/update-product-type.use-case';
import { DeleteProductTypeUseCase } from '../../../application/use-cases/delete-product-type.use-case';
import { GetProductTypeUseCase } from '../../../application/use-cases/get-product-type.use-case';
import { ListProductTypesUseCase } from '../../../application/use-cases/list-product-types.use-case';

@ApiTags('Product Types')
@Controller('product-types')
export class ProductTypesController {
  constructor(
    private readonly createProductTypeUseCase: CreateProductTypeUseCase,
    private readonly updateProductTypeUseCase: UpdateProductTypeUseCase,
    private readonly deleteProductTypeUseCase: DeleteProductTypeUseCase,
    private readonly getProductTypeUseCase: GetProductTypeUseCase,
    private readonly listProductTypesUseCase: ListProductTypesUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un tipo de producto' })
  @ApiCreatedResponse({ type: ProductTypeResponseDto })
  create(@Body() dto: CreateProductTypeDto) {
    return this.createProductTypeUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tipos de producto' })
  @ApiOkResponse({ type: [ProductTypeResponseDto] })
  findAll(@Query() filter: ProductTypeFilterDto) {
    return this.listProductTypesUseCase.execute(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tipo de producto por ID' })
  @ApiOkResponse({ type: ProductTypeResponseDto })
  findOne(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.getProductTypeUseCase.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un tipo de producto' })
  @ApiOkResponse({ type: ProductTypeResponseDto })
  update(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Body() dto: UpdateProductTypeDto,
  ) {
    return this.updateProductTypeUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un tipo de producto' })
  @ApiNoContentResponse()
  remove(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.deleteProductTypeUseCase.execute(id);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add controller product-types.controller.ts"
```

#### 8.20 — features/business/product-types/index.ts

Barrel export del feature para imports limpios.

**Archivo:** `src/features/business/product-types/index.ts`

```bash
mkdir -p src/features/business/product-types
cat > src/features/business/product-types/index.ts <<'EOF_BACKEND_IA'
export { ProductTypesModule } from './product-types.module';
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add barrel export product-types"
```

#### 8.21 — features/business/product-types/product-types.module.ts

Módulo Nest del feature: cablea providers, tokens DI y controller.

**Archivo:** `src/features/business/product-types/product-types.module.ts`

```bash
mkdir -p src/features/business/product-types
cat > src/features/business/product-types/product-types.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { PRODUCT_TYPE_REPOSITORY } from './domain/interfaces/product-type-repository.interface';
import { ProductTypeRepository } from './infrastructure/persistence/repositories/product-type.repository';
import { CreateProductTypeUseCase } from './application/use-cases/create-product-type.use-case';
import { UpdateProductTypeUseCase } from './application/use-cases/update-product-type.use-case';
import { DeleteProductTypeUseCase } from './application/use-cases/delete-product-type.use-case';
import { GetProductTypeUseCase } from './application/use-cases/get-product-type.use-case';
import { ListProductTypesUseCase } from './application/use-cases/list-product-types.use-case';
import { ProductTypesController } from './presentation/http/controllers/product-types.controller';

@Module({
  controllers: [ProductTypesController],
  providers: [
    ProductTypeRepository,
    { provide: PRODUCT_TYPE_REPOSITORY, useExisting: ProductTypeRepository },
    CreateProductTypeUseCase,
    UpdateProductTypeUseCase,
    DeleteProductTypeUseCase,
    GetProductTypeUseCase,
    ListProductTypesUseCase,
  ],
  exports: [PRODUCT_TYPE_REPOSITORY],
})
export class ProductTypesModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: wire nest module product-types.module.ts"
```

#### 8.22 — Actualizar sequelize.factory.ts (registrar modelos)

Registra en ALL_MODELS solo los modelos ya creados (orden de dependencias).

**Archivo:** `src/infrastructure/database/sequelize/sequelize.factory.ts`

```bash
mkdir -p src/infrastructure/database/sequelize
cat > src/infrastructure/database/sequelize/sequelize.factory.ts <<'EOF_BACKEND_IA'
import { Sequelize } from 'sequelize-typescript';
import { DatabaseDialect } from '../../../config/environment/env.interface';
import { getSequelizeOptions } from './sequelize.options';

import { ClientModel } from '../../../features/business/clients/infrastructure/persistence/models/client.model';
import { ProductTypeModel } from '../../../features/business/product-types/infrastructure/persistence/models/product-type.model';

export const ALL_MODELS = [
  ClientModel,
  ProductTypeModel,
];

export async function createSequelizeInstance(
  dialect: DatabaseDialect,
): Promise<Sequelize> {
  const options = getSequelizeOptions(dialect);

  let dialectModule: any;

  switch (dialect) {
    case DatabaseDialect.MySQL:
      dialectModule = require('mysql2');
      break;
    case DatabaseDialect.Postgres:
      dialectModule = require('pg');
      break;
    case DatabaseDialect.MSSQL:
      dialectModule = require('tedious');
      break;
    case DatabaseDialect.Oracle:
      dialectModule = require('oracledb');
      break;
    default:
      throw new Error(`Dialecto no soportado: ${dialect}`);
  }

  const sequelize = new Sequelize({
    ...options,
    dialectModule,
    models: ALL_MODELS,
  } as any);

  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión exitosa a ${dialect.toUpperCase()}`);
  } catch (error: any) {
    console.error(
      `❌ Error conectando a ${dialect.toUpperCase()}:`,
      error.message,
    );
    throw error;
  }

  if (process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: false });
    console.log('✅ Tablas sincronizadas');
  }

  return sequelize;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: register ProductTypeModel in sequelize factory"
```

#### 8.23 — Actualizar business.module.ts

Agrega el feature module de negocio recién terminado.

**Archivo:** `src/features/business/business.module.ts`

```bash
mkdir -p src/features/business
cat > src/features/business/business.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ClientsModule } from './clients/clients.module';
import { ProductTypesModule } from './product-types/product-types.module';

@Module({
  imports: [ClientsModule, ProductTypesModule],
  exports: [ClientsModule, ProductTypesModule],
})
export class BusinessModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add ProductTypesModule to BusinessModule"
```

#### 8.24 — Actualizar database-seeder.service.ts

Ejecuta seeders en orden de dependencias al arrancar (dev).

**Archivo:** `src/infrastructure/database/seeders/database-seeder.service.ts`

```bash
mkdir -p src/infrastructure/database/seeders
cat > src/infrastructure/database/seeders/database-seeder.service.ts <<'EOF_BACKEND_IA'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { seedClients } from '../../../features/business/clients/infrastructure/persistence/seeders/clients.seeder';
import { seedProductTypes } from '../../../features/business/product-types/infrastructure/persistence/seeders/product-types.seeder';

/**
 * Ejecuta seeders en orden de dependencias.
 * Solo en entornos no productivos.
 */
@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    try {
      await seedClients();
      await seedProductTypes();
      this.logger.log('✅ Seeders ejecutados');
    } catch (error: any) {
      this.logger.error(`❌ Error en seeders: ${error.message}`, error.stack);
      throw error;
    }
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: run seedProductTypes on bootstrap"
```

#### 8.25 — Actualizar app.module.ts

Importa BusinessModule y/o AuthModule según el avance. Los guards globales llegan en la fase RBAC.

**Archivo:** `src/app.module.ts`

```bash
mkdir -p src
cat > src/app.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './config/environment/env.config';
import { appConfig } from './config/app/app.config';
import { jwtConfig } from './config/jwt/jwt.config';
import { LoggerModule } from './config/logger/logger.module';
import { SequelizeDatabaseModule } from './infrastructure/database/sequelize/sequelize.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { BusinessModule } from './features/business/business.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig, appConfig, jwtConfig],
      envFilePath: '.env',
    }),
    SequelizeDatabaseModule,
    SecurityModule,
    LoggerModule,
    BusinessModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: keep BusinessModule wired in AppModule"
```

#### 8.26 — Verificar tabla `product_types`

Confirma sync/seeder y endpoints `/api/product-types`.

```bash
npm run start:dev
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "test: verify product_types table and endpoints"
```


------------------------------------------------------------------------

## FASE 9 — `08_BUSINESS_PRODUCTS`

### Business — Products

> **Objetivo de la fase:** Productos dependen de ProductTypes (FK). El modelo usa `require()` lazy para evitar ciclos.

#### 9.1 — features/business/products/domain/entities/product.entity.ts

Entidad de dominio (TypeScript puro). No extiende Sequelize `Model`. Aquí viven las reglas del negocio.

**Archivo:** `src/features/business/products/domain/entities/product.entity.ts`

```bash
mkdir -p src/features/business/products/domain/entities
cat > src/features/business/products/domain/entities/product.entity.ts <<'EOF_BACKEND_IA'
import { Status } from '../../../../../common/enums/status.enum';
import { InvalidProductPriceException } from '../exceptions/invalid-product-price.exception';
import { InvalidProductStockException } from '../exceptions/invalid-product-stock.exception';
import { isValidPrice } from '../validators/product-price.validator';
import { isValidStock } from '../validators/product-stock.validator';

export interface ProductProps {
  id?: number;
  name: string;
  brand: string;
  price: number;
  minStock: number;
  quantity: number;
  productTypeId: number;
  status?: Status;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Product {
  id?: number;
  name: string;
  brand: string;
  price: number;
  minStock: number;
  quantity: number;
  productTypeId: number;
  status: Status;
  createdAt?: Date;
  updatedAt?: Date;

  private constructor(props: ProductProps) {
    this.id = props.id;
    this.name = props.name;
    this.brand = props.brand;
    this.price = props.price;
    this.minStock = props.minStock;
    this.quantity = props.quantity;
    this.productTypeId = props.productTypeId;
    this.status = props.status ?? Status.ACTIVE;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    props: Omit<ProductProps, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
  ): Product {
    if (!props.name?.trim()) {
      throw new Error('El nombre del producto es requerido');
    }

    if (!props.brand?.trim()) {
      throw new Error('La marca del producto es requerida');
    }

    if (!isValidPrice(props.price)) {
      throw new InvalidProductPriceException(props.price);
    }

    if (!isValidStock(props.quantity)) {
      throw new InvalidProductStockException(props.quantity);
    }

    if (!isValidStock(props.minStock)) {
      throw new InvalidProductStockException(props.minStock);
    }

    return new Product(props);
  }

  static reconstitute(props: ProductProps): Product {
    return new Product(props);
  }

  update(
    props: Partial<
      Omit<ProductProps, 'id' | 'status' | 'createdAt' | 'updatedAt'>
    >,
  ): void {
    if (props.name !== undefined) {
      if (!props.name.trim()) {
        throw new Error('El nombre del producto es requerido');
      }
      this.name = props.name;
    }

    if (props.brand !== undefined) {
      if (!props.brand.trim()) {
        throw new Error('La marca del producto es requerida');
      }
      this.brand = props.brand;
    }

    if (props.price !== undefined) {
      if (!isValidPrice(props.price)) {
        throw new InvalidProductPriceException(props.price);
      }
      this.price = props.price;
    }

    if (props.minStock !== undefined) {
      if (!isValidStock(props.minStock)) {
        throw new InvalidProductStockException(props.minStock);
      }
      this.minStock = props.minStock;
    }

    if (props.quantity !== undefined) {
      if (!isValidStock(props.quantity)) {
        throw new InvalidProductStockException(props.quantity);
      }
      this.quantity = props.quantity;
    }

    if (props.productTypeId !== undefined) {
      this.productTypeId = props.productTypeId;
    }
  }

  deactivate(): void {
    this.status = Status.INACTIVE;
  }

  reduceStock(amount: number): void {
    const newQuantity = this.quantity - amount;
    if (!isValidStock(newQuantity)) {
      throw new InvalidProductStockException(newQuantity);
    }
    this.quantity = newQuantity;
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain entity product.entity.ts"
```

#### 9.2 — features/business/products/domain/exceptions/invalid-product-price.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/business/products/domain/exceptions/invalid-product-price.exception.ts`

```bash
mkdir -p src/features/business/products/domain/exceptions
cat > src/features/business/products/domain/exceptions/invalid-product-price.exception.ts <<'EOF_BACKEND_IA'
import { DomainException } from '../../../../../common/exceptions/domain.exception';

export class InvalidProductPriceException extends DomainException {
  constructor(price: number) {
    super(`El precio '${price}' debe ser mayor a 0`);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception invalid-product-price.exception.ts"
```

#### 9.3 — features/business/products/domain/exceptions/invalid-product-stock.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/business/products/domain/exceptions/invalid-product-stock.exception.ts`

```bash
mkdir -p src/features/business/products/domain/exceptions
cat > src/features/business/products/domain/exceptions/invalid-product-stock.exception.ts <<'EOF_BACKEND_IA'
import { DomainException } from '../../../../../common/exceptions/domain.exception';

export class InvalidProductStockException extends DomainException {
  constructor(stock: number) {
    super(`El stock '${stock}' no puede ser negativo`);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception invalid-product-stock.exception.ts"
```

#### 9.4 — features/business/products/domain/exceptions/product-not-found.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/business/products/domain/exceptions/product-not-found.exception.ts`

```bash
mkdir -p src/features/business/products/domain/exceptions
cat > src/features/business/products/domain/exceptions/product-not-found.exception.ts <<'EOF_BACKEND_IA'
import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception';

export class ProductNotFoundException extends EntityNotFoundException {
  constructor(id: number) {
    super('Producto', id);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception product-not-found.exception.ts"
```

#### 9.5 — features/business/products/domain/interfaces/product-repository.interface.ts

Puerto (contrato) del repositorio. La aplicación depende de esta interface, no de Sequelize.

**Archivo:** `src/features/business/products/domain/interfaces/product-repository.interface.ts`

```bash
mkdir -p src/features/business/products/domain/interfaces
cat > src/features/business/products/domain/interfaces/product-repository.interface.ts <<'EOF_BACKEND_IA'
import { PaginatedResult } from '../../../../../common/interfaces/pagination.interface';
import { Product } from '../entities/product.entity';

export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';

export interface ProductFindAllParams {
  page?: number;
  limit?: number;
  search?: string;
  productTypeId?: number;
}

export interface IProductRepository {
  create(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<Product | null>;
  findAll(params: ProductFindAllParams): Promise<PaginatedResult<Product>>;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add repository port product-repository.interface.ts"
```

#### 9.6 — features/business/products/domain/validators/product-price.validator.ts

Validador de dominio reutilizable (reglas independientes del framework HTTP).

**Archivo:** `src/features/business/products/domain/validators/product-price.validator.ts`

```bash
mkdir -p src/features/business/products/domain/validators
cat > src/features/business/products/domain/validators/product-price.validator.ts <<'EOF_BACKEND_IA'
export function isValidPrice(price: number): boolean {
  return price > 0;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain validator product-price.validator.ts"
```

#### 9.7 — features/business/products/domain/validators/product-stock.validator.ts

Validador de dominio reutilizable (reglas independientes del framework HTTP).

**Archivo:** `src/features/business/products/domain/validators/product-stock.validator.ts`

```bash
mkdir -p src/features/business/products/domain/validators
cat > src/features/business/products/domain/validators/product-stock.validator.ts <<'EOF_BACKEND_IA'
export function isValidStock(stock: number): boolean {
  return stock >= 0;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain validator product-stock.validator.ts"
```

#### 9.8 — features/business/products/infrastructure/persistence/models/product.model.ts

Modelo Sequelize (`@Table`). Solo infraestructura: mapeo a tabla física.

**Archivo:** `src/features/business/products/infrastructure/persistence/models/product.model.ts`

```bash
mkdir -p src/features/business/products/infrastructure/persistence/models
cat > src/features/business/products/infrastructure/persistence/models/product.model.ts <<'EOF_BACKEND_IA'
import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Status } from '../../../../../../common/enums/status.enum';

@Table({ tableName: 'products' })
export class ProductModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare brand: string;

  @Column({ type: DataType.BIGINT, allowNull: false })
  declare price: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare minStock: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare quantity: number;

  @ForeignKey(
    () =>
      require('../../../../product-types/infrastructure/persistence/models/product-type.model')
        .ProductTypeModel,
  )
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare productTypeId: number;

  @BelongsTo(
    () =>
      require('../../../../product-types/infrastructure/persistence/models/product-type.model')
        .ProductTypeModel,
  )
  declare productType: unknown;

  @Column({
    type: DataType.ENUM(...Object.values(Status)),
    allowNull: false,
    defaultValue: Status.ACTIVE,
  })
  declare status: Status;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize model product.model.ts"
```

#### 9.9 — features/business/products/infrastructure/persistence/repositories/product.repository.ts

Adaptador del repositorio: implementa el puerto de dominio con Sequelize.

**Archivo:** `src/features/business/products/infrastructure/persistence/repositories/product.repository.ts`

```bash
mkdir -p src/features/business/products/infrastructure/persistence/repositories
cat > src/features/business/products/infrastructure/persistence/repositories/product.repository.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import { Op, WhereOptions } from 'sequelize';
import {
  buildPaginatedResult,
  normalizePagination,
} from '../../../../../../common/utils/pagination.util';
import { Product } from '../../../domain/entities/product.entity';
import {
  IProductRepository,
  ProductFindAllParams,
} from '../../../domain/interfaces/product-repository.interface';
import { ProductMapper } from '../../../application/mappers/product.mapper';
import { ProductModel } from '../models/product.model';

@Injectable()
export class ProductRepository implements IProductRepository {
  async create(product: Product): Promise<Product> {
    const model = await ProductModel.create(ProductMapper.toPersistence(product));
    return ProductMapper.toDomain(model);
  }

  async update(product: Product): Promise<Product> {
    await ProductModel.update(ProductMapper.toPersistence(product), {
      where: { id: product.id },
    });
    const updated = await ProductModel.findByPk(product.id!);
    return ProductMapper.toDomain(updated!);
  }

  async delete(id: number): Promise<void> {
    await ProductModel.destroy({ where: { id } });
  }

  async findById(id: number): Promise<Product | null> {
    const model = await ProductModel.findByPk(id);
    return model ? ProductMapper.toDomain(model) : null;
  }

  async findAll(params: ProductFindAllParams) {
    const { page, limit, offset } = normalizePagination(
      params.page,
      params.limit,
    );

    const where: WhereOptions = {};

    if (params.search) {
      Object.assign(where, {
        [Op.or]: [
          { name: { [Op.like]: `%${params.search}%` } },
          { brand: { [Op.like]: `%${params.search}%` } },
        ],
      });
    }

    if (params.productTypeId) {
      where.productTypeId = params.productTypeId;
    }

    const { rows, count } = await ProductModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return buildPaginatedResult(
      rows.map((row) => ProductMapper.toDomain(row)),
      count,
      page,
      limit,
    );
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize repository product.repository.ts"
```

#### 9.10 — features/business/products/infrastructure/persistence/migrations/create-products-table.migration.ts

Migración documental/auxiliar de la tabla. En dev el sync de Sequelize crea el esquema.

**Archivo:** `src/features/business/products/infrastructure/persistence/migrations/create-products-table.migration.ts`

```bash
mkdir -p src/features/business/products/infrastructure/persistence/migrations
cat > src/features/business/products/infrastructure/persistence/migrations/create-products-table.migration.ts <<'EOF_BACKEND_IA'
export const createProductsTableMigration = {
  name: 'create-products-table',
  async up(): Promise<void> {
    // Sequelize sync handles table creation in development.
    // Production: CREATE TABLE products (id, name, brand, price, minStock, quantity, productTypeId, status, createdAt, updatedAt)
  },
  async down(): Promise<void> {
    // Production: DROP TABLE products
  },
};
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add migration create-products-table.migration.ts"
```

#### 9.11 — features/business/products/infrastructure/persistence/seeders/products.seeder.ts

Seeder de datos iniciales para desarrollo y verificación física en BD.

**Archivo:** `src/features/business/products/infrastructure/persistence/seeders/products.seeder.ts`

```bash
mkdir -p src/features/business/products/infrastructure/persistence/seeders
cat > src/features/business/products/infrastructure/persistence/seeders/products.seeder.ts <<'EOF_BACKEND_IA'
import { ProductModel } from '../models/product.model';
import { Status } from '../../../../../../common/enums/status.enum';

export async function seedProducts(): Promise<void> {
  const count = await ProductModel.count();
  if (count > 0) {
    return;
  }

  await ProductModel.bulkCreate([
    {
      name: 'Smartphone X',
      brand: 'TechBrand',
      price: 59999,
      minStock: 5,
      quantity: 50,
      productTypeId: 1,
      status: Status.ACTIVE,
    },
    {
      name: 'Wireless Headphones',
      brand: 'AudioPro',
      price: 12999,
      minStock: 10,
      quantity: 100,
      productTypeId: 1,
      status: Status.ACTIVE,
    },
  ]);
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add seeder products.seeder.ts"
```

#### 9.12 — features/business/products/application/dto/create-product.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/business/products/application/dto/create-product.dto.ts`

```bash
mkdir -p src/features/business/products/application/dto
cat > src/features/business/products/application/dto/create-product.dto.ts <<'EOF_BACKEND_IA'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Smartphone X' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'TechBrand' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  brand: string;

  @ApiProperty({ example: 59999 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ example: 5, default: 0 })
  @IsInt()
  @Min(0)
  minStock: number;

  @ApiProperty({ example: 50, default: 0 })
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  productTypeId: number;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto create-product.dto.ts"
```

#### 9.13 — features/business/products/application/dto/product-filter.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/business/products/application/dto/product-filter.dto.ts`

```bash
mkdir -p src/features/business/products/application/dto
cat > src/features/business/products/application/dto/product-filter.dto.ts <<'EOF_BACKEND_IA'
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class ProductFilterDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number;

  @ApiPropertyOptional({ example: 'smartphone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  productTypeId?: number;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto product-filter.dto.ts"
```

#### 9.14 — features/business/products/application/dto/product-response.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/business/products/application/dto/product-response.dto.ts`

```bash
mkdir -p src/features/business/products/application/dto
cat > src/features/business/products/application/dto/product-response.dto.ts <<'EOF_BACKEND_IA'
import { ApiProperty } from '@nestjs/swagger';
import { Status } from '../../../../../common/enums/status.enum';

export class ProductResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Smartphone X' })
  name: string;

  @ApiProperty({ example: 'TechBrand' })
  brand: string;

  @ApiProperty({ example: 59999 })
  price: number;

  @ApiProperty({ example: 5 })
  minStock: number;

  @ApiProperty({ example: 50 })
  quantity: number;

  @ApiProperty({ example: 1 })
  productTypeId: number;

  @ApiProperty({ enum: Status, example: Status.ACTIVE })
  status: Status;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto product-response.dto.ts"
```

#### 9.15 — features/business/products/application/dto/update-product.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/business/products/application/dto/update-product.dto.ts`

```bash
mkdir -p src/features/business/products/application/dto
cat > src/features/business/products/application/dto/update-product.dto.ts <<'EOF_BACKEND_IA'
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto update-product.dto.ts"
```

#### 9.16 — features/business/products/application/mappers/product.mapper.ts

Mapper entre entidad de dominio y DTO de respuesta.

**Archivo:** `src/features/business/products/application/mappers/product.mapper.ts`

```bash
mkdir -p src/features/business/products/application/mappers
cat > src/features/business/products/application/mappers/product.mapper.ts <<'EOF_BACKEND_IA'
import { Status } from '../../../../../common/enums/status.enum';
import { Product } from '../../domain/entities/product.entity';
import { ProductResponseDto } from '../dto/product-response.dto';
import { ProductModel } from '../../infrastructure/persistence/models/product.model';

export class ProductMapper {
  static toDomain(model: ProductModel): Product {
    return Product.reconstitute({
      id: model.id,
      name: model.name,
      brand: model.brand,
      price: Number(model.price),
      minStock: model.minStock,
      quantity: model.quantity,
      productTypeId: model.productTypeId,
      status: model.status,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toResponse(entity: Product): ProductResponseDto {
    return {
      id: entity.id!,
      name: entity.name,
      brand: entity.brand,
      price: entity.price,
      minStock: entity.minStock,
      quantity: entity.quantity,
      productTypeId: entity.productTypeId,
      status: entity.status,
      createdAt: entity.createdAt!,
      updatedAt: entity.updatedAt!,
    };
  }

  static toPersistence(entity: Product): Partial<ProductModel> {
    return {
      id: entity.id,
      name: entity.name,
      brand: entity.brand,
      price: entity.price,
      minStock: entity.minStock,
      quantity: entity.quantity,
      productTypeId: entity.productTypeId,
      status: entity.status ?? Status.ACTIVE,
    };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add mapper product.mapper.ts"
```

#### 9.17 — features/business/products/application/use-cases/create-product.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/business/products/application/use-cases/create-product.use-case.ts`

```bash
mkdir -p src/features/business/products/application/use-cases
cat > src/features/business/products/application/use-cases/create-product.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ProductTypeNotFoundException } from '../../../product-types/domain/exceptions/product-type-not-found.exception';
import {
  type IProductTypeRepository,
  PRODUCT_TYPE_REPOSITORY,
} from '../../../product-types/domain/interfaces/product-type-repository.interface';
import { Product } from '../../domain/entities/product.entity';
import {
  type IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/interfaces/product-repository.interface';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(PRODUCT_TYPE_REPOSITORY)
    private readonly productTypeRepository: IProductTypeRepository,
  ) {}

  async execute(dto: CreateProductDto) {
    const productType = await this.productTypeRepository.findById(
      dto.productTypeId,
    );
    if (!productType) {
      throw new ProductTypeNotFoundException(dto.productTypeId);
    }

    const product = Product.create(dto);
    const created = await this.productRepository.create(product);
    return ProductMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case create-product.use-case.ts"
```

#### 9.18 — features/business/products/application/use-cases/delete-product.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/business/products/application/use-cases/delete-product.use-case.ts`

```bash
mkdir -p src/features/business/products/application/use-cases
cat > src/features/business/products/application/use-cases/delete-product.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ProductNotFoundException } from '../../domain/exceptions/product-not-found.exception';
import {
  type IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/interfaces/product-repository.interface';

@Injectable()
export class DeleteProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new ProductNotFoundException(id);
    }

    await this.productRepository.delete(id);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case delete-product.use-case.ts"
```

#### 9.19 — features/business/products/application/use-cases/get-product.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/business/products/application/use-cases/get-product.use-case.ts`

```bash
mkdir -p src/features/business/products/application/use-cases
cat > src/features/business/products/application/use-cases/get-product.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ProductNotFoundException } from '../../domain/exceptions/product-not-found.exception';
import {
  type IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/interfaces/product-repository.interface';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class GetProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: number) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new ProductNotFoundException(id);
    }

    return ProductMapper.toResponse(product);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case get-product.use-case.ts"
```

#### 9.20 — features/business/products/application/use-cases/list-products.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/business/products/application/use-cases/list-products.use-case.ts`

```bash
mkdir -p src/features/business/products/application/use-cases
cat > src/features/business/products/application/use-cases/list-products.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import {
  type IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/interfaces/product-repository.interface';
import { ProductFilterDto } from '../dto/product-filter.dto';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(filter: ProductFilterDto) {
    const result = await this.productRepository.findAll(filter);
    return {
      items: result.items.map((product) => ProductMapper.toResponse(product)),
      meta: result.meta,
    };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case list-products.use-case.ts"
```

#### 9.21 — features/business/products/application/use-cases/update-product.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/business/products/application/use-cases/update-product.use-case.ts`

```bash
mkdir -p src/features/business/products/application/use-cases
cat > src/features/business/products/application/use-cases/update-product.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ProductTypeNotFoundException } from '../../../product-types/domain/exceptions/product-type-not-found.exception';
import {
  type IProductTypeRepository,
  PRODUCT_TYPE_REPOSITORY,
} from '../../../product-types/domain/interfaces/product-type-repository.interface';
import { ProductNotFoundException } from '../../domain/exceptions/product-not-found.exception';
import {
  type IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/interfaces/product-repository.interface';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(PRODUCT_TYPE_REPOSITORY)
    private readonly productTypeRepository: IProductTypeRepository,
  ) {}

  async execute(id: number, dto: UpdateProductDto) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new ProductNotFoundException(id);
    }

    if (dto.productTypeId) {
      const productType = await this.productTypeRepository.findById(
        dto.productTypeId,
      );
      if (!productType) {
        throw new ProductTypeNotFoundException(dto.productTypeId);
      }
    }

    product.update(dto);
    const updated = await this.productRepository.update(product);
    return ProductMapper.toResponse(updated);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case update-product.use-case.ts"
```

#### 9.22 — features/business/products/presentation/http/serializers/product.serializer.ts

Serializer de presentación (forma estable de la respuesta HTTP).

**Archivo:** `src/features/business/products/presentation/http/serializers/product.serializer.ts`

```bash
mkdir -p src/features/business/products/presentation/http/serializers
cat > src/features/business/products/presentation/http/serializers/product.serializer.ts <<'EOF_BACKEND_IA'
import { Product } from '../../../domain/entities/product.entity';
import { ProductResponseDto } from '../../../application/dto/product-response.dto';
import { ProductMapper } from '../../../application/mappers/product.mapper';

export class ProductSerializer {
  static serialize(entity: Product): ProductResponseDto {
    return ProductMapper.toResponse(entity);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add serializer product.serializer.ts"
```

#### 9.23 — features/business/products/presentation/http/controllers/products.controller.ts

Controller delgado: valida DTO, llama use-case, devuelve respuesta.

**Archivo:** `src/features/business/products/presentation/http/controllers/products.controller.ts`

```bash
mkdir -p src/features/business/products/presentation/http/controllers
cat > src/features/business/products/presentation/http/controllers/products.controller.ts <<'EOF_BACKEND_IA'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ParsePositiveIntPipe } from '../../../../../../common/pipes/parse-positive-int.pipe';
import { CreateProductDto } from '../../../application/dto/create-product.dto';
import { UpdateProductDto } from '../../../application/dto/update-product.dto';
import { ProductFilterDto } from '../../../application/dto/product-filter.dto';
import { ProductResponseDto } from '../../../application/dto/product-response.dto';
import { CreateProductUseCase } from '../../../application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from '../../../application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from '../../../application/use-cases/delete-product.use-case';
import { GetProductUseCase } from '../../../application/use-cases/get-product.use-case';
import { ListProductsUseCase } from '../../../application/use-cases/list-products.use-case';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly listProductsUseCase: ListProductsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un producto' })
  @ApiCreatedResponse({ type: ProductResponseDto })
  create(@Body() dto: CreateProductDto) {
    return this.createProductUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos' })
  @ApiOkResponse({ type: [ProductResponseDto] })
  findAll(@Query() filter: ProductFilterDto) {
    return this.listProductsUseCase.execute(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiOkResponse({ type: ProductResponseDto })
  findOne(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.getProductUseCase.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiOkResponse({ type: ProductResponseDto })
  update(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.updateProductUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiNoContentResponse()
  remove(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.deleteProductUseCase.execute(id);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add controller products.controller.ts"
```

#### 9.24 — features/business/products/index.ts

Barrel export del feature para imports limpios.

**Archivo:** `src/features/business/products/index.ts`

```bash
mkdir -p src/features/business/products
cat > src/features/business/products/index.ts <<'EOF_BACKEND_IA'
export { ProductsModule } from './products.module';
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add barrel export products"
```

#### 9.25 — features/business/products/products.module.ts

Módulo Nest del feature: cablea providers, tokens DI y controller.

**Archivo:** `src/features/business/products/products.module.ts`

```bash
mkdir -p src/features/business/products
cat > src/features/business/products/products.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ProductTypesModule } from '../product-types/product-types.module';
import { PRODUCT_REPOSITORY } from './domain/interfaces/product-repository.interface';
import { ProductRepository } from './infrastructure/persistence/repositories/product.repository';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product.use-case';
import { GetProductUseCase } from './application/use-cases/get-product.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { ProductsController } from './presentation/http/controllers/products.controller';

@Module({
  imports: [ProductTypesModule],
  controllers: [ProductsController],
  providers: [
    ProductRepository,
    { provide: PRODUCT_REPOSITORY, useExisting: ProductRepository },
    CreateProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    GetProductUseCase,
    ListProductsUseCase,
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class ProductsModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: wire nest module products.module.ts"
```

#### 9.26 — Actualizar sequelize.factory.ts (registrar modelos)

Registra en ALL_MODELS solo los modelos ya creados (orden de dependencias).

**Archivo:** `src/infrastructure/database/sequelize/sequelize.factory.ts`

```bash
mkdir -p src/infrastructure/database/sequelize
cat > src/infrastructure/database/sequelize/sequelize.factory.ts <<'EOF_BACKEND_IA'
import { Sequelize } from 'sequelize-typescript';
import { DatabaseDialect } from '../../../config/environment/env.interface';
import { getSequelizeOptions } from './sequelize.options';

import { ClientModel } from '../../../features/business/clients/infrastructure/persistence/models/client.model';
import { ProductTypeModel } from '../../../features/business/product-types/infrastructure/persistence/models/product-type.model';
import { ProductModel } from '../../../features/business/products/infrastructure/persistence/models/product.model';

export const ALL_MODELS = [
  ClientModel,
  ProductTypeModel,
  ProductModel,
];

export async function createSequelizeInstance(
  dialect: DatabaseDialect,
): Promise<Sequelize> {
  const options = getSequelizeOptions(dialect);

  let dialectModule: any;

  switch (dialect) {
    case DatabaseDialect.MySQL:
      dialectModule = require('mysql2');
      break;
    case DatabaseDialect.Postgres:
      dialectModule = require('pg');
      break;
    case DatabaseDialect.MSSQL:
      dialectModule = require('tedious');
      break;
    case DatabaseDialect.Oracle:
      dialectModule = require('oracledb');
      break;
    default:
      throw new Error(`Dialecto no soportado: ${dialect}`);
  }

  const sequelize = new Sequelize({
    ...options,
    dialectModule,
    models: ALL_MODELS,
  } as any);

  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión exitosa a ${dialect.toUpperCase()}`);
  } catch (error: any) {
    console.error(
      `❌ Error conectando a ${dialect.toUpperCase()}:`,
      error.message,
    );
    throw error;
  }

  if (process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: false });
    console.log('✅ Tablas sincronizadas');
  }

  return sequelize;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: register ProductModel in sequelize factory"
```

#### 9.27 — Actualizar business.module.ts

Agrega el feature module de negocio recién terminado.

**Archivo:** `src/features/business/business.module.ts`

```bash
mkdir -p src/features/business
cat > src/features/business/business.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ClientsModule } from './clients/clients.module';
import { ProductTypesModule } from './product-types/product-types.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [ClientsModule, ProductTypesModule, ProductsModule],
  exports: [ClientsModule, ProductTypesModule, ProductsModule],
})
export class BusinessModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add ProductsModule to BusinessModule"
```

#### 9.28 — Actualizar database-seeder.service.ts

Ejecuta seeders en orden de dependencias al arrancar (dev).

**Archivo:** `src/infrastructure/database/seeders/database-seeder.service.ts`

```bash
mkdir -p src/infrastructure/database/seeders
cat > src/infrastructure/database/seeders/database-seeder.service.ts <<'EOF_BACKEND_IA'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { seedClients } from '../../../features/business/clients/infrastructure/persistence/seeders/clients.seeder';
import { seedProductTypes } from '../../../features/business/product-types/infrastructure/persistence/seeders/product-types.seeder';
import { seedProducts } from '../../../features/business/products/infrastructure/persistence/seeders/products.seeder';

/**
 * Ejecuta seeders en orden de dependencias.
 * Solo en entornos no productivos.
 */
@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    try {
      await seedClients();
      await seedProductTypes();
      await seedProducts();
      this.logger.log('✅ Seeders ejecutados');
    } catch (error: any) {
      this.logger.error(`❌ Error en seeders: ${error.message}`, error.stack);
      throw error;
    }
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: run seedProducts on bootstrap"
```

#### 9.29 — Actualizar app.module.ts

Importa BusinessModule y/o AuthModule según el avance. Los guards globales llegan en la fase RBAC.

**Archivo:** `src/app.module.ts`

```bash
mkdir -p src
cat > src/app.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './config/environment/env.config';
import { appConfig } from './config/app/app.config';
import { jwtConfig } from './config/jwt/jwt.config';
import { LoggerModule } from './config/logger/logger.module';
import { SequelizeDatabaseModule } from './infrastructure/database/sequelize/sequelize.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { BusinessModule } from './features/business/business.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig, appConfig, jwtConfig],
      envFilePath: '.env',
    }),
    SequelizeDatabaseModule,
    SecurityModule,
    LoggerModule,
    BusinessModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: keep BusinessModule wired in AppModule"
```

#### 9.30 — Verificar tabla `products`

Confirma FK a product_types, seeder y CRUD `/api/products`.

```bash
npm run start:dev
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "test: verify products table and endpoints"
```


------------------------------------------------------------------------

## FASE 10 — `09_BUSINESS_SALES`

### Business — Sales (+ ProductSale)

> **Objetivo de la fase:** Ventas con líneas (ProductSale), cálculo de dominio y control de stock.

#### 10.1 — features/business/sales/domain/entities/sale.entity.ts

Entidad de dominio (TypeScript puro). No extiende Sequelize `Model`. Aquí viven las reglas del negocio.

**Archivo:** `src/features/business/sales/domain/entities/sale.entity.ts`

```bash
mkdir -p src/features/business/sales/domain/entities
cat > src/features/business/sales/domain/entities/sale.entity.ts <<'EOF_BACKEND_IA'
import { Status } from '../../../../../common/enums/status.enum';

export interface SaleItemProps {
  id?: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  total: number;
  saleId?: number;
}

export class SaleItem {
  id?: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  total: number;
  saleId?: number;

  private constructor(props: SaleItemProps) {
    this.id = props.id;
    this.productId = props.productId;
    this.quantity = props.quantity;
    this.unitPrice = props.unitPrice;
    this.total = props.total;
    this.saleId = props.saleId;
  }

  static create(
    props: Omit<SaleItemProps, 'id' | 'total' | 'saleId'>,
  ): SaleItem {
    if (props.quantity <= 0) {
      throw new Error('La cantidad debe ser mayor a 0');
    }

    if (props.unitPrice <= 0) {
      throw new Error('El precio unitario debe ser mayor a 0');
    }

    const total = props.quantity * props.unitPrice;

    return new SaleItem({
      ...props,
      total,
    });
  }

  static reconstitute(props: SaleItemProps): SaleItem {
    return new SaleItem(props);
  }
}

export interface SaleProps {
  id?: number;
  saleDate: Date;
  subtotal: number;
  tax: number;
  discounts: number;
  total: number;
  status?: Status;
  clientId: number;
  items?: SaleItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Sale {
  id?: number;
  saleDate: Date;
  subtotal: number;
  tax: number;
  discounts: number;
  total: number;
  status: Status;
  clientId: number;
  items: SaleItem[];
  createdAt?: Date;
  updatedAt?: Date;

  private constructor(props: SaleProps) {
    this.id = props.id;
    this.saleDate = props.saleDate;
    this.subtotal = props.subtotal;
    this.tax = props.tax;
    this.discounts = props.discounts;
    this.total = props.total;
    this.status = props.status ?? Status.ACTIVE;
    this.clientId = props.clientId;
    this.items = props.items ?? [];
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    props: Omit<
      SaleProps,
      'id' | 'status' | 'subtotal' | 'total' | 'createdAt' | 'updatedAt'
    > & {
      subtotal: number;
      total: number;
    },
  ): Sale {
    if (!props.items?.length) {
      throw new Error('La venta debe tener al menos un item');
    }

    return new Sale(props);
  }

  static reconstitute(props: SaleProps): Sale {
    return new Sale(props);
  }

  cancel(): void {
    this.status = Status.INACTIVE;
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain entity sale.entity.ts"
```

#### 10.2 — features/business/sales/domain/exceptions/insufficient-stock.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/business/sales/domain/exceptions/insufficient-stock.exception.ts`

```bash
mkdir -p src/features/business/sales/domain/exceptions
cat > src/features/business/sales/domain/exceptions/insufficient-stock.exception.ts <<'EOF_BACKEND_IA'
import { DomainException } from '../../../../../common/exceptions/domain.exception';

export class InsufficientStockException extends DomainException {
  constructor(productName: string, available: number, requested: number) {
    super(
      `Stock insuficiente para '${productName}': disponible ${available}, solicitado ${requested}`,
    );
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception insufficient-stock.exception.ts"
```

#### 10.3 — features/business/sales/domain/exceptions/sale-not-found.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/business/sales/domain/exceptions/sale-not-found.exception.ts`

```bash
mkdir -p src/features/business/sales/domain/exceptions
cat > src/features/business/sales/domain/exceptions/sale-not-found.exception.ts <<'EOF_BACKEND_IA'
import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception';

export class SaleNotFoundException extends EntityNotFoundException {
  constructor(id: number) {
    super('Venta', id);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception sale-not-found.exception.ts"
```

#### 10.4 — features/business/sales/domain/interfaces/sale-repository.interface.ts

Puerto (contrato) del repositorio. La aplicación depende de esta interface, no de Sequelize.

**Archivo:** `src/features/business/sales/domain/interfaces/sale-repository.interface.ts`

```bash
mkdir -p src/features/business/sales/domain/interfaces
cat > src/features/business/sales/domain/interfaces/sale-repository.interface.ts <<'EOF_BACKEND_IA'
import { PaginatedResult } from '../../../../../common/interfaces/pagination.interface';
import { Sale } from '../entities/sale.entity';

export const SALE_REPOSITORY = 'SALE_REPOSITORY';

export interface SaleFindAllParams {
  page?: number;
  limit?: number;
  clientId?: number;
}

export interface ISaleRepository {
  create(sale: Sale): Promise<Sale>;
  update(sale: Sale): Promise<Sale>;
  findById(id: number): Promise<Sale | null>;
  findAll(params: SaleFindAllParams): Promise<PaginatedResult<Sale>>;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add repository port sale-repository.interface.ts"
```

#### 10.5 — features/business/sales/domain/services/sale-calculator.domain-service.ts

Servicio de dominio (lógica pura sin I/O).

**Archivo:** `src/features/business/sales/domain/services/sale-calculator.domain-service.ts`

```bash
mkdir -p src/features/business/sales/domain/services
cat > src/features/business/sales/domain/services/sale-calculator.domain-service.ts <<'EOF_BACKEND_IA'
export interface SaleItemInput {
  quantity: number;
  unitPrice: number;
}

export interface SaleTotals {
  subtotal: number;
  tax: number;
  discounts: number;
  total: number;
}

export class SaleCalculatorDomainService {
  calculateSubtotal(items: SaleItemInput[]): number {
    return items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
  }

  calculateTotals(
    items: SaleItemInput[],
    tax = 0,
    discounts = 0,
  ): SaleTotals {
    const subtotal = this.calculateSubtotal(items);
    const total = subtotal + tax - discounts;

    return {
      subtotal,
      tax,
      discounts,
      total,
    };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain service sale-calculator.domain-service.ts"
```

#### 10.6 — features/business/sales/infrastructure/persistence/models/product-sale.model.ts

Modelo Sequelize (`@Table`). Solo infraestructura: mapeo a tabla física.

**Archivo:** `src/features/business/sales/infrastructure/persistence/models/product-sale.model.ts`

```bash
mkdir -p src/features/business/sales/infrastructure/persistence/models
cat > src/features/business/sales/infrastructure/persistence/models/product-sale.model.ts <<'EOF_BACKEND_IA'
import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

@Table({ tableName: 'product_sales' })
export class ProductSaleModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.BIGINT, allowNull: false })
  declare total: number;

  @ForeignKey(
    () =>
      require('../../../../products/infrastructure/persistence/models/product.model')
        .ProductModel,
  )
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare productId: number;

  @BelongsTo(
    () =>
      require('../../../../products/infrastructure/persistence/models/product.model')
        .ProductModel,
  )
  declare product: unknown;

  @ForeignKey(() => require('./sale.model').SaleModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare saleId: number;

  @BelongsTo(() => require('./sale.model').SaleModel)
  declare sale: unknown;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  declare quantity: number;

  @Column({ type: DataType.BIGINT, allowNull: false })
  declare unitPrice: number;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize model product-sale.model.ts"
```

#### 10.7 — features/business/sales/infrastructure/persistence/models/sale.model.ts

Modelo Sequelize (`@Table`). Solo infraestructura: mapeo a tabla física.

**Archivo:** `src/features/business/sales/infrastructure/persistence/models/sale.model.ts`

```bash
mkdir -p src/features/business/sales/infrastructure/persistence/models
cat > src/features/business/sales/infrastructure/persistence/models/sale.model.ts <<'EOF_BACKEND_IA'
import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Status } from '../../../../../../common/enums/status.enum';

@Table({ tableName: 'sales' })
export class SaleModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.DATE, allowNull: false })
  declare saleDate: Date;

  @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: 0 })
  declare subtotal: number;

  @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: 0 })
  declare tax: number;

  @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: 0 })
  declare discounts: number;

  @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: 0 })
  declare total: number;

  @Column({
    type: DataType.ENUM(...Object.values(Status)),
    allowNull: false,
    defaultValue: Status.ACTIVE,
  })
  declare status: Status;

  @ForeignKey(
    () =>
      require('../../../../clients/infrastructure/persistence/models/client.model')
        .ClientModel,
  )
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare clientId: number;

  @BelongsTo(
    () =>
      require('../../../../clients/infrastructure/persistence/models/client.model')
        .ClientModel,
  )
  declare client: unknown;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @HasMany(
    () =>
      require('./product-sale.model').ProductSaleModel,
  )
  declare items: unknown[];
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize model sale.model.ts"
```

#### 10.8 — features/business/sales/infrastructure/persistence/repositories/sale.repository.ts

Adaptador del repositorio: implementa el puerto de dominio con Sequelize.

**Archivo:** `src/features/business/sales/infrastructure/persistence/repositories/sale.repository.ts`

```bash
mkdir -p src/features/business/sales/infrastructure/persistence/repositories
cat > src/features/business/sales/infrastructure/persistence/repositories/sale.repository.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import {
  buildPaginatedResult,
  normalizePagination,
} from '../../../../../../common/utils/pagination.util';
import { ProductModel } from '../../../../products/infrastructure/persistence/models/product.model';
import { Sale } from '../../../domain/entities/sale.entity';
import {
  ISaleRepository,
  SaleFindAllParams,
} from '../../../domain/interfaces/sale-repository.interface';
import { SaleMapper } from '../../../application/mappers/sale.mapper';
import { SaleModel } from '../models/sale.model';
import { ProductSaleModel } from '../models/product-sale.model';

@Injectable()
export class SaleRepository implements ISaleRepository {
  async create(sale: Sale): Promise<Sale> {
    const sequelize = SaleModel.sequelize!;

    return sequelize.transaction(async (transaction) => {
      const saleModel = await SaleModel.create(
        SaleMapper.toPersistence(sale),
        { transaction },
      );

      const itemModels = await ProductSaleModel.bulkCreate(
        sale.items.map((item) => ({
          productId: item.productId,
          saleId: saleModel.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        { transaction },
      );

      for (const item of sale.items) {
        const product = await ProductModel.findByPk(item.productId, {
          transaction,
        });
        if (product) {
          await product.update(
            { quantity: product.quantity - item.quantity },
            { transaction },
          );
        }
      }

      return SaleMapper.toDomain(saleModel, itemModels);
    });
  }

  async update(sale: Sale): Promise<Sale> {
    await SaleModel.update(SaleMapper.toPersistence(sale), {
      where: { id: sale.id },
    });

    const updated = await SaleModel.findByPk(sale.id!, {
      include: [ProductSaleModel],
    });

    return SaleMapper.toDomain(updated!, updated!.items as ProductSaleModel[]);
  }

  async findById(id: number): Promise<Sale | null> {
    const model = await SaleModel.findByPk(id, {
      include: [ProductSaleModel],
    });

    if (!model) {
      return null;
    }

    return SaleMapper.toDomain(model, model.items as ProductSaleModel[]);
  }

  async findAll(params: SaleFindAllParams) {
    const { page, limit, offset } = normalizePagination(
      params.page,
      params.limit,
    );

    const where = params.clientId ? { clientId: params.clientId } : {};

    const { rows, count } = await SaleModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [ProductSaleModel],
    });

    return buildPaginatedResult(
      rows.map((row) =>
        SaleMapper.toDomain(row, row.items as ProductSaleModel[]),
      ),
      count,
      page,
      limit,
    );
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize repository sale.repository.ts"
```

#### 10.9 — features/business/sales/infrastructure/persistence/migrations/create-sales-table.migration.ts

Migración documental/auxiliar de la tabla. En dev el sync de Sequelize crea el esquema.

**Archivo:** `src/features/business/sales/infrastructure/persistence/migrations/create-sales-table.migration.ts`

```bash
mkdir -p src/features/business/sales/infrastructure/persistence/migrations
cat > src/features/business/sales/infrastructure/persistence/migrations/create-sales-table.migration.ts <<'EOF_BACKEND_IA'
export const createSalesTableMigration = {
  name: 'create-sales-table',
  async up(): Promise<void> {
    // Sequelize sync handles table creation in development.
    // Production: CREATE TABLE sales (...), CREATE TABLE product_sales (...)
  },
  async down(): Promise<void> {
    // Production: DROP TABLE product_sales, DROP TABLE sales
  },
};
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add migration create-sales-table.migration.ts"
```

#### 10.10 — features/business/sales/infrastructure/persistence/seeders/sales.seeder.ts

Seeder de datos iniciales para desarrollo y verificación física en BD.

**Archivo:** `src/features/business/sales/infrastructure/persistence/seeders/sales.seeder.ts`

```bash
mkdir -p src/features/business/sales/infrastructure/persistence/seeders
cat > src/features/business/sales/infrastructure/persistence/seeders/sales.seeder.ts <<'EOF_BACKEND_IA'
import { SaleModel } from '../models/sale.model';
import { ProductSaleModel } from '../models/product-sale.model';
import { ClientModel } from '../../../../clients/infrastructure/persistence/models/client.model';
import { ProductModel } from '../../../../products/infrastructure/persistence/models/product.model';
import { Status } from '../../../../../../common/enums/status.enum';

export async function seedSales(): Promise<void> {
  const count = await SaleModel.count();
  if (count > 0) {
    return;
  }

  const clientCount = await ClientModel.count();
  const productCount = await ProductModel.count();

  if (clientCount === 0 || productCount === 0) {
    return;
  }

  const product = await ProductModel.findByPk(1);
  if (!product) {
    return;
  }

  const quantity = 1;
  const unitPrice = Number(product.price);
  const subtotal = quantity * unitPrice;
  const tax = Math.round(subtotal * 0.19);
  const discounts = 0;
  const total = subtotal + tax - discounts;

  const sequelize = SaleModel.sequelize!;

  await sequelize.transaction(async (transaction) => {
    const sale = await SaleModel.create(
      {
        saleDate: new Date(),
        subtotal,
        tax,
        discounts,
        total,
        status: Status.ACTIVE,
        clientId: 1,
      },
      { transaction },
    );

    await ProductSaleModel.create(
      {
        saleId: sale.id,
        productId: product.id,
        quantity,
        unitPrice,
        total: subtotal,
      },
      { transaction },
    );

    await product.update(
      { quantity: product.quantity - quantity },
      { transaction },
    );
  });
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add seeder sales.seeder.ts"
```

#### 10.11 — features/business/sales/application/dto/create-sale.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/business/sales/application/dto/create-sale.dto.ts`

```bash
mkdir -p src/features/business/sales/application/dto
cat > src/features/business/sales/application/dto/create-sale.dto.ts <<'EOF_BACKEND_IA'
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateSaleItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 59999 })
  @IsNumber()
  @IsPositive()
  unitPrice: number;
}

export class CreateSaleDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  clientId: number;

  @ApiProperty({ type: [CreateSaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discounts?: number;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto create-sale.dto.ts"
```

#### 10.12 — features/business/sales/application/dto/sale-filter.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/business/sales/application/dto/sale-filter.dto.ts`

```bash
mkdir -p src/features/business/sales/application/dto
cat > src/features/business/sales/application/dto/sale-filter.dto.ts <<'EOF_BACKEND_IA'
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Min } from 'class-validator';

export class SaleFilterDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  clientId?: number;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto sale-filter.dto.ts"
```

#### 10.13 — features/business/sales/application/dto/sale-response.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/business/sales/application/dto/sale-response.dto.ts`

```bash
mkdir -p src/features/business/sales/application/dto
cat > src/features/business/sales/application/dto/sale-response.dto.ts <<'EOF_BACKEND_IA'
import { ApiProperty } from '@nestjs/swagger';
import { Status } from '../../../../../common/enums/status.enum';

export class SaleItemResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  productId: number;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 59999 })
  unitPrice: number;

  @ApiProperty({ example: 119998 })
  total: number;
}

export class SaleResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty()
  saleDate: Date;

  @ApiProperty({ example: 119998 })
  subtotal: number;

  @ApiProperty({ example: 22799 })
  tax: number;

  @ApiProperty({ example: 0 })
  discounts: number;

  @ApiProperty({ example: 142797 })
  total: number;

  @ApiProperty({ enum: Status, example: Status.ACTIVE })
  status: Status;

  @ApiProperty({ example: 1 })
  clientId: number;

  @ApiProperty({ type: [SaleItemResponseDto] })
  items: SaleItemResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto sale-response.dto.ts"
```

#### 10.14 — features/business/sales/application/mappers/sale.mapper.ts

Mapper entre entidad de dominio y DTO de respuesta.

**Archivo:** `src/features/business/sales/application/mappers/sale.mapper.ts`

```bash
mkdir -p src/features/business/sales/application/mappers
cat > src/features/business/sales/application/mappers/sale.mapper.ts <<'EOF_BACKEND_IA'
import { Status } from '../../../../../common/enums/status.enum';
import { Sale, SaleItem } from '../../domain/entities/sale.entity';
import {
  SaleItemResponseDto,
  SaleResponseDto,
} from '../dto/sale-response.dto';
import { SaleModel } from '../../infrastructure/persistence/models/sale.model';
import { ProductSaleModel } from '../../infrastructure/persistence/models/product-sale.model';

export class SaleMapper {
  static toDomain(saleModel: SaleModel, itemModels: ProductSaleModel[]): Sale {
    const items = itemModels.map((item) =>
      SaleItem.reconstitute({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
        saleId: item.saleId,
      }),
    );

    return Sale.reconstitute({
      id: saleModel.id,
      saleDate: saleModel.saleDate,
      subtotal: Number(saleModel.subtotal),
      tax: Number(saleModel.tax),
      discounts: Number(saleModel.discounts),
      total: Number(saleModel.total),
      status: saleModel.status,
      clientId: saleModel.clientId,
      items,
      createdAt: saleModel.createdAt,
      updatedAt: saleModel.updatedAt,
    });
  }

  static toResponse(entity: Sale): SaleResponseDto {
    return {
      id: entity.id!,
      saleDate: entity.saleDate,
      subtotal: entity.subtotal,
      tax: entity.tax,
      discounts: entity.discounts,
      total: entity.total,
      status: entity.status,
      clientId: entity.clientId,
      items: entity.items.map((item) => SaleMapper.toItemResponse(item)),
      createdAt: entity.createdAt!,
      updatedAt: entity.updatedAt!,
    };
  }

  static toItemResponse(item: SaleItem): SaleItemResponseDto {
    return {
      id: item.id!,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    };
  }

  static toPersistence(entity: Sale): Partial<SaleModel> {
    return {
      id: entity.id,
      saleDate: entity.saleDate,
      subtotal: entity.subtotal,
      tax: entity.tax,
      discounts: entity.discounts,
      total: entity.total,
      status: entity.status ?? Status.ACTIVE,
      clientId: entity.clientId,
    };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add mapper sale.mapper.ts"
```

#### 10.15 — features/business/sales/application/use-cases/cancel-sale.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/business/sales/application/use-cases/cancel-sale.use-case.ts`

```bash
mkdir -p src/features/business/sales/application/use-cases
cat > src/features/business/sales/application/use-cases/cancel-sale.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Status } from '../../../../../common/enums/status.enum';
import { SaleNotFoundException } from '../../domain/exceptions/sale-not-found.exception';
import {
  type ISaleRepository,
  SALE_REPOSITORY,
} from '../../domain/interfaces/sale-repository.interface';
import { SaleMapper } from '../mappers/sale.mapper';

@Injectable()
export class CancelSaleUseCase {
  constructor(
    @Inject(SALE_REPOSITORY)
    private readonly saleRepository: ISaleRepository,
  ) {}

  async execute(id: number) {
    const sale = await this.saleRepository.findById(id);
    if (!sale) {
      throw new SaleNotFoundException(id);
    }

    if (sale.status === Status.INACTIVE) {
      return SaleMapper.toResponse(sale);
    }

    sale.cancel();
    const updated = await this.saleRepository.update(sale);
    return SaleMapper.toResponse(updated);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case cancel-sale.use-case.ts"
```

#### 10.16 — features/business/sales/application/use-cases/create-sale.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/business/sales/application/use-cases/create-sale.use-case.ts`

```bash
mkdir -p src/features/business/sales/application/use-cases
cat > src/features/business/sales/application/use-cases/create-sale.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ClientNotFoundException } from '../../../clients/domain/exceptions/client-not-found.exception';
import {
  CLIENT_REPOSITORY,
  type IClientRepository,
} from '../../../clients/domain/interfaces/client-repository.interface';
import { ProductNotFoundException } from '../../../products/domain/exceptions/product-not-found.exception';
import {
  type IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../products/domain/interfaces/product-repository.interface';
import { InsufficientStockException } from '../../domain/exceptions/insufficient-stock.exception';
import { Sale, SaleItem } from '../../domain/entities/sale.entity';
import {
  type ISaleRepository,
  SALE_REPOSITORY,
} from '../../domain/interfaces/sale-repository.interface';
import { SaleCalculatorDomainService } from '../../domain/services/sale-calculator.domain-service';
import { CreateSaleDto } from '../dto/create-sale.dto';
import { SaleMapper } from '../mappers/sale.mapper';

@Injectable()
export class CreateSaleUseCase {
  private readonly saleCalculator = new SaleCalculatorDomainService();

  constructor(
    @Inject(SALE_REPOSITORY)
    private readonly saleRepository: ISaleRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(dto: CreateSaleDto) {
    const client = await this.clientRepository.findById(dto.clientId);
    if (!client) {
      throw new ClientNotFoundException(dto.clientId);
    }

    const saleItems: SaleItem[] = [];

    for (const itemDto of dto.items) {
      const product = await this.productRepository.findById(itemDto.productId);
      if (!product) {
        throw new ProductNotFoundException(itemDto.productId);
      }

      if (product.quantity < itemDto.quantity) {
        throw new InsufficientStockException(
          product.name,
          product.quantity,
          itemDto.quantity,
        );
      }

      saleItems.push(
        SaleItem.create({
          productId: itemDto.productId,
          quantity: itemDto.quantity,
          unitPrice: itemDto.unitPrice,
        }),
      );
    }

    const totals = this.saleCalculator.calculateTotals(
      dto.items,
      dto.tax ?? 0,
      dto.discounts ?? 0,
    );

    const sale = Sale.create({
      saleDate: new Date(),
      subtotal: totals.subtotal,
      tax: totals.tax,
      discounts: totals.discounts,
      total: totals.total,
      clientId: dto.clientId,
      items: saleItems,
    });

    const created = await this.saleRepository.create(sale);
    return SaleMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case create-sale.use-case.ts"
```

#### 10.17 — features/business/sales/application/use-cases/get-sale.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/business/sales/application/use-cases/get-sale.use-case.ts`

```bash
mkdir -p src/features/business/sales/application/use-cases
cat > src/features/business/sales/application/use-cases/get-sale.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { SaleNotFoundException } from '../../domain/exceptions/sale-not-found.exception';
import {
  type ISaleRepository,
  SALE_REPOSITORY,
} from '../../domain/interfaces/sale-repository.interface';
import { SaleMapper } from '../mappers/sale.mapper';

@Injectable()
export class GetSaleUseCase {
  constructor(
    @Inject(SALE_REPOSITORY)
    private readonly saleRepository: ISaleRepository,
  ) {}

  async execute(id: number) {
    const sale = await this.saleRepository.findById(id);
    if (!sale) {
      throw new SaleNotFoundException(id);
    }

    return SaleMapper.toResponse(sale);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case get-sale.use-case.ts"
```

#### 10.18 — features/business/sales/application/use-cases/list-sales.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/business/sales/application/use-cases/list-sales.use-case.ts`

```bash
mkdir -p src/features/business/sales/application/use-cases
cat > src/features/business/sales/application/use-cases/list-sales.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import {
  type ISaleRepository,
  SALE_REPOSITORY,
} from '../../domain/interfaces/sale-repository.interface';
import { SaleFilterDto } from '../dto/sale-filter.dto';
import { SaleMapper } from '../mappers/sale.mapper';

@Injectable()
export class ListSalesUseCase {
  constructor(
    @Inject(SALE_REPOSITORY)
    private readonly saleRepository: ISaleRepository,
  ) {}

  async execute(filter: SaleFilterDto) {
    const result = await this.saleRepository.findAll(filter);
    return {
      items: result.items.map((sale) => SaleMapper.toResponse(sale)),
      meta: result.meta,
    };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case list-sales.use-case.ts"
```

#### 10.19 — features/business/sales/presentation/http/serializers/sale.serializer.ts

Serializer de presentación (forma estable de la respuesta HTTP).

**Archivo:** `src/features/business/sales/presentation/http/serializers/sale.serializer.ts`

```bash
mkdir -p src/features/business/sales/presentation/http/serializers
cat > src/features/business/sales/presentation/http/serializers/sale.serializer.ts <<'EOF_BACKEND_IA'
import { Sale } from '../../../domain/entities/sale.entity';
import { SaleResponseDto } from '../../../application/dto/sale-response.dto';
import { SaleMapper } from '../../../application/mappers/sale.mapper';

export class SaleSerializer {
  static serialize(entity: Sale): SaleResponseDto {
    return SaleMapper.toResponse(entity);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add serializer sale.serializer.ts"
```

#### 10.20 — features/business/sales/presentation/http/controllers/sales.controller.ts

Controller delgado: valida DTO, llama use-case, devuelve respuesta.

**Archivo:** `src/features/business/sales/presentation/http/controllers/sales.controller.ts`

```bash
mkdir -p src/features/business/sales/presentation/http/controllers
cat > src/features/business/sales/presentation/http/controllers/sales.controller.ts <<'EOF_BACKEND_IA'
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ParsePositiveIntPipe } from '../../../../../../common/pipes/parse-positive-int.pipe';
import { CreateSaleDto } from '../../../application/dto/create-sale.dto';
import { SaleFilterDto } from '../../../application/dto/sale-filter.dto';
import { SaleResponseDto } from '../../../application/dto/sale-response.dto';
import { CreateSaleUseCase } from '../../../application/use-cases/create-sale.use-case';
import { CancelSaleUseCase } from '../../../application/use-cases/cancel-sale.use-case';
import { GetSaleUseCase } from '../../../application/use-cases/get-sale.use-case';
import { ListSalesUseCase } from '../../../application/use-cases/list-sales.use-case';

@ApiTags('Sales')
@Controller('sales')
export class SalesController {
  constructor(
    private readonly createSaleUseCase: CreateSaleUseCase,
    private readonly cancelSaleUseCase: CancelSaleUseCase,
    private readonly getSaleUseCase: GetSaleUseCase,
    private readonly listSalesUseCase: ListSalesUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear una venta' })
  @ApiCreatedResponse({ type: SaleResponseDto })
  create(@Body() dto: CreateSaleDto) {
    return this.createSaleUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ventas' })
  @ApiOkResponse({ type: [SaleResponseDto] })
  findAll(@Query() filter: SaleFilterDto) {
    return this.listSalesUseCase.execute(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una venta por ID' })
  @ApiOkResponse({ type: SaleResponseDto })
  findOne(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.getSaleUseCase.execute(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar una venta' })
  @ApiOkResponse({ type: SaleResponseDto })
  cancel(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.cancelSaleUseCase.execute(id);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add controller sales.controller.ts"
```

#### 10.21 — features/business/sales/index.ts

Barrel export del feature para imports limpios.

**Archivo:** `src/features/business/sales/index.ts`

```bash
mkdir -p src/features/business/sales
cat > src/features/business/sales/index.ts <<'EOF_BACKEND_IA'
export { SalesModule } from './sales.module';
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add barrel export sales"
```

#### 10.22 — features/business/sales/sales.module.ts

Módulo Nest del feature: cablea providers, tokens DI y controller.

**Archivo:** `src/features/business/sales/sales.module.ts`

```bash
mkdir -p src/features/business/sales
cat > src/features/business/sales/sales.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { ProductsModule } from '../products/products.module';
import { SALE_REPOSITORY } from './domain/interfaces/sale-repository.interface';
import { SaleRepository } from './infrastructure/persistence/repositories/sale.repository';
import { CreateSaleUseCase } from './application/use-cases/create-sale.use-case';
import { CancelSaleUseCase } from './application/use-cases/cancel-sale.use-case';
import { GetSaleUseCase } from './application/use-cases/get-sale.use-case';
import { ListSalesUseCase } from './application/use-cases/list-sales.use-case';
import { SalesController } from './presentation/http/controllers/sales.controller';

@Module({
  imports: [ClientsModule, ProductsModule],
  controllers: [SalesController],
  providers: [
    SaleRepository,
    { provide: SALE_REPOSITORY, useExisting: SaleRepository },
    CreateSaleUseCase,
    CancelSaleUseCase,
    GetSaleUseCase,
    ListSalesUseCase,
  ],
  exports: [SALE_REPOSITORY],
})
export class SalesModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: wire nest module sales.module.ts"
```

#### 10.23 — Barrel business/index.ts

Exports públicos del bounded context business.

**Archivo:** `src/features/business/index.ts`

```bash
mkdir -p src/features/business
cat > src/features/business/index.ts <<'EOF_BACKEND_IA'
export { BusinessModule } from './business.module';
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add business barrel exports"
```

#### 10.24 — Actualizar sequelize.factory.ts (registrar modelos)

Registra en ALL_MODELS solo los modelos ya creados (orden de dependencias).

**Archivo:** `src/infrastructure/database/sequelize/sequelize.factory.ts`

```bash
mkdir -p src/infrastructure/database/sequelize
cat > src/infrastructure/database/sequelize/sequelize.factory.ts <<'EOF_BACKEND_IA'
import { Sequelize } from 'sequelize-typescript';
import { DatabaseDialect } from '../../../config/environment/env.interface';
import { getSequelizeOptions } from './sequelize.options';

import { ClientModel } from '../../../features/business/clients/infrastructure/persistence/models/client.model';
import { ProductTypeModel } from '../../../features/business/product-types/infrastructure/persistence/models/product-type.model';
import { ProductModel } from '../../../features/business/products/infrastructure/persistence/models/product.model';
import { SaleModel } from '../../../features/business/sales/infrastructure/persistence/models/sale.model';
import { ProductSaleModel } from '../../../features/business/sales/infrastructure/persistence/models/product-sale.model';

export const ALL_MODELS = [
  ClientModel,
  ProductTypeModel,
  ProductModel,
  SaleModel,
  ProductSaleModel,
];

export async function createSequelizeInstance(
  dialect: DatabaseDialect,
): Promise<Sequelize> {
  const options = getSequelizeOptions(dialect);

  let dialectModule: any;

  switch (dialect) {
    case DatabaseDialect.MySQL:
      dialectModule = require('mysql2');
      break;
    case DatabaseDialect.Postgres:
      dialectModule = require('pg');
      break;
    case DatabaseDialect.MSSQL:
      dialectModule = require('tedious');
      break;
    case DatabaseDialect.Oracle:
      dialectModule = require('oracledb');
      break;
    default:
      throw new Error(`Dialecto no soportado: ${dialect}`);
  }

  const sequelize = new Sequelize({
    ...options,
    dialectModule,
    models: ALL_MODELS,
  } as any);

  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión exitosa a ${dialect.toUpperCase()}`);
  } catch (error: any) {
    console.error(
      `❌ Error conectando a ${dialect.toUpperCase()}:`,
      error.message,
    );
    throw error;
  }

  if (process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: false });
    console.log('✅ Tablas sincronizadas');
  }

  return sequelize;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: register SaleModel and ProductSaleModel"
```

#### 10.25 — Actualizar business.module.ts

Agrega el feature module de negocio recién terminado.

**Archivo:** `src/features/business/business.module.ts`

```bash
mkdir -p src/features/business
cat > src/features/business/business.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ClientsModule } from './clients/clients.module';
import { ProductTypesModule } from './product-types/product-types.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [ClientsModule, ProductTypesModule, ProductsModule, SalesModule],
  exports: [ClientsModule, ProductTypesModule, ProductsModule, SalesModule],
})
export class BusinessModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add SalesModule to BusinessModule"
```

#### 10.26 — Actualizar database-seeder.service.ts

Ejecuta seeders en orden de dependencias al arrancar (dev).

**Archivo:** `src/infrastructure/database/seeders/database-seeder.service.ts`

```bash
mkdir -p src/infrastructure/database/seeders
cat > src/infrastructure/database/seeders/database-seeder.service.ts <<'EOF_BACKEND_IA'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { seedClients } from '../../../features/business/clients/infrastructure/persistence/seeders/clients.seeder';
import { seedProductTypes } from '../../../features/business/product-types/infrastructure/persistence/seeders/product-types.seeder';
import { seedProducts } from '../../../features/business/products/infrastructure/persistence/seeders/products.seeder';
import { seedSales } from '../../../features/business/sales/infrastructure/persistence/seeders/sales.seeder';

/**
 * Ejecuta seeders en orden de dependencias.
 * Solo en entornos no productivos.
 */
@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    try {
      await seedClients();
      await seedProductTypes();
      await seedProducts();
      await seedSales();
      this.logger.log('✅ Seeders ejecutados');
    } catch (error: any) {
      this.logger.error(`❌ Error en seeders: ${error.message}`, error.stack);
      throw error;
    }
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: run seedSales on bootstrap"
```

#### 10.27 — Actualizar app.module.ts

Importa BusinessModule y/o AuthModule según el avance. Los guards globales llegan en la fase RBAC.

**Archivo:** `src/app.module.ts`

```bash
mkdir -p src
cat > src/app.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './config/environment/env.config';
import { appConfig } from './config/app/app.config';
import { jwtConfig } from './config/jwt/jwt.config';
import { LoggerModule } from './config/logger/logger.module';
import { SequelizeDatabaseModule } from './infrastructure/database/sequelize/sequelize.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { BusinessModule } from './features/business/business.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig, appConfig, jwtConfig],
      envFilePath: '.env',
    }),
    SequelizeDatabaseModule,
    SecurityModule,
    LoggerModule,
    BusinessModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: keep BusinessModule wired in AppModule"
```

#### 10.28 — Verificar tablas `sales` / `product_sales`

Prueba crear una venta y cancelarla. Revisa stock de productos y filas en product_sales.

```bash
npm run start:dev
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "test: verify sales flow and stock side effects"
```


------------------------------------------------------------------------

## FASE 11 — `10_AUTH_USERS`

### Auth — Users

> **Objetivo de la fase:** Usuarios del sistema (credenciales). Modelo sin asociaciones a Roles/RefreshTokens todavía.

#### 11.1 — features/auth/users/domain/entities/user.entity.ts

Entidad de dominio (TypeScript puro). No extiende Sequelize `Model`. Aquí viven las reglas del negocio.

**Archivo:** `src/features/auth/users/domain/entities/user.entity.ts`

```bash
mkdir -p src/features/auth/users/domain/entities
cat > src/features/auth/users/domain/entities/user.entity.ts <<'EOF_BACKEND_IA'
import { Status } from '../../../../../common/enums/status.enum';

export class User {
  id?: number;
  username: string;
  email: string;
  password: string;
  isActive: Status;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain entity user.entity.ts"
```

#### 11.2 — features/auth/users/domain/exceptions/user-email-exists.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/auth/users/domain/exceptions/user-email-exists.exception.ts`

```bash
mkdir -p src/features/auth/users/domain/exceptions
cat > src/features/auth/users/domain/exceptions/user-email-exists.exception.ts <<'EOF_BACKEND_IA'
import { DomainException } from '../../../../../common/exceptions/domain.exception';

export class UserEmailExistsException extends DomainException {
  constructor(email: string) {
    super(`El email ${email} ya está registrado`);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception user-email-exists.exception.ts"
```

#### 11.3 — features/auth/users/domain/exceptions/user-not-found.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/auth/users/domain/exceptions/user-not-found.exception.ts`

```bash
mkdir -p src/features/auth/users/domain/exceptions
cat > src/features/auth/users/domain/exceptions/user-not-found.exception.ts <<'EOF_BACKEND_IA'
import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception';

export class UserNotFoundException extends EntityNotFoundException {
  constructor(identifier: string | number) {
    super('Usuario', identifier);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception user-not-found.exception.ts"
```

#### 11.4 — features/auth/users/domain/exceptions/user-username-exists.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/auth/users/domain/exceptions/user-username-exists.exception.ts`

```bash
mkdir -p src/features/auth/users/domain/exceptions
cat > src/features/auth/users/domain/exceptions/user-username-exists.exception.ts <<'EOF_BACKEND_IA'
import { DomainException } from '../../../../../common/exceptions/domain.exception';

export class UserUsernameExistsException extends DomainException {
  constructor(username: string) {
    super(`El username ${username} ya está registrado`);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception user-username-exists.exception.ts"
```

#### 11.5 — features/auth/users/domain/interfaces/user-repository.interface.ts

Puerto (contrato) del repositorio. La aplicación depende de esta interface, no de Sequelize.

**Archivo:** `src/features/auth/users/domain/interfaces/user-repository.interface.ts`

```bash
mkdir -p src/features/auth/users/domain/interfaces
cat > src/features/auth/users/domain/interfaces/user-repository.interface.ts <<'EOF_BACKEND_IA'
import { User } from '../entities/user.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface IUserRepository {
  create(user: User): Promise<User>;
  findAll(): Promise<User[]>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  update(id: number, data: Partial<User>): Promise<User>;
  delete(id: number): Promise<void>;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add repository port user-repository.interface.ts"
```

#### 11.6 — features/auth/users/infrastructure/persistence/models/user.model.ts (sin asociaciones cruzadas aún)

Modelo Sequelize (`@Table`). Solo infraestructura: mapeo a tabla física. En esta fase se crea **sin** BelongsToMany/HasMany hacia módulos aún no creados, para poder compilar y sincronizar la tabla.

**Archivo:** `src/features/auth/users/infrastructure/persistence/models/user.model.ts`

```bash
mkdir -p src/features/auth/users/infrastructure/persistence/models
cat > src/features/auth/users/infrastructure/persistence/models/user.model.ts <<'EOF_BACKEND_IA'
import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Status } from '../../../../../../common/enums/status.enum';

@Table({ tableName: 'users' })
export class UserModel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING(100), allowNull: false, unique: true })
  declare username: string;

  @Column({ type: DataType.STRING(150), allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare password: string;

  @Column({
    type: DataType.ENUM(...Object.values(Status)),
    allowNull: false,
    defaultValue: Status.ACTIVE,
  })
  declare isActive: Status;

  @Column({ type: DataType.STRING(500), allowNull: true })
  declare avatar: string | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize model user.model.ts without cross associations"
```

#### 11.7 — features/auth/users/infrastructure/persistence/repositories/sequelize-user.repository.ts

Adaptador del repositorio: implementa el puerto de dominio con Sequelize.

**Archivo:** `src/features/auth/users/infrastructure/persistence/repositories/sequelize-user.repository.ts`

```bash
mkdir -p src/features/auth/users/infrastructure/persistence/repositories
cat > src/features/auth/users/infrastructure/persistence/repositories/sequelize-user.repository.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { USER_REPOSITORY } from '../../../domain/interfaces/user-repository.interface';
import type { IUserRepository } from '../../../domain/interfaces/user-repository.interface';
import { UserModel } from '../models/user.model';
import { UserMapper } from '../../../application/mappers/user.mapper';

@Injectable()
export class SequelizeUserRepository implements IUserRepository {
  async create(user: User): Promise<User> {
    const model = await UserModel.create(UserMapper.toPersistence(user));
    return UserMapper.toDomain(model);
  }

  async findAll(): Promise<User[]> {
    const models = await UserModel.findAll({ order: [['id', 'ASC']] });
    return models.map(UserMapper.toDomain);
  }

  async findById(id: number): Promise<User | null> {
    const model = await UserModel.findByPk(id);
    return model ? UserMapper.toDomain(model) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const model = await UserModel.findOne({ where: { email } });
    return model ? UserMapper.toDomain(model) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const model = await UserModel.findOne({ where: { username } });
    return model ? UserMapper.toDomain(model) : null;
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    const model = await UserModel.findByPk(id);
    if (!model) {
      throw new Error(`User ${id} not found`);
    }
    await model.update(UserMapper.toPersistence({ ...UserMapper.toDomain(model), ...data }));
    return UserMapper.toDomain(model);
  }

  async delete(id: number): Promise<void> {
    await UserModel.destroy({ where: { id } });
  }
}

export const userRepositoryProvider = {
  provide: USER_REPOSITORY,
  useClass: SequelizeUserRepository,
};
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize repository sequelize-user.repository.ts"
```

#### 11.8 — features/auth/users/infrastructure/persistence/seeders/users.seeder.ts

Seeder de datos iniciales para desarrollo y verificación física en BD.

**Archivo:** `src/features/auth/users/infrastructure/persistence/seeders/users.seeder.ts`

```bash
mkdir -p src/features/auth/users/infrastructure/persistence/seeders
cat > src/features/auth/users/infrastructure/persistence/seeders/users.seeder.ts <<'EOF_BACKEND_IA'
/**
 * Seeder de feature deshabilitado.
 * El bootstrap central vive en:
 * src/infrastructure/database/seeders/auth-bootstrap.seeder.ts
 * para respetar el orden de dependencias Business → Auth.
 */
export class FeatureSeederDisabled {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add seeder users.seeder.ts"
```

#### 11.9 — features/auth/users/application/dto/create-user.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/auth/users/application/dto/create-user.dto.ts`

```bash
mkdir -p src/features/auth/users/application/dto
cat > src/features/auth/users/application/dto/create-user.dto.ts <<'EOF_BACKEND_IA'
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Status } from '../../../../../common/enums/status.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(Status)
  isActive?: Status;

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(Status)
  isActive?: Status;

  @IsOptional()
  @IsString()
  avatar?: string;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto create-user.dto.ts"
```

#### 11.10 — features/auth/users/application/dto/update-user.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/auth/users/application/dto/update-user.dto.ts`

```bash
mkdir -p src/features/auth/users/application/dto
cat > src/features/auth/users/application/dto/update-user.dto.ts <<'EOF_BACKEND_IA'
export { UpdateUserDto } from './create-user.dto';
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto update-user.dto.ts"
```

#### 11.11 — features/auth/users/application/mappers/user.mapper.ts

Mapper entre entidad de dominio y DTO de respuesta.

**Archivo:** `src/features/auth/users/application/mappers/user.mapper.ts`

```bash
mkdir -p src/features/auth/users/application/mappers
cat > src/features/auth/users/application/mappers/user.mapper.ts <<'EOF_BACKEND_IA'
import { User } from '../../domain/entities/user.entity';
import { UserModel } from '../../infrastructure/persistence/models/user.model';

export class UserMapper {
  static toDomain(model: UserModel): User {
    return new User({
      id: model.id,
      username: model.username,
      email: model.email,
      password: model.password,
      isActive: model.isActive,
      avatar: model.avatar ?? undefined,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toPersistence(entity: User): Partial<UserModel> {
    return {
      id: entity.id,
      username: entity.username,
      email: entity.email,
      password: entity.password,
      isActive: entity.isActive,
      avatar: entity.avatar ?? null,
    };
  }

  static toResponse(entity: User) {
    return {
      id: entity.id,
      username: entity.username,
      email: entity.email,
      isActive: entity.isActive,
      avatar: entity.avatar,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add mapper user.mapper.ts"
```

#### 11.12 — features/auth/users/application/use-cases/create-user.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/users/application/use-cases/create-user.use-case.ts`

```bash
mkdir -p src/features/auth/users/application/use-cases
cat > src/features/auth/users/application/use-cases/create-user.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Status } from '../../../../../common/enums/status.enum';
import { PASSWORD_HASHER } from '../../../../../infrastructure/security/hashing/password-hasher.interface';
import type { IPasswordHasher } from '../../../../../infrastructure/security/hashing/password-hasher.interface';
import { User } from '../../domain/entities/user.entity';
import { UserEmailExistsException } from '../../domain/exceptions/user-email-exists.exception';
import { UserUsernameExistsException } from '../../domain/exceptions/user-username-exists.exception';
import { USER_REPOSITORY } from '../../domain/interfaces/user-repository.interface';
import type { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(dto: CreateUserDto) {
    const existingEmail = await this.userRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw new UserEmailExistsException(dto.email);
    }

    const existingUsername = await this.userRepository.findByUsername(dto.username);
    if (existingUsername) {
      throw new UserUsernameExistsException(dto.username);
    }

    const hashedPassword = await this.passwordHasher.hash(dto.password);

    const user = new User({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
      isActive: dto.isActive ?? Status.ACTIVE,
      avatar: dto.avatar,
    });

    const created = await this.userRepository.create(user);
    return UserMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case create-user.use-case.ts"
```

#### 11.13 — features/auth/users/application/use-cases/delete-user.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/users/application/use-cases/delete-user.use-case.ts`

```bash
mkdir -p src/features/auth/users/application/use-cases
cat > src/features/auth/users/application/use-cases/delete-user.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/interfaces/user-repository.interface';
import type { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new UserNotFoundException(id);
    }
    await this.userRepository.delete(id);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case delete-user.use-case.ts"
```

#### 11.14 — features/auth/users/application/use-cases/get-user.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/users/application/use-cases/get-user.use-case.ts`

```bash
mkdir -p src/features/auth/users/application/use-cases
cat > src/features/auth/users/application/use-cases/get-user.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/interfaces/user-repository.interface';
import type { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundException(id);
    }
    return UserMapper.toResponse(user);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case get-user.use-case.ts"
```

#### 11.15 — features/auth/users/application/use-cases/list-users.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/users/application/use-cases/list-users.use-case.ts`

```bash
mkdir -p src/features/auth/users/application/use-cases
cat > src/features/auth/users/application/use-cases/list-users.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/interfaces/user-repository.interface';
import type { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute() {
    const users = await this.userRepository.findAll();
    return users.map(UserMapper.toResponse);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case list-users.use-case.ts"
```

#### 11.16 — features/auth/users/application/use-cases/update-user.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/users/application/use-cases/update-user.use-case.ts`

```bash
mkdir -p src/features/auth/users/application/use-cases
cat > src/features/auth/users/application/use-cases/update-user.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { PASSWORD_HASHER } from '../../../../../infrastructure/security/hashing/password-hasher.interface';
import type { IPasswordHasher } from '../../../../../infrastructure/security/hashing/password-hasher.interface';
import { UserEmailExistsException } from '../../domain/exceptions/user-email-exists.exception';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { UserUsernameExistsException } from '../../domain/exceptions/user-username-exists.exception';
import { USER_REPOSITORY } from '../../domain/interfaces/user-repository.interface';
import type { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(id: number, dto: UpdateUserDto) {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new UserNotFoundException(id);
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.userRepository.findByEmail(dto.email);
      if (emailTaken) {
        throw new UserEmailExistsException(dto.email);
      }
    }

    if (dto.username && dto.username !== existing.username) {
      const usernameTaken = await this.userRepository.findByUsername(dto.username);
      if (usernameTaken) {
        throw new UserUsernameExistsException(dto.username);
      }
    }

    const updateData: Partial<typeof existing> = { ...dto };
    if (dto.password) {
      updateData.password = await this.passwordHasher.hash(dto.password);
    }

    const updated = await this.userRepository.update(id, updateData);
    return UserMapper.toResponse(updated);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case update-user.use-case.ts"
```

#### 11.17 — features/auth/users/presentation/http/controllers/users.controller.ts

Controller delgado: valida DTO, llama use-case, devuelve respuesta.

**Archivo:** `src/features/auth/users/presentation/http/controllers/users.controller.ts`

```bash
mkdir -p src/features/auth/users/presentation/http/controllers
cat > src/features/auth/users/presentation/http/controllers/users.controller.ts <<'EOF_BACKEND_IA'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CreateUserDto } from '../../../application/dto/create-user.dto';
import { UpdateUserDto } from '../../../application/dto/update-user.dto';
import { CreateUserUseCase } from '../../../application/use-cases/create-user.use-case';
import { DeleteUserUseCase } from '../../../application/use-cases/delete-user.use-case';
import { GetUserUseCase } from '../../../application/use-cases/get-user.use-case';
import { ListUsersUseCase } from '../../../application/use-cases/list-users.use-case';
import { UpdateUserUseCase } from '../../../application/use-cases/update-user.use-case';

@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.createUserUseCase.execute(dto);
  }

  @Get()
  findAll() {
    return this.listUsersUseCase.execute();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.getUserUseCase.execute(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.updateUserUseCase.execute(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.deleteUserUseCase.execute(id);
    return { message: 'Usuario eliminado' };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add controller users.controller.ts"
```

#### 11.18 — features/auth/users/users.module.ts

Módulo Nest del feature: cablea providers, tokens DI y controller.

**Archivo:** `src/features/auth/users/users.module.ts`

```bash
mkdir -p src/features/auth/users
cat > src/features/auth/users/users.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';
import { GetUserUseCase } from './application/use-cases/get-user.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { userRepositoryProvider } from './infrastructure/persistence/repositories/sequelize-user.repository';
import { UsersController } from './presentation/http/controllers/users.controller';

@Module({
  controllers: [UsersController],
  providers: [
    userRepositoryProvider,
    CreateUserUseCase,
    GetUserUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
  ],
  exports: [userRepositoryProvider],
})
export class UsersModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: wire nest module users.module.ts"
```

#### 11.19 — Actualizar sequelize.factory.ts (registrar modelos)

Registra en ALL_MODELS solo los modelos ya creados (orden de dependencias).

**Archivo:** `src/infrastructure/database/sequelize/sequelize.factory.ts`

```bash
mkdir -p src/infrastructure/database/sequelize
cat > src/infrastructure/database/sequelize/sequelize.factory.ts <<'EOF_BACKEND_IA'
import { Sequelize } from 'sequelize-typescript';
import { DatabaseDialect } from '../../../config/environment/env.interface';
import { getSequelizeOptions } from './sequelize.options';

import { ClientModel } from '../../../features/business/clients/infrastructure/persistence/models/client.model';
import { ProductTypeModel } from '../../../features/business/product-types/infrastructure/persistence/models/product-type.model';
import { ProductModel } from '../../../features/business/products/infrastructure/persistence/models/product.model';
import { SaleModel } from '../../../features/business/sales/infrastructure/persistence/models/sale.model';
import { ProductSaleModel } from '../../../features/business/sales/infrastructure/persistence/models/product-sale.model';
import { UserModel } from '../../../features/auth/users/infrastructure/persistence/models/user.model';

export const ALL_MODELS = [
  ClientModel,
  ProductTypeModel,
  ProductModel,
  SaleModel,
  ProductSaleModel,
  UserModel,
];

export async function createSequelizeInstance(
  dialect: DatabaseDialect,
): Promise<Sequelize> {
  const options = getSequelizeOptions(dialect);

  let dialectModule: any;

  switch (dialect) {
    case DatabaseDialect.MySQL:
      dialectModule = require('mysql2');
      break;
    case DatabaseDialect.Postgres:
      dialectModule = require('pg');
      break;
    case DatabaseDialect.MSSQL:
      dialectModule = require('tedious');
      break;
    case DatabaseDialect.Oracle:
      dialectModule = require('oracledb');
      break;
    default:
      throw new Error(`Dialecto no soportado: ${dialect}`);
  }

  const sequelize = new Sequelize({
    ...options,
    dialectModule,
    models: ALL_MODELS,
  } as any);

  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión exitosa a ${dialect.toUpperCase()}`);
  } catch (error: any) {
    console.error(
      `❌ Error conectando a ${dialect.toUpperCase()}:`,
      error.message,
    );
    throw error;
  }

  if (process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: false });
    console.log('✅ Tablas sincronizadas');
  }

  return sequelize;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: register auth models up to user"
```

#### 11.20 — Actualizar auth.module.ts

Agrega el feature module de auth recién terminado.

**Archivo:** `src/features/auth/auth.module.ts`

```bash
mkdir -p src/features/auth
cat > src/features/auth/auth.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule],
  exports: [UsersModule],
})
export class AuthModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add users to AuthModule"
```

#### 11.21 — Actualizar database-seeder.service.ts

Ejecuta seeders en orden de dependencias al arrancar (dev).

**Archivo:** `src/infrastructure/database/seeders/database-seeder.service.ts`

```bash
mkdir -p src/infrastructure/database/seeders
cat > src/infrastructure/database/seeders/database-seeder.service.ts <<'EOF_BACKEND_IA'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { seedClients } from '../../../features/business/clients/infrastructure/persistence/seeders/clients.seeder';
import { seedProductTypes } from '../../../features/business/product-types/infrastructure/persistence/seeders/product-types.seeder';
import { seedProducts } from '../../../features/business/products/infrastructure/persistence/seeders/products.seeder';
import { seedSales } from '../../../features/business/sales/infrastructure/persistence/seeders/sales.seeder';

/**
 * Ejecuta seeders en orden de dependencias.
 * Solo en entornos no productivos.
 */
@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    try {
      await seedClients();
      await seedProductTypes();
      await seedProducts();
      await seedSales();
      this.logger.log('✅ Seeders ejecutados');
    } catch (error: any) {
      this.logger.error(`❌ Error en seeders: ${error.message}`, error.stack);
      throw error;
    }
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: update auth/business seeders bootstrap order"
```

#### 11.22 — Actualizar app.module.ts

Importa BusinessModule y/o AuthModule según el avance. Los guards globales llegan en la fase RBAC.

**Archivo:** `src/app.module.ts`

```bash
mkdir -p src
cat > src/app.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './config/environment/env.config';
import { appConfig } from './config/app/app.config';
import { jwtConfig } from './config/jwt/jwt.config';
import { LoggerModule } from './config/logger/logger.module';
import { SequelizeDatabaseModule } from './infrastructure/database/sequelize/sequelize.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { BusinessModule } from './features/business/business.module';
import { AuthModule } from './features/auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig, appConfig, jwtConfig],
      envFilePath: '.env',
    }),
    SequelizeDatabaseModule,
    SecurityModule,
    LoggerModule,
    BusinessModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: import AuthModule into AppModule"
```

#### 11.23 — Verificar feature auth (Auth — Users)

Arranca y confirma tablas/endpoints del feature. Si hay asociaciones pendientes, el sync de columnas principales ya debe existir.

```bash
npm run start:dev
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "test: verify 10_auth_users auth feature"
```


------------------------------------------------------------------------

## FASE 12 — `11_AUTH_ROLES`

### Auth — Roles

> **Objetivo de la fase:** Roles del sistema. Modelo sin asociaciones a Users/Resources todavía.

#### 12.1 — features/auth/roles/domain/entities/role.entity.ts

Entidad de dominio (TypeScript puro). No extiende Sequelize `Model`. Aquí viven las reglas del negocio.

**Archivo:** `src/features/auth/roles/domain/entities/role.entity.ts`

```bash
mkdir -p src/features/auth/roles/domain/entities
cat > src/features/auth/roles/domain/entities/role.entity.ts <<'EOF_BACKEND_IA'
import { Status } from '../../../../../common/enums/status.enum';

export class Role {
  id?: number;
  name: string;
  isActive: Status;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial: Partial<Role>) {
    Object.assign(this, partial);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain entity role.entity.ts"
```

#### 12.2 — features/auth/roles/domain/exceptions/role-name-exists.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/auth/roles/domain/exceptions/role-name-exists.exception.ts`

```bash
mkdir -p src/features/auth/roles/domain/exceptions
cat > src/features/auth/roles/domain/exceptions/role-name-exists.exception.ts <<'EOF_BACKEND_IA'
import { DomainException } from '../../../../../common/exceptions/domain.exception';

export class RoleNameExistsException extends DomainException {
  constructor(name: string) {
    super(`El rol ${name} ya existe`);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception role-name-exists.exception.ts"
```

#### 12.3 — features/auth/roles/domain/exceptions/role-not-found.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/auth/roles/domain/exceptions/role-not-found.exception.ts`

```bash
mkdir -p src/features/auth/roles/domain/exceptions
cat > src/features/auth/roles/domain/exceptions/role-not-found.exception.ts <<'EOF_BACKEND_IA'
import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception';

export class RoleNotFoundException extends EntityNotFoundException {
  constructor(identifier: string | number) {
    super('Rol', identifier);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception role-not-found.exception.ts"
```

#### 12.4 — features/auth/roles/domain/interfaces/role-repository.interface.ts

Puerto (contrato) del repositorio. La aplicación depende de esta interface, no de Sequelize.

**Archivo:** `src/features/auth/roles/domain/interfaces/role-repository.interface.ts`

```bash
mkdir -p src/features/auth/roles/domain/interfaces
cat > src/features/auth/roles/domain/interfaces/role-repository.interface.ts <<'EOF_BACKEND_IA'
import { Role } from '../entities/role.entity';

export const ROLE_REPOSITORY = 'ROLE_REPOSITORY';

export interface IRoleRepository {
  create(role: Role): Promise<Role>;
  findAll(): Promise<Role[]>;
  findById(id: number): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  findByIds(ids: number[]): Promise<Role[]>;
  update(id: number, data: Partial<Role>): Promise<Role>;
  delete(id: number): Promise<void>;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add repository port role-repository.interface.ts"
```

#### 12.5 — features/auth/roles/infrastructure/persistence/models/role.model.ts (sin asociaciones cruzadas aún)

Modelo Sequelize (`@Table`). Solo infraestructura: mapeo a tabla física. En esta fase se crea **sin** BelongsToMany/HasMany hacia módulos aún no creados, para poder compilar y sincronizar la tabla.

**Archivo:** `src/features/auth/roles/infrastructure/persistence/models/role.model.ts`

```bash
mkdir -p src/features/auth/roles/infrastructure/persistence/models
cat > src/features/auth/roles/infrastructure/persistence/models/role.model.ts <<'EOF_BACKEND_IA'
import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Status } from '../../../../../../common/enums/status.enum';

@Table({ tableName: 'roles' })
export class RoleModel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING(100), allowNull: false, unique: true })
  declare name: string;

  @Column({
    type: DataType.ENUM(...Object.values(Status)),
    allowNull: false,
    defaultValue: Status.ACTIVE,
  })
  declare isActive: Status;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize model role.model.ts without cross associations"
```

#### 12.6 — features/auth/roles/infrastructure/persistence/repositories/sequelize-role.repository.ts

Adaptador del repositorio: implementa el puerto de dominio con Sequelize.

**Archivo:** `src/features/auth/roles/infrastructure/persistence/repositories/sequelize-role.repository.ts`

```bash
mkdir -p src/features/auth/roles/infrastructure/persistence/repositories
cat > src/features/auth/roles/infrastructure/persistence/repositories/sequelize-role.repository.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import { Role } from '../../../domain/entities/role.entity';
import { ROLE_REPOSITORY } from '../../../domain/interfaces/role-repository.interface';
import type { IRoleRepository } from '../../../domain/interfaces/role-repository.interface';
import { RoleModel } from '../models/role.model';
import { RoleMapper } from '../../../application/mappers/role.mapper';

@Injectable()
export class SequelizeRoleRepository implements IRoleRepository {
  async create(role: Role): Promise<Role> {
    const model = await RoleModel.create(RoleMapper.toPersistence(role));
    return RoleMapper.toDomain(model);
  }

  async findAll(): Promise<Role[]> {
    const models = await RoleModel.findAll({ order: [['id', 'ASC']] });
    return models.map(RoleMapper.toDomain);
  }

  async findById(id: number): Promise<Role | null> {
    const model = await RoleModel.findByPk(id);
    return model ? RoleMapper.toDomain(model) : null;
  }

  async findByName(name: string): Promise<Role | null> {
    const model = await RoleModel.findOne({ where: { name } });
    return model ? RoleMapper.toDomain(model) : null;
  }

  async findByIds(ids: number[]): Promise<Role[]> {
    if (ids.length === 0) return [];
    const models = await RoleModel.findAll({ where: { id: { [Op.in]: ids } } });
    return models.map(RoleMapper.toDomain);
  }

  async update(id: number, data: Partial<Role>): Promise<Role> {
    const model = await RoleModel.findByPk(id);
    if (!model) {
      throw new Error(`Role ${id} not found`);
    }
    await model.update(RoleMapper.toPersistence({ ...RoleMapper.toDomain(model), ...data }));
    return RoleMapper.toDomain(model);
  }

  async delete(id: number): Promise<void> {
    await RoleModel.destroy({ where: { id } });
  }
}

export const roleRepositoryProvider = {
  provide: ROLE_REPOSITORY,
  useClass: SequelizeRoleRepository,
};
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize repository sequelize-role.repository.ts"
```

#### 12.7 — features/auth/roles/infrastructure/persistence/seeders/roles.seeder.ts

Seeder de datos iniciales para desarrollo y verificación física en BD.

**Archivo:** `src/features/auth/roles/infrastructure/persistence/seeders/roles.seeder.ts`

```bash
mkdir -p src/features/auth/roles/infrastructure/persistence/seeders
cat > src/features/auth/roles/infrastructure/persistence/seeders/roles.seeder.ts <<'EOF_BACKEND_IA'
/**
 * Seeder de feature deshabilitado.
 * El bootstrap central vive en:
 * src/infrastructure/database/seeders/auth-bootstrap.seeder.ts
 * para respetar el orden de dependencias Business → Auth.
 */
export class FeatureSeederDisabled {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add seeder roles.seeder.ts"
```

#### 12.8 — features/auth/roles/application/dto/create-role.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/auth/roles/application/dto/create-role.dto.ts`

```bash
mkdir -p src/features/auth/roles/application/dto
cat > src/features/auth/roles/application/dto/create-role.dto.ts <<'EOF_BACKEND_IA'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Status } from '../../../../../common/enums/status.enum';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEnum(Status)
  isActive?: Status;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEnum(Status)
  isActive?: Status;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto create-role.dto.ts"
```

#### 12.9 — features/auth/roles/application/dto/update-role.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/auth/roles/application/dto/update-role.dto.ts`

```bash
mkdir -p src/features/auth/roles/application/dto
cat > src/features/auth/roles/application/dto/update-role.dto.ts <<'EOF_BACKEND_IA'
export { UpdateRoleDto } from './create-role.dto';
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto update-role.dto.ts"
```

#### 12.10 — features/auth/roles/application/mappers/role.mapper.ts

Mapper entre entidad de dominio y DTO de respuesta.

**Archivo:** `src/features/auth/roles/application/mappers/role.mapper.ts`

```bash
mkdir -p src/features/auth/roles/application/mappers
cat > src/features/auth/roles/application/mappers/role.mapper.ts <<'EOF_BACKEND_IA'
import { Role } from '../../domain/entities/role.entity';
import { RoleModel } from '../../infrastructure/persistence/models/role.model';

export class RoleMapper {
  static toDomain(model: RoleModel): Role {
    return new Role({
      id: model.id,
      name: model.name,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toPersistence(entity: Role): Partial<RoleModel> {
    return {
      id: entity.id,
      name: entity.name,
      isActive: entity.isActive,
    };
  }

  static toResponse(entity: Role) {
    return {
      id: entity.id,
      name: entity.name,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add mapper role.mapper.ts"
```

#### 12.11 — features/auth/roles/application/use-cases/create-role.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/roles/application/use-cases/create-role.use-case.ts`

```bash
mkdir -p src/features/auth/roles/application/use-cases
cat > src/features/auth/roles/application/use-cases/create-role.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Status } from '../../../../../common/enums/status.enum';
import { Role } from '../../domain/entities/role.entity';
import { RoleNameExistsException } from '../../domain/exceptions/role-name-exists.exception';
import { ROLE_REPOSITORY } from '../../domain/interfaces/role-repository.interface';
import type { IRoleRepository } from '../../domain/interfaces/role-repository.interface';
import { CreateRoleDto } from '../dto/create-role.dto';
import { RoleMapper } from '../mappers/role.mapper';

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(dto: CreateRoleDto) {
    const existing = await this.roleRepository.findByName(dto.name);
    if (existing) {
      throw new RoleNameExistsException(dto.name);
    }

    const role = new Role({
      name: dto.name,
      isActive: dto.isActive ?? Status.ACTIVE,
    });

    const created = await this.roleRepository.create(role);
    return RoleMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case create-role.use-case.ts"
```

#### 12.12 — features/auth/roles/application/use-cases/delete-role.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/roles/application/use-cases/delete-role.use-case.ts`

```bash
mkdir -p src/features/auth/roles/application/use-cases
cat > src/features/auth/roles/application/use-cases/delete-role.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ROLE_REPOSITORY } from '../../domain/interfaces/role-repository.interface';
import type { IRoleRepository } from '../../domain/interfaces/role-repository.interface';
import { RoleNotFoundException } from '../../domain/exceptions/role-not-found.exception';

@Injectable()
export class DeleteRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const existing = await this.roleRepository.findById(id);
    if (!existing) {
      throw new RoleNotFoundException(id);
    }
    await this.roleRepository.delete(id);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case delete-role.use-case.ts"
```

#### 12.13 — features/auth/roles/application/use-cases/get-role.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/roles/application/use-cases/get-role.use-case.ts`

```bash
mkdir -p src/features/auth/roles/application/use-cases
cat > src/features/auth/roles/application/use-cases/get-role.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ROLE_REPOSITORY } from '../../domain/interfaces/role-repository.interface';
import type { IRoleRepository } from '../../domain/interfaces/role-repository.interface';
import { RoleNotFoundException } from '../../domain/exceptions/role-not-found.exception';
import { RoleMapper } from '../mappers/role.mapper';

@Injectable()
export class GetRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(id: number) {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new RoleNotFoundException(id);
    }
    return RoleMapper.toResponse(role);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case get-role.use-case.ts"
```

#### 12.14 — features/auth/roles/application/use-cases/list-roles.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/roles/application/use-cases/list-roles.use-case.ts`

```bash
mkdir -p src/features/auth/roles/application/use-cases
cat > src/features/auth/roles/application/use-cases/list-roles.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ROLE_REPOSITORY } from '../../domain/interfaces/role-repository.interface';
import type { IRoleRepository } from '../../domain/interfaces/role-repository.interface';
import { RoleMapper } from '../mappers/role.mapper';

@Injectable()
export class ListRolesUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute() {
    const roles = await this.roleRepository.findAll();
    return roles.map(RoleMapper.toResponse);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case list-roles.use-case.ts"
```

#### 12.15 — features/auth/roles/application/use-cases/update-role.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/roles/application/use-cases/update-role.use-case.ts`

```bash
mkdir -p src/features/auth/roles/application/use-cases
cat > src/features/auth/roles/application/use-cases/update-role.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { RoleNameExistsException } from '../../domain/exceptions/role-name-exists.exception';
import { RoleNotFoundException } from '../../domain/exceptions/role-not-found.exception';
import { ROLE_REPOSITORY } from '../../domain/interfaces/role-repository.interface';
import type { IRoleRepository } from '../../domain/interfaces/role-repository.interface';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RoleMapper } from '../mappers/role.mapper';

@Injectable()
export class UpdateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(id: number, dto: UpdateRoleDto) {
    const existing = await this.roleRepository.findById(id);
    if (!existing) {
      throw new RoleNotFoundException(id);
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.roleRepository.findByName(dto.name);
      if (nameTaken) {
        throw new RoleNameExistsException(dto.name);
      }
    }

    const updated = await this.roleRepository.update(id, dto);
    return RoleMapper.toResponse(updated);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case update-role.use-case.ts"
```

#### 12.16 — features/auth/roles/presentation/http/controllers/roles.controller.ts

Controller delgado: valida DTO, llama use-case, devuelve respuesta.

**Archivo:** `src/features/auth/roles/presentation/http/controllers/roles.controller.ts`

```bash
mkdir -p src/features/auth/roles/presentation/http/controllers
cat > src/features/auth/roles/presentation/http/controllers/roles.controller.ts <<'EOF_BACKEND_IA'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CreateRoleDto } from '../../../application/dto/create-role.dto';
import { UpdateRoleDto } from '../../../application/dto/update-role.dto';
import { CreateRoleUseCase } from '../../../application/use-cases/create-role.use-case';
import { DeleteRoleUseCase } from '../../../application/use-cases/delete-role.use-case';
import { GetRoleUseCase } from '../../../application/use-cases/get-role.use-case';
import { ListRolesUseCase } from '../../../application/use-cases/list-roles.use-case';
import { UpdateRoleUseCase } from '../../../application/use-cases/update-role.use-case';

@Controller('roles')
export class RolesController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly listRolesUseCase: ListRolesUseCase,
    private readonly getRoleUseCase: GetRoleUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.createRoleUseCase.execute(dto);
  }

  @Get()
  findAll() {
    return this.listRolesUseCase.execute();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.getRoleUseCase.execute(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.updateRoleUseCase.execute(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.deleteRoleUseCase.execute(id);
    return { message: 'Rol eliminado' };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add controller roles.controller.ts"
```

#### 12.17 — features/auth/roles/roles.module.ts

Módulo Nest del feature: cablea providers, tokens DI y controller.

**Archivo:** `src/features/auth/roles/roles.module.ts`

```bash
mkdir -p src/features/auth/roles
cat > src/features/auth/roles/roles.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { CreateRoleUseCase } from './application/use-cases/create-role.use-case';
import { DeleteRoleUseCase } from './application/use-cases/delete-role.use-case';
import { GetRoleUseCase } from './application/use-cases/get-role.use-case';
import { ListRolesUseCase } from './application/use-cases/list-roles.use-case';
import { UpdateRoleUseCase } from './application/use-cases/update-role.use-case';
import { roleRepositoryProvider } from './infrastructure/persistence/repositories/sequelize-role.repository';
import { RolesController } from './presentation/http/controllers/roles.controller';

@Module({
  controllers: [RolesController],
  providers: [
    roleRepositoryProvider,
    CreateRoleUseCase,
    GetRoleUseCase,
    ListRolesUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
  ],
  exports: [roleRepositoryProvider],
})
export class RolesModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: wire nest module roles.module.ts"
```

#### 12.18 — Actualizar sequelize.factory.ts (registrar modelos)

Registra en ALL_MODELS solo los modelos ya creados (orden de dependencias).

**Archivo:** `src/infrastructure/database/sequelize/sequelize.factory.ts`

```bash
mkdir -p src/infrastructure/database/sequelize
cat > src/infrastructure/database/sequelize/sequelize.factory.ts <<'EOF_BACKEND_IA'
import { Sequelize } from 'sequelize-typescript';
import { DatabaseDialect } from '../../../config/environment/env.interface';
import { getSequelizeOptions } from './sequelize.options';

import { ClientModel } from '../../../features/business/clients/infrastructure/persistence/models/client.model';
import { ProductTypeModel } from '../../../features/business/product-types/infrastructure/persistence/models/product-type.model';
import { ProductModel } from '../../../features/business/products/infrastructure/persistence/models/product.model';
import { SaleModel } from '../../../features/business/sales/infrastructure/persistence/models/sale.model';
import { ProductSaleModel } from '../../../features/business/sales/infrastructure/persistence/models/product-sale.model';
import { UserModel } from '../../../features/auth/users/infrastructure/persistence/models/user.model';
import { RoleModel } from '../../../features/auth/roles/infrastructure/persistence/models/role.model';

export const ALL_MODELS = [
  ClientModel,
  ProductTypeModel,
  ProductModel,
  SaleModel,
  ProductSaleModel,
  UserModel,
  RoleModel,
];

export async function createSequelizeInstance(
  dialect: DatabaseDialect,
): Promise<Sequelize> {
  const options = getSequelizeOptions(dialect);

  let dialectModule: any;

  switch (dialect) {
    case DatabaseDialect.MySQL:
      dialectModule = require('mysql2');
      break;
    case DatabaseDialect.Postgres:
      dialectModule = require('pg');
      break;
    case DatabaseDialect.MSSQL:
      dialectModule = require('tedious');
      break;
    case DatabaseDialect.Oracle:
      dialectModule = require('oracledb');
      break;
    default:
      throw new Error(`Dialecto no soportado: ${dialect}`);
  }

  const sequelize = new Sequelize({
    ...options,
    dialectModule,
    models: ALL_MODELS,
  } as any);

  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión exitosa a ${dialect.toUpperCase()}`);
  } catch (error: any) {
    console.error(
      `❌ Error conectando a ${dialect.toUpperCase()}:`,
      error.message,
    );
    throw error;
  }

  if (process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: false });
    console.log('✅ Tablas sincronizadas');
  }

  return sequelize;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: register auth models up to role"
```

#### 12.19 — Actualizar auth.module.ts

Agrega el feature module de auth recién terminado.

**Archivo:** `src/features/auth/auth.module.ts`

```bash
mkdir -p src/features/auth
cat > src/features/auth/auth.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';

@Module({
  imports: [UsersModule, RolesModule],
  exports: [UsersModule, RolesModule],
})
export class AuthModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add roles to AuthModule"
```

#### 12.20 — Actualizar database-seeder.service.ts

Ejecuta seeders en orden de dependencias al arrancar (dev).

**Archivo:** `src/infrastructure/database/seeders/database-seeder.service.ts`

```bash
mkdir -p src/infrastructure/database/seeders
cat > src/infrastructure/database/seeders/database-seeder.service.ts <<'EOF_BACKEND_IA'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { seedClients } from '../../../features/business/clients/infrastructure/persistence/seeders/clients.seeder';
import { seedProductTypes } from '../../../features/business/product-types/infrastructure/persistence/seeders/product-types.seeder';
import { seedProducts } from '../../../features/business/products/infrastructure/persistence/seeders/products.seeder';
import { seedSales } from '../../../features/business/sales/infrastructure/persistence/seeders/sales.seeder';

/**
 * Ejecuta seeders en orden de dependencias.
 * Solo en entornos no productivos.
 */
@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    try {
      await seedClients();
      await seedProductTypes();
      await seedProducts();
      await seedSales();
      this.logger.log('✅ Seeders ejecutados');
    } catch (error: any) {
      this.logger.error(`❌ Error en seeders: ${error.message}`, error.stack);
      throw error;
    }
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: update auth/business seeders bootstrap order"
```

#### 12.21 — Actualizar app.module.ts

Importa BusinessModule y/o AuthModule según el avance. Los guards globales llegan en la fase RBAC.

**Archivo:** `src/app.module.ts`

```bash
mkdir -p src
cat > src/app.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './config/environment/env.config';
import { appConfig } from './config/app/app.config';
import { jwtConfig } from './config/jwt/jwt.config';
import { LoggerModule } from './config/logger/logger.module';
import { SequelizeDatabaseModule } from './infrastructure/database/sequelize/sequelize.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { BusinessModule } from './features/business/business.module';
import { AuthModule } from './features/auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig, appConfig, jwtConfig],
      envFilePath: '.env',
    }),
    SequelizeDatabaseModule,
    SecurityModule,
    LoggerModule,
    BusinessModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: import AuthModule into AppModule"
```

#### 12.22 — Verificar feature auth (Auth — Roles)

Arranca y confirma tablas/endpoints del feature. Si hay asociaciones pendientes, el sync de columnas principales ya debe existir.

```bash
npm run start:dev
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "test: verify 11_auth_roles auth feature"
```


------------------------------------------------------------------------

## FASE 13 — `12_AUTH_ROLE_USERS`

### Auth — RoleUsers

> **Objetivo de la fase:** Pivote user↔role. Tras crearlo, se agregan asociaciones User↔Role (aún sin Resources/RefreshTokens).

#### 13.1 — features/auth/role-users/domain/entities/role-user.entity.ts

Entidad de dominio (TypeScript puro). No extiende Sequelize `Model`. Aquí viven las reglas del negocio.

**Archivo:** `src/features/auth/role-users/domain/entities/role-user.entity.ts`

```bash
mkdir -p src/features/auth/role-users/domain/entities
cat > src/features/auth/role-users/domain/entities/role-user.entity.ts <<'EOF_BACKEND_IA'
import { Status } from '../../../../../common/enums/status.enum';

export class RoleUser {
  id?: number;
  roleId: number;
  userId: number;
  isActive: Status;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial: Partial<RoleUser>) {
    Object.assign(this, partial);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain entity role-user.entity.ts"
```

#### 13.2 — features/auth/role-users/domain/exceptions/role-user-already-assigned.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/auth/role-users/domain/exceptions/role-user-already-assigned.exception.ts`

```bash
mkdir -p src/features/auth/role-users/domain/exceptions
cat > src/features/auth/role-users/domain/exceptions/role-user-already-assigned.exception.ts <<'EOF_BACKEND_IA'
import { DomainException } from '../../../../../common/exceptions/domain.exception';

export class RoleUserAlreadyAssignedException extends DomainException {
  constructor(userId: number, roleId: number) {
    super(`El usuario ${userId} ya tiene asignado el rol ${roleId}`);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception role-user-already-assigned.exception.ts"
```

#### 13.3 — features/auth/role-users/domain/exceptions/role-user-not-found.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/auth/role-users/domain/exceptions/role-user-not-found.exception.ts`

```bash
mkdir -p src/features/auth/role-users/domain/exceptions
cat > src/features/auth/role-users/domain/exceptions/role-user-not-found.exception.ts <<'EOF_BACKEND_IA'
import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception';

export class RoleUserNotFoundException extends EntityNotFoundException {
  constructor(identifier: string | number) {
    super('Asignación de rol', identifier);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception role-user-not-found.exception.ts"
```

#### 13.4 — features/auth/role-users/domain/interfaces/role-user-repository.interface.ts

Puerto (contrato) del repositorio. La aplicación depende de esta interface, no de Sequelize.

**Archivo:** `src/features/auth/role-users/domain/interfaces/role-user-repository.interface.ts`

```bash
mkdir -p src/features/auth/role-users/domain/interfaces
cat > src/features/auth/role-users/domain/interfaces/role-user-repository.interface.ts <<'EOF_BACKEND_IA'
import { RoleUser } from '../entities/role-user.entity';

export const ROLE_USER_REPOSITORY = 'ROLE_USER_REPOSITORY';

export interface IRoleUserRepository {
  assign(roleUser: RoleUser): Promise<RoleUser>;
  revoke(id: number): Promise<void>;
  findByUserId(userId: number): Promise<RoleUser[]>;
  findByUserIdAndRoleId(userId: number, roleId: number): Promise<RoleUser | null>;
  findActiveByUserId(userId: number): Promise<RoleUser[]>;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add repository port role-user-repository.interface.ts"
```

#### 13.5 — features/auth/role-users/infrastructure/persistence/models/role-user.model.ts

Modelo Sequelize (`@Table`). Solo infraestructura: mapeo a tabla física.

**Archivo:** `src/features/auth/role-users/infrastructure/persistence/models/role-user.model.ts`

```bash
mkdir -p src/features/auth/role-users/infrastructure/persistence/models
cat > src/features/auth/role-users/infrastructure/persistence/models/role-user.model.ts <<'EOF_BACKEND_IA'
import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Status } from '../../../../../../common/enums/status.enum';
import { UserModel } from '../../../../users/infrastructure/persistence/models/user.model';
import { RoleModel } from '../../../../roles/infrastructure/persistence/models/role.model';

@Table({ tableName: 'role_users' })
export class RoleUserModel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => RoleModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare roleId: number;

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @Column({
    type: DataType.ENUM(...Object.values(Status)),
    allowNull: false,
    defaultValue: Status.ACTIVE,
  })
  declare isActive: Status;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => RoleModel)
  declare role: RoleModel;

  @BelongsTo(() => UserModel)
  declare user: UserModel;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize model role-user.model.ts"
```

#### 13.6 — features/auth/role-users/infrastructure/persistence/repositories/sequelize-role-user.repository.ts

Adaptador del repositorio: implementa el puerto de dominio con Sequelize.

**Archivo:** `src/features/auth/role-users/infrastructure/persistence/repositories/sequelize-role-user.repository.ts`

```bash
mkdir -p src/features/auth/role-users/infrastructure/persistence/repositories
cat > src/features/auth/role-users/infrastructure/persistence/repositories/sequelize-role-user.repository.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import { Status } from '../../../../../../common/enums/status.enum';
import { RoleUser } from '../../../domain/entities/role-user.entity';
import { ROLE_USER_REPOSITORY } from '../../../domain/interfaces/role-user-repository.interface';
import type { IRoleUserRepository } from '../../../domain/interfaces/role-user-repository.interface';
import { RoleUserModel } from '../models/role-user.model';
import { RoleUserMapper } from '../../../application/mappers/role-user.mapper';

@Injectable()
export class SequelizeRoleUserRepository implements IRoleUserRepository {
  async assign(roleUser: RoleUser): Promise<RoleUser> {
    const model = await RoleUserModel.create(RoleUserMapper.toPersistence(roleUser));
    return RoleUserMapper.toDomain(model);
  }

  async revoke(id: number): Promise<void> {
    await RoleUserModel.update(
      { isActive: Status.INACTIVE },
      { where: { id } },
    );
  }

  async findByUserId(userId: number): Promise<RoleUser[]> {
    const models = await RoleUserModel.findAll({
      where: { userId },
      order: [['id', 'ASC']],
    });
    return models.map(RoleUserMapper.toDomain);
  }

  async findByUserIdAndRoleId(
    userId: number,
    roleId: number,
  ): Promise<RoleUser | null> {
    const model = await RoleUserModel.findOne({ where: { userId, roleId } });
    return model ? RoleUserMapper.toDomain(model) : null;
  }

  async findActiveByUserId(userId: number): Promise<RoleUser[]> {
    const models = await RoleUserModel.findAll({
      where: { userId, isActive: Status.ACTIVE },
    });
    return models.map(RoleUserMapper.toDomain);
  }
}

export const roleUserRepositoryProvider = {
  provide: ROLE_USER_REPOSITORY,
  useClass: SequelizeRoleUserRepository,
};
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize repository sequelize-role-user.repository.ts"
```

#### 13.7 — features/auth/role-users/infrastructure/persistence/seeders/role-users.seeder.ts

Seeder de datos iniciales para desarrollo y verificación física en BD.

**Archivo:** `src/features/auth/role-users/infrastructure/persistence/seeders/role-users.seeder.ts`

```bash
mkdir -p src/features/auth/role-users/infrastructure/persistence/seeders
cat > src/features/auth/role-users/infrastructure/persistence/seeders/role-users.seeder.ts <<'EOF_BACKEND_IA'
/**
 * Seeder de feature deshabilitado.
 * El bootstrap central vive en:
 * src/infrastructure/database/seeders/auth-bootstrap.seeder.ts
 * para respetar el orden de dependencias Business → Auth.
 */
export class FeatureSeederDisabled {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add seeder role-users.seeder.ts"
```

#### 13.8 — features/auth/role-users/application/dto/assign-role-user.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/auth/role-users/application/dto/assign-role-user.dto.ts`

```bash
mkdir -p src/features/auth/role-users/application/dto
cat > src/features/auth/role-users/application/dto/assign-role-user.dto.ts <<'EOF_BACKEND_IA'
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Status } from '../../../../../common/enums/status.enum';

export class AssignRoleUserDto {
  @IsInt()
  roleId: number;

  @IsInt()
  userId: number;

  @IsOptional()
  @IsEnum(Status)
  isActive?: Status;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto assign-role-user.dto.ts"
```

#### 13.9 — features/auth/role-users/application/mappers/role-user.mapper.ts

Mapper entre entidad de dominio y DTO de respuesta.

**Archivo:** `src/features/auth/role-users/application/mappers/role-user.mapper.ts`

```bash
mkdir -p src/features/auth/role-users/application/mappers
cat > src/features/auth/role-users/application/mappers/role-user.mapper.ts <<'EOF_BACKEND_IA'
import { RoleUser } from '../../domain/entities/role-user.entity';
import { RoleUserModel } from '../../infrastructure/persistence/models/role-user.model';

export class RoleUserMapper {
  static toDomain(model: RoleUserModel): RoleUser {
    return new RoleUser({
      id: model.id,
      roleId: model.roleId,
      userId: model.userId,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toPersistence(entity: RoleUser): Partial<RoleUserModel> {
    return {
      id: entity.id,
      roleId: entity.roleId,
      userId: entity.userId,
      isActive: entity.isActive,
    };
  }

  static toResponse(entity: RoleUser) {
    return {
      id: entity.id,
      roleId: entity.roleId,
      userId: entity.userId,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add mapper role-user.mapper.ts"
```

#### 13.10 — features/auth/role-users/application/use-cases/assign-role-user.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/role-users/application/use-cases/assign-role-user.use-case.ts`

```bash
mkdir -p src/features/auth/role-users/application/use-cases
cat > src/features/auth/role-users/application/use-cases/assign-role-user.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Status } from '../../../../../common/enums/status.enum';
import { RoleNotFoundException } from '../../../roles/domain/exceptions/role-not-found.exception';
import { ROLE_REPOSITORY } from '../../../roles/domain/interfaces/role-repository.interface';
import type { IRoleRepository } from '../../../roles/domain/interfaces/role-repository.interface';
import { UserNotFoundException } from '../../../users/domain/exceptions/user-not-found.exception';
import { USER_REPOSITORY } from '../../../users/domain/interfaces/user-repository.interface';
import type { IUserRepository } from '../../../users/domain/interfaces/user-repository.interface';
import { RoleUser } from '../../domain/entities/role-user.entity';
import { RoleUserAlreadyAssignedException } from '../../domain/exceptions/role-user-already-assigned.exception';
import { ROLE_USER_REPOSITORY } from '../../domain/interfaces/role-user-repository.interface';
import type { IRoleUserRepository } from '../../domain/interfaces/role-user-repository.interface';
import { AssignRoleUserDto } from '../dto/assign-role-user.dto';
import { RoleUserMapper } from '../mappers/role-user.mapper';

@Injectable()
export class AssignRoleUserUseCase {
  constructor(
    @Inject(ROLE_USER_REPOSITORY)
    private readonly roleUserRepository: IRoleUserRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(dto: AssignRoleUserDto) {
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new UserNotFoundException(dto.userId);
    }

    const role = await this.roleRepository.findById(dto.roleId);
    if (!role) {
      throw new RoleNotFoundException(dto.roleId);
    }

    const existing = await this.roleUserRepository.findByUserIdAndRoleId(
      dto.userId,
      dto.roleId,
    );
    if (existing && existing.isActive === Status.ACTIVE) {
      throw new RoleUserAlreadyAssignedException(dto.userId, dto.roleId);
    }

    const roleUser = new RoleUser({
      roleId: dto.roleId,
      userId: dto.userId,
      isActive: dto.isActive ?? Status.ACTIVE,
    });

    const assigned = await this.roleUserRepository.assign(roleUser);
    return RoleUserMapper.toResponse(assigned);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case assign-role-user.use-case.ts"
```

#### 13.11 — features/auth/role-users/application/use-cases/list-role-users-by-user.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/role-users/application/use-cases/list-role-users-by-user.use-case.ts`

```bash
mkdir -p src/features/auth/role-users/application/use-cases
cat > src/features/auth/role-users/application/use-cases/list-role-users-by-user.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ROLE_REPOSITORY } from '../../../roles/domain/interfaces/role-repository.interface';
import type { IRoleRepository } from '../../../roles/domain/interfaces/role-repository.interface';
import { ROLE_USER_REPOSITORY } from '../../domain/interfaces/role-user-repository.interface';
import type { IRoleUserRepository } from '../../domain/interfaces/role-user-repository.interface';
import { RoleUserMapper } from '../mappers/role-user.mapper';

@Injectable()
export class ListRoleUsersByUserUseCase {
  constructor(
    @Inject(ROLE_USER_REPOSITORY)
    private readonly roleUserRepository: IRoleUserRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(userId: number) {
    const roleUsers = await this.roleUserRepository.findByUserId(userId);
    const roleIds = roleUsers.map((ru) => ru.roleId);
    const roles = await this.roleRepository.findByIds(roleIds);
    const roleMap = new Map(roles.map((r) => [r.id, r.name]));

    return roleUsers.map((ru) => ({
      ...RoleUserMapper.toResponse(ru),
      roleName: roleMap.get(ru.roleId),
    }));
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case list-role-users-by-user.use-case.ts"
```

#### 13.12 — features/auth/role-users/application/use-cases/revoke-role-user.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/role-users/application/use-cases/revoke-role-user.use-case.ts`

```bash
mkdir -p src/features/auth/role-users/application/use-cases
cat > src/features/auth/role-users/application/use-cases/revoke-role-user.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ROLE_USER_REPOSITORY } from '../../domain/interfaces/role-user-repository.interface';
import type { IRoleUserRepository } from '../../domain/interfaces/role-user-repository.interface';
import { RoleUserNotFoundException } from '../../domain/exceptions/role-user-not-found.exception';
import { RoleUserModel } from '../../infrastructure/persistence/models/role-user.model';

@Injectable()
export class RevokeRoleUserUseCase {
  constructor(
    @Inject(ROLE_USER_REPOSITORY)
    private readonly roleUserRepository: IRoleUserRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const existing = await RoleUserModel.findByPk(id);
    if (!existing) {
      throw new RoleUserNotFoundException(id);
    }
    await this.roleUserRepository.revoke(id);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case revoke-role-user.use-case.ts"
```

#### 13.13 — features/auth/role-users/presentation/http/controllers/role-users.controller.ts

Controller delgado: valida DTO, llama use-case, devuelve respuesta.

**Archivo:** `src/features/auth/role-users/presentation/http/controllers/role-users.controller.ts`

```bash
mkdir -p src/features/auth/role-users/presentation/http/controllers
cat > src/features/auth/role-users/presentation/http/controllers/role-users.controller.ts <<'EOF_BACKEND_IA'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { AssignRoleUserDto } from '../../../application/dto/assign-role-user.dto';
import { AssignRoleUserUseCase } from '../../../application/use-cases/assign-role-user.use-case';
import { ListRoleUsersByUserUseCase } from '../../../application/use-cases/list-role-users-by-user.use-case';
import { RevokeRoleUserUseCase } from '../../../application/use-cases/revoke-role-user.use-case';

@Controller('role-users')
export class RoleUsersController {
  constructor(
    private readonly assignRoleUserUseCase: AssignRoleUserUseCase,
    private readonly revokeRoleUserUseCase: RevokeRoleUserUseCase,
    private readonly listRoleUsersByUserUseCase: ListRoleUsersByUserUseCase,
  ) {}

  @Post()
  assign(@Body() dto: AssignRoleUserDto) {
    return this.assignRoleUserUseCase.execute(dto);
  }

  @Delete(':id')
  async revoke(@Param('id', ParseIntPipe) id: number) {
    await this.revokeRoleUserUseCase.execute(id);
    return { message: 'Asignación revocada' };
  }

  @Get('user/:userId')
  listByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.listRoleUsersByUserUseCase.execute(userId);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add controller role-users.controller.ts"
```

#### 13.14 — features/auth/role-users/role-users.module.ts

Módulo Nest del feature: cablea providers, tokens DI y controller.

**Archivo:** `src/features/auth/role-users/role-users.module.ts`

```bash
mkdir -p src/features/auth/role-users
cat > src/features/auth/role-users/role-users.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';
import { AssignRoleUserUseCase } from './application/use-cases/assign-role-user.use-case';
import { ListRoleUsersByUserUseCase } from './application/use-cases/list-role-users-by-user.use-case';
import { RevokeRoleUserUseCase } from './application/use-cases/revoke-role-user.use-case';
import { roleUserRepositoryProvider } from './infrastructure/persistence/repositories/sequelize-role-user.repository';
import { RoleUsersController } from './presentation/http/controllers/role-users.controller';

@Module({
  imports: [UsersModule, RolesModule],
  controllers: [RoleUsersController],
  providers: [
    roleUserRepositoryProvider,
    AssignRoleUserUseCase,
    RevokeRoleUserUseCase,
    ListRoleUsersByUserUseCase,
  ],
  exports: [roleUserRepositoryProvider],
})
export class RoleUsersModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: wire nest module role-users.module.ts"
```

#### 13.15 — Actualizar user.model.ts (asociación roles, sin refreshTokens)

Ya existe RoleUserModel: se cablea BelongsToMany roles. RefreshTokens llega en Fase 16.

**Archivo:** `src/features/auth/users/infrastructure/persistence/models/user.model.ts`

```bash
mkdir -p src/features/auth/users/infrastructure/persistence/models
cat > src/features/auth/users/infrastructure/persistence/models/user.model.ts <<'EOF_BACKEND_IA'
import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  BelongsToMany,
} from 'sequelize-typescript';
import { Status } from '../../../../../../common/enums/status.enum';
import { RoleModel } from '../../../../roles/infrastructure/persistence/models/role.model';
import { RoleUserModel } from '../../../../role-users/infrastructure/persistence/models/role-user.model';

@Table({ tableName: 'users' })
export class UserModel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING(100), allowNull: false, unique: true })
  declare username: string;

  @Column({ type: DataType.STRING(150), allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare password: string;

  @Column({
    type: DataType.ENUM(...Object.values(Status)),
    allowNull: false,
    defaultValue: Status.ACTIVE,
  })
  declare isActive: Status;

  @Column({ type: DataType.STRING(500), allowNull: true })
  declare avatar: string | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsToMany(() => RoleModel, () => RoleUserModel)
  declare roles: RoleModel[];
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: link UserModel BelongsToMany roles via RoleUserModel"
```

#### 13.16 — Actualizar role.model.ts (asociación users, sin resources)

Se cablea BelongsToMany users. Resources llega en Fases 14–15.

**Archivo:** `src/features/auth/roles/infrastructure/persistence/models/role.model.ts`

```bash
mkdir -p src/features/auth/roles/infrastructure/persistence/models
cat > src/features/auth/roles/infrastructure/persistence/models/role.model.ts <<'EOF_BACKEND_IA'
import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  BelongsToMany,
} from 'sequelize-typescript';
import { Status } from '../../../../../../common/enums/status.enum';
import { UserModel } from '../../../../users/infrastructure/persistence/models/user.model';
import { RoleUserModel } from '../../../../role-users/infrastructure/persistence/models/role-user.model';

@Table({ tableName: 'roles' })
export class RoleModel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING(100), allowNull: false, unique: true })
  declare name: string;

  @Column({
    type: DataType.ENUM(...Object.values(Status)),
    allowNull: false,
    defaultValue: Status.ACTIVE,
  })
  declare isActive: Status;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsToMany(() => UserModel, () => RoleUserModel)
  declare users: UserModel[];
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: link RoleModel BelongsToMany users via RoleUserModel"
```

#### 13.17 — Actualizar sequelize.factory.ts (registrar modelos)

Registra en ALL_MODELS solo los modelos ya creados (orden de dependencias).

**Archivo:** `src/infrastructure/database/sequelize/sequelize.factory.ts`

```bash
mkdir -p src/infrastructure/database/sequelize
cat > src/infrastructure/database/sequelize/sequelize.factory.ts <<'EOF_BACKEND_IA'
import { Sequelize } from 'sequelize-typescript';
import { DatabaseDialect } from '../../../config/environment/env.interface';
import { getSequelizeOptions } from './sequelize.options';

import { ClientModel } from '../../../features/business/clients/infrastructure/persistence/models/client.model';
import { ProductTypeModel } from '../../../features/business/product-types/infrastructure/persistence/models/product-type.model';
import { ProductModel } from '../../../features/business/products/infrastructure/persistence/models/product.model';
import { SaleModel } from '../../../features/business/sales/infrastructure/persistence/models/sale.model';
import { ProductSaleModel } from '../../../features/business/sales/infrastructure/persistence/models/product-sale.model';
import { UserModel } from '../../../features/auth/users/infrastructure/persistence/models/user.model';
import { RoleModel } from '../../../features/auth/roles/infrastructure/persistence/models/role.model';
import { RoleUserModel } from '../../../features/auth/role-users/infrastructure/persistence/models/role-user.model';

export const ALL_MODELS = [
  ClientModel,
  ProductTypeModel,
  ProductModel,
  SaleModel,
  ProductSaleModel,
  UserModel,
  RoleModel,
  RoleUserModel,
];

export async function createSequelizeInstance(
  dialect: DatabaseDialect,
): Promise<Sequelize> {
  const options = getSequelizeOptions(dialect);

  let dialectModule: any;

  switch (dialect) {
    case DatabaseDialect.MySQL:
      dialectModule = require('mysql2');
      break;
    case DatabaseDialect.Postgres:
      dialectModule = require('pg');
      break;
    case DatabaseDialect.MSSQL:
      dialectModule = require('tedious');
      break;
    case DatabaseDialect.Oracle:
      dialectModule = require('oracledb');
      break;
    default:
      throw new Error(`Dialecto no soportado: ${dialect}`);
  }

  const sequelize = new Sequelize({
    ...options,
    dialectModule,
    models: ALL_MODELS,
  } as any);

  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión exitosa a ${dialect.toUpperCase()}`);
  } catch (error: any) {
    console.error(
      `❌ Error conectando a ${dialect.toUpperCase()}:`,
      error.message,
    );
    throw error;
  }

  if (process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: false });
    console.log('✅ Tablas sincronizadas');
  }

  return sequelize;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: register auth models up to roleUser"
```

#### 13.18 — Actualizar auth.module.ts

Agrega el feature module de auth recién terminado.

**Archivo:** `src/features/auth/auth.module.ts`

```bash
mkdir -p src/features/auth
cat > src/features/auth/auth.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { RoleUsersModule } from './role-users/role-users.module';

@Module({
  imports: [UsersModule, RolesModule, RoleUsersModule],
  exports: [UsersModule, RolesModule, RoleUsersModule],
})
export class AuthModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add roleUsers to AuthModule"
```

#### 13.19 — Actualizar database-seeder.service.ts

Ejecuta seeders en orden de dependencias al arrancar (dev).

**Archivo:** `src/infrastructure/database/seeders/database-seeder.service.ts`

```bash
mkdir -p src/infrastructure/database/seeders
cat > src/infrastructure/database/seeders/database-seeder.service.ts <<'EOF_BACKEND_IA'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { seedClients } from '../../../features/business/clients/infrastructure/persistence/seeders/clients.seeder';
import { seedProductTypes } from '../../../features/business/product-types/infrastructure/persistence/seeders/product-types.seeder';
import { seedProducts } from '../../../features/business/products/infrastructure/persistence/seeders/products.seeder';
import { seedSales } from '../../../features/business/sales/infrastructure/persistence/seeders/sales.seeder';

/**
 * Ejecuta seeders en orden de dependencias.
 * Solo en entornos no productivos.
 */
@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    try {
      await seedClients();
      await seedProductTypes();
      await seedProducts();
      await seedSales();
      this.logger.log('✅ Seeders ejecutados');
    } catch (error: any) {
      this.logger.error(`❌ Error en seeders: ${error.message}`, error.stack);
      throw error;
    }
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: update auth/business seeders bootstrap order"
```

#### 13.20 — Actualizar app.module.ts

Importa BusinessModule y/o AuthModule según el avance. Los guards globales llegan en la fase RBAC.

**Archivo:** `src/app.module.ts`

```bash
mkdir -p src
cat > src/app.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './config/environment/env.config';
import { appConfig } from './config/app/app.config';
import { jwtConfig } from './config/jwt/jwt.config';
import { LoggerModule } from './config/logger/logger.module';
import { SequelizeDatabaseModule } from './infrastructure/database/sequelize/sequelize.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { BusinessModule } from './features/business/business.module';
import { AuthModule } from './features/auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig, appConfig, jwtConfig],
      envFilePath: '.env',
    }),
    SequelizeDatabaseModule,
    SecurityModule,
    LoggerModule,
    BusinessModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: import AuthModule into AppModule"
```

#### 13.21 — Verificar feature auth (Auth — RoleUsers)

Arranca y confirma tablas/endpoints del feature. Si hay asociaciones pendientes, el sync de columnas principales ya debe existir.

```bash
npm run start:dev
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "test: verify 12_auth_role_users auth feature"
```


------------------------------------------------------------------------

## FASE 14 — `13_AUTH_RESOURCES`

### Auth — Resources

> **Objetivo de la fase:** Recursos HTTP protegibles (path + method). Modelo sin ResourceRoles aún.

#### 14.1 — features/auth/resources/domain/entities/resource.entity.ts

Entidad de dominio (TypeScript puro). No extiende Sequelize `Model`. Aquí viven las reglas del negocio.

**Archivo:** `src/features/auth/resources/domain/entities/resource.entity.ts`

```bash
mkdir -p src/features/auth/resources/domain/entities
cat > src/features/auth/resources/domain/entities/resource.entity.ts <<'EOF_BACKEND_IA'
import { Status } from '../../../../../common/enums/status.enum';

export class Resource {
  id?: number;
  path: string;
  method: string;
  isActive: Status;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial: Partial<Resource>) {
    Object.assign(this, partial);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain entity resource.entity.ts"
```

#### 14.2 — features/auth/resources/domain/exceptions/resource-not-found.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/auth/resources/domain/exceptions/resource-not-found.exception.ts`

```bash
mkdir -p src/features/auth/resources/domain/exceptions
cat > src/features/auth/resources/domain/exceptions/resource-not-found.exception.ts <<'EOF_BACKEND_IA'
import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception';

export class ResourceNotFoundException extends EntityNotFoundException {
  constructor(identifier: string | number) {
    super('Recurso', identifier);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception resource-not-found.exception.ts"
```

#### 14.3 — features/auth/resources/domain/interfaces/resource-repository.interface.ts

Puerto (contrato) del repositorio. La aplicación depende de esta interface, no de Sequelize.

**Archivo:** `src/features/auth/resources/domain/interfaces/resource-repository.interface.ts`

```bash
mkdir -p src/features/auth/resources/domain/interfaces
cat > src/features/auth/resources/domain/interfaces/resource-repository.interface.ts <<'EOF_BACKEND_IA'
import { Resource } from '../entities/resource.entity';

export const RESOURCE_REPOSITORY = 'RESOURCE_REPOSITORY';

export interface IResourceRepository {
  create(resource: Resource): Promise<Resource>;
  findAll(): Promise<Resource[]>;
  findById(id: number): Promise<Resource | null>;
  findByPathAndMethod(path: string, method: string): Promise<Resource | null>;
  update(id: number, data: Partial<Resource>): Promise<Resource>;
  delete(id: number): Promise<void>;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add repository port resource-repository.interface.ts"
```

#### 14.4 — features/auth/resources/infrastructure/persistence/models/resource.model.ts (sin asociaciones cruzadas aún)

Modelo Sequelize (`@Table`). Solo infraestructura: mapeo a tabla física. En esta fase se crea **sin** BelongsToMany/HasMany hacia módulos aún no creados, para poder compilar y sincronizar la tabla.

**Archivo:** `src/features/auth/resources/infrastructure/persistence/models/resource.model.ts`

```bash
mkdir -p src/features/auth/resources/infrastructure/persistence/models
cat > src/features/auth/resources/infrastructure/persistence/models/resource.model.ts <<'EOF_BACKEND_IA'
import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Status } from '../../../../../../common/enums/status.enum';

@Table({ tableName: 'resources' })
export class ResourceModel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare path: string;

  @Column({ type: DataType.STRING(10), allowNull: false })
  declare method: string;

  @Column({
    type: DataType.ENUM(...Object.values(Status)),
    allowNull: false,
    defaultValue: Status.ACTIVE,
  })
  declare isActive: Status;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize model resource.model.ts without cross associations"
```

#### 14.5 — features/auth/resources/infrastructure/persistence/repositories/sequelize-resource.repository.ts

Adaptador del repositorio: implementa el puerto de dominio con Sequelize.

**Archivo:** `src/features/auth/resources/infrastructure/persistence/repositories/sequelize-resource.repository.ts`

```bash
mkdir -p src/features/auth/resources/infrastructure/persistence/repositories
cat > src/features/auth/resources/infrastructure/persistence/repositories/sequelize-resource.repository.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import { Resource } from '../../../domain/entities/resource.entity';
import { RESOURCE_REPOSITORY } from '../../../domain/interfaces/resource-repository.interface';
import type { IResourceRepository } from '../../../domain/interfaces/resource-repository.interface';
import { ResourceModel } from '../models/resource.model';
import { ResourceMapper } from '../../../application/mappers/resource.mapper';

@Injectable()
export class SequelizeResourceRepository implements IResourceRepository {
  async create(resource: Resource): Promise<Resource> {
    const model = await ResourceModel.create(ResourceMapper.toPersistence(resource));
    return ResourceMapper.toDomain(model);
  }

  async findAll(): Promise<Resource[]> {
    const models = await ResourceModel.findAll({ order: [['id', 'ASC']] });
    return models.map(ResourceMapper.toDomain);
  }

  async findById(id: number): Promise<Resource | null> {
    const model = await ResourceModel.findByPk(id);
    return model ? ResourceMapper.toDomain(model) : null;
  }

  async findByPathAndMethod(path: string, method: string): Promise<Resource | null> {
    const model = await ResourceModel.findOne({ where: { path, method } });
    return model ? ResourceMapper.toDomain(model) : null;
  }

  async update(id: number, data: Partial<Resource>): Promise<Resource> {
    const model = await ResourceModel.findByPk(id);
    if (!model) {
      throw new Error(`Resource ${id} not found`);
    }
    await model.update(
      ResourceMapper.toPersistence({ ...ResourceMapper.toDomain(model), ...data }),
    );
    return ResourceMapper.toDomain(model);
  }

  async delete(id: number): Promise<void> {
    await ResourceModel.destroy({ where: { id } });
  }
}

export const resourceRepositoryProvider = {
  provide: RESOURCE_REPOSITORY,
  useClass: SequelizeResourceRepository,
};
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize repository sequelize-resource.repository.ts"
```

#### 14.6 — features/auth/resources/infrastructure/persistence/seeders/resources.seeder.ts

Seeder de datos iniciales para desarrollo y verificación física en BD.

**Archivo:** `src/features/auth/resources/infrastructure/persistence/seeders/resources.seeder.ts`

```bash
mkdir -p src/features/auth/resources/infrastructure/persistence/seeders
cat > src/features/auth/resources/infrastructure/persistence/seeders/resources.seeder.ts <<'EOF_BACKEND_IA'
/**
 * Seeder de feature deshabilitado.
 * El bootstrap central vive en:
 * src/infrastructure/database/seeders/auth-bootstrap.seeder.ts
 * para respetar el orden de dependencias Business → Auth.
 */
export class FeatureSeederDisabled {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add seeder resources.seeder.ts"
```

#### 14.7 — features/auth/resources/application/dto/create-resource.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/auth/resources/application/dto/create-resource.dto.ts`

```bash
mkdir -p src/features/auth/resources/application/dto
cat > src/features/auth/resources/application/dto/create-resource.dto.ts <<'EOF_BACKEND_IA'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { HttpMethod } from '../../../../../common/enums/http-method.enum';
import { Status } from '../../../../../common/enums/status.enum';

export class CreateResourceDto {
  @IsString()
  @IsNotEmpty()
  path: string;

  @IsEnum(HttpMethod)
  method: HttpMethod;

  @IsOptional()
  @IsEnum(Status)
  isActive?: Status;
}

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  path?: string;

  @IsOptional()
  @IsEnum(HttpMethod)
  method?: HttpMethod;

  @IsOptional()
  @IsEnum(Status)
  isActive?: Status;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto create-resource.dto.ts"
```

#### 14.8 — features/auth/resources/application/mappers/resource.mapper.ts

Mapper entre entidad de dominio y DTO de respuesta.

**Archivo:** `src/features/auth/resources/application/mappers/resource.mapper.ts`

```bash
mkdir -p src/features/auth/resources/application/mappers
cat > src/features/auth/resources/application/mappers/resource.mapper.ts <<'EOF_BACKEND_IA'
import { Resource } from '../../domain/entities/resource.entity';
import { ResourceModel } from '../../infrastructure/persistence/models/resource.model';

export class ResourceMapper {
  static toDomain(model: ResourceModel): Resource {
    return new Resource({
      id: model.id,
      path: model.path,
      method: model.method,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toPersistence(entity: Resource): Partial<ResourceModel> {
    return {
      id: entity.id,
      path: entity.path,
      method: entity.method,
      isActive: entity.isActive,
    };
  }

  static toResponse(entity: Resource) {
    return {
      id: entity.id,
      path: entity.path,
      method: entity.method,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add mapper resource.mapper.ts"
```

#### 14.9 — features/auth/resources/application/use-cases/create-resource.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/resources/application/use-cases/create-resource.use-case.ts`

```bash
mkdir -p src/features/auth/resources/application/use-cases
cat > src/features/auth/resources/application/use-cases/create-resource.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Status } from '../../../../../common/enums/status.enum';
import { Resource } from '../../domain/entities/resource.entity';
import { RESOURCE_REPOSITORY } from '../../domain/interfaces/resource-repository.interface';
import type { IResourceRepository } from '../../domain/interfaces/resource-repository.interface';
import { CreateResourceDto } from '../dto/create-resource.dto';
import { ResourceMapper } from '../mappers/resource.mapper';

@Injectable()
export class CreateResourceUseCase {
  constructor(
    @Inject(RESOURCE_REPOSITORY)
    private readonly resourceRepository: IResourceRepository,
  ) {}

  async execute(dto: CreateResourceDto) {
    const resource = new Resource({
      path: dto.path,
      method: dto.method,
      isActive: dto.isActive ?? Status.ACTIVE,
    });

    const created = await this.resourceRepository.create(resource);
    return ResourceMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case create-resource.use-case.ts"
```

#### 14.10 — features/auth/resources/application/use-cases/delete-resource.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/resources/application/use-cases/delete-resource.use-case.ts`

```bash
mkdir -p src/features/auth/resources/application/use-cases
cat > src/features/auth/resources/application/use-cases/delete-resource.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { RESOURCE_REPOSITORY } from '../../domain/interfaces/resource-repository.interface';
import type { IResourceRepository } from '../../domain/interfaces/resource-repository.interface';
import { ResourceNotFoundException } from '../../domain/exceptions/resource-not-found.exception';

@Injectable()
export class DeleteResourceUseCase {
  constructor(
    @Inject(RESOURCE_REPOSITORY)
    private readonly resourceRepository: IResourceRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const existing = await this.resourceRepository.findById(id);
    if (!existing) {
      throw new ResourceNotFoundException(id);
    }
    await this.resourceRepository.delete(id);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case delete-resource.use-case.ts"
```

#### 14.11 — features/auth/resources/application/use-cases/get-resource.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/resources/application/use-cases/get-resource.use-case.ts`

```bash
mkdir -p src/features/auth/resources/application/use-cases
cat > src/features/auth/resources/application/use-cases/get-resource.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { RESOURCE_REPOSITORY } from '../../domain/interfaces/resource-repository.interface';
import type { IResourceRepository } from '../../domain/interfaces/resource-repository.interface';
import { ResourceNotFoundException } from '../../domain/exceptions/resource-not-found.exception';
import { ResourceMapper } from '../mappers/resource.mapper';

@Injectable()
export class GetResourceUseCase {
  constructor(
    @Inject(RESOURCE_REPOSITORY)
    private readonly resourceRepository: IResourceRepository,
  ) {}

  async execute(id: number) {
    const resource = await this.resourceRepository.findById(id);
    if (!resource) {
      throw new ResourceNotFoundException(id);
    }
    return ResourceMapper.toResponse(resource);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case get-resource.use-case.ts"
```

#### 14.12 — features/auth/resources/application/use-cases/list-resources.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/resources/application/use-cases/list-resources.use-case.ts`

```bash
mkdir -p src/features/auth/resources/application/use-cases
cat > src/features/auth/resources/application/use-cases/list-resources.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { RESOURCE_REPOSITORY } from '../../domain/interfaces/resource-repository.interface';
import type { IResourceRepository } from '../../domain/interfaces/resource-repository.interface';
import { ResourceMapper } from '../mappers/resource.mapper';

@Injectable()
export class ListResourcesUseCase {
  constructor(
    @Inject(RESOURCE_REPOSITORY)
    private readonly resourceRepository: IResourceRepository,
  ) {}

  async execute() {
    const resources = await this.resourceRepository.findAll();
    return resources.map(ResourceMapper.toResponse);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case list-resources.use-case.ts"
```

#### 14.13 — features/auth/resources/application/use-cases/update-resource.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/resources/application/use-cases/update-resource.use-case.ts`

```bash
mkdir -p src/features/auth/resources/application/use-cases
cat > src/features/auth/resources/application/use-cases/update-resource.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { RESOURCE_REPOSITORY } from '../../domain/interfaces/resource-repository.interface';
import type { IResourceRepository } from '../../domain/interfaces/resource-repository.interface';
import { ResourceNotFoundException } from '../../domain/exceptions/resource-not-found.exception';
import { UpdateResourceDto } from '../dto/create-resource.dto';
import { ResourceMapper } from '../mappers/resource.mapper';

@Injectable()
export class UpdateResourceUseCase {
  constructor(
    @Inject(RESOURCE_REPOSITORY)
    private readonly resourceRepository: IResourceRepository,
  ) {}

  async execute(id: number, dto: UpdateResourceDto) {
    const existing = await this.resourceRepository.findById(id);
    if (!existing) {
      throw new ResourceNotFoundException(id);
    }

    const updated = await this.resourceRepository.update(id, dto);
    return ResourceMapper.toResponse(updated);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case update-resource.use-case.ts"
```

#### 14.14 — features/auth/resources/presentation/http/controllers/resources.controller.ts

Controller delgado: valida DTO, llama use-case, devuelve respuesta.

**Archivo:** `src/features/auth/resources/presentation/http/controllers/resources.controller.ts`

```bash
mkdir -p src/features/auth/resources/presentation/http/controllers
cat > src/features/auth/resources/presentation/http/controllers/resources.controller.ts <<'EOF_BACKEND_IA'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CreateResourceDto, UpdateResourceDto } from '../../../application/dto/create-resource.dto';
import { CreateResourceUseCase } from '../../../application/use-cases/create-resource.use-case';
import { DeleteResourceUseCase } from '../../../application/use-cases/delete-resource.use-case';
import { GetResourceUseCase } from '../../../application/use-cases/get-resource.use-case';
import { ListResourcesUseCase } from '../../../application/use-cases/list-resources.use-case';
import { UpdateResourceUseCase } from '../../../application/use-cases/update-resource.use-case';

@Controller('resources')
export class ResourcesController {
  constructor(
    private readonly createResourceUseCase: CreateResourceUseCase,
    private readonly listResourcesUseCase: ListResourcesUseCase,
    private readonly getResourceUseCase: GetResourceUseCase,
    private readonly updateResourceUseCase: UpdateResourceUseCase,
    private readonly deleteResourceUseCase: DeleteResourceUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateResourceDto) {
    return this.createResourceUseCase.execute(dto);
  }

  @Get()
  findAll() {
    return this.listResourcesUseCase.execute();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.getResourceUseCase.execute(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateResourceDto) {
    return this.updateResourceUseCase.execute(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.deleteResourceUseCase.execute(id);
    return { message: 'Recurso eliminado' };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add controller resources.controller.ts"
```

#### 14.15 — features/auth/resources/resources.module.ts

Módulo Nest del feature: cablea providers, tokens DI y controller.

**Archivo:** `src/features/auth/resources/resources.module.ts`

```bash
mkdir -p src/features/auth/resources
cat > src/features/auth/resources/resources.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { CreateResourceUseCase } from './application/use-cases/create-resource.use-case';
import { DeleteResourceUseCase } from './application/use-cases/delete-resource.use-case';
import { GetResourceUseCase } from './application/use-cases/get-resource.use-case';
import { ListResourcesUseCase } from './application/use-cases/list-resources.use-case';
import { UpdateResourceUseCase } from './application/use-cases/update-resource.use-case';
import { resourceRepositoryProvider } from './infrastructure/persistence/repositories/sequelize-resource.repository';
import { ResourcesController } from './presentation/http/controllers/resources.controller';

@Module({
  controllers: [ResourcesController],
  providers: [
    resourceRepositoryProvider,
    CreateResourceUseCase,
    GetResourceUseCase,
    ListResourcesUseCase,
    UpdateResourceUseCase,
    DeleteResourceUseCase,
  ],
  exports: [resourceRepositoryProvider],
})
export class ResourcesModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: wire nest module resources.module.ts"
```

#### 14.16 — Actualizar sequelize.factory.ts (registrar modelos)

Registra en ALL_MODELS solo los modelos ya creados (orden de dependencias).

**Archivo:** `src/infrastructure/database/sequelize/sequelize.factory.ts`

```bash
mkdir -p src/infrastructure/database/sequelize
cat > src/infrastructure/database/sequelize/sequelize.factory.ts <<'EOF_BACKEND_IA'
import { Sequelize } from 'sequelize-typescript';
import { DatabaseDialect } from '../../../config/environment/env.interface';
import { getSequelizeOptions } from './sequelize.options';

import { ClientModel } from '../../../features/business/clients/infrastructure/persistence/models/client.model';
import { ProductTypeModel } from '../../../features/business/product-types/infrastructure/persistence/models/product-type.model';
import { ProductModel } from '../../../features/business/products/infrastructure/persistence/models/product.model';
import { SaleModel } from '../../../features/business/sales/infrastructure/persistence/models/sale.model';
import { ProductSaleModel } from '../../../features/business/sales/infrastructure/persistence/models/product-sale.model';
import { UserModel } from '../../../features/auth/users/infrastructure/persistence/models/user.model';
import { RoleModel } from '../../../features/auth/roles/infrastructure/persistence/models/role.model';
import { RoleUserModel } from '../../../features/auth/role-users/infrastructure/persistence/models/role-user.model';
import { ResourceModel } from '../../../features/auth/resources/infrastructure/persistence/models/resource.model';

export const ALL_MODELS = [
  ClientModel,
  ProductTypeModel,
  ProductModel,
  SaleModel,
  ProductSaleModel,
  UserModel,
  RoleModel,
  RoleUserModel,
  ResourceModel,
];

export async function createSequelizeInstance(
  dialect: DatabaseDialect,
): Promise<Sequelize> {
  const options = getSequelizeOptions(dialect);

  let dialectModule: any;

  switch (dialect) {
    case DatabaseDialect.MySQL:
      dialectModule = require('mysql2');
      break;
    case DatabaseDialect.Postgres:
      dialectModule = require('pg');
      break;
    case DatabaseDialect.MSSQL:
      dialectModule = require('tedious');
      break;
    case DatabaseDialect.Oracle:
      dialectModule = require('oracledb');
      break;
    default:
      throw new Error(`Dialecto no soportado: ${dialect}`);
  }

  const sequelize = new Sequelize({
    ...options,
    dialectModule,
    models: ALL_MODELS,
  } as any);

  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión exitosa a ${dialect.toUpperCase()}`);
  } catch (error: any) {
    console.error(
      `❌ Error conectando a ${dialect.toUpperCase()}:`,
      error.message,
    );
    throw error;
  }

  if (process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: false });
    console.log('✅ Tablas sincronizadas');
  }

  return sequelize;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: register auth models up to resource"
```

#### 14.17 — Actualizar auth.module.ts

Agrega el feature module de auth recién terminado.

**Archivo:** `src/features/auth/auth.module.ts`

```bash
mkdir -p src/features/auth
cat > src/features/auth/auth.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { RoleUsersModule } from './role-users/role-users.module';
import { ResourcesModule } from './resources/resources.module';

@Module({
  imports: [UsersModule, RolesModule, RoleUsersModule, ResourcesModule],
  exports: [UsersModule, RolesModule, RoleUsersModule, ResourcesModule],
})
export class AuthModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add resources to AuthModule"
```

#### 14.18 — Actualizar database-seeder.service.ts

Ejecuta seeders en orden de dependencias al arrancar (dev).

**Archivo:** `src/infrastructure/database/seeders/database-seeder.service.ts`

```bash
mkdir -p src/infrastructure/database/seeders
cat > src/infrastructure/database/seeders/database-seeder.service.ts <<'EOF_BACKEND_IA'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { seedClients } from '../../../features/business/clients/infrastructure/persistence/seeders/clients.seeder';
import { seedProductTypes } from '../../../features/business/product-types/infrastructure/persistence/seeders/product-types.seeder';
import { seedProducts } from '../../../features/business/products/infrastructure/persistence/seeders/products.seeder';
import { seedSales } from '../../../features/business/sales/infrastructure/persistence/seeders/sales.seeder';

/**
 * Ejecuta seeders en orden de dependencias.
 * Solo en entornos no productivos.
 */
@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    try {
      await seedClients();
      await seedProductTypes();
      await seedProducts();
      await seedSales();
      this.logger.log('✅ Seeders ejecutados');
    } catch (error: any) {
      this.logger.error(`❌ Error en seeders: ${error.message}`, error.stack);
      throw error;
    }
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: update auth/business seeders bootstrap order"
```

#### 14.19 — Actualizar app.module.ts

Importa BusinessModule y/o AuthModule según el avance. Los guards globales llegan en la fase RBAC.

**Archivo:** `src/app.module.ts`

```bash
mkdir -p src
cat > src/app.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './config/environment/env.config';
import { appConfig } from './config/app/app.config';
import { jwtConfig } from './config/jwt/jwt.config';
import { LoggerModule } from './config/logger/logger.module';
import { SequelizeDatabaseModule } from './infrastructure/database/sequelize/sequelize.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { BusinessModule } from './features/business/business.module';
import { AuthModule } from './features/auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig, appConfig, jwtConfig],
      envFilePath: '.env',
    }),
    SequelizeDatabaseModule,
    SecurityModule,
    LoggerModule,
    BusinessModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: import AuthModule into AppModule"
```

#### 14.20 — Verificar feature auth (Auth — Resources)

Arranca y confirma tablas/endpoints del feature. Si hay asociaciones pendientes, el sync de columnas principales ya debe existir.

```bash
npm run start:dev
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "test: verify 13_auth_resources auth feature"
```


------------------------------------------------------------------------

## FASE 15 — `14_AUTH_RESOURCE_ROLES`

### Auth — ResourceRoles

> **Objetivo de la fase:** Pivote resource↔role. Luego se restauran asociaciones finales Role/Resource.

#### 15.1 — features/auth/resource-roles/domain/entities/resource-role.entity.ts

Entidad de dominio (TypeScript puro). No extiende Sequelize `Model`. Aquí viven las reglas del negocio.

**Archivo:** `src/features/auth/resource-roles/domain/entities/resource-role.entity.ts`

```bash
mkdir -p src/features/auth/resource-roles/domain/entities
cat > src/features/auth/resource-roles/domain/entities/resource-role.entity.ts <<'EOF_BACKEND_IA'
import { Status } from '../../../../../common/enums/status.enum';

export class ResourceRole {
  id?: number;
  resourceId: number;
  roleId: number;
  isActive: Status;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial: Partial<ResourceRole>) {
    Object.assign(this, partial);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain entity resource-role.entity.ts"
```

#### 15.2 — features/auth/resource-roles/domain/exceptions/resource-role-not-found.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/auth/resource-roles/domain/exceptions/resource-role-not-found.exception.ts`

```bash
mkdir -p src/features/auth/resource-roles/domain/exceptions
cat > src/features/auth/resource-roles/domain/exceptions/resource-role-not-found.exception.ts <<'EOF_BACKEND_IA'
import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception';

export class ResourceRoleNotFoundException extends EntityNotFoundException {
  constructor(identifier: string | number) {
    super('Permiso de recurso', identifier);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception resource-role-not-found.exception.ts"
```

#### 15.3 — features/auth/resource-roles/domain/interfaces/resource-role-repository.interface.ts

Puerto (contrato) del repositorio. La aplicación depende de esta interface, no de Sequelize.

**Archivo:** `src/features/auth/resource-roles/domain/interfaces/resource-role-repository.interface.ts`

```bash
mkdir -p src/features/auth/resource-roles/domain/interfaces
cat > src/features/auth/resource-roles/domain/interfaces/resource-role-repository.interface.ts <<'EOF_BACKEND_IA'
import { ResourceRole } from '../entities/resource-role.entity';

export const RESOURCE_ROLE_REPOSITORY = 'RESOURCE_ROLE_REPOSITORY';

export interface IResourceRoleRepository {
  assign(resourceRole: ResourceRole): Promise<ResourceRole>;
  revoke(id: number): Promise<void>;
  findAll(): Promise<ResourceRole[]>;
  findByRoleIds(roleIds: number[]): Promise<ResourceRole[]>;
  findByResourceIdAndRoleId(
    resourceId: number,
    roleId: number,
  ): Promise<ResourceRole | null>;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add repository port resource-role-repository.interface.ts"
```

#### 15.4 — features/auth/resource-roles/infrastructure/persistence/models/resource-role.model.ts

Modelo Sequelize (`@Table`). Solo infraestructura: mapeo a tabla física.

**Archivo:** `src/features/auth/resource-roles/infrastructure/persistence/models/resource-role.model.ts`

```bash
mkdir -p src/features/auth/resource-roles/infrastructure/persistence/models
cat > src/features/auth/resource-roles/infrastructure/persistence/models/resource-role.model.ts <<'EOF_BACKEND_IA'
import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Status } from '../../../../../../common/enums/status.enum';
import { ResourceModel } from '../../../../resources/infrastructure/persistence/models/resource.model';
import { RoleModel } from '../../../../roles/infrastructure/persistence/models/role.model';

@Table({ tableName: 'resource_roles' })
export class ResourceRoleModel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => ResourceModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare resourceId: number;

  @ForeignKey(() => RoleModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare roleId: number;

  @Column({
    type: DataType.ENUM(...Object.values(Status)),
    allowNull: false,
    defaultValue: Status.ACTIVE,
  })
  declare isActive: Status;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => ResourceModel)
  declare resource: ResourceModel;

  @BelongsTo(() => RoleModel)
  declare role: RoleModel;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize model resource-role.model.ts"
```

#### 15.5 — features/auth/resource-roles/infrastructure/persistence/repositories/sequelize-resource-role.repository.ts

Adaptador del repositorio: implementa el puerto de dominio con Sequelize.

**Archivo:** `src/features/auth/resource-roles/infrastructure/persistence/repositories/sequelize-resource-role.repository.ts`

```bash
mkdir -p src/features/auth/resource-roles/infrastructure/persistence/repositories
cat > src/features/auth/resource-roles/infrastructure/persistence/repositories/sequelize-resource-role.repository.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import { Status } from '../../../../../../common/enums/status.enum';
import { ResourceRole } from '../../../domain/entities/resource-role.entity';
import { RESOURCE_ROLE_REPOSITORY } from '../../../domain/interfaces/resource-role-repository.interface';
import type { IResourceRoleRepository } from '../../../domain/interfaces/resource-role-repository.interface';
import { ResourceRoleModel } from '../models/resource-role.model';
import { ResourceRoleMapper } from '../../../application/mappers/resource-role.mapper';

@Injectable()
export class SequelizeResourceRoleRepository implements IResourceRoleRepository {
  async assign(resourceRole: ResourceRole): Promise<ResourceRole> {
    const model = await ResourceRoleModel.create(
      ResourceRoleMapper.toPersistence(resourceRole),
    );
    return ResourceRoleMapper.toDomain(model);
  }

  async revoke(id: number): Promise<void> {
    await ResourceRoleModel.update(
      { isActive: Status.INACTIVE },
      { where: { id } },
    );
  }

  async findAll(): Promise<ResourceRole[]> {
    const models = await ResourceRoleModel.findAll({ order: [['id', 'ASC']] });
    return models.map(ResourceRoleMapper.toDomain);
  }

  async findByRoleIds(roleIds: number[]): Promise<ResourceRole[]> {
    if (roleIds.length === 0) return [];
    const models = await ResourceRoleModel.findAll({
      where: { roleId: { [Op.in]: roleIds }, isActive: Status.ACTIVE },
    });
    return models.map(ResourceRoleMapper.toDomain);
  }

  async findByResourceIdAndRoleId(
    resourceId: number,
    roleId: number,
  ): Promise<ResourceRole | null> {
    const model = await ResourceRoleModel.findOne({
      where: { resourceId, roleId },
    });
    return model ? ResourceRoleMapper.toDomain(model) : null;
  }
}

export const resourceRoleRepositoryProvider = {
  provide: RESOURCE_ROLE_REPOSITORY,
  useClass: SequelizeResourceRoleRepository,
};
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize repository sequelize-resource-role.repository.ts"
```

#### 15.6 — features/auth/resource-roles/infrastructure/persistence/seeders/resource-roles.seeder.ts

Seeder de datos iniciales para desarrollo y verificación física en BD.

**Archivo:** `src/features/auth/resource-roles/infrastructure/persistence/seeders/resource-roles.seeder.ts`

```bash
mkdir -p src/features/auth/resource-roles/infrastructure/persistence/seeders
cat > src/features/auth/resource-roles/infrastructure/persistence/seeders/resource-roles.seeder.ts <<'EOF_BACKEND_IA'
/**
 * Seeder de feature deshabilitado.
 * El bootstrap central vive en:
 * src/infrastructure/database/seeders/auth-bootstrap.seeder.ts
 * para respetar el orden de dependencias Business → Auth.
 */
export class FeatureSeederDisabled {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add seeder resource-roles.seeder.ts"
```

#### 15.7 — features/auth/resource-roles/application/dto/assign-resource-role.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/auth/resource-roles/application/dto/assign-resource-role.dto.ts`

```bash
mkdir -p src/features/auth/resource-roles/application/dto
cat > src/features/auth/resource-roles/application/dto/assign-resource-role.dto.ts <<'EOF_BACKEND_IA'
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Status } from '../../../../../common/enums/status.enum';

export class AssignResourceRoleDto {
  @IsInt()
  resourceId: number;

  @IsInt()
  roleId: number;

  @IsOptional()
  @IsEnum(Status)
  isActive?: Status;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto assign-resource-role.dto.ts"
```

#### 15.8 — features/auth/resource-roles/application/mappers/resource-role.mapper.ts

Mapper entre entidad de dominio y DTO de respuesta.

**Archivo:** `src/features/auth/resource-roles/application/mappers/resource-role.mapper.ts`

```bash
mkdir -p src/features/auth/resource-roles/application/mappers
cat > src/features/auth/resource-roles/application/mappers/resource-role.mapper.ts <<'EOF_BACKEND_IA'
import { ResourceRole } from '../../domain/entities/resource-role.entity';
import { ResourceRoleModel } from '../../infrastructure/persistence/models/resource-role.model';

export class ResourceRoleMapper {
  static toDomain(model: ResourceRoleModel): ResourceRole {
    return new ResourceRole({
      id: model.id,
      resourceId: model.resourceId,
      roleId: model.roleId,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toPersistence(entity: ResourceRole): Partial<ResourceRoleModel> {
    return {
      id: entity.id,
      resourceId: entity.resourceId,
      roleId: entity.roleId,
      isActive: entity.isActive,
    };
  }

  static toResponse(entity: ResourceRole) {
    return {
      id: entity.id,
      resourceId: entity.resourceId,
      roleId: entity.roleId,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add mapper resource-role.mapper.ts"
```

#### 15.9 — features/auth/resource-roles/application/use-cases/assign-resource-role.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/resource-roles/application/use-cases/assign-resource-role.use-case.ts`

```bash
mkdir -p src/features/auth/resource-roles/application/use-cases
cat > src/features/auth/resource-roles/application/use-cases/assign-resource-role.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Status } from '../../../../../common/enums/status.enum';
import { ResourceNotFoundException } from '../../../resources/domain/exceptions/resource-not-found.exception';
import { RESOURCE_REPOSITORY } from '../../../resources/domain/interfaces/resource-repository.interface';
import type { IResourceRepository } from '../../../resources/domain/interfaces/resource-repository.interface';
import { RoleNotFoundException } from '../../../roles/domain/exceptions/role-not-found.exception';
import { ROLE_REPOSITORY } from '../../../roles/domain/interfaces/role-repository.interface';
import type { IRoleRepository } from '../../../roles/domain/interfaces/role-repository.interface';
import { ResourceRole } from '../../domain/entities/resource-role.entity';
import { RESOURCE_ROLE_REPOSITORY } from '../../domain/interfaces/resource-role-repository.interface';
import type { IResourceRoleRepository } from '../../domain/interfaces/resource-role-repository.interface';
import { AssignResourceRoleDto } from '../dto/assign-resource-role.dto';
import { ResourceRoleMapper } from '../mappers/resource-role.mapper';

@Injectable()
export class AssignResourceRoleUseCase {
  constructor(
    @Inject(RESOURCE_ROLE_REPOSITORY)
    private readonly resourceRoleRepository: IResourceRoleRepository,
    @Inject(RESOURCE_REPOSITORY)
    private readonly resourceRepository: IResourceRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(dto: AssignResourceRoleDto) {
    const resource = await this.resourceRepository.findById(dto.resourceId);
    if (!resource) {
      throw new ResourceNotFoundException(dto.resourceId);
    }

    const role = await this.roleRepository.findById(dto.roleId);
    if (!role) {
      throw new RoleNotFoundException(dto.roleId);
    }

    const resourceRole = new ResourceRole({
      resourceId: dto.resourceId,
      roleId: dto.roleId,
      isActive: dto.isActive ?? Status.ACTIVE,
    });

    const assigned = await this.resourceRoleRepository.assign(resourceRole);
    return ResourceRoleMapper.toResponse(assigned);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case assign-resource-role.use-case.ts"
```

#### 15.10 — features/auth/resource-roles/application/use-cases/list-resource-roles.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/resource-roles/application/use-cases/list-resource-roles.use-case.ts`

```bash
mkdir -p src/features/auth/resource-roles/application/use-cases
cat > src/features/auth/resource-roles/application/use-cases/list-resource-roles.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { RESOURCE_REPOSITORY } from '../../../resources/domain/interfaces/resource-repository.interface';
import type { IResourceRepository } from '../../../resources/domain/interfaces/resource-repository.interface';
import { ROLE_REPOSITORY } from '../../../roles/domain/interfaces/role-repository.interface';
import type { IRoleRepository } from '../../../roles/domain/interfaces/role-repository.interface';
import { RESOURCE_ROLE_REPOSITORY } from '../../domain/interfaces/resource-role-repository.interface';
import type { IResourceRoleRepository } from '../../domain/interfaces/resource-role-repository.interface';
import { ResourceRoleMapper } from '../mappers/resource-role.mapper';

@Injectable()
export class ListResourceRolesUseCase {
  constructor(
    @Inject(RESOURCE_ROLE_REPOSITORY)
    private readonly resourceRoleRepository: IResourceRoleRepository,
    @Inject(RESOURCE_REPOSITORY)
    private readonly resourceRepository: IResourceRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute() {
    const resourceRoles = await this.resourceRoleRepository.findAll();
    const resources = await this.resourceRepository.findAll();
    const roles = await this.roleRepository.findAll();

    const resourceMap = new Map(resources.map((r) => [r.id, r]));
    const roleMap = new Map(roles.map((r) => [r.id, r]));

    return resourceRoles.map((rr) => ({
      ...ResourceRoleMapper.toResponse(rr),
      resource: resourceMap.get(rr.resourceId),
      role: roleMap.get(rr.roleId),
    }));
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case list-resource-roles.use-case.ts"
```

#### 15.11 — features/auth/resource-roles/application/use-cases/revoke-resource-role.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/resource-roles/application/use-cases/revoke-resource-role.use-case.ts`

```bash
mkdir -p src/features/auth/resource-roles/application/use-cases
cat > src/features/auth/resource-roles/application/use-cases/revoke-resource-role.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { RESOURCE_ROLE_REPOSITORY } from '../../domain/interfaces/resource-role-repository.interface';
import type { IResourceRoleRepository } from '../../domain/interfaces/resource-role-repository.interface';
import { ResourceRoleNotFoundException } from '../../domain/exceptions/resource-role-not-found.exception';
import { ResourceRoleModel } from '../../infrastructure/persistence/models/resource-role.model';

@Injectable()
export class RevokeResourceRoleUseCase {
  constructor(
    @Inject(RESOURCE_ROLE_REPOSITORY)
    private readonly resourceRoleRepository: IResourceRoleRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const existing = await ResourceRoleModel.findByPk(id);
    if (!existing) {
      throw new ResourceRoleNotFoundException(id);
    }
    await this.resourceRoleRepository.revoke(id);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case revoke-resource-role.use-case.ts"
```

#### 15.12 — features/auth/resource-roles/presentation/http/controllers/resource-roles.controller.ts

Controller delgado: valida DTO, llama use-case, devuelve respuesta.

**Archivo:** `src/features/auth/resource-roles/presentation/http/controllers/resource-roles.controller.ts`

```bash
mkdir -p src/features/auth/resource-roles/presentation/http/controllers
cat > src/features/auth/resource-roles/presentation/http/controllers/resource-roles.controller.ts <<'EOF_BACKEND_IA'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { AssignResourceRoleDto } from '../../../application/dto/assign-resource-role.dto';
import { AssignResourceRoleUseCase } from '../../../application/use-cases/assign-resource-role.use-case';
import { ListResourceRolesUseCase } from '../../../application/use-cases/list-resource-roles.use-case';
import { RevokeResourceRoleUseCase } from '../../../application/use-cases/revoke-resource-role.use-case';

@Controller('resource-roles')
export class ResourceRolesController {
  constructor(
    private readonly assignResourceRoleUseCase: AssignResourceRoleUseCase,
    private readonly revokeResourceRoleUseCase: RevokeResourceRoleUseCase,
    private readonly listResourceRolesUseCase: ListResourceRolesUseCase,
  ) {}

  @Post()
  assign(@Body() dto: AssignResourceRoleDto) {
    return this.assignResourceRoleUseCase.execute(dto);
  }

  @Get()
  findAll() {
    return this.listResourceRolesUseCase.execute();
  }

  @Delete(':id')
  async revoke(@Param('id', ParseIntPipe) id: number) {
    await this.revokeResourceRoleUseCase.execute(id);
    return { message: 'Permiso revocado' };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add controller resource-roles.controller.ts"
```

#### 15.13 — features/auth/resource-roles/resource-roles.module.ts

Módulo Nest del feature: cablea providers, tokens DI y controller.

**Archivo:** `src/features/auth/resource-roles/resource-roles.module.ts`

```bash
mkdir -p src/features/auth/resource-roles
cat > src/features/auth/resource-roles/resource-roles.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ResourcesModule } from '../resources/resources.module';
import { RolesModule } from '../roles/roles.module';
import { AssignResourceRoleUseCase } from './application/use-cases/assign-resource-role.use-case';
import { ListResourceRolesUseCase } from './application/use-cases/list-resource-roles.use-case';
import { RevokeResourceRoleUseCase } from './application/use-cases/revoke-resource-role.use-case';
import { resourceRoleRepositoryProvider } from './infrastructure/persistence/repositories/sequelize-resource-role.repository';
import { ResourceRolesController } from './presentation/http/controllers/resource-roles.controller';

@Module({
  imports: [ResourcesModule, RolesModule],
  controllers: [ResourceRolesController],
  providers: [
    resourceRoleRepositoryProvider,
    AssignResourceRoleUseCase,
    RevokeResourceRoleUseCase,
    ListResourceRolesUseCase,
  ],
  exports: [resourceRoleRepositoryProvider],
})
export class ResourceRolesModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: wire nest module resource-roles.module.ts"
```

#### 15.14 — Restaurar asociaciones finales en src/features/auth/roles/infrastructure/persistence/models/role.model.ts

Ya existen los modelos relacionados: se reintroducen las asociaciones Sequelize finales.

**Archivo:** `src/features/auth/roles/infrastructure/persistence/models/role.model.ts`

```bash
mkdir -p src/features/auth/roles/infrastructure/persistence/models
cat > src/features/auth/roles/infrastructure/persistence/models/role.model.ts <<'EOF_BACKEND_IA'
import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  BelongsToMany,
} from 'sequelize-typescript';
import { Status } from '../../../../../../common/enums/status.enum';
import { UserModel } from '../../../../users/infrastructure/persistence/models/user.model';
import { RoleUserModel } from '../../../../role-users/infrastructure/persistence/models/role-user.model';
import { ResourceModel } from '../../../../resources/infrastructure/persistence/models/resource.model';
import { ResourceRoleModel } from '../../../../resource-roles/infrastructure/persistence/models/resource-role.model';

@Table({ tableName: 'roles' })
export class RoleModel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING(100), allowNull: false, unique: true })
  declare name: string;

  @Column({
    type: DataType.ENUM(...Object.values(Status)),
    allowNull: false,
    defaultValue: Status.ACTIVE,
  })
  declare isActive: Status;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsToMany(() => UserModel, () => RoleUserModel)
  declare users: UserModel[];

  @BelongsToMany(() => ResourceModel, () => ResourceRoleModel)
  declare resources: ResourceModel[];
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: restore sequelize associations in role.model.ts"
```

#### 15.15 — Restaurar asociaciones finales en src/features/auth/resources/infrastructure/persistence/models/resource.model.ts

Ya existen los modelos relacionados: se reintroducen las asociaciones Sequelize finales.

**Archivo:** `src/features/auth/resources/infrastructure/persistence/models/resource.model.ts`

```bash
mkdir -p src/features/auth/resources/infrastructure/persistence/models
cat > src/features/auth/resources/infrastructure/persistence/models/resource.model.ts <<'EOF_BACKEND_IA'
import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  BelongsToMany,
} from 'sequelize-typescript';
import { Status } from '../../../../../../common/enums/status.enum';
import { RoleModel } from '../../../../roles/infrastructure/persistence/models/role.model';
import { ResourceRoleModel } from '../../../../resource-roles/infrastructure/persistence/models/resource-role.model';

@Table({ tableName: 'resources' })
export class ResourceModel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare path: string;

  @Column({ type: DataType.STRING(10), allowNull: false })
  declare method: string;

  @Column({
    type: DataType.ENUM(...Object.values(Status)),
    allowNull: false,
    defaultValue: Status.ACTIVE,
  })
  declare isActive: Status;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsToMany(() => RoleModel, () => ResourceRoleModel)
  declare roles: RoleModel[];
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: restore sequelize associations in resource.model.ts"
```

#### 15.16 — Actualizar sequelize.factory.ts (registrar modelos)

Registra en ALL_MODELS solo los modelos ya creados (orden de dependencias).

**Archivo:** `src/infrastructure/database/sequelize/sequelize.factory.ts`

```bash
mkdir -p src/infrastructure/database/sequelize
cat > src/infrastructure/database/sequelize/sequelize.factory.ts <<'EOF_BACKEND_IA'
import { Sequelize } from 'sequelize-typescript';
import { DatabaseDialect } from '../../../config/environment/env.interface';
import { getSequelizeOptions } from './sequelize.options';

import { ClientModel } from '../../../features/business/clients/infrastructure/persistence/models/client.model';
import { ProductTypeModel } from '../../../features/business/product-types/infrastructure/persistence/models/product-type.model';
import { ProductModel } from '../../../features/business/products/infrastructure/persistence/models/product.model';
import { SaleModel } from '../../../features/business/sales/infrastructure/persistence/models/sale.model';
import { ProductSaleModel } from '../../../features/business/sales/infrastructure/persistence/models/product-sale.model';
import { UserModel } from '../../../features/auth/users/infrastructure/persistence/models/user.model';
import { RoleModel } from '../../../features/auth/roles/infrastructure/persistence/models/role.model';
import { RoleUserModel } from '../../../features/auth/role-users/infrastructure/persistence/models/role-user.model';
import { ResourceModel } from '../../../features/auth/resources/infrastructure/persistence/models/resource.model';
import { ResourceRoleModel } from '../../../features/auth/resource-roles/infrastructure/persistence/models/resource-role.model';

export const ALL_MODELS = [
  ClientModel,
  ProductTypeModel,
  ProductModel,
  SaleModel,
  ProductSaleModel,
  UserModel,
  RoleModel,
  RoleUserModel,
  ResourceModel,
  ResourceRoleModel,
];

export async function createSequelizeInstance(
  dialect: DatabaseDialect,
): Promise<Sequelize> {
  const options = getSequelizeOptions(dialect);

  let dialectModule: any;

  switch (dialect) {
    case DatabaseDialect.MySQL:
      dialectModule = require('mysql2');
      break;
    case DatabaseDialect.Postgres:
      dialectModule = require('pg');
      break;
    case DatabaseDialect.MSSQL:
      dialectModule = require('tedious');
      break;
    case DatabaseDialect.Oracle:
      dialectModule = require('oracledb');
      break;
    default:
      throw new Error(`Dialecto no soportado: ${dialect}`);
  }

  const sequelize = new Sequelize({
    ...options,
    dialectModule,
    models: ALL_MODELS,
  } as any);

  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión exitosa a ${dialect.toUpperCase()}`);
  } catch (error: any) {
    console.error(
      `❌ Error conectando a ${dialect.toUpperCase()}:`,
      error.message,
    );
    throw error;
  }

  if (process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: false });
    console.log('✅ Tablas sincronizadas');
  }

  return sequelize;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: register auth models up to resourceRole"
```

#### 15.17 — Actualizar auth.module.ts

Agrega el feature module de auth recién terminado.

**Archivo:** `src/features/auth/auth.module.ts`

```bash
mkdir -p src/features/auth
cat > src/features/auth/auth.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { RoleUsersModule } from './role-users/role-users.module';
import { ResourcesModule } from './resources/resources.module';
import { ResourceRolesModule } from './resource-roles/resource-roles.module';

@Module({
  imports: [UsersModule, RolesModule, RoleUsersModule, ResourcesModule, ResourceRolesModule],
  exports: [UsersModule, RolesModule, RoleUsersModule, ResourcesModule, ResourceRolesModule],
})
export class AuthModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add resourceRoles to AuthModule"
```

#### 15.18 — Actualizar database-seeder.service.ts

Ejecuta seeders en orden de dependencias al arrancar (dev).

**Archivo:** `src/infrastructure/database/seeders/database-seeder.service.ts`

```bash
mkdir -p src/infrastructure/database/seeders
cat > src/infrastructure/database/seeders/database-seeder.service.ts <<'EOF_BACKEND_IA'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { seedClients } from '../../../features/business/clients/infrastructure/persistence/seeders/clients.seeder';
import { seedProductTypes } from '../../../features/business/product-types/infrastructure/persistence/seeders/product-types.seeder';
import { seedProducts } from '../../../features/business/products/infrastructure/persistence/seeders/products.seeder';
import { seedSales } from '../../../features/business/sales/infrastructure/persistence/seeders/sales.seeder';

/**
 * Ejecuta seeders en orden de dependencias.
 * Solo en entornos no productivos.
 */
@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    try {
      await seedClients();
      await seedProductTypes();
      await seedProducts();
      await seedSales();
      this.logger.log('✅ Seeders ejecutados');
    } catch (error: any) {
      this.logger.error(`❌ Error en seeders: ${error.message}`, error.stack);
      throw error;
    }
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: update auth/business seeders bootstrap order"
```

#### 15.19 — Actualizar app.module.ts

Importa BusinessModule y/o AuthModule según el avance. Los guards globales llegan en la fase RBAC.

**Archivo:** `src/app.module.ts`

```bash
mkdir -p src
cat > src/app.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './config/environment/env.config';
import { appConfig } from './config/app/app.config';
import { jwtConfig } from './config/jwt/jwt.config';
import { LoggerModule } from './config/logger/logger.module';
import { SequelizeDatabaseModule } from './infrastructure/database/sequelize/sequelize.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { BusinessModule } from './features/business/business.module';
import { AuthModule } from './features/auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig, appConfig, jwtConfig],
      envFilePath: '.env',
    }),
    SequelizeDatabaseModule,
    SecurityModule,
    LoggerModule,
    BusinessModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: import AuthModule into AppModule"
```

#### 15.20 — Verificar feature auth (Auth — ResourceRoles)

Arranca y confirma tablas/endpoints del feature. Si hay asociaciones pendientes, el sync de columnas principales ya debe existir.

```bash
npm run start:dev
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "test: verify 14_auth_resource_roles auth feature"
```


------------------------------------------------------------------------

## FASE 16 — `15_AUTH_REFRESH_TOKENS`

### Auth — RefreshTokens

> **Objetivo de la fase:** Persistencia de refresh tokens. Luego se restaura User.model con HasMany refreshTokens.

#### 16.1 — features/auth/refresh-tokens/domain/entities/refresh-token.entity.ts

Entidad de dominio (TypeScript puro). No extiende Sequelize `Model`. Aquí viven las reglas del negocio.

**Archivo:** `src/features/auth/refresh-tokens/domain/entities/refresh-token.entity.ts`

```bash
mkdir -p src/features/auth/refresh-tokens/domain/entities
cat > src/features/auth/refresh-tokens/domain/entities/refresh-token.entity.ts <<'EOF_BACKEND_IA'
import { Status } from '../../../../../common/enums/status.enum';

export class RefreshToken {
  id?: number;
  userId: number;
  token: string;
  deviceInfo?: string;
  isValid: Status;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial: Partial<RefreshToken>) {
    Object.assign(this, partial);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain entity refresh-token.entity.ts"
```

#### 16.2 — features/auth/refresh-tokens/domain/interfaces/refresh-token-repository.interface.ts

Puerto (contrato) del repositorio. La aplicación depende de esta interface, no de Sequelize.

**Archivo:** `src/features/auth/refresh-tokens/domain/interfaces/refresh-token-repository.interface.ts`

```bash
mkdir -p src/features/auth/refresh-tokens/domain/interfaces
cat > src/features/auth/refresh-tokens/domain/interfaces/refresh-token-repository.interface.ts <<'EOF_BACKEND_IA'
import { RefreshToken } from '../entities/refresh-token.entity';

export const REFRESH_TOKEN_REPOSITORY = 'REFRESH_TOKEN_REPOSITORY';

export interface IRefreshTokenRepository {
  create(refreshToken: RefreshToken): Promise<RefreshToken>;
  findValidByToken(token: string): Promise<RefreshToken | null>;
  invalidate(id: number): Promise<void>;
  invalidateAllForUser(userId: number): Promise<void>;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add repository port refresh-token-repository.interface.ts"
```

#### 16.3 — features/auth/refresh-tokens/infrastructure/persistence/models/refresh-token.model.ts

Modelo Sequelize (`@Table`). Solo infraestructura: mapeo a tabla física.

**Archivo:** `src/features/auth/refresh-tokens/infrastructure/persistence/models/refresh-token.model.ts`

```bash
mkdir -p src/features/auth/refresh-tokens/infrastructure/persistence/models
cat > src/features/auth/refresh-tokens/infrastructure/persistence/models/refresh-token.model.ts <<'EOF_BACKEND_IA'
import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Status } from '../../../../../../common/enums/status.enum';
import { UserModel } from '../../../../users/infrastructure/persistence/models/user.model';

@Table({ tableName: 'refresh_tokens' })
export class RefreshTokenModel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @Column({ type: DataType.STRING(500), allowNull: false })
  declare token: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare deviceInfo: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(Status)),
    allowNull: false,
    defaultValue: Status.ACTIVE,
  })
  declare isValid: Status;

  @Column({ type: DataType.DATE, allowNull: false })
  declare expiresAt: Date;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => UserModel)
  declare user: UserModel;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize model refresh-token.model.ts"
```

#### 16.4 — features/auth/refresh-tokens/infrastructure/persistence/repositories/sequelize-refresh-token.repository.ts

Adaptador del repositorio: implementa el puerto de dominio con Sequelize.

**Archivo:** `src/features/auth/refresh-tokens/infrastructure/persistence/repositories/sequelize-refresh-token.repository.ts`

```bash
mkdir -p src/features/auth/refresh-tokens/infrastructure/persistence/repositories
cat > src/features/auth/refresh-tokens/infrastructure/persistence/repositories/sequelize-refresh-token.repository.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import { Status } from '../../../../../../common/enums/status.enum';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';
import { REFRESH_TOKEN_REPOSITORY } from '../../../domain/interfaces/refresh-token-repository.interface';
import type { IRefreshTokenRepository } from '../../../domain/interfaces/refresh-token-repository.interface';
import { RefreshTokenModel } from '../models/refresh-token.model';
import { RefreshTokenMapper } from '../../../application/mappers/refresh-token.mapper';

@Injectable()
export class SequelizeRefreshTokenRepository implements IRefreshTokenRepository {
  async create(refreshToken: RefreshToken): Promise<RefreshToken> {
    const model = await RefreshTokenModel.create(
      RefreshTokenMapper.toPersistence(refreshToken),
    );
    return RefreshTokenMapper.toDomain(model);
  }

  async findValidByToken(token: string): Promise<RefreshToken | null> {
    const model = await RefreshTokenModel.findOne({
      where: {
        token,
        isValid: Status.ACTIVE,
        expiresAt: { [Op.gt]: new Date() },
      },
    });
    return model ? RefreshTokenMapper.toDomain(model) : null;
  }

  async invalidate(id: number): Promise<void> {
    await RefreshTokenModel.update(
      { isValid: Status.INACTIVE },
      { where: { id } },
    );
  }

  async invalidateAllForUser(userId: number): Promise<void> {
    await RefreshTokenModel.update(
      { isValid: Status.INACTIVE },
      { where: { userId, isValid: Status.ACTIVE } },
    );
  }
}

export const refreshTokenRepositoryProvider = {
  provide: REFRESH_TOKEN_REPOSITORY,
  useClass: SequelizeRefreshTokenRepository,
};
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize repository sequelize-refresh-token.repository.ts"
```

#### 16.5 — features/auth/refresh-tokens/infrastructure/persistence/seeders/refresh-tokens.seeder.ts

Seeder de datos iniciales para desarrollo y verificación física en BD.

**Archivo:** `src/features/auth/refresh-tokens/infrastructure/persistence/seeders/refresh-tokens.seeder.ts`

```bash
mkdir -p src/features/auth/refresh-tokens/infrastructure/persistence/seeders
cat > src/features/auth/refresh-tokens/infrastructure/persistence/seeders/refresh-tokens.seeder.ts <<'EOF_BACKEND_IA'
/**
 * Seeder de feature deshabilitado.
 * El bootstrap central vive en:
 * src/infrastructure/database/seeders/auth-bootstrap.seeder.ts
 * para respetar el orden de dependencias Business → Auth.
 */
export class FeatureSeederDisabled {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add seeder refresh-tokens.seeder.ts"
```

#### 16.6 — features/auth/refresh-tokens/application/mappers/refresh-token.mapper.ts

Mapper entre entidad de dominio y DTO de respuesta.

**Archivo:** `src/features/auth/refresh-tokens/application/mappers/refresh-token.mapper.ts`

```bash
mkdir -p src/features/auth/refresh-tokens/application/mappers
cat > src/features/auth/refresh-tokens/application/mappers/refresh-token.mapper.ts <<'EOF_BACKEND_IA'
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { RefreshTokenModel } from '../../infrastructure/persistence/models/refresh-token.model';

export class RefreshTokenMapper {
  static toDomain(model: RefreshTokenModel): RefreshToken {
    return new RefreshToken({
      id: model.id,
      userId: model.userId,
      token: model.token,
      deviceInfo: model.deviceInfo ?? undefined,
      isValid: model.isValid,
      expiresAt: model.expiresAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toPersistence(entity: RefreshToken): Partial<RefreshTokenModel> {
    return {
      id: entity.id,
      userId: entity.userId,
      token: entity.token,
      deviceInfo: entity.deviceInfo ?? null,
      isValid: entity.isValid,
      expiresAt: entity.expiresAt,
    };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add mapper refresh-token.mapper.ts"
```

#### 16.7 — features/auth/refresh-tokens/application/use-cases/create-refresh-token.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/refresh-tokens/application/use-cases/create-refresh-token.use-case.ts`

```bash
mkdir -p src/features/auth/refresh-tokens/application/use-cases
cat > src/features/auth/refresh-tokens/application/use-cases/create-refresh-token.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Status } from '../../../../../common/enums/status.enum';
import { parseDurationToMs } from '../../../../../common/utils/date.util';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/interfaces/refresh-token-repository.interface';
import type { IRefreshTokenRepository } from '../../domain/interfaces/refresh-token-repository.interface';

export interface CreateRefreshTokenInput {
  userId: number;
  token: string;
  deviceInfo?: string;
}

@Injectable()
export class CreateRefreshTokenUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: CreateRefreshTokenInput): Promise<RefreshToken> {
    const refreshExpiresIn =
      this.configService.get<string>('environment.jwt.refreshExpiresIn') || '7d';
    const expiresAt = new Date(Date.now() + parseDurationToMs(refreshExpiresIn));

    return this.refreshTokenRepository.create(
      new RefreshToken({
        userId: input.userId,
        token: input.token,
        deviceInfo: input.deviceInfo,
        isValid: Status.ACTIVE,
        expiresAt,
      }),
    );
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case create-refresh-token.use-case.ts"
```

#### 16.8 — features/auth/refresh-tokens/application/use-cases/invalidate-refresh-token.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/refresh-tokens/application/use-cases/invalidate-refresh-token.use-case.ts`

```bash
mkdir -p src/features/auth/refresh-tokens/application/use-cases
cat > src/features/auth/refresh-tokens/application/use-cases/invalidate-refresh-token.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/interfaces/refresh-token-repository.interface';
import type { IRefreshTokenRepository } from '../../domain/interfaces/refresh-token-repository.interface';

@Injectable()
export class InvalidateRefreshTokenUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(id: number): Promise<void> {
    await this.refreshTokenRepository.invalidate(id);
  }

  async executeAllForUser(userId: number): Promise<void> {
    await this.refreshTokenRepository.invalidateAllForUser(userId);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case invalidate-refresh-token.use-case.ts"
```

#### 16.9 — features/auth/refresh-tokens/application/use-cases/validate-refresh-token.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/refresh-tokens/application/use-cases/validate-refresh-token.use-case.ts`

```bash
mkdir -p src/features/auth/refresh-tokens/application/use-cases
cat > src/features/auth/refresh-tokens/application/use-cases/validate-refresh-token.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/interfaces/refresh-token-repository.interface';
import type { IRefreshTokenRepository } from '../../domain/interfaces/refresh-token-repository.interface';

@Injectable()
export class ValidateRefreshTokenUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(token: string): Promise<RefreshToken | null> {
    return this.refreshTokenRepository.findValidByToken(token);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case validate-refresh-token.use-case.ts"
```

#### 16.10 — features/auth/refresh-tokens/refresh-tokens.module.ts

Módulo Nest del feature: cablea providers, tokens DI y controller.

**Archivo:** `src/features/auth/refresh-tokens/refresh-tokens.module.ts`

```bash
mkdir -p src/features/auth/refresh-tokens
cat > src/features/auth/refresh-tokens/refresh-tokens.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { CreateRefreshTokenUseCase } from './application/use-cases/create-refresh-token.use-case';
import { InvalidateRefreshTokenUseCase } from './application/use-cases/invalidate-refresh-token.use-case';
import { ValidateRefreshTokenUseCase } from './application/use-cases/validate-refresh-token.use-case';
import { refreshTokenRepositoryProvider } from './infrastructure/persistence/repositories/sequelize-refresh-token.repository';

@Module({
  providers: [
    refreshTokenRepositoryProvider,
    CreateRefreshTokenUseCase,
    InvalidateRefreshTokenUseCase,
    ValidateRefreshTokenUseCase,
  ],
  exports: [
    refreshTokenRepositoryProvider,
    CreateRefreshTokenUseCase,
    InvalidateRefreshTokenUseCase,
    ValidateRefreshTokenUseCase,
  ],
})
export class RefreshTokensModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: wire nest module refresh-tokens.module.ts"
```

#### 16.11 — Restaurar asociaciones finales en src/features/auth/users/infrastructure/persistence/models/user.model.ts

Ya existen los modelos relacionados: se reintroducen las asociaciones Sequelize finales.

**Archivo:** `src/features/auth/users/infrastructure/persistence/models/user.model.ts`

```bash
mkdir -p src/features/auth/users/infrastructure/persistence/models
cat > src/features/auth/users/infrastructure/persistence/models/user.model.ts <<'EOF_BACKEND_IA'
import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  BelongsToMany,
  HasMany,
} from 'sequelize-typescript';
import { Status } from '../../../../../../common/enums/status.enum';
import { RoleModel } from '../../../../roles/infrastructure/persistence/models/role.model';
import { RoleUserModel } from '../../../../role-users/infrastructure/persistence/models/role-user.model';
import { RefreshTokenModel } from '../../../../refresh-tokens/infrastructure/persistence/models/refresh-token.model';

@Table({ tableName: 'users' })
export class UserModel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING(100), allowNull: false, unique: true })
  declare username: string;

  @Column({ type: DataType.STRING(150), allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare password: string;

  @Column({
    type: DataType.ENUM(...Object.values(Status)),
    allowNull: false,
    defaultValue: Status.ACTIVE,
  })
  declare isActive: Status;

  @Column({ type: DataType.STRING(500), allowNull: true })
  declare avatar: string | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsToMany(() => RoleModel, () => RoleUserModel)
  declare roles: RoleModel[];

  @HasMany(() => RefreshTokenModel)
  declare refreshTokens: RefreshTokenModel[];
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: restore sequelize associations in user.model.ts"
```

#### 16.12 — Actualizar sequelize.factory.ts (registrar modelos)

Registra en ALL_MODELS solo los modelos ya creados (orden de dependencias).

**Archivo:** `src/infrastructure/database/sequelize/sequelize.factory.ts`

```bash
mkdir -p src/infrastructure/database/sequelize
cat > src/infrastructure/database/sequelize/sequelize.factory.ts <<'EOF_BACKEND_IA'
import { Sequelize } from 'sequelize-typescript';
import { DatabaseDialect } from '../../../config/environment/env.interface';
import { getSequelizeOptions } from './sequelize.options';

import { ClientModel } from '../../../features/business/clients/infrastructure/persistence/models/client.model';
import { ProductTypeModel } from '../../../features/business/product-types/infrastructure/persistence/models/product-type.model';
import { ProductModel } from '../../../features/business/products/infrastructure/persistence/models/product.model';
import { SaleModel } from '../../../features/business/sales/infrastructure/persistence/models/sale.model';
import { ProductSaleModel } from '../../../features/business/sales/infrastructure/persistence/models/product-sale.model';
import { UserModel } from '../../../features/auth/users/infrastructure/persistence/models/user.model';
import { RoleModel } from '../../../features/auth/roles/infrastructure/persistence/models/role.model';
import { RoleUserModel } from '../../../features/auth/role-users/infrastructure/persistence/models/role-user.model';
import { ResourceModel } from '../../../features/auth/resources/infrastructure/persistence/models/resource.model';
import { ResourceRoleModel } from '../../../features/auth/resource-roles/infrastructure/persistence/models/resource-role.model';
import { RefreshTokenModel } from '../../../features/auth/refresh-tokens/infrastructure/persistence/models/refresh-token.model';

export const ALL_MODELS = [
  ClientModel,
  ProductTypeModel,
  ProductModel,
  SaleModel,
  ProductSaleModel,
  UserModel,
  RoleModel,
  RoleUserModel,
  ResourceModel,
  ResourceRoleModel,
  RefreshTokenModel,
];

export async function createSequelizeInstance(
  dialect: DatabaseDialect,
): Promise<Sequelize> {
  const options = getSequelizeOptions(dialect);

  let dialectModule: any;

  switch (dialect) {
    case DatabaseDialect.MySQL:
      dialectModule = require('mysql2');
      break;
    case DatabaseDialect.Postgres:
      dialectModule = require('pg');
      break;
    case DatabaseDialect.MSSQL:
      dialectModule = require('tedious');
      break;
    case DatabaseDialect.Oracle:
      dialectModule = require('oracledb');
      break;
    default:
      throw new Error(`Dialecto no soportado: ${dialect}`);
  }

  const sequelize = new Sequelize({
    ...options,
    dialectModule,
    models: ALL_MODELS,
  } as any);

  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión exitosa a ${dialect.toUpperCase()}`);
  } catch (error: any) {
    console.error(
      `❌ Error conectando a ${dialect.toUpperCase()}:`,
      error.message,
    );
    throw error;
  }

  if (process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: false });
    console.log('✅ Tablas sincronizadas');
  }

  return sequelize;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: register auth models up to refreshToken"
```

#### 16.13 — Actualizar auth.module.ts

Agrega el feature module de auth recién terminado.

**Archivo:** `src/features/auth/auth.module.ts`

```bash
mkdir -p src/features/auth
cat > src/features/auth/auth.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { RoleUsersModule } from './role-users/role-users.module';
import { ResourcesModule } from './resources/resources.module';
import { ResourceRolesModule } from './resource-roles/resource-roles.module';
import { RefreshTokensModule } from './refresh-tokens/refresh-tokens.module';

@Module({
  imports: [UsersModule, RolesModule, RoleUsersModule, ResourcesModule, ResourceRolesModule, RefreshTokensModule],
  exports: [UsersModule, RolesModule, RoleUsersModule, ResourcesModule, ResourceRolesModule, RefreshTokensModule],
})
export class AuthModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add refreshTokens to AuthModule"
```

#### 16.14 — Actualizar database-seeder.service.ts

Ejecuta seeders en orden de dependencias al arrancar (dev).

**Archivo:** `src/infrastructure/database/seeders/database-seeder.service.ts`

```bash
mkdir -p src/infrastructure/database/seeders
cat > src/infrastructure/database/seeders/database-seeder.service.ts <<'EOF_BACKEND_IA'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { seedClients } from '../../../features/business/clients/infrastructure/persistence/seeders/clients.seeder';
import { seedProductTypes } from '../../../features/business/product-types/infrastructure/persistence/seeders/product-types.seeder';
import { seedProducts } from '../../../features/business/products/infrastructure/persistence/seeders/products.seeder';
import { seedSales } from '../../../features/business/sales/infrastructure/persistence/seeders/sales.seeder';

/**
 * Ejecuta seeders en orden de dependencias.
 * Solo en entornos no productivos.
 */
@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    try {
      await seedClients();
      await seedProductTypes();
      await seedProducts();
      await seedSales();
      this.logger.log('✅ Seeders ejecutados');
    } catch (error: any) {
      this.logger.error(`❌ Error en seeders: ${error.message}`, error.stack);
      throw error;
    }
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: update auth/business seeders bootstrap order"
```

#### 16.15 — Actualizar app.module.ts

Importa BusinessModule y/o AuthModule según el avance. Los guards globales llegan en la fase RBAC.

**Archivo:** `src/app.module.ts`

```bash
mkdir -p src
cat > src/app.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './config/environment/env.config';
import { appConfig } from './config/app/app.config';
import { jwtConfig } from './config/jwt/jwt.config';
import { LoggerModule } from './config/logger/logger.module';
import { SequelizeDatabaseModule } from './infrastructure/database/sequelize/sequelize.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { BusinessModule } from './features/business/business.module';
import { AuthModule } from './features/auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig, appConfig, jwtConfig],
      envFilePath: '.env',
    }),
    SequelizeDatabaseModule,
    SecurityModule,
    LoggerModule,
    BusinessModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: import AuthModule into AppModule"
```

#### 16.16 — Verificar feature auth (Auth — RefreshTokens)

Arranca y confirma tablas/endpoints del feature. Si hay asociaciones pendientes, el sync de columnas principales ya debe existir.

```bash
npm run start:dev
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "test: verify 15_auth_refresh_tokens auth feature"
```


------------------------------------------------------------------------

## FASE 17 — `16_AUTH_JWT_LOGIN`

### JWT — login / refresh / logout

> **Objetivo de la fase:** Casos de uso de autenticación, strategy Passport JWT y endpoints públicos de auth.

#### 17.1 — features/auth/authentication/domain/exceptions/inactive-user.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/auth/authentication/domain/exceptions/inactive-user.exception.ts`

```bash
mkdir -p src/features/auth/authentication/domain/exceptions
cat > src/features/auth/authentication/domain/exceptions/inactive-user.exception.ts <<'EOF_BACKEND_IA'
import { DomainException } from '../../../../../common/exceptions/domain.exception';

export class InactiveUserException extends DomainException {
  constructor() {
    super('Usuario inactivo');
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception inactive-user.exception.ts"
```

#### 17.2 — features/auth/authentication/domain/exceptions/invalid-credentials.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/auth/authentication/domain/exceptions/invalid-credentials.exception.ts`

```bash
mkdir -p src/features/auth/authentication/domain/exceptions
cat > src/features/auth/authentication/domain/exceptions/invalid-credentials.exception.ts <<'EOF_BACKEND_IA'
import { DomainException } from '../../../../../common/exceptions/domain.exception';

export class InvalidCredentialsException extends DomainException {
  constructor() {
    super('Credenciales inválidas');
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception invalid-credentials.exception.ts"
```

#### 17.3 — features/auth/authentication/domain/exceptions/invalid-refresh-token.exception.ts

Excepción de dominio. El caso de uso la lanza; el filter HTTP la traduce a status code.

**Archivo:** `src/features/auth/authentication/domain/exceptions/invalid-refresh-token.exception.ts`

```bash
mkdir -p src/features/auth/authentication/domain/exceptions
cat > src/features/auth/authentication/domain/exceptions/invalid-refresh-token.exception.ts <<'EOF_BACKEND_IA'
import { DomainException } from '../../../../../common/exceptions/domain.exception';

export class InvalidRefreshTokenException extends DomainException {
  constructor() {
    super('Refresh token inválido o expirado');
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add domain exception invalid-refresh-token.exception.ts"
```

#### 17.4 — features/auth/authentication/infrastructure/jwt/jwt-token.service.ts

Infraestructura JWT (strategy/payload/token service).

**Archivo:** `src/features/auth/authentication/infrastructure/jwt/jwt-token.service.ts`

```bash
mkdir -p src/features/auth/authentication/infrastructure/jwt
cat > src/features/auth/authentication/infrastructure/jwt/jwt-token.service.ts <<'EOF_BACKEND_IA'
import { Injectable, Inject } from '@nestjs/common';
import { TOKEN_SERVICE } from '../../../../../infrastructure/security/tokens/token.interface';
import type {
  ITokenService,
  IssuedTokens,
  TokenPayload,
} from '../../../../../infrastructure/security/tokens/token.interface';

@Injectable()
export class JwtTokenService {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  issueTokens(payload: TokenPayload): Promise<IssuedTokens> {
    return this.tokenService.issueTokens(payload);
  }

  verifyAccessToken(token: string): Promise<TokenPayload> {
    return this.tokenService.verifyAccessToken(token);
  }

  verifyRefreshToken(token: string): Promise<TokenPayload> {
    return this.tokenService.verifyRefreshToken(token);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add jwt-token.service.ts"
```

#### 17.5 — features/auth/authentication/infrastructure/jwt/jwt.payload.ts

Infraestructura JWT (strategy/payload/token service).

**Archivo:** `src/features/auth/authentication/infrastructure/jwt/jwt.payload.ts`

```bash
mkdir -p src/features/auth/authentication/infrastructure/jwt
cat > src/features/auth/authentication/infrastructure/jwt/jwt.payload.ts <<'EOF_BACKEND_IA'
export interface JwtPayload {
  sub: number;
  email: string;
  username: string;
  roles: string[];
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add jwt.payload.ts"
```

#### 17.6 — features/auth/authentication/infrastructure/jwt/jwt.strategy.ts

Infraestructura JWT (strategy/payload/token service).

**Archivo:** `src/features/auth/authentication/infrastructure/jwt/jwt.strategy.ts`

```bash
mkdir -p src/features/auth/authentication/infrastructure/jwt
cat > src/features/auth/authentication/infrastructure/jwt/jwt.strategy.ts <<'EOF_BACKEND_IA'
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../../../../../common/interfaces/authenticated-user.interface';
import { JwtPayload } from './jwt.payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('environment.jwt.secret') ?? '',
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }

    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      roles: payload.roles ?? [],
    };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add jwt.strategy.ts"
```

#### 17.7 — features/auth/authentication/infrastructure/password/bcrypt-auth-password.service.ts

Hash de passwords específico de autenticación.

**Archivo:** `src/features/auth/authentication/infrastructure/password/bcrypt-auth-password.service.ts`

```bash
mkdir -p src/features/auth/authentication/infrastructure/password
cat > src/features/auth/authentication/infrastructure/password/bcrypt-auth-password.service.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PASSWORD_HASHER } from '../../../../../infrastructure/security/hashing/password-hasher.interface';
import type { IPasswordHasher } from '../../../../../infrastructure/security/hashing/password-hasher.interface';

@Injectable()
export class BcryptAuthPasswordService {
  constructor(
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  hash(plain: string): Promise<string> {
    return this.passwordHasher.hash(plain);
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return this.passwordHasher.compare(plain, hashed);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add bcrypt-auth-password.service.ts"
```

#### 17.8 — features/auth/authentication/application/dto/authentication-response.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/auth/authentication/application/dto/authentication-response.dto.ts`

```bash
mkdir -p src/features/auth/authentication/application/dto
cat > src/features/auth/authentication/application/dto/authentication-response.dto.ts <<'EOF_BACKEND_IA'
export class AuthenticationResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: {
    id: number;
    email: string;
    username: string;
    roles: string[];
  };
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto authentication-response.dto.ts"
```

#### 17.9 — features/auth/authentication/application/dto/login.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/auth/authentication/application/dto/login.dto.ts`

```bash
mkdir -p src/features/auth/authentication/application/dto
cat > src/features/auth/authentication/application/dto/login.dto.ts <<'EOF_BACKEND_IA'
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto login.dto.ts"
```

#### 17.10 — features/auth/authentication/application/dto/logout.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/auth/authentication/application/dto/logout.dto.ts`

```bash
mkdir -p src/features/auth/authentication/application/dto
cat > src/features/auth/authentication/application/dto/logout.dto.ts <<'EOF_BACKEND_IA'
export { RefreshTokenDto as LogoutDto } from './refresh-token.dto';
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto logout.dto.ts"
```

#### 17.11 — features/auth/authentication/application/dto/refresh-token.dto.ts

DTO de entrada/salida HTTP con `class-validator` / Swagger.

**Archivo:** `src/features/auth/authentication/application/dto/refresh-token.dto.ts`

```bash
mkdir -p src/features/auth/authentication/application/dto
cat > src/features/auth/authentication/application/dto/refresh-token.dto.ts <<'EOF_BACKEND_IA'
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add dto refresh-token.dto.ts"
```

#### 17.12 — features/auth/authentication/application/use-cases/login.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/authentication/application/use-cases/login.use-case.ts`

```bash
mkdir -p src/features/auth/authentication/application/use-cases
cat > src/features/auth/authentication/application/use-cases/login.use-case.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Status } from '../../../../../common/enums/status.enum';
import { ROLE_REPOSITORY } from '../../../roles/domain/interfaces/role-repository.interface';
import type { IRoleRepository } from '../../../roles/domain/interfaces/role-repository.interface';
import { ROLE_USER_REPOSITORY } from '../../../role-users/domain/interfaces/role-user-repository.interface';
import type { IRoleUserRepository } from '../../../role-users/domain/interfaces/role-user-repository.interface';
import { USER_REPOSITORY } from '../../../users/domain/interfaces/user-repository.interface';
import type { IUserRepository } from '../../../users/domain/interfaces/user-repository.interface';
import { CreateRefreshTokenUseCase } from '../../../refresh-tokens/application/use-cases/create-refresh-token.use-case';
import { AuthenticationResponseDto } from '../dto/authentication-response.dto';
import { LoginDto } from '../dto/login.dto';
import { InactiveUserException } from '../../domain/exceptions/inactive-user.exception';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
import { BcryptAuthPasswordService } from '../../infrastructure/password/bcrypt-auth-password.service';
import { JwtTokenService } from '../../infrastructure/jwt/jwt-token.service';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(ROLE_USER_REPOSITORY)
    private readonly roleUserRepository: IRoleUserRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    private readonly authPasswordService: BcryptAuthPasswordService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly createRefreshTokenUseCase: CreateRefreshTokenUseCase,
  ) {}

  async execute(dto: LoginDto): Promise<AuthenticationResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    if (user.isActive !== Status.ACTIVE) {
      throw new InactiveUserException();
    }

    const passwordValid = await this.authPasswordService.compare(
      dto.password,
      user.password,
    );
    if (!passwordValid) {
      throw new InvalidCredentialsException();
    }

    const roleUsers = await this.roleUserRepository.findActiveByUserId(user.id!);
    const roleIds = roleUsers.map((ru) => ru.roleId);
    const roles = await this.roleRepository.findByIds(roleIds);
    const roleNames = roles.map((r) => r.name);

    const tokens = await this.jwtTokenService.issueTokens({
      sub: user.id!,
      email: user.email,
      username: user.username,
      roles: roleNames,
    });

    await this.createRefreshTokenUseCase.execute({
      userId: user.id!,
      token: tokens.refreshToken,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id!,
        email: user.email,
        username: user.username,
        roles: roleNames,
      },
    };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case login.use-case.ts"
```

#### 17.13 — features/auth/authentication/application/use-cases/logout.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/authentication/application/use-cases/logout.use-case.ts`

```bash
mkdir -p src/features/auth/authentication/application/use-cases
cat > src/features/auth/authentication/application/use-cases/logout.use-case.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import { ValidateRefreshTokenUseCase } from '../../../refresh-tokens/application/use-cases/validate-refresh-token.use-case';
import { InvalidateRefreshTokenUseCase } from '../../../refresh-tokens/application/use-cases/invalidate-refresh-token.use-case';
import { LogoutDto } from '../dto/logout.dto';
import { InvalidRefreshTokenException } from '../../domain/exceptions/invalid-refresh-token.exception';
import { JwtTokenService } from '../../infrastructure/jwt/jwt-token.service';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly validateRefreshTokenUseCase: ValidateRefreshTokenUseCase,
    private readonly invalidateRefreshTokenUseCase: InvalidateRefreshTokenUseCase,
  ) {}

  async execute(dto: LogoutDto): Promise<void> {
    try {
      await this.jwtTokenService.verifyRefreshToken(dto.refreshToken);
    } catch {
      throw new InvalidRefreshTokenException();
    }

    const stored = await this.validateRefreshTokenUseCase.execute(dto.refreshToken);
    if (!stored) {
      throw new InvalidRefreshTokenException();
    }

    await this.invalidateRefreshTokenUseCase.execute(stored.id!);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case logout.use-case.ts"
```

#### 17.14 — features/auth/authentication/application/use-cases/refresh-token.use-case.ts

Caso de uso (aplicación). Orquesta dominio + repositorio. El controller solo lo invoca.

**Archivo:** `src/features/auth/authentication/application/use-cases/refresh-token.use-case.ts`

```bash
mkdir -p src/features/auth/authentication/application/use-cases
cat > src/features/auth/authentication/application/use-cases/refresh-token.use-case.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Status } from '../../../../../common/enums/status.enum';
import { USER_REPOSITORY } from '../../../users/domain/interfaces/user-repository.interface';
import type { IUserRepository } from '../../../users/domain/interfaces/user-repository.interface';
import { ROLE_REPOSITORY } from '../../../roles/domain/interfaces/role-repository.interface';
import type { IRoleRepository } from '../../../roles/domain/interfaces/role-repository.interface';
import { ROLE_USER_REPOSITORY } from '../../../role-users/domain/interfaces/role-user-repository.interface';
import type { IRoleUserRepository } from '../../../role-users/domain/interfaces/role-user-repository.interface';
import { CreateRefreshTokenUseCase } from '../../../refresh-tokens/application/use-cases/create-refresh-token.use-case';
import { InvalidateRefreshTokenUseCase } from '../../../refresh-tokens/application/use-cases/invalidate-refresh-token.use-case';
import { ValidateRefreshTokenUseCase } from '../../../refresh-tokens/application/use-cases/validate-refresh-token.use-case';
import { AuthenticationResponseDto } from '../dto/authentication-response.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { InactiveUserException } from '../../domain/exceptions/inactive-user.exception';
import { InvalidRefreshTokenException } from '../../domain/exceptions/invalid-refresh-token.exception';
import { JwtTokenService } from '../../infrastructure/jwt/jwt-token.service';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(ROLE_USER_REPOSITORY)
    private readonly roleUserRepository: IRoleUserRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    private readonly jwtTokenService: JwtTokenService,
    private readonly validateRefreshTokenUseCase: ValidateRefreshTokenUseCase,
    private readonly invalidateRefreshTokenUseCase: InvalidateRefreshTokenUseCase,
    private readonly createRefreshTokenUseCase: CreateRefreshTokenUseCase,
  ) {}

  async execute(dto: RefreshTokenDto): Promise<AuthenticationResponseDto> {
    let payload;
    try {
      payload = await this.jwtTokenService.verifyRefreshToken(dto.refreshToken);
    } catch {
      throw new InvalidRefreshTokenException();
    }

    const stored = await this.validateRefreshTokenUseCase.execute(dto.refreshToken);
    if (!stored) {
      throw new InvalidRefreshTokenException();
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user || user.isActive !== Status.ACTIVE) {
      throw new InvalidRefreshTokenException();
    }

    const roleUsers = await this.roleUserRepository.findActiveByUserId(user.id!);
    const roleIds = roleUsers.map((ru) => ru.roleId);
    const roles = await this.roleRepository.findByIds(roleIds);
    const roleNames = roles.map((r) => r.name);

    const tokens = await this.jwtTokenService.issueTokens({
      sub: user.id!,
      email: user.email,
      username: user.username,
      roles: roleNames,
    });

    await this.invalidateRefreshTokenUseCase.execute(stored.id!);
    await this.createRefreshTokenUseCase.execute({
      userId: user.id!,
      token: tokens.refreshToken,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id!,
        email: user.email,
        username: user.username,
        roles: roleNames,
      },
    };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add use case refresh-token.use-case.ts"
```

#### 17.15 — features/auth/authentication/presentation/http/controllers/authentication.controller.ts

Controller delgado: valida DTO, llama use-case, devuelve respuesta.

**Archivo:** `src/features/auth/authentication/presentation/http/controllers/authentication.controller.ts`

```bash
mkdir -p src/features/auth/authentication/presentation/http/controllers
cat > src/features/auth/authentication/presentation/http/controllers/authentication.controller.ts <<'EOF_BACKEND_IA'
import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../../../../../../common/decorators/public.decorator';
import { LoginDto } from '../../../application/dto/login.dto';
import { LogoutDto } from '../../../application/dto/logout.dto';
import { RefreshTokenDto } from '../../../application/dto/refresh-token.dto';
import { LoginUseCase } from '../../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../../application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from '../../../application/use-cases/refresh-token.use-case';

@Controller('auth')
export class AuthenticationController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.refreshTokenUseCase.execute(dto);
  }

  @Post('logout')
  async logout(@Body() dto: LogoutDto) {
    await this.logoutUseCase.execute(dto);
    return { message: 'Sesión cerrada' };
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add controller authentication.controller.ts"
```

#### 17.16 — features/auth/authentication/authentication.module.ts

Módulo Nest del feature: cablea providers, tokens DI y controller.

**Archivo:** `src/features/auth/authentication/authentication.module.ts`

```bash
mkdir -p src/features/auth/authentication
cat > src/features/auth/authentication/authentication.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { RefreshTokensModule } from '../refresh-tokens/refresh-tokens.module';
import { RoleUsersModule } from '../role-users/role-users.module';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { JwtStrategy } from './infrastructure/jwt/jwt.strategy';
import { JwtTokenService } from './infrastructure/jwt/jwt-token.service';
import { BcryptAuthPasswordService } from './infrastructure/password/bcrypt-auth-password.service';
import { AuthenticationController } from './presentation/http/controllers/authentication.controller';

@Module({
  imports: [UsersModule, RolesModule, RoleUsersModule, RefreshTokensModule],
  controllers: [AuthenticationController],
  providers: [
    LoginUseCase,
    LogoutUseCase,
    RefreshTokenUseCase,
    JwtStrategy,
    JwtTokenService,
    BcryptAuthPasswordService,
  ],
  exports: [JwtStrategy, JwtTokenService],
})
export class AuthenticationModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: wire nest module authentication.module.ts"
```

#### 17.17 — features/auth/infrastructure/database/sequelize.provider.ts

Archivo del feature en Clean Architecture.

**Archivo:** `src/features/auth/infrastructure/database/sequelize.provider.ts`

```bash
mkdir -p src/features/auth/infrastructure/database
cat > src/features/auth/infrastructure/database/sequelize.provider.ts <<'EOF_BACKEND_IA'
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Sequelize } from 'sequelize-typescript';
import { SEQUELIZE_TOKEN } from '../../../../common/constants/database.constants';
import { RefreshTokenModel } from '../../refresh-tokens/infrastructure/persistence/models/refresh-token.model';
import { ResourceRoleModel } from '../../resource-roles/infrastructure/persistence/models/resource-role.model';
import { ResourceModel } from '../../resources/infrastructure/persistence/models/resource.model';
import { RoleUserModel } from '../../role-users/infrastructure/persistence/models/role-user.model';
import { RoleModel } from '../../roles/infrastructure/persistence/models/role.model';
import { UserModel } from '../../users/infrastructure/persistence/models/user.model';

export const AUTH_MODELS = [
  UserModel,
  RoleModel,
  RoleUserModel,
  ResourceModel,
  ResourceRoleModel,
  RefreshTokenModel,
];

export const sequelizeProvider: Provider = {
  provide: SEQUELIZE_TOKEN,
  useFactory: async (configService: ConfigService) => {
    const dbConfig = configService.get('environment.database');

    const sequelize = new Sequelize({
      dialect: dbConfig.dialect,
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      logging: configService.get('environment.app.nodeEnv') === 'development',
      define: {
        underscored: false,
        freezeTableName: true,
      },
    });

    sequelize.addModels(AUTH_MODELS);
    await sequelize.authenticate();
    await sequelize.sync();

    return sequelize;
  },
  inject: [ConfigService],
};
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add sequelize.provider.ts"
```

#### 17.18 — features/auth/index.ts

Barrel export del feature para imports limpios.

**Archivo:** `src/features/auth/index.ts`

```bash
mkdir -p src/features/auth
cat > src/features/auth/index.ts <<'EOF_BACKEND_IA'
export { AuthModule } from './auth.module';
export { UsersModule } from './users/users.module';
export { RolesModule } from './roles/roles.module';
export { RoleUsersModule } from './role-users/role-users.module';
export { ResourcesModule } from './resources/resources.module';
export { ResourceRolesModule } from './resource-roles/resource-roles.module';
export { RefreshTokensModule } from './refresh-tokens/refresh-tokens.module';
export { AuthenticationModule } from './authentication/authentication.module';
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: add barrel export auth"
```

#### 17.19 — Crear auth-bootstrap.seeder.ts

Siembra roles, users, pivotes y resources iniciales (admin/vendedor).

**Archivo:** `src/infrastructure/database/seeders/auth-bootstrap.seeder.ts`

```bash
mkdir -p src/infrastructure/database/seeders
cat > src/infrastructure/database/seeders/auth-bootstrap.seeder.ts <<'EOF_BACKEND_IA'
import * as bcrypt from 'bcrypt';
import { Status } from '../../../common/enums/status.enum';
import { HttpMethod } from '../../../common/enums/http-method.enum';
import { UserModel } from '../../../features/auth/users/infrastructure/persistence/models/user.model';
import { RoleModel } from '../../../features/auth/roles/infrastructure/persistence/models/role.model';
import { RoleUserModel } from '../../../features/auth/role-users/infrastructure/persistence/models/role-user.model';
import { ResourceModel } from '../../../features/auth/resources/infrastructure/persistence/models/resource.model';
import { ResourceRoleModel } from '../../../features/auth/resource-roles/infrastructure/persistence/models/resource-role.model';

export async function seedAuthBootstrap(): Promise<void> {
  // Roles
  if ((await RoleModel.count()) === 0) {
    await RoleModel.bulkCreate([
      { name: 'ADMIN', isActive: Status.ACTIVE },
      { name: 'MANAGER', isActive: Status.ACTIVE },
      { name: 'VENDEDOR', isActive: Status.ACTIVE },
    ]);
  }

  // Users
  if ((await UserModel.count()) === 0) {
    const adminPassword = await bcrypt.hash('Admin123*', 10);
    const vendorPassword = await bcrypt.hash('Vendedor123*', 10);

    await UserModel.bulkCreate([
      {
        username: 'admin',
        email: 'admin@tecnogua.com',
        password: adminPassword,
        isActive: Status.ACTIVE,
      },
      {
        username: 'vendedor',
        email: 'vendedor@tecnogua.com',
        password: vendorPassword,
        isActive: Status.ACTIVE,
      },
    ]);
  }

  // Role-Users
  if ((await RoleUserModel.count()) === 0) {
    const admin = await UserModel.findOne({ where: { email: 'admin@tecnogua.com' } });
    const vendor = await UserModel.findOne({
      where: { email: 'vendedor@tecnogua.com' },
    });
    const adminRole = await RoleModel.findOne({ where: { name: 'ADMIN' } });
    const vendorRole = await RoleModel.findOne({ where: { name: 'VENDEDOR' } });

    if (admin && adminRole) {
      await RoleUserModel.create({
        userId: admin.id,
        roleId: adminRole.id,
        isActive: Status.ACTIVE,
      });
    }
    if (vendor && vendorRole) {
      await RoleUserModel.create({
        userId: vendor.id,
        roleId: vendorRole.id,
        isActive: Status.ACTIVE,
      });
    }
  }

  // Resources
  if ((await ResourceModel.count()) === 0) {
    const resources = [
      { path: '/api/users', method: HttpMethod.GET },
      { path: '/api/users', method: HttpMethod.POST },
      { path: '/api/clients', method: HttpMethod.GET },
      { path: '/api/clients', method: HttpMethod.POST },
      { path: '/api/product-types', method: HttpMethod.GET },
      { path: '/api/product-types', method: HttpMethod.POST },
      { path: '/api/products', method: HttpMethod.GET },
      { path: '/api/products', method: HttpMethod.POST },
      { path: '/api/sales', method: HttpMethod.GET },
      { path: '/api/sales', method: HttpMethod.POST },
      { path: '/api/roles', method: HttpMethod.GET },
      { path: '/api/resources', method: HttpMethod.GET },
      { path: '/api/auth/login', method: HttpMethod.POST },
      { path: '/api/auth/refresh', method: HttpMethod.POST },
    ];

    await ResourceModel.bulkCreate(
      resources.map((r) => ({ ...r, isActive: Status.ACTIVE })),
    );
  }

  // Resource-Roles
  if ((await ResourceRoleModel.count()) === 0) {
    const adminRole = await RoleModel.findOne({ where: { name: 'ADMIN' } });
    const vendorRole = await RoleModel.findOne({ where: { name: 'VENDEDOR' } });
    const allResources = await ResourceModel.findAll();

    if (adminRole) {
      await ResourceRoleModel.bulkCreate(
        allResources.map((resource) => ({
          resourceId: resource.id,
          roleId: adminRole.id,
          isActive: Status.ACTIVE,
        })),
      );
    }

    if (vendorRole) {
      const vendorPaths = ['/api/clients', '/api/products', '/api/sales'];
      const vendorResources = allResources.filter(
        (r) =>
          vendorPaths.includes(r.path) &&
          (r.method === HttpMethod.GET || r.method === HttpMethod.POST),
      );

      await ResourceRoleModel.bulkCreate(
        vendorResources.map((resource) => ({
          resourceId: resource.id,
          roleId: vendorRole.id,
          isActive: Status.ACTIVE,
        })),
      );
    }
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add auth-bootstrap.seeder for initial rbac data"
```

#### 17.20 — Actualizar auth.module.ts (con Passport + AuthenticationModule)

Estado final del AuthModule con PassportModule y AuthenticationModule.

**Archivo:** `src/features/auth/auth.module.ts`

```bash
mkdir -p src/features/auth
cat > src/features/auth/auth.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthenticationModule } from './authentication/authentication.module';
import { RefreshTokensModule } from './refresh-tokens/refresh-tokens.module';
import { ResourceRolesModule } from './resource-roles/resource-roles.module';
import { ResourcesModule } from './resources/resources.module';
import { RoleUsersModule } from './role-users/role-users.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
    RolesModule,
    RoleUsersModule,
    ResourcesModule,
    ResourceRolesModule,
    RefreshTokensModule,
    AuthenticationModule,
  ],
  exports: [
    PassportModule,
    UsersModule,
    RolesModule,
    RoleUsersModule,
    ResourcesModule,
    ResourceRolesModule,
    RefreshTokensModule,
    AuthenticationModule,
  ],
})
export class AuthModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: wire AuthenticationModule and PassportModule"
```

#### 17.21 — Actualizar database-seeder.service.ts (incluye auth bootstrap)

Business seeders + seedAuthBootstrap en orden.

**Archivo:** `src/infrastructure/database/seeders/database-seeder.service.ts`

```bash
mkdir -p src/infrastructure/database/seeders
cat > src/infrastructure/database/seeders/database-seeder.service.ts <<'EOF_BACKEND_IA'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { seedClients } from '../../../features/business/clients/infrastructure/persistence/seeders/clients.seeder';
import { seedProductTypes } from '../../../features/business/product-types/infrastructure/persistence/seeders/product-types.seeder';
import { seedProducts } from '../../../features/business/products/infrastructure/persistence/seeders/products.seeder';
import { seedSales } from '../../../features/business/sales/infrastructure/persistence/seeders/sales.seeder';
import { seedAuthBootstrap } from './auth-bootstrap.seeder';

/**
 * Ejecuta seeders en orden de dependencias:
 * Business → Auth (users/roles/resources → pivotes)
 */
@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    try {
      await seedClients();
      await seedProductTypes();
      await seedProducts();
      await seedSales();
      await seedAuthBootstrap();
      this.logger.log('✅ Seeders ejecutados');
    } catch (error: any) {
      this.logger.error(`❌ Error en seeders: ${error.message}`, error.stack);
      throw error;
    }
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: run seedAuthBootstrap after business seeders"
```

#### 17.22 — Actualizar sequelize.factory.ts (estado final de modelos)

Asegura ALL_MODELS completo idéntico al proyecto de referencia.

**Archivo:** `src/infrastructure/database/sequelize/sequelize.factory.ts`

```bash
mkdir -p src/infrastructure/database/sequelize
cat > src/infrastructure/database/sequelize/sequelize.factory.ts <<'EOF_BACKEND_IA'
import { Sequelize } from 'sequelize-typescript';
import { DatabaseDialect } from '../../../config/environment/env.interface';
import { getSequelizeOptions } from './sequelize.options';

// Business models
import { ClientModel } from '../../../features/business/clients/infrastructure/persistence/models/client.model';
import { ProductTypeModel } from '../../../features/business/product-types/infrastructure/persistence/models/product-type.model';
import { ProductModel } from '../../../features/business/products/infrastructure/persistence/models/product.model';
import { SaleModel } from '../../../features/business/sales/infrastructure/persistence/models/sale.model';
import { ProductSaleModel } from '../../../features/business/sales/infrastructure/persistence/models/product-sale.model';

// Auth models
import { UserModel } from '../../../features/auth/users/infrastructure/persistence/models/user.model';
import { RoleModel } from '../../../features/auth/roles/infrastructure/persistence/models/role.model';
import { RoleUserModel } from '../../../features/auth/role-users/infrastructure/persistence/models/role-user.model';
import { ResourceModel } from '../../../features/auth/resources/infrastructure/persistence/models/resource.model';
import { ResourceRoleModel } from '../../../features/auth/resource-roles/infrastructure/persistence/models/resource-role.model';
import { RefreshTokenModel } from '../../../features/auth/refresh-tokens/infrastructure/persistence/models/refresh-token.model';

export const ALL_MODELS = [
  // Business first
  ClientModel,
  ProductTypeModel,
  ProductModel,
  SaleModel,
  ProductSaleModel,
  // Auth
  UserModel,
  RoleModel,
  RoleUserModel,
  ResourceModel,
  ResourceRoleModel,
  RefreshTokenModel,
];

export async function createSequelizeInstance(
  dialect: DatabaseDialect,
): Promise<Sequelize> {
  const options = getSequelizeOptions(dialect);

  let dialectModule: any;

  switch (dialect) {
    case DatabaseDialect.MySQL:
      dialectModule = require('mysql2');
      break;
    case DatabaseDialect.Postgres:
      dialectModule = require('pg');
      break;
    case DatabaseDialect.MSSQL:
      dialectModule = require('tedious');
      break;
    case DatabaseDialect.Oracle:
      dialectModule = require('oracledb');
      break;
    default:
      throw new Error(`Dialecto no soportado: ${dialect}`);
  }

  const sequelize = new Sequelize({
    ...options,
    dialectModule,
    models: ALL_MODELS,
  } as any);

  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión exitosa a ${dialect.toUpperCase()}`);
  } catch (error: any) {
    console.error(
      `❌ Error conectando a ${dialect.toUpperCase()}:`,
      error.message,
    );
    throw error;
  }

  if (process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: false });
    console.log('✅ Tablas sincronizadas');
  }

  return sequelize;
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: finalize ALL_MODELS registration"
```

#### 17.23 — Probar login / refresh / logout

Usa Swagger o curl:

```bash
curl -s -X POST http://localhost:3002/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@tecnogua.com","password":"Admin123*"}'
```

Guarda accessToken/refreshToken y prueba refresh + logout.

```bash
npm run start:dev
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "test: verify jwt login refresh logout flow"
```


------------------------------------------------------------------------

## FASE 18 — `17_AUTH_RBAC_GUARDS`

### RBAC — guards globales

> **Objetivo de la fase:** Activar JwtAuthGuard + RolesGuard (y ResourceAccessGuard disponible) a nivel aplicación.

#### 18.1 — common/guards/jwt-auth.guard.ts

Guard JWT global-ready. Respeta `@Public()`.

**Archivo:** `src/common/guards/jwt-auth.guard.ts`

```bash
mkdir -p src/common/guards
cat > src/common/guards/jwt-auth.guard.ts <<'EOF_BACKEND_IA'
import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser>(err: Error | null, user: TUser): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('No autorizado');
    }
    return user;
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add JwtAuthGuard"
```

#### 18.2 — common/guards/roles.guard.ts

Valida roles del usuario autenticado contra `@Roles()`.

**Archivo:** `src/common/guards/roles.guard.ts`

```bash
mkdir -p src/common/guards
cat > src/common/guards/roles.guard.ts <<'EOF_BACKEND_IA'
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new ForbiddenException('Acceso denegado');
    }

    const hasRole = requiredRoles.some((role) => user.roles?.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('No tiene permisos suficientes');
    }

    return true;
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add RolesGuard"
```

#### 18.3 — common/guards/resource-access.guard.ts

Guard opcional por recurso HTTP (`@Resource()`).

**Archivo:** `src/common/guards/resource-access.guard.ts`

```bash
mkdir -p src/common/guards
cat > src/common/guards/resource-access.guard.ts <<'EOF_BACKEND_IA'
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Status } from '../enums/status.enum';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RESOURCE_REPOSITORY } from '../../features/auth/resources/domain/interfaces/resource-repository.interface';
import type { IResourceRepository } from '../../features/auth/resources/domain/interfaces/resource-repository.interface';
import { RESOURCE_ROLE_REPOSITORY } from '../../features/auth/resource-roles/domain/interfaces/resource-role-repository.interface';
import type { IResourceRoleRepository } from '../../features/auth/resource-roles/domain/interfaces/resource-role-repository.interface';
import { ROLE_REPOSITORY } from '../../features/auth/roles/domain/interfaces/role-repository.interface';
import type { IRoleRepository } from '../../features/auth/roles/domain/interfaces/role-repository.interface';

@Injectable()
export class ResourceAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(RESOURCE_REPOSITORY)
    private readonly resourceRepository: IResourceRepository,
    @Inject(RESOURCE_ROLE_REPOSITORY)
    private readonly resourceRoleRepository: IResourceRoleRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new ForbiddenException('Acceso denegado');
    }

    if (requiredRoles?.length) {
      const hasRole = requiredRoles.some((role) => user.roles?.includes(role));
      if (!hasRole) {
        throw new ForbiddenException('No tiene permisos suficientes');
      }
      return true;
    }

    const method = request.method.toUpperCase();
    const path = this.normalizePath(request.route?.path ?? request.path);

    const resource = await this.resourceRepository.findByPathAndMethod(path, method);
    if (!resource || resource.isActive !== Status.ACTIVE) {
      return true;
    }

    const userRoles = await this.roleRepository.findByIds(
      await this.getRoleIdsByNames(user.roles),
    );
    const roleIds = userRoles.map((r) => r.id!);

    if (roleIds.length === 0) {
      throw new ForbiddenException('Acceso denegado al recurso');
    }

    const permissions = await this.resourceRoleRepository.findByRoleIds(roleIds);
    const allowed = permissions.some(
      (p) => p.resourceId === resource.id && p.isActive === Status.ACTIVE,
    );

    if (!allowed) {
      throw new ForbiddenException('Acceso denegado al recurso');
    }

    return true;
  }

  private normalizePath(path: string): string {
    const apiPath = path.startsWith('/api') ? path : `/api${path}`;
    return apiPath.replace(/\/:\w+/g, '');
  }

  private async getRoleIdsByNames(roleNames: string[]): Promise<number[]> {
    const roles = await Promise.all(
      roleNames.map((name) => this.roleRepository.findByName(name)),
    );
    return roles.filter(Boolean).map((r) => r!.id!);
  }
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: add ResourceAccessGuard"
```

#### 18.4 — Activar guards globales en app.module.ts

APP_GUARD JwtAuthGuard + RolesGuard. Desde aquí los endpoints requieren token salvo `@Public()`.

**Archivo:** `src/app.module.ts`

```bash
mkdir -p src
cat > src/app.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { envConfig } from './config/environment/env.config';
import { appConfig } from './config/app/app.config';
import { jwtConfig } from './config/jwt/jwt.config';
import { LoggerModule } from './config/logger/logger.module';
import { SequelizeDatabaseModule } from './infrastructure/database/sequelize/sequelize.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { BusinessModule } from './features/business/business.module';
import { AuthModule } from './features/auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig, appConfig, jwtConfig],
      envFilePath: '.env',
    }),
    SequelizeDatabaseModule,
    SecurityModule,
    LoggerModule,
    BusinessModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "feat: register global JwtAuthGuard and RolesGuard"
```

#### 18.5 — Verificar que endpoints protegidos exigen Bearer

Sin token, `/api/clients` debe responder 401. Con token admin, 200. Login sigue público.

```bash
npm run start:dev
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "test: verify rbac guards enforce bearer auth"
```


------------------------------------------------------------------------

## FASE 19 — `18_SWAGGER_BEARER`

### Swagger Bearer

> **Objetivo de la fase:** Confirmar documentación Bearer JWT en Swagger (ya configurada en swagger.config; se reafirma el estado final).

#### 19.1 — Reafirmar swagger.config.ts (Bearer)

Documenta el esquema Bearer para Authorize en `/api/docs`.

**Archivo:** `src/config/swagger/swagger.config.ts`

```bash
mkdir -p src/config/swagger
cat > src/config/swagger/swagger.config.ts <<'EOF_BACKEND_IA'
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  SWAGGER_DESCRIPTION,
  SWAGGER_PATH,
  SWAGGER_TITLE,
  SWAGGER_VERSION,
} from './swagger.constants';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle(SWAGGER_TITLE)
    .setDescription(SWAGGER_DESCRIPTION)
    .setVersion(SWAGGER_VERSION)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document);
}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "docs: ensure swagger bearer auth scheme"
```

#### 19.2 — Reafirmar swagger.constants.ts

Constantes de título/path de Swagger.

**Archivo:** `src/config/swagger/swagger.constants.ts`

```bash
mkdir -p src/config/swagger
cat > src/config/swagger/swagger.constants.ts <<'EOF_BACKEND_IA'
export const SWAGGER_TITLE = 'Backend NestJS + Sequelize API';
export const SWAGGER_DESCRIPTION =
  'API profesional con Clean Architecture / DDD, JWT y RBAC';
export const SWAGGER_VERSION = '1.0';
export const SWAGGER_PATH = 'api/docs';
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: sync swagger constants"
```

#### 19.3 — Probar Authorize en Swagger UI

Abre `/api/docs` → Authorize → pega el accessToken del login → ejecuta un endpoint protegido.

```bash
npm run start:dev
# http://localhost:3002/api/docs
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "test: verify swagger authorize with bearer token"
```


------------------------------------------------------------------------

## FASE 20 — `19_INTEGRACION_FINAL`

### Integración final + checklist

> **Objetivo de la fase:** Alinear archivos raíz al estado del proyecto de referencia y cerrar con checklist de aceptación.

#### 20.1 — Alinear business.module.ts final

Estado final del agregador Business.

**Archivo:** `src/features/business/business.module.ts`

```bash
mkdir -p src/features/business
cat > src/features/business/business.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ClientsModule } from './clients/clients.module';
import { ProductTypesModule } from './product-types/product-types.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [ClientsModule, ProductTypesModule, ProductsModule, SalesModule],
  exports: [ClientsModule, ProductTypesModule, ProductsModule, SalesModule],
})
export class BusinessModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: finalize BusinessModule exports"
```

#### 20.2 — Alinear auth.module.ts final

Estado final del agregador Auth.

**Archivo:** `src/features/auth/auth.module.ts`

```bash
mkdir -p src/features/auth
cat > src/features/auth/auth.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthenticationModule } from './authentication/authentication.module';
import { RefreshTokensModule } from './refresh-tokens/refresh-tokens.module';
import { ResourceRolesModule } from './resource-roles/resource-roles.module';
import { ResourcesModule } from './resources/resources.module';
import { RoleUsersModule } from './role-users/role-users.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
    RolesModule,
    RoleUsersModule,
    ResourcesModule,
    ResourceRolesModule,
    RefreshTokensModule,
    AuthenticationModule,
  ],
  exports: [
    PassportModule,
    UsersModule,
    RolesModule,
    RoleUsersModule,
    ResourcesModule,
    ResourceRolesModule,
    RefreshTokensModule,
    AuthenticationModule,
  ],
})
export class AuthModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: finalize AuthModule exports"
```

#### 20.3 — Alinear app.module.ts final

Estado final de AppModule (features + guards).

**Archivo:** `src/app.module.ts`

```bash
mkdir -p src
cat > src/app.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { envConfig } from './config/environment/env.config';
import { appConfig } from './config/app/app.config';
import { jwtConfig } from './config/jwt/jwt.config';
import { LoggerModule } from './config/logger/logger.module';
import { SequelizeDatabaseModule } from './infrastructure/database/sequelize/sequelize.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { BusinessModule } from './features/business/business.module';
import { AuthModule } from './features/auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig, appConfig, jwtConfig],
      envFilePath: '.env',
    }),
    SequelizeDatabaseModule,
    SecurityModule,
    LoggerModule,
    BusinessModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: finalize AppModule integration"
```

#### 20.4 — Alinear main.ts final

Bootstrap final idéntico al backend de referencia.

**Archivo:** `src/main.ts`

```bash
mkdir -p src
cat > src/main.ts <<'EOF_BACKEND_IA'
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { getLoggerConfig } from './config/logger/logger.config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { CustomValidationPipe } from './common/pipes/validation.pipe';
import { setupSwagger } from './config/swagger/swagger.config';
import { GLOBAL_PREFIX } from './common/constants/app.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: getLoggerConfig().logLevels,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3002);

  app.setGlobalPrefix(GLOBAL_PREFIX);

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new LoggingInterceptor(),
    new TimeoutInterceptor(),
  );

  app.useGlobalPipes(new CustomValidationPipe());

  setupSwagger(app);

  try {
    await app.listen(port);
    console.log(`🚀 Application running on: http://localhost:${port}`);
    console.log(`📘 Swagger: http://localhost:${port}/api/docs`);
  } catch (error: any) {
    if (error?.code === 'EADDRINUSE') {
      console.error(
        `❌ El puerto ${port} ya está en uso (EADDRINUSE).\n` +
          `   Solución rápida:\n` +
          `   1) npm run free:port\n` +
          `   2) npm run start:dev\n` +
          `   O cambia PORT en el archivo .env`,
      );
      await app.close();
      process.exit(1);
    }
    throw error;
  }
}
bootstrap();
EOF_BACKEND_IA
```

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "chore: finalize main.ts bootstrap"
```

#### 20.5 — Checklist de aceptación

Marca cada ítem:

- [ ] `npm run start:dev` arranca sin errores
- [ ] Swagger en `/api/docs`
- [ ] Tablas business: clients, product_types, products, sales, product_sales
- [ ] Tablas auth: users, roles, role_users, resources, resource_roles, refresh_tokens
- [ ] Seeders cargan admin/vendedor y catálogo demo
- [ ] Login → access + refresh
- [ ] Endpoints business requieren Bearer (401 sin token)
- [ ] Admin puede operar CRUD básico
- [ ] Refresh y logout funcionan
- [ ] `.env.example` documenta `DB_DIALECT` y los bloques `DB_MYSQL_*`, `DB_POSTGRES_*`, `DB_MSSQL_*`, `DB_ORACLE_*`

Si todo pasa, el backend_ia quedó reconstruido manualmente de punta a punta.

**Sugerencia de commit (issue):**

```bash
git add .
git commit -m "test: complete integration checklist for backend_ia"
```

#### 20.6 — Commit de cierre

Cierra la épica de construcción manual.

```bash
git add .
git commit -m "chore: complete backend_ia manual rebuild checklist"
```


------------------------------------------------------------------------

## Notas finales para issues / commits

- Un subítem = un issue = un commit (mensaje sugerido al final de cada subítem).
- Si un subítem solo crea carpetas, el commit puede ser `chore:`.
- Si agrega capacidad de negocio/auth, usa `feat:`.
- Si solo verifica, usa `test:`.
- No subas `.env` real; sí `.env.example` con `DB_DIALECT` y un bloque por motor.
- Fuente de verdad del código: este repo (`backend_ia`). La guía larga `docs/guia_del_backend.md` explica el *porqué*; este manual prioriza el *cómo ejecutar*.

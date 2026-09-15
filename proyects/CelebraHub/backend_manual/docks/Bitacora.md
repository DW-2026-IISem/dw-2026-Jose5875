## Bitacora manual de creación del Backend Jose Pinto  

## 1. Crear carpetas padre y permisos
``` bash
/home/josea/ia-lab/dw2026-2/proyects/CelebraHub
josea@Labestia:~/ia-lab/dw2026-2/dw-2026-Jose5875/proyects$ sudo chmod 777 -R CelebraHub/
```
<p align="center">
  <img src="imagenes/carpetas .png">
</p>


---------------------------------------------------------------------------------------------

## 2. instalar nest

Ejecutamos el comando para instalar el nestjs y verificar la version:

``` bash
npm install -g @nestjs/cli
nest --version
```

Verifica la estructura:
<p align="center">
  <img src="imagenes/instalacioon del nst.png">
</p>


---------------------------------------------------------------------------------------------

## 3. Crear proyecto NestJS



``` bash
cd /home/josea/ia-lab/dw2026-2/dw-2026-Jose5875/proyects/CelebraHub/backend_manual
nest new .
cd backend_manual

```


<p align="center">
  <img src="imagenes/instalar njs.png">
</p>



---------------------------------------------------------------------------------------------

## 4. Crear `.env` mínimo (puerto)

``` bash
cat > .env <<'EOF_BACKEND_MANUAL'
PORT=3002
NODE_ENV=development
EOF_BACKEND_MANUAL

```
<p align="center">
  <img src="imagenes/crear .evn.png">
</p>




------------------------------------------------------------------------------

## 5. Dependencias de producción


``` bash
npm install @nestjs/config @nestjs/swagger @nestjs/jwt @nestjs/passport @nestjs/mapped-types \
  passport passport-jwt sequelize sequelize-typescript mysql2 pg tedious oracledb \
  class-validator class-transformer bcrypt reflect-metadata express compression helmet
```

<p align="center">
  <img src="imagenes/dependencia de produccion.png">
</p>


-----------------------------------------------------------------------------------------------

## 6. Dependencias de desarrollo


``` bash

npm install -D @types/bcrypt @types/passport-jwt sequelize-cli

```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

-------------------------------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/compilando base.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 8. Crear árbol base de carpetas



``` bash
mkdir -p src/config/{app,database,environment,logger,swagger}
mkdir -p src/common/{constants,decorators,enums,exceptions,filters,guards,interceptors,interfaces,pipes,types,utils,validators}
mkdir -p src/infrastructure/database/{sequelize,migrations,seeders}
mkdir -p src/infrastructure/logging
mkdir -p src/features/shipping/{companies,contacts,addresses,shipments,packages,tracking-events,couriers,routes,rates,delivery-proofs,invoices}/{application/{dto,mappers,use-cases},domain/{entities,enums,exceptions,interfaces,services,validators},infrastructure/persistence/{models,repositories,migrations,seeders},presentation/http/{controllers,decorators,serializers,swagger},tests}
cat > src/features/shipping/shipping.module.ts <<'EOF_BACKEND'
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  exports: [],
})
export class ShippingModule {}
EOF_BACKEND_MANUAL
```

<p align="center">
  <img src="imagenes/crear arbol.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 9. Crear `.env.example` y actualizar `.env` completo



El `.env` real NO se sube a Git. Usa BD dedicada `enlace_express`.

**Contrato multi-base**

- `DB_DIALECT` = `mysql` | `postgres` | `mssql` | `oracle` (elige qué motor corre).
- MySQL: `DB_MYSQL_HOST`, `DB_MYSQL_PORT`, `DB_MYSQL_USERNAME`, `DB_MYSQL_PASSWORD`, `DB_MYSQL_NAME`.
- PostgreSQL: `DB_POSTGRES_*` (puerto lab 5432).
- SQL Server: `DB_MSSQL_*` (puerto lab 1433, usuario `sa`).
- Oracle: `DB_ORACLE_*` + `DB_ORACLE_CONNECT_STRING` (puerto lab 1521).
- Para cambiar de motor, cambia **solo** `DB_DIALECT`. No uses `DB_HOST` / `DB_USERNAME` genéricos.

```bash
cat > .env.example <<'EOF_BACKEND_MANUAL'
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

EOF_BACKEND_MANUAL
```

<p align="center">
  <img src="imagenes/9..png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 10. Interface de entorno

``` bash

mkdir -p src/config/environment
cat > src/config/environment/env.interface.ts <<'EOF_BACKEND_MANUAL'
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

export interface EnvironmentConfig {
  app: AppConfig;
  database: DatabaseConfig;
}
EOF_BACKEND_MANUAL
```

<p align="center">
  <img src="imagenes/10 Interface de entorno.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 11. Validación de entorno con class-validator



``` bash

mkdir -p src/config/environment
cat > src/config/environment/env.validation.ts <<'EOF_BACKEND_MANUAL'
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
EOF_BACKEND_MANUAL
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-15 173633.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 12. Resolver de credenciales por motor



``` bash

mkdir -p src/config/environment
cat > src/config/environment/db-env.ts <<'EOF_BACKEND_MANUAL'
import { DatabaseConfig, DatabaseDialect } from './env.interface';

export const DEFAULT_DB_PORTS: Record<DatabaseDialect, number> = {
  [DatabaseDialect.MySQL]: 3307,
  [DatabaseDialect.Postgres]: 5433,
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
EOF_BACKEND_MANUAL
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-15 174341.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 13. Factory registerAs de entorno



``` bash

mkdir -p src/config/environment
cat > src/config/environment/env.config.ts <<'EOF_BACKEND_MANUAL'
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
  };
});
EOF_BACKEND_MANUAL
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-15 175118.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 14. Constante SEQUELIZE_TOKEN



``` bash

mkdir -p src/common/constants
cat > src/common/constants/database.constants.ts <<'EOF_BACKEND_MANUAL'
export const SEQUELIZE_TOKEN = 'SEQUELIZE';
EOF_BACKEND_MANUAL
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-15 175903.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 15.  Tipos auxiliares de database config



``` bash

mkdir -p src/config/database
cat > src/config/database/database.types.ts <<'EOF_BACKEND_MANUAL'
import { Options as SequelizeOptions } from 'sequelize';

export type DialectOptions =
  | { dialect: 'mysql'; options?: SequelizeOptions }
  | { dialect: 'postgres'; options?: SequelizeOptions }
  | { dialect: 'mssql'; options?: SequelizeOptions }
  | { dialect: 'oracle'; options?: SequelizeOptions };
EOF_BACKEND_MANUAL
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-15 180141.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 16. database.config.ts



``` bash

mkdir -p src/config/database
cat > src/config/database/database.config.ts <<'EOF_BACKEND_MANUAL'
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
EOF_BACKEND_MANUAL
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-15 180602.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 17. database.module.ts / providerss

``` bash
mkdir -p src/config/database
cat > src/config/database/database.module.ts <<'EOF_BACKEND_MANUAL'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig } from './database.config';

@Module({
  imports: [ConfigModule.forFeature(databaseConfig)],
  exports: [ConfigModule],
})
export class DatabaseConfigModule {}
EOF_BACKEND_MANUAL
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-15 181541.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 18. database.providers.ts



``` bash
mkdir -p src/config/database
cat > src/config/database/database.providers.ts <<'EOF_BACKEND'
export const DATABASE_PROVIDERS = [];
EOF_BACKEND
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-15 182021.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 19. Opciones Sequelize por dialecto



``` bash

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

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-15 182651.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 7. Verificar arranque base



``` bash

npm run start:dev
# Ctrl+C cuando veas el log de arranque
curl -s http://localhost:3002 || true
```

<p align="center">
  <img src="imagenes/dependencias de desarollo.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v

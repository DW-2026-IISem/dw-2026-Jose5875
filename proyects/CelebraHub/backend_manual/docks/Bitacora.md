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

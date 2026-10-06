## Bitacora manual de creación del Backend usando express Jose Pinto  
## iss 1
## 1. Inicializar npm y scripts
``` bash
mkdir app-storelab-express
cd app-storelab-express
npm init -y
mkdir -p docs
```
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 093717.png">
</p>


---------------------------------------------------------------------------------------------

## 2. estructura de carpetas (features)

``` bash
mkdir -p \
  src/config \
  src/database/seeders \
  src/routes \
  src/shared/errors \
  src/shared/http \
  src/shared/database \
  src/features/business/clients
```

Verifica la estructura:
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 093908.png">
</p>


---------------------------------------------------------------------------------------------

## 3. Dependencias base (Express + TypeScript)



``` bash
npm install express@^5.2.1 cors@^2.8.6 dotenv@^17.4.2 morgan@^1.12.1

npm install -D typescript@~5.9.2 ts-node@^10.9.2 nodemon@^3.1.14 \
  @types/node@^22.20.3 @types/express@^5.0.6 \
  @types/cors@^2.8.19 @types/morgan@^1.9.10

```


<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 094436.png">
</p>



---------------------------------------------------------------------------------------------

## 4. TypeScript (tsconfig.json)

``` bash
cat >> tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "module": "commonjs",
    "target": "ES2020",
    "lib": ["ES2020"],
    "types": ["node"],
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "sourceMap": true,
    "strict": true,
    "skipLibCheck": true,
    "moduleDetection": "force",
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

```
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 094626.png">
</p>




------------------------------------------------------------------------------

## 5. Servidor y App (esqueleto HTTP)


``` bash
cat >> src/server.ts << 'EOF'
import { App } from './config/index';

async function main() {
    const app = new App();
    await app.listen();
}

main();
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 095144.png">
</p>


-----------------------------------------------------------------------------------------------

## 6. src/config/index.ts (esqueleto)


``` bash
cat >> src/config/index.ts << 'EOF'
import dotenv from "dotenv";
import express, { Application, ErrorRequestHandler } from "express";
import morgan from "morgan";
var cors = require("cors");
import { sequelize, getDatabaseInfo, testConnection } from "../database/db";
import "../features/business/clients/client.model";
import "../features/business/product-types/product-type.model";
import "../features/business/products/product.model";
import "../features/business/sales/sale.model";
import "../features/business/product-sales/product-sale.model";
import "../features/business/products/products.associations";
import "../features/business/sales/sales.associations";
import "../features/business/product-sales/product-sales.associations";
// Fase II — Auth con RBAC: primero los seis modelos, después las asociaciones
// (las asociaciones referencian los modelos, no al revés).
import "../features/auth/users/user.model";
import "../features/auth/roles/role.model";
import "../features/auth/resources/resource.model";
import "../features/auth/role-users/role-user.model";
import "../features/auth/resource-roles/resource-role.model";
import "../features/auth/refresh-tokens/refresh-token.model";
import "../features/auth/rbac.associations";
import { Routes } from "../routes/index";
import { setupSwagger } from "../swagger/index";

dotenv.config();

export class App {
  public app: Application;
  public routePrv: Routes = new Routes();

  constructor(private port?: number | string) {
    this.app = express();
    this.settings();
    this.middlewares();
    this.routes();
    this.docs();
    this.errorHandling();
  }

  private settings(): void {
    this.app.set('port', this.port || process.env.PORT || 4000);
  }

  private middlewares(): void {
    this.app.use(morgan('dev'));
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
  }

  private routes(): void {
    // Fase I — Business (cada operación, modalidad JWT + RBAC)
    this.routePrv.clientsRoutes.routes(this.app);
    this.routePrv.productTypesRoutes.routes(this.app);
    this.routePrv.productsRoutes.routes(this.app);
    this.routePrv.salesRoutes.routes(this.app);
    this.routePrv.productSalesRoutes.routes(this.app);

    // Fase II — Auth con RBAC
    // `sessionRoutes` registra los endpoints OPEN/JWT (login, refresh, logout,
    // perfil, permisos); el resto son modalidad JWT + RBAC.
    this.routePrv.sessionRoutes.routes(this.app);
    this.routePrv.refreshTokensRoutes.routes(this.app);
    this.routePrv.usersRoutes.routes(this.app);
    this.routePrv.rolesRoutes.routes(this.app);
    this.routePrv.resourcesRoutes.routes(this.app);
    this.routePrv.roleUsersRoutes.routes(this.app);
    this.routePrv.resourceRolesRoutes.routes(this.app);
  }

  private docs(): void {
    setupSwagger(this.app);
  }

  /**
   * Errores que ocurren **antes** de llegar a un controller o middleware.
   *
   * El caso típico es un cuerpo JSON malformado: `express.json()` lanza un
   * `SyntaxError` que, sin manejador, cae en el de Express por defecto y responde
   * 400 con un HTML que incluye el **stack trace y rutas absolutas del servidor**
   * (fuga de información). Aquí se traduce a un 400 JSON limpio.
   *
   * Debe registrarse **después** de las rutas: Express reconoce un middleware de
   * error por su aridad de 4 argumentos.
   */
  private errorHandling(): void {
    const bodyErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
      if (err instanceof SyntaxError && "body" in err) {
        res.status(400).json({ error: "Malformed JSON body" });
        return;
      }
      next(err);
    };
    this.app.use(bodyErrorHandler);
  }

  private async dbConnection(): Promise<void> {
    try {
      const dbInfo = getDatabaseInfo();
      console.log(`🔗 Intentando conectar a: ${dbInfo.engine.toUpperCase()}`);

      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error(`No se pudo conectar a la base de datos ${dbInfo.engine.toUpperCase()}`);
      }

      // Lab: sync crea/altera tablas desde los modelos (BD limpia → snake_case desde cero).
      const force = process.env.DB_SYNC_FORCE === "true";
      const isMysql =
        sequelize.getDialect() === "mysql" || sequelize.getDialect() === "mariadb";

      if (isMysql) {
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
      }
      try {
        await sequelize.sync({ force, alter: !force });
      } finally {
        if (isMysql) {
          await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
        }
      }

      console.log(
        force
          ? "📦 Base de datos recreada (DB_SYNC_FORCE=true)"
          : "📦 Base de datos sincronizada exitosamente"
      );
    } catch (error) {
      console.error("❌ Error al conectar con la base de datos:", error);
      process.exit(1);
    }
  }

  async listen() {
    // Orden de arranque: primero la BD (conexión + `sync`), después abrir el puerto.
    // Si se abre el puerto antes de terminar `sync({ alter: true })`, las sentencias
    // DDL (ALTER TABLE, DROP/ADD FOREIGN KEY) compiten con las peticiones que ya
    // están entrando y provocan deadlocks y errores de FK intermitentes.
    await this.dbConnection();
    await this.app.listen(this.app.get('port'));
    console.log(`🚀 Servidor ejecutándose en puerto ${this.app.get('port')}`);
  }
}
EOF

```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 095343.png">
</p>

-------------------------------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------
## fase 2 



## 7. Drivers Sequelize y .env



``` bash

npm install sequelize@^6.37.8 mysql2@^3.24.4 pg@^8.23.0 pg-hstore@^2.3.4 \
  tedious@^20.0.0 oracledb@^7.0.1
npm install -D @types/sequelize@^6.12.0
```


``` bash
cat >> .env << 'EOF'
PORT=4000

# Variable para seleccionar el motor de base de datos
DB_ENGINE=mysql

# Configuración para MySQL
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=jose123456
MYSQL_NAME=josepinto
MYSQL_PORT=3307

# Configuración para PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_USER=josepinto
POSTGRES_PASSWORD=jose123456
POSTGRES_NAME=josepintol
POSTGRES_PORT=5432

# Configuración para SQL Server
MSSQL_HOST=localhost
MSSQL_USER=sa
MSSQL_PASSWORD=Jose123456!
MSSQL_NAME=master
MSSQL_PORT=1433

# Configuración para Oracle
ORACLE_HOST=localhost
ORACLE_USER=system
ORACLE_PASSWORD=Oracles123456
ORACLE_NAME=XE
ORACLE_PORT=1521

EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 103432.png">
</p>
--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 8. Configuración Sequelize (database/db.ts)



``` bash
cat >> src/database/db.ts << 'EOF'
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

interface DatabaseConfig {
  dialect: string;
  host: string;
  username: string;
  password: string;
  database: string;
  port: number;
}

const dbConfigurations: Record<string, DatabaseConfig> = {
  mysql: {
    dialect: "mysql",
    host: process.env.MYSQL_HOST || "localhost",
    username: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_NAME || "test",
    port: parseInt(process.env.MYSQL_PORT || "3306")
  },
  postgres: {
    dialect: "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    username: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "",
    database: process.env.POSTGRES_NAME || "test",
    port: parseInt(process.env.POSTGRES_PORT || "5432")
  }
};

const selectedEngine = process.env.DB_ENGINE || "mysql";
const selectedConfig = dbConfigurations[selectedEngine];

if (!selectedConfig) {
  throw new Error(`Motor de base de datos no soportado: ${selectedEngine}`);
}

console.log(`🔌 Conectando a base de datos: ${selectedEngine.toUpperCase()}`);

export const sequelize = new Sequelize(
  selectedConfig.database,
  selectedConfig.username,
  selectedConfig.password,
  {
    host: selectedConfig.host,
    port: selectedConfig.port,
    dialect: selectedConfig.dialect as any,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export const getDatabaseInfo = () => {
  return {
    engine: selectedEngine,
    config: selectedConfig,
    connectionString: `${selectedConfig.dialect}://${selectedConfig.username}@${selectedConfig.host}:${selectedConfig.port}/${selectedConfig.database}`
  };
};

export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión exitosa a ${selectedEngine.toUpperCase()}`);
    return true;
  } catch (error) {
    console.error(`❌ Error de conexión a ${selectedEngine.toUpperCase()}:`, error);
    return false;
  }
};
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 104550.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------
## Business — ISS-03 — Feature Client (CRUD por capas: A…E)

## 9. 



El `.env` real NO se sube a Git. Usa BD dedicada `enlace_express`.


```bash
mkdir -p src/shared/errors src/shared/http src/shared/database
```
```bash
cat >> src/shared/errors/app-error.ts << 'EOF'
/**
 * Error de aplicación con código HTTP asociado.
 *
 * Lo lanzan los **services** (capa de negocio) cuando una regla no se cumple
 * (no encontrado, estado inválido, stock insuficiente, etc.).
 * Los **controllers** lo traducen a una respuesta HTTP.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  public constructor(statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 113238.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 10. src/shared/http/base-controller.ts

``` bash
cat > src/shared/http/base-controller.ts << 'EOF'
import { Request, Response } from "express";
import { AppError } from "../errors/app-error";

export abstract class BaseController {

  protected async run(
    res: Response,
    work: () => Promise<void>
  ): Promise<void> {
    try {
      await work();
    } catch (error) {
      this.handleError(res, error);
    }
  }

  protected paramId(req: Request): number {
    const raw = req.params.id;
    const value = Array.isArray(raw) ? raw[0] : raw;

    if (!value || !/^\d+$/.test(value) || Number(value) < 1) {
      throw new AppError(
        400,
        "Invalid id: must be a positive integer"
      );
    }

    return Number(value);
  }

  protected handleError(
    res: Response,
    error: unknown
  ): void {
    if (error instanceof AppError) {
      res
        .status(error.statusCode)
        .json({ error: error.message });

      return;
    }

    console.error(error);

    res
      .status(500)
      .json({
        error: "Internal server error",
        detail: String(error)
      });
  }
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 113439.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 11. src/shared/database/with-transaction.ts



``` bash
cat > src/shared/database/with-transaction.ts << 'EOF'
import { Transaction } from "sequelize";
import { sequelize } from "../../database/db";

export async function withTransaction<T>(
  work: (transaction: Transaction) => Promise<T>
): Promise<T> {
  const transaction = await sequelize.transaction();
  let committed = false;

  try {
    const result = await work(transaction);

    await transaction.commit();
    committed = true;

    return result;
  } catch (error) {
    if (!committed) {
      await transaction.rollback().catch(() => undefined);
    }

    throw error;
  }
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 113551.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 12. Modelo Client



``` bash

cat >> src/features/business/clients/client.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";
import bcrypt from "bcryptjs";

export interface ClientI {
  id?: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  password: string;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class Client extends Model {
  public id!: number;
  public name!: string;
  public address!: string;
  public phone!: string;
  public email!: string;
  public password!: string;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Client.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: { msg: "Phone cannot be empty" },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: { msg: "Email must be a valid email address" },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      // Fail-safe: una fila insertada sin estado explícito NO queda visible en la API.
      // La vía de creación de la API siempre envía "active".
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Client",
    tableName: "clients",
    timestamps: true,
    hooks: {
      beforeCreate: async (client: Client) => {
        if (client.password) {
          const salt = await bcrypt.genSalt(10);
          client.password = await bcrypt.hash(client.password, salt);
        }
      },
      beforeUpdate: async (client: Client) => {
        if (client.changed("password") && client.password) {
          const salt = await bcrypt.genSalt(10);
          client.password = await bcrypt.hash(client.password, salt);
        }
      },
      beforeBulkCreate: async (clients: Client[]) => {
        for (const client of clients) {
          if (client.password) {
            const salt = await bcrypt.genSalt(10);
            client.password = await bcrypt.hash(client.password, salt);
          }
        }
      },
    },
  }
);
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 113900.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 13. DTO + esqueletos repository / service / controller / routes + carpeta HTTP


## dto/create-client.dto.ts


``` bash
cat >> src/features/business/clients/dto/create-client.dto.ts << 'EOF'
/** Datos de entrada de `POST /api/clientes`. */
export interface CreateClientDto {
  name: string;
  address: string;
  phone: string;
  email: string;
  password: string;
  /** Opcional: por defecto `active`. Tras crearlo, el estado sólo cambia con el borrado lógico. */
  status?: "active" | "inactive";
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 114110.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 14. dto/update-client.dto.ts



``` bash

cat > src/features/business/clientes/dto/update-cliente.dto.ts << 'EOF'
export interface UpdateClienteDto {
  tipo_documento: string;
  numero_documento: string;
  nombre: string;
  telefono: string;
  email: string;
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 114435.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 15. dto/patch-client.dto.ts



``` bash
cat > src/features/business/clientes/dto/patch-cliente.dto.ts << 'EOF'
import { UpdateClienteDto } from "./update-cliente.dto";

export type PatchClienteDto = Partial<UpdateClienteDto>;
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 114555.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 16. dto/client-response.dto.ts



``` bash
cat > src/features/business/clientes/dto/cliente-response.dto.ts << 'EOF'
import {
  Cliente,
  ClienteI
} from "../cliente.model";

export type ClienteResponseDto = ClienteI;

export function toClienteResponse(
  cliente: Cliente
): ClienteResponseDto {
  return cliente.toJSON() as ClienteI;
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 114734.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 17. dto/index.ts

``` bash
cat > src/features/business/clientes/dto/index.ts << 'EOF'
export * from "./create-cliente.dto";
export * from "./update-cliente.dto";
export * from "./patch-cliente.dto";
export * from "./cliente-response.dto";
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 115138.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 18. Repository (esqueleto)



``` bash
cat > src/features/business/clientes/clientes.repository.ts << 'EOF'
import {
  CreationAttributes,
  Transaction
} from "sequelize";

import {
  Cliente,
  ClienteI
} from "./cliente.model";

export class ClientesRepository {

  // ================== READ ==================

  public async findAllActive(): Promise<Cliente[]> {
    return Cliente.findAll({
      where: {
        is_active: true
      }
    });
  }

  public async findById(
    id: number,
    transaction?: Transaction
  ): Promise<Cliente | null> {
    return Cliente.findByPk(id, {
      transaction
    });
  }

  // ================== CREATE ==================

  public async create(
    data: CreationAttributes<Cliente>
  ): Promise<Cliente> {
    return Cliente.create(data);
  }

  // ================== UPDATE ==================

  public async update(
    cliente: Cliente,
    data: Partial<ClienteI>
  ): Promise<Cliente> {
    return cliente.update(data);
  }

  // ================== DELETE ==================

  public async delete(
    cliente: Cliente
  ): Promise<void> {
    await cliente.destroy();
  }
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 115531.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 19. Service (esqueleto)



``` bash
cat > src/features/business/clientes/clientes.service.ts << 'EOF'
import {
  ClienteResponseDto,
  CreateClienteDto,
  PatchClienteDto,
  UpdateClienteDto,
  toClienteResponse
} from "./dto";

import {
  ClientesRepository
} from "./clientes.repository";

import {
  Cliente
} from "./cliente.model";

import {
  AppError
} from "../../../shared/errors/app-error";

export class ClientesService {

  public constructor(
    private readonly repository: ClientesRepository =
      new ClientesRepository()
  ) {}

  // ================== READ ==================

  public async getAll(): Promise<ClienteResponseDto[]> {
    const clientes =
      await this.repository.findAllActive();

    return clientes.map(
      (cliente) => toClienteResponse(cliente)
    );
  }

  public async getOne(
    id: number
  ): Promise<ClienteResponseDto> {
    return toClienteResponse(
      await this.findOrFail(id)
    );
  }

  // ================== CREATE ==================

  public async create(
    body: CreateClienteDto
  ): Promise<ClienteResponseDto> {

    const cliente =
      await this.repository.create({
        tipo_documento: body.tipo_documento,
        numero_documento: body.numero_documento,
        nombre: body.nombre,
        telefono: body.telefono,
        email: body.email,
        is_active: true
      });

    return toClienteResponse(cliente);
  }

  // ================== UPDATE ==================

  public async updatePut(
    id: number,
    body: UpdateClienteDto
  ): Promise<ClienteResponseDto> {

    const cliente =
      await this.findOrFail(id);

    await this.repository.update(
      cliente,
      {
        tipo_documento: body.tipo_documento,
        numero_documento: body.numero_documento,
        nombre: body.nombre,
        telefono: body.telefono,
        email: body.email
      }
    );

    return toClienteResponse(cliente);
  }

  public async updatePatch(
    id: number,
    body: PatchClienteDto
  ): Promise<ClienteResponseDto> {

    const cliente =
      await this.findOrFail(id);

    await this.repository.update(
      cliente,
      body
    );

    return toClienteResponse(cliente);
  }

  // ================== DELETE ==================

  public async deletePhysical(
    id: number
  ): Promise<void> {

    const cliente =
      await this.findOrFail(id, false);

    await this.repository.delete(cliente);
  }

  public async deleteLogical(
    id: number
  ): Promise<ClienteResponseDto> {

    const cliente =
      await this.findOrFail(id);

    await this.repository.update(
      cliente,
      {
        is_active: false
      }
    );

    return toClienteResponse(cliente);
  }

  // ================== HELPERS ==================

  private async findOrFail(
    id: number,
    onlyActive = true
  ): Promise<Cliente> {

    const cliente =
      await this.repository.findById(id);

    if (
      !cliente ||
      (onlyActive && !cliente.is_active)
    ) {
      throw new AppError(
        404,
        "Cliente no encontrado"
      );
    }

    return cliente;
  }
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 115803.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 20. Controller


``` bash
cat > src/features/business/clientes/clientes.controller.ts << 'EOF'
import {
  Request,
  Response
} from "express";

import {
  BaseController
} from "../../../shared/http/base-controller";

import {
  ClientesService
} from "./clientes.service";

import {
  CreateClienteDto,
  PatchClienteDto,
  UpdateClienteDto
} from "./dto";

export class ClientesController
  extends BaseController {

  public constructor(
    private readonly service: ClientesService =
      new ClientesService()
  ) {
    super();
  }

  // ================== READ ==================

  public async getAll(
    _req: Request,
    res: Response
  ): Promise<void> {

    await this.run(res, async () => {

      const clientes =
        await this.service.getAll();

      res.status(200).json({
        clientes
      });
    });
  }

  public async getOne(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(res, async () => {

      const cliente =
        await this.service.getOne(
          this.paramId(req)
        );

      res.status(200).json({
        cliente
      });
    });
  }

  // ================== CREATE ==================

  public async create(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(res, async () => {

      const cliente =
        await this.service.create(
          req.body as CreateClienteDto
        );

      res.status(201).json({
        cliente
      });
    });
  }

  // ================== UPDATE ==================

  public async updatePut(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(res, async () => {

      const cliente =
        await this.service.updatePut(
          this.paramId(req),
          req.body as UpdateClienteDto
        );

      res.status(200).json({
        cliente
      });
    });
  }

  public async updatePatch(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(res, async () => {

      const cliente =
        await this.service.updatePatch(
          this.paramId(req),
          req.body as PatchClienteDto
        );

      res.status(200).json({
        cliente
      });
    });
  }

  // ================== DELETE ==================

  public async deletePhysical(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(res, async () => {

      const id = this.paramId(req);

      await this.service.deletePhysical(id);

      res.status(200).json({
        message: "Cliente eliminado permanentemente",
        id
      });
    });
  }

  public async deleteLogical(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(res, async () => {

      const cliente =
        await this.service.deleteLogical(
          this.paramId(req)
        );

      res.status(200).json({
        message: "Cliente desactivado correctamente",
        cliente
      });
    });
  }
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 115934.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 21. Routes (esqueleto)



``` bash
cat > src/features/business/clientes/clientes.routes.ts << 'EOF'
import {
  Application
} from "express";

import {
  ClientesController
} from "./clientes.controller";

export class ClientesRoutes {

  public clientesController:
    ClientesController =
      new ClientesController();

  public routes(
    app: Application
  ): void {

    // ================== GET ==================

    app
      .route("/api/clientes")
      .get(
        this.clientesController.getAll.bind(
          this.clientesController
        )
      );

    app
      .route("/api/clientes/:id")
      .get(
        this.clientesController.getOne.bind(
          this.clientesController
        )
      );

    // ================== CREATE ==================

    app
      .route("/api/clientes")
      .post(
        this.clientesController.create.bind(
          this.clientesController
        )
      );

    // ================== UPDATE ==================

    app
      .route("/api/clientes/:id")
      .put(
        this.clientesController.updatePut.bind(
          this.clientesController
        )
      )
      .patch(
        this.clientesController.updatePatch.bind(
          this.clientesController
        )
      );

    // ================== DELETE ==================

    app
      .route("/api/clientes/:id")
      .delete(
        this.clientesController.deletePhysical.bind(
          this.clientesController
        )
      );

    app
      .route("/api/clientes/:id/deactivate")
      .patch(
        this.clientesController.deleteLogical.bind(
          this.clientesController
        )
      );
  }
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 120155.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 22. Agregador Routes + cableado en Config

``` bash
cat > src/routes/index.ts << 'EOF'
import {
  ClientesRoutes
} from "../features/business/clientes/clientes.routes";

export class Routes {

  public clientesRoutes:
    ClientesRoutes =
      new ClientesRoutes();
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 120447.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 23.PARCHE — src/config/index.ts ya existe (ISS-01).



``` bash

import { sequelize, getDatabaseInfo, testConnection } from "../database/db";
import "../features/business/clients/client.model";
import { Routes } from "../routes/index";
Dentro de export class App, debajo de public app: Application; añadir:

  public routePrv: Routes = new Routes();
Dentro de routes(), reemplazar el comentario // ISS-03 §4.3 por:

    this.routePrv.clientsRoutes.routes(this.app);
Dentro de dbConnection(), reemplazar el comentario // ISS-02 / ISS-03 por:

    try {
      // Mostrar información de la base de datos seleccionada
      const dbInfo = getDatabaseInfo();
      console.log(`🔗 Intentando conectar a: ${dbInfo.engine.toUpperCase()}`);

      // Probar la conexión
      const isConnected = await testConnection();

      if (!isConnected) {
        throw new Error(`No se pudo conectar a la base de datos ${dbInfo.engine.toUpperCase()}`);
      }

      // alter: true actualiza columnas faltantes (ej. createdAt/updatedAt tras timestamps: true).
      // force: false no recrea tablas; no borra datos. En producción preferir migraciones.
      await sequelize.sync({ force: false, alter: true });
      console.log(`📦 Base de datos sincronizada exitosamente`);
    } catch (error) {
      console.error("❌ Error al conectar con la base de datos:", error);
      process.exit(1); // Terminar la aplicación si no se puede conectar
    }
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 121326.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 24. ISS-03-B — Feature Client — GetAll y GetOne
## HTTP — archivo nuevo



``` bash
cat > src/features/business/clientes/http/clientes.get.http << 'EOF'
### CELEBRAHUB - CLIENTES
### ISS-03 - GET ALL

@baseUrl = http://localhost:4000

### Obtener todos los clientes activos
GET {{baseUrl}}/api/clientes

### Obtener cliente por ID
GET {{baseUrl}}/api/clientes/1

### ID inválido
GET {{baseUrl}}/api/clientes/abc

### ID cero
GET {{baseUrl}}/api/clientes/0
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 122104.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
-----------------------------------------------------

------------------------------------------------------------------------

## 25. CREATE



``` bash
cat > src/features/business/clientes/http/clientes.create.http << 'EOF'
### CELEBRAHUB - CLIENTES
### ISS-03 - CREATE

@baseUrl = http://localhost:4000

### Crear cliente
POST {{baseUrl}}/api/clientes
Content-Type: application/json

{
  "tipo_documento": "CC",
  "numero_documento": "1234567890",
  "nombre": "Ana Pérez",
  "telefono": "3001234567",
  "email": "ana.perez@example.com"
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 122213.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 26. UPDATE



``` bash
cat > src/features/business/clientes/http/clientes.update.http << 'EOF'
### CELEBRAHUB - CLIENTES
### ISS-03 - UPDATE

@baseUrl = http://localhost:4000

### PUT
PUT {{baseUrl}}/api/clientes/1
Content-Type: application/json

{
  "tipo_documento": "CC",
  "numero_documento": "1234567890",
  "nombre": "Ana Pérez Actualizada",
  "telefono": "3009876543",
  "email": "ana.actualizada@example.com"
}

###

### PATCH
PATCH {{baseUrl}}/api/clientes/1
Content-Type: application/json

{
  "telefono": "3011112233"
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 122309.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v------------------------------------------------------------------------

## 27.  DELETE



``` bash
cat > src/features/business/clientes/http/clientes.delete.http << 'EOF'
### CELEBRAHUB - CLIENTES
### ISS-03 - DELETE

@baseUrl = http://localhost:4000

### Borrado lógico
PATCH {{baseUrl}}/api/clientes/1/deactivate

###

### Borrado físico
DELETE {{baseUrl}}/api/clientes/1
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 122916.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v------------------------------------------------------------------------

## 28. Fase I: Business — ISS-04 — Seeders con Faker (feature + runner)
## Seeder dentro del feature Client



``` bash
cat > src/database/seeders/clientes.seeder.ts << 'EOF'
import { faker } from "@faker-js/faker";

import { Cliente } from "../../features/business/clientes/cliente.model";
import { sequelize } from "../../database/db";

async function seedClientes(): Promise<void> {
  try {
    await sequelize.authenticate();

    console.log("🌱 Iniciando seeder de clientes...");

    const clientes = [];

    for (let i = 0; i < 10; i++) {
      clientes.push({
        tipo_documento: faker.helpers.arrayElement([
          "CC",
          "CE",
          "TI",
          "NIT"
        ]),

        numero_documento:
          faker.string.numeric(10),

        nombre:
          faker.person.fullName(),

        telefono:
          faker.phone.number(),

        email:
          faker.internet.email(),

        is_active: true
      });
    }

    await Cliente.bulkCreate(clientes);

    console.log(
      `✅ Se crearon ${clientes.length} clientes correctamente`
    );

  } catch (error) {

    console.error(
      "❌ Error ejecutando seeder de clientes:",
      error
    );

    process.exit(1);

  } finally {

    await sequelize.close();
  }
}

seedClientes();
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 130030.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v------------------------------------------------------------------------

## 29. SeedersRunner + conteos por entidad (database/seeders)
## Conteos



``` bash
cat >> src/database/seeders/counts.ts << 'EOF'
/**
 * Cantidad de registros por feature/entidad.
 * Prioridad: CLI (--clientes=N) > env (SEED_CLIENTES) > default.
 *
 * Cuando agreguemos nuevas entidades de CelebraHub,
 * las incorporaremos aquí.
 */
export type SeedCounts = {
  clientes: number;
  // usuarios?: number;
  // roles?: number;
  // salones?: number;
  // servicios?: number;
  // proveedores?: number;
  // reservas?: number;
  // eventos?: number;
  // contratos?: number;
  // pagos?: number;
};

export const DEFAULT_SEED_COUNTS: SeedCounts = {
  clientes: 10,
};

export function resolveSeedCounts(
  argv: string[] = process.argv.slice(2)
): SeedCounts {
  const counts: SeedCounts = {
    ...DEFAULT_SEED_COUNTS
  };

  const envClientes = process.env.SEED_CLIENTES;

  if (
    envClientes !== undefined &&
    envClientes !== ""
  ) {
    counts.clientes = Number(envClientes);
  }

  for (const arg of argv) {
    const m = arg.match(
      /^--([a-zA-Z_]+)=(\d+)$/
    );

    if (!m) continue;

    const key =
      m[1] as keyof SeedCounts;

    const value = Number(m[2]);

    if (key in counts) {
      counts[key] = value;
    }
  }

  return counts;
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 130526.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v------------------------------------------------------------------------

## 30. 9.2.2 Runner

``` bash
cat >> src/database/seeders/index.ts << 'EOF'
import dotenv from "dotenv";
import { sequelize, testConnection } from "../db";
import "../../features/business/clients/client.model";
import { seedClients } from "../../features/business/clients/client.seeder";
import { resolveSeedCounts } from "./counts";

dotenv.config();

/**
 * SeedersRunner — ejecuta TODOS los seeders de features.
 *
 * Ubicación: `src/database/seeders/` (orquestación fuera de cada feature).
 * Cada feature exporta su seeder (ej. `features/business/clients/clients.seeder.ts`).
 *
 * Uso:
 *   npm run db:seed
 *   npm run db:seed -- --clients=20
 *   SEED_CLIENTS=5 npm run db:seed
 */
export async function runAllSeeders(): Promise<void> {
  const counts = resolveSeedCounts();
  console.log("🌱 Iniciando SeedersRunner...");
  console.log("📊 Conteos:", counts);

  const ok = await testConnection();
  if (!ok) {
    throw new Error("No hay conexión a la base de datos");
  }

  await sequelize.sync({ force: false, alter: true });

  // Orden: business (padres → hijos)
  await seedClients(counts.clients);

  console.log("🌱 SeedersRunner finalizado");
}

if (require.main === module) {
  runAllSeeders()
    .then(async () => {
      await sequelize.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("❌ Error en seeders:", err);
      await sequelize.close();
      process.exit(1);
    });
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 132605.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v------------------------------------------------------------------------

## 31. Fase I: Business — ISS-05 — Swagger / OpenAPI (feature + registry)
##  OpenAPI dentro del feature Client

``` bash
mkdir -p src/common/enums
cat > src/common/enums/sort-order.enum.ts <<'EOF_BACKEND_IA'
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
EOF_BACKEND_IA
```


``` bash
cat > src/features/business/clientes/clientes.swagger.ts << 'EOF'
/**
 * Documentación OpenAPI del feature Clientes.
 *
 * La documentación se agrega desde
 * src/swagger/index.ts.
 *
 * Este archivo solamente describe
 * el contrato de la API.
 */

export const clientesSwagger = {
  tags: [
    {
      name: "Clientes",
      description:
        "CRUD de clientes de CelebraHub"
    }
  ],

  paths: {

    "/api/clientes": {

      get: {
        tags: ["Clientes"],
        summary: "Listar clientes activos",
        description:
          "Obtiene todos los clientes activos de CelebraHub.",
        responses: {
          "200": {
            description:
              "Lista de clientes activos"
          }
        }
      },

      post: {
        tags: ["Clientes"],
        summary: "Crear cliente",
        description:
          "Registra un nuevo cliente en CelebraHub.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ClienteCreate"
              }
            }
          }
        },
        responses: {
          "201": {
            description:
              "Cliente creado correctamente"
          },
          "400": {
            description:
              "Datos inválidos"
          }
        }
      }
    },

    "/api/clientes/{id}": {

      get: {
        tags: ["Clientes"],
        summary: "Obtener cliente por ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
              minimum: 1
            }
          }
        ],
        responses: {
          "200": {
            description:
              "Cliente encontrado"
          },
          "400": {
            description:
              "ID inválido"
          },
          "404": {
            description:
              "Cliente no encontrado"
          }
        }
      },

      put: {
        tags: ["Clientes"],
        summary: "Actualizar cliente",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
              minimum: 1
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ClienteUpdate"
              }
            }
          }
        },
        responses: {
          "200": {
            description:
              "Cliente actualizado correctamente"
          },
          "400": {
            description:
              "Datos inválidos"
          },
          "404": {
            description:
              "Cliente no encontrado"
          }
        }
      },

      patch: {
        tags: ["Clientes"],
        summary:
          "Actualizar parcialmente un cliente",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
              minimum: 1
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ClientePatch"
              }
            }
          }
        },
        responses: {
          "200": {
            description:
              "Cliente actualizado correctamente"
          },
          "404": {
            description:
              "Cliente no encontrado"
          }
        }
      },

      delete: {
        tags: ["Clientes"],
        summary:
          "Eliminar cliente físicamente",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
              minimum: 1
            }
          }
        ],
        responses: {
          "200": {
            description:
              "Cliente eliminado correctamente"
          },
          "404": {
            description:
              "Cliente no encontrado"
          }
        }
      }
    },

    "/api/clientes/{id}/deactivate": {

      patch: {
        tags: ["Clientes"],
        summary:
          "Desactivar cliente",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
              minimum: 1
            }
          }
        ],
        responses: {
          "200": {
            description:
              "Cliente desactivado correctamente"
          },
          "404": {
            description:
              "Cliente no encontrado"
          }
        }
      }
    }
  },

  components: {

    schemas: {

      Cliente: {
        type: "object",
        properties: {
          id: {
            type: "integer",
            example: 1
          },
          tipo_documento: {
            type: "string",
            example: "CC"
          },
          numero_documento: {
            type: "string",
            example: "1234567890"
          },
          nombre: {
            type: "string",
            example: "Ana Perez"
          },
          telefono: {
            type: "string",
            example: "3001234567"
          },
          email: {
            type: "string",
            format: "email",
            example:
              "ana.perez@gmail.com"
          },
          is_active: {
            type: "boolean",
            example: true
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
          updatedAt: {
            type: "string",
            format: "date-time"
          }
        }
      },

      ClienteCreate: {
        type: "object",
        required: [
          "tipo_documento",
          "numero_documento",
          "nombre",
          "telefono",
          "email"
        ],
        properties: {
          tipo_documento: {
            type: "string",
            example: "CC"
          },
          numero_documento: {
            type: "string",
            example: "1234567890"
          },
          nombre: {
            type: "string",
            example: "Ana Perez"
          },
          telefono: {
            type: "string",
            example: "3001234567"
          },
          email: {
            type: "string",
            format: "email",
            example:
              "ana.perez@gmail.com"
          }
        }
      },

      ClienteUpdate: {
        type: "object",
        required: [
          "tipo_documento",
          "numero_documento",
          "nombre",
          "telefono",
          "email"
        ],
        properties: {
          tipo_documento: {
            type: "string"
          },
          numero_documento: {
            type: "string"
          },
          nombre: {
            type: "string"
          },
          telefono: {
            type: "string"
          },
          email: {
            type: "string",
            format: "email"
          }
        }
      },

      ClientePatch: {
        type: "object",
        properties: {
          tipo_documento: {
            type: "string"
          },
          numero_documento: {
            type: "string"
          },
          nombre: {
            type: "string"
          },
          telefono: {
            type: "string"
          },
          email: {
            type: "string",
            format: "email"
          }
        }
      }
    }
  }
};
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 134203.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v------------------------------------------------------------------------

## 32. Registry externo + montaje en Config



``` bash
cat > src/swagger/index.ts << 'EOF'
import { Application } from "express";
import swaggerUi from "swagger-ui-express";

import {
  clientesSwagger
} from "../features/business/clientes/clientes.swagger";

export type FeatureSwaggerModule = {
  tags: unknown[];
  paths: Record<string, unknown>;
  components?: {
    schemas?: Record<string, unknown>;
  };
};

/**
 * Registry externo:
 * reúne la documentación OpenAPI
 * de cada feature.
 */
const featureSwaggerModules:
  FeatureSwaggerModule[] = [
    clientesSwagger

    // futuros módulos:
    // salonesSwagger,
    // reservasSwagger,
    // eventosSwagger,
    // serviciosSwagger,
  ];

export function buildOpenApiDocument() {

  const tags: unknown[] = [];

  const paths: Record<string, unknown> = {};

  const schemas: Record<string, unknown> = {};

  for (
    const mod of featureSwaggerModules
  ) {

    tags.push(...mod.tags);

    Object.assign(
      paths,
      mod.paths
    );

    if (
      mod.components?.schemas
    ) {

      Object.assign(
        schemas,
        mod.components.schemas
      );
    }
  }

  return {

    openapi: "3.0.3",

    info: {
      title: "CelebraHub API",
      version: "1.0.0",
      description:
        "API CelebraHub - Centro de eventos."
    },

    servers: [
      {
        url:
          `http://localhost:${process.env.PORT || 4000}`,
        description: "Local"
      }
    ],

    tags,

    paths,

    components: {
      schemas
    }
  };
}

/**
 * Monta Swagger UI y el JSON OpenAPI.
 */
export function setupSwagger(
  app: Application
): void {

  const document =
    buildOpenApiDocument();

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(document)
  );

  app.get(
    "/api/docs.json",
    (_req, res) => {
      res.json(document);
    }
  );

  console.log(
    "📘 Swagger UI: /api/docs | OpenAPI JSON: /api/docs.json"
  );
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 134420.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v------------------------------------------------------------------------

## 33. comprobamos




<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 135919.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v------------------------------------------------------------------------

## 34. Fase I: Business — ISS-06 — Feature ProductType (tipos de producto)



``` bash

cat > src/features/business/servicios/dto/create-servicio.dto.ts <<'EOF'
export interface CreateServicioDto {
  nombre: string;
  descripcion?: string | null;
}
EOF

cat > src/features/business/servicios/dto/update-servicio.dto.ts <<'EOF'
export interface UpdateServicioDto {
  nombre: string;
  descripcion?: string | null;
}
EOF

cat > src/features/business/servicios/dto/patch-servicio.dto.ts <<'EOF'
import { UpdateServicioDto } from "./update-servicio.dto";

export type PatchServicioDto = Partial<UpdateServicioDto>;
EOF

cat > src/features/business/servicios/dto/servicio-response.dto.ts <<'EOF'
import { Servicio, ServicioI } from "../servicio.model";

export type ServicioResponseDto = ServicioI;

export function toServicioResponse(
  servicio: Servicio
): ServicioResponseDto {
  return servicio.toJSON() as ServicioResponseDto;
}
EOF

cat > src/features/business/servicios/dto/index.ts <<'EOF'
export * from "./create-servicio.dto";
export * from "./update-servicio.dto";
export * from "./patch-servicio.dto";
export * from "./servicio-response.dto";
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 143132.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 35. Repository



``` bash
cat > src/features/business/servicios/servicios.repository.ts <<'EOF'
import { CreationAttributes } from "sequelize";
import { Servicio, ServicioI } from "./servicio.model";

export class ServiciosRepository {

  public async findAllActive(): Promise<Servicio[]> {
    return Servicio.findAll({
      where: {
        is_active: true
      }
    });
  }

  public async findById(
    id: number
  ): Promise<Servicio | null> {
    return Servicio.findByPk(id);
  }

  public async create(
    data: CreationAttributes<Servicio>
  ): Promise<Servicio> {
    return Servicio.create(data);
  }

  public async update(
    servicio: Servicio,
    data: Partial<ServicioI>
  ): Promise<Servicio> {
    return servicio.update(data);
  }

  public async delete(
    servicio: Servicio
  ): Promise<void> {
    await servicio.destroy();
  }
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 143320.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v------------------------------------------------------------------------

## 36. Service



``` bash
cat > src/features/business/servicios/servicios.service.ts <<'EOF'
import {
  CreateServicioDto,
  PatchServicioDto,
  ServicioResponseDto,
  UpdateServicioDto,
  toServicioResponse
} from "./dto";

import { ServiciosRepository } from "./servicios.repository";
import { Servicio } from "./servicio.model";

import { AppError } from "../../../shared/errors/app-error";

export class ServiciosService {

  public constructor(
    private readonly repository: ServiciosRepository =
      new ServiciosRepository()
  ) {}

  // ================== READ ==================

  public async getAll(): Promise<ServicioResponseDto[]> {

    const servicios =
      await this.repository.findAllActive();

    return servicios.map(
      (servicio) =>
        toServicioResponse(servicio)
    );
  }

  public async getOne(
    id: number
  ): Promise<ServicioResponseDto> {

    return toServicioResponse(
      await this.findOrFail(id)
    );
  }

  // ================== CREATE ==================

  public async create(
    body: CreateServicioDto
  ): Promise<ServicioResponseDto> {

    const servicio =
      await this.repository.create({
        nombre: body.nombre,
        descripcion:
          body.descripcion ?? null,
        is_active: true
      });

    return toServicioResponse(servicio);
  }

  // ================== UPDATE ==================

  public async updatePut(
    id: number,
    body: UpdateServicioDto
  ): Promise<ServicioResponseDto> {

    const servicio =
      await this.findOrFail(id);

    await this.repository.update(
      servicio,
      {
        nombre: body.nombre,
        descripcion:
          body.descripcion ?? null
      }
    );

    return toServicioResponse(servicio);
  }

  public async updatePatch(
    id: number,
    body: PatchServicioDto
  ): Promise<ServicioResponseDto> {

    const servicio =
      await this.findOrFail(id);

    await this.repository.update(
      servicio,
      body
    );

    return toServicioResponse(servicio);
  }

  // ================== DELETE ==================

  public async deletePhysical(
    id: number
  ): Promise<void> {

    const servicio =
      await this.findOrFail(id, false);

    await this.repository.delete(servicio);
  }

  public async deleteLogical(
    id: number
  ): Promise<ServicioResponseDto> {

    const servicio =
      await this.findOrFail(id);

    await this.repository.update(
      servicio,
      {
        is_active: false
      }
    );

    return toServicioResponse(servicio);
  }

  // ================== HELPERS ==================

  private async findOrFail(
    id: number,
    onlyActive = true
  ): Promise<Servicio> {

    const servicio =
      await this.repository.findById(id);

    if (
      !servicio ||
      (onlyActive && !servicio.is_active)
    ) {
      throw new AppError(
        404,
        "Servicio no encontrado"
      );
    }

    return servicio;
  }
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 143430.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v------------------------------------------------------------------------

## 37. Controller



``` bash
cat > src/features/business/servicios/servicios.controller.ts <<'EOF'
import { Request, Response } from "express";

import { BaseController } from "../../../shared/http/base-controller";

import {
  CreateServicioDto,
  PatchServicioDto,
  UpdateServicioDto
} from "./dto";

import { ServiciosService } from "./servicios.service";

export class ServiciosController
  extends BaseController {

  public constructor(
    private readonly service: ServiciosService =
      new ServiciosService()
  ) {
    super();
  }

  // ================== READ ==================

  public async getAll(
    _req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const servicios =
          await this.service.getAll();

        res.status(200).json({
          servicios
        });
      }
    );
  }

  public async getOne(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const servicio =
          await this.service.getOne(
            this.paramId(req)
          );

        res.status(200).json({
          servicio
        });
      }
    );
  }

  // ================== CREATE ==================

  public async create(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const servicio =
          await this.service.create(
            req.body as CreateServicioDto
          );

        res.status(201).json({
          servicio
        });
      }
    );
  }

  // ================== UPDATE ==================

  public async updatePut(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const servicio =
          await this.service.updatePut(
            this.paramId(req),
            req.body as UpdateServicioDto
          );

        res.status(200).json({
          servicio
        });
      }
    );
  }

  public async updatePatch(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const servicio =
          await this.service.updatePatch(
            this.paramId(req),
            req.body as PatchServicioDto
          );

        res.status(200).json({
          servicio
        });
      }
    );
  }

  // ================== DELETE ==================

  public async deletePhysical(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const id =
          this.paramId(req);

        await this.service.deletePhysical(id);

        res.status(200).json({
          message:
            "Servicio eliminado permanentemente",
          id
        });
      }
    );
  }

  public async deleteLogical(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const servicio =
          await this.service.deleteLogical(
            this.paramId(req)
          );

        res.status(200).json({
          message:
            "Servicio desactivado correctamente",
          servicio
        });
      }
    );
  }
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 143620.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v------------------------------------------------------------------------

## 38. Routers



``` bash
cat > src/features/business/servicios/servicios.routes.ts <<'EOF'
import { Application } from "express";

import { ServiciosController } from "./servicios.controller";

export class ServiciosRoutes {

  public serviciosController:
    ServiciosController =
      new ServiciosController();

  public routes(
    app: Application
  ): void {

    // ================== GET ALL ==================

    app
      .route("/api/servicios")
      .get(
        this.serviciosController.getAll.bind(
          this.serviciosController
        )
      );

    // ================== GET ONE ==================

    app
      .route("/api/servicios/:id")
      .get(
        this.serviciosController.getOne.bind(
          this.serviciosController
        )
      );

    // ================== CREATE ==================

    app
      .route("/api/servicios")
      .post(
        this.serviciosController.create.bind(
          this.serviciosController
        )
      );

    // ================== UPDATE ==================

    app
      .route("/api/servicios/:id")
      .put(
        this.serviciosController.updatePut.bind(
          this.serviciosController
        )
      )
      .patch(
        this.serviciosController.updatePatch.bind(
          this.serviciosController
        )
      );

    // ================== DELETE FÍSICO ==================

    app
      .route("/api/servicios/:id")
      .delete(
        this.serviciosController.deletePhysical.bind(
          this.serviciosController
        )
      );

    // ================== DELETE LÓGICO ==================

    app
      .route("/api/servicios/:id/deactivate")
      .patch(
        this.serviciosController.deleteLogical.bind(
          this.serviciosController
        )
      );
  }
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 144137.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v------------------------------------------------------------------------

## 39. 11.3 HTTP (REST Client)


``` bash
cat > src/features/business/servicios/http/servicios.get.http <<'EOF'
### CelebraHub - Servicios - GET

@baseUrl = http://localhost:4000
@id = 1

### Obtener todos los servicios activos
GET {{baseUrl}}/api/servicios

###

### Obtener un servicio por ID
GET {{baseUrl}}/api/servicios/{{id}}
EOF


cat > src/features/business/servicios/http/servicios.create.http <<'EOF'
### CelebraHub - Servicios - CREATE

@baseUrl = http://localhost:4000

### Crear un servicio
POST {{baseUrl}}/api/servicios
Content-Type: application/json

{
  "nombre": "Decoración para eventos",
  "descripcion": "Decoración temática para celebraciones"
}
EOF


cat > src/features/business/servicios/http/servicios.update.http <<'EOF'
### CelebraHub - Servicios - UPDATE

@baseUrl = http://localhost:4000
@id = 1

### Actualización completa con PUT
PUT {{baseUrl}}/api/servicios/{{id}}
Content-Type: application/json

{
  "nombre": "Decoración integral para eventos",
  "descripcion": "Servicio completo de decoración para celebraciones"
}

###

### Actualización parcial con PATCH
PATCH {{baseUrl}}/api/servicios/{{id}}
Content-Type: application/json

{
  "descripcion": "Decoración personalizada para eventos"
}
EOF


cat > src/features/business/servicios/http/servicios.delete.http <<'EOF'
### CelebraHub - Servicios - DELETE

@baseUrl = http://localhost:4000
@id = 1

### Eliminación física
DELETE {{baseUrl}}/api/servicios/{{id}}

###

### Eliminación lógica
PATCH {{baseUrl}}/api/servicios/{{id}}/deactivate
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 145338.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v------------------------------------------------------------------------

## 40. Seeder ProductType

``` bash
cat > src/features/business/servicios/servicios.seeder.ts <<'EOF'
import { faker } from "@faker-js/faker";
import { Servicio } from "./servicio.model";

/**
 * Seeder del feature Servicio de CelebraHub.
 * Genera servicios de prueba para el centro de eventos.
 *
 * Es idempotente: si ya existen servicios,
 * no vuelve a insertar registros.
 */
export async function seedServicios(
  count: number
): Promise<number> {

  if (count <= 0) {
    console.log("⏭️ servicios: count=0, se omite");
    return 0;
  }

  const existing =
    await Servicio.count();

  if (existing > 0) {
    console.log(
      `⏭️ servicios: ya hay ${existing} registro(s), se omite seeder`
    );

    return 0;
  }

  const tiposServicio = [
    "Decoración",
    "Catering",
    "Mobiliario",
    "Sonido",
    "Iluminación",
    "Fotografía",
    "Animación",
    "Organización de eventos"
  ];

  const rows = Array.from(
    { length: count },
    (_, index) => ({
      nombre:
        tiposServicio[index % tiposServicio.length],

      descripcion:
        faker.commerce.productDescription(),

      is_active: true
    })
  );

  await Servicio.bulkCreate(rows);

  console.log(
    `✅ servicios: insertados ${count} registro(s) de prueba`
  );

  return count;
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 151022.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v------------------------------------------------------------------------

## 41. 



``` bash
cat > src/database/seeders/counts.ts <<'EOF'
/**
 * Cantidad de registros por feature/entidad.
 *
 * Prioridad:
 * CLI (--clientes=N, --servicios=N)
 * > env (SEED_CLIENTES, SEED_SERVICIOS)
 * > default
 */
export type SeedCounts = {
  clientes: number;
  servicios: number;
};

export const DEFAULT_SEED_COUNTS: SeedCounts = {
  clientes: 10,
  servicios: 10,
};

export function resolveSeedCounts(
  argv: string[] = process.argv.slice(2)
): SeedCounts {

  const counts: SeedCounts = {
    ...DEFAULT_SEED_COUNTS
  };

  const envClientes =
    process.env.SEED_CLIENTES;

  const envServicios =
    process.env.SEED_SERVICIOS;

  if (
    envClientes !== undefined &&
    envClientes !== ""
  ) {
    counts.clientes =
      Number(envClientes);
  }

  if (
    envServicios !== undefined &&
    envServicios !== ""
  ) {
    counts.servicios =
      Number(envServicios);
  }

  for (const arg of argv) {

    const m = arg.match(
      /^--([a-zA-Z_]+)=(\d+)$/
    );

    if (!m) continue;

    const key =
      m[1] as keyof SeedCounts;

    const value =
      Number(m[2]);

    if (key in counts) {
      counts[key] = value;
    }
  }

  return counts;
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 151415.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v------------------------------------------------------------------------

## 42. Swagger ProductType



``` bash
cat > src/features/business/servicios/servicios.swagger.ts <<'EOF'
export const serviciosSwagger = {

  tags: [
    {
      name: "Servicios",
      description:
        "CRUD de servicios disponibles para eventos en CelebraHub"
    }
  ],

  paths: {

    "/api/servicios": {

      get: {
        tags: ["Servicios"],
        summary: "Listar servicios activos",
        responses: {
          "200": {
            description:
              "Lista de servicios activos",

            content: {
              "application/json": {
                schema: {
                  type: "object",

                  properties: {
                    servicios: {
                      type: "array",

                      items: {
                        $ref:
                          "#/components/schemas/Servicio"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },

      post: {
        tags: ["Servicios"],
        summary: "Crear un servicio",

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ServicioCreate"
              }
            }
          }
        },

        responses: {
          "201": {
            description:
              "Servicio creado correctamente",

            content: {
              "application/json": {
                schema: {
                  type: "object",

                  properties: {
                    servicio: {
                      $ref:
                        "#/components/schemas/Servicio"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/api/servicios/{id}": {

      get: {
        tags: ["Servicios"],
        summary: "Obtener un servicio por ID",

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "integer",
              minimum: 1
            }
          }
        ],

        responses: {
          "200": {
            description:
              "Servicio encontrado",

            content: {
              "application/json": {
                schema: {
                  type: "object",

                  properties: {
                    servicio: {
                      $ref:
                        "#/components/schemas/Servicio"
                    }
                  }
                }
              }
            }
          },

          "404": {
            description:
              "Servicio no encontrado"
          }
        }
      },

      put: {
        tags: ["Servicios"],
        summary:
          "Actualizar completamente un servicio",

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "integer",
              minimum: 1
            }
          }
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ServicioUpdate"
              }
            }
          }
        },

        responses: {
          "200": {
            description:
              "Servicio actualizado"
          },

          "404": {
            description:
              "Servicio no encontrado"
          }
        }
      },

      patch: {
        tags: ["Servicios"],
        summary:
          "Actualizar parcialmente un servicio",

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "integer",
              minimum: 1
            }
          }
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ServicioPatch"
              }
            }
          }
        },

        responses: {
          "200": {
            description:
              "Servicio actualizado"
          },

          "404": {
            description:
              "Servicio no encontrado"
          }
        }
      },

      delete: {
        tags: ["Servicios"],
        summary:
          "Eliminar físicamente un servicio",

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "integer",
              minimum: 1
            }
          }
        ],

        responses: {
          "200": {
            description:
              "Servicio eliminado"
          },

          "404": {
            description:
              "Servicio no encontrado"
          }
        }
      }
    },

    "/api/servicios/{id}/deactivate": {

      patch: {
        tags: ["Servicios"],
        summary:
          "Desactivar un servicio",

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "integer",
              minimum: 1
            }
          }
        ],

        responses: {
          "200": {
            description:
              "Servicio desactivado correctamente"
          },

          "404": {
            description:
              "Servicio no encontrado"
          }
        }
      }
    }
  },

  components: {

    schemas: {

      Servicio: {

        type: "object",

        properties: {

          id: {
            type: "integer",
            example: 1
          },

          nombre: {
            type: "string",
            example:
              "Decoración para eventos"
          },

          descripcion: {
            type: "string",
            nullable: true,

            example:
              "Decoración temática para celebraciones"
          },

          is_active: {
            type: "boolean",
            example: true
          },

          createdAt: {
            type: "string",
            format: "date-time"
          },

          updatedAt: {
            type: "string",
            format: "date-time"
          }
        }
      },

      ServicioCreate: {

        type: "object",

        required: [
          "nombre"
        ],

        properties: {

          nombre: {
            type: "string",
            example:
              "Catering"
          },

          descripcion: {
            type: "string",

            example:
              "Servicio de alimentación para eventos"
          }
        }
      },

      ServicioUpdate: {

        type: "object",

        required: [
          "nombre"
        ],

        properties: {

          nombre: {
            type: "string"
          },

          descripcion: {
            type: "string",
            nullable: true
          }
        }
      },

      ServicioPatch: {

        type: "object",

        properties: {

          nombre: {
            type: "string"
          },

          descripcion: {
            type: "string",
            nullable: true
          }
        }
      }
    }
  }
};
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 151904.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v------------------------------------------------------------------------

## 43.Business — ISS-07 — Feature Product (productos)

##  Modelo Product

``` bash
cat > src/features/business/evento-servicios/evento-servicio.model.ts <<'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export interface EventoServicioI {
  id?: number;
  referencia_id: number;
  tipo: string;
  fecha: Date;
  cantidad: number;
  observaciones?: string | null;
  estado: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class EventoServicio
  extends Model<EventoServicioI>
  implements EventoServicioI {

  public id!: number;

  public referencia_id!: number;

  public tipo!: string;

  public fecha!: Date;

  public cantidad!: number;

  public observaciones!: string | null;

  public estado!: string;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

EventoServicio.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    referencia_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    tipo: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    fecha: {
      type: DataTypes.DATE,
      allowNull: false
    },

    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },

    observaciones: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    estado: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "pendiente"
    }
  },
  {
    sequelize,
    modelName: "EventoServicio",
    tableName: "evento_servicios",
    timestamps: true
  }
);
EOF

```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 195459.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v------------------------------------------------------------------------

## 44. DTO + Repository + Service + Controller + routes



``` bash
mkdir -p src/features/business/evento-servicios/dto

cat > src/features/business/evento-servicios/dto/create-evento-servicio.dto.ts <<'EOF'
export interface CreateEventoServicioDto {
  referencia_id: number;
  tipo: string;
  fecha: string;
  cantidad: number;
  observaciones?: string | null;
  estado?: string;
}
EOF

cat > src/features/business/evento-servicios/dto/update-evento-servicio.dto.ts <<'EOF'
export interface UpdateEventoServicioDto {
  referencia_id: number;
  tipo: string;
  fecha: string;
  cantidad: number;
  observaciones?: string | null;
  estado?: string;
}
EOF

cat > src/features/business/evento-servicios/dto/patch-evento-servicio.dto.ts <<'EOF'
import { UpdateEventoServicioDto } from "./update-evento-servicio.dto";

export type PatchEventoServicioDto =
  Partial<UpdateEventoServicioDto>;
EOF

cat > src/features/business/evento-servicios/dto/evento-servicio-response.dto.ts <<'EOF'
import {
  EventoServicio,
  EventoServicioI
} from "../evento-servicio.model";

export type EventoServicioResponseDto =
  EventoServicioI;

export function toEventoServicioResponse(
  eventoServicio: EventoServicio
): EventoServicioResponseDto {

  return eventoServicio.toJSON()
    as EventoServicioResponseDto;
}
EOF

cat > src/features/business/evento-servicios/dto/index.ts <<'EOF'
export * from "./create-evento-servicio.dto";
export * from "./update-evento-servicio.dto";
export * from "./patch-evento-servicio.dto";
export * from "./evento-servicio-response.dto";
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 195927.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
v------------------------------------------------------------------------

## 45. Repository



``` bash
cat > src/features/business/evento-servicios/evento-servicios.repository.ts <<'EOF'
import {
  CreationAttributes
} from "sequelize";

import {
  EventoServicio,
  EventoServicioI
} from "./evento-servicio.model";

export class EventoServiciosRepository {

  public async findAllActive():
    Promise<EventoServicio[]> {

    return EventoServicio.findAll({
      where: {
        estado: "pendiente"
      }
    });
  }

  public async findById(
    id: number
  ): Promise<EventoServicio | null> {

    return EventoServicio.findByPk(id);
  }

  public async create(
    data: CreationAttributes<EventoServicio>
  ): Promise<EventoServicio> {

    return EventoServicio.create(data);
  }

  public async update(
    eventoServicio: EventoServicio,
    data: Partial<EventoServicioI>
  ): Promise<EventoServicio> {

    return eventoServicio.update(data);
  }

  public async delete(
    eventoServicio: EventoServicio
  ): Promise<void> {

    await eventoServicio.destroy();
  }
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 200057.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
## 46. Service




``` bash
cat > src/features/business/evento-servicios/evento-servicios.service.ts <<'EOF'
import {
  CreateEventoServicioDto,
  PatchEventoServicioDto,
  EventoServicioResponseDto,
  UpdateEventoServicioDto,
  toEventoServicioResponse
} from "./dto";

import {
  EventoServiciosRepository
} from "./evento-servicios.repository";

import {
  EventoServicio
} from "./evento-servicio.model";

import {
  AppError
} from "../../../shared/errors/app-error";

export class EventoServiciosService {

  public constructor(
    private readonly repository:
      EventoServiciosRepository =
        new EventoServiciosRepository()
  ) {}

  // ================== READ ==================

  public async getAll():
    Promise<EventoServicioResponseDto[]> {

    const registros =
      await this.repository.findAllActive();

    return registros.map(
      (registro) =>
        toEventoServicioResponse(registro)
    );
  }

  public async getOne(
    id: number
  ): Promise<EventoServicioResponseDto> {

    return toEventoServicioResponse(
      await this.findOrFail(id)
    );
  }

  // ================== CREATE ==================

  public async create(
    body: CreateEventoServicioDto
  ): Promise<EventoServicioResponseDto> {

    const eventoServicio =
      await this.repository.create({
        referencia_id:
          body.referencia_id,

        tipo:
          body.tipo,

        fecha:
          new Date(body.fecha),

        cantidad:
          body.cantidad,

        observaciones:
          body.observaciones ?? null,

        estado:
          body.estado ?? "pendiente"
      });

    return toEventoServicioResponse(
      eventoServicio
    );
  }

  // ================== UPDATE ==================

  public async updatePut(
    id: number,
    body: UpdateEventoServicioDto
  ): Promise<EventoServicioResponseDto> {

    const eventoServicio =
      await this.findOrFail(id);

    await this.repository.update(
      eventoServicio,
      {
        referencia_id:
          body.referencia_id,

        tipo:
          body.tipo,

        fecha:
          new Date(body.fecha),

        cantidad:
          body.cantidad,

        observaciones:
          body.observaciones ?? null,

        estado:
          body.estado ??
          eventoServicio.estado
      }
    );

    return toEventoServicioResponse(
      eventoServicio
    );
  }

  public async updatePatch(
    id: number,
    body: PatchEventoServicioDto
  ): Promise<EventoServicioResponseDto> {

    const eventoServicio =
      await this.findOrFail(id);

    const data:
      Partial<EventoServicio> = {};

    if (
      body.referencia_id !== undefined
    ) {
      data.referencia_id =
        body.referencia_id;
    }

    if (
      body.tipo !== undefined
    ) {
      data.tipo =
        body.tipo;
    }

    if (
      body.fecha !== undefined
    ) {
      data.fecha =
        new Date(body.fecha);
    }

    if (
      body.cantidad !== undefined
    ) {
      data.cantidad =
        body.cantidad;
    }

    if (
      body.observaciones !== undefined
    ) {
      data.observaciones =
        body.observaciones;
    }

    if (
      body.estado !== undefined
    ) {
      data.estado =
        body.estado;
    }

    await this.repository.update(
      eventoServicio,
      data
    );

    return toEventoServicioResponse(
      eventoServicio
    );
  }

  // ================== DELETE ==================

  public async deletePhysical(
    id: number
  ): Promise<void> {

    const eventoServicio =
      await this.findOrFail(
        id,
        false
      );

    await this.repository.delete(
      eventoServicio
    );
  }

  public async deleteLogical(
    id: number
  ): Promise<EventoServicioResponseDto> {

    const eventoServicio =
      await this.findOrFail(id);

    await this.repository.update(
      eventoServicio,
      {
        estado: "inactivo"
      }
    );

    return toEventoServicioResponse(
      eventoServicio
    );
  }

  // ================== HELPER ==================

  private async findOrFail(
    id: number,
    onlyActive = true
  ): Promise<EventoServicio> {

    const eventoServicio =
      await this.repository.findById(id);

    if (!eventoServicio) {

      throw new AppError(
        404,
        "EventoServicio no encontrado"
      );
    }

    if (
      onlyActive &&
      eventoServicio.estado === "inactivo"
    ) {

      throw new AppError(
        404,
        "EventoServicio no encontrado"
      );
    }

    return eventoServicio;
  }
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 200604.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 47. Controller



``` bash
cat > src/features/business/evento-servicios/evento-servicios.controller.ts <<'EOF'
import {
  Request,
  Response
} from "express";

import {
  BaseController
} from "../../../shared/http/base-controller";

import {
  CreateEventoServicioDto,
  PatchEventoServicioDto,
  UpdateEventoServicioDto
} from "./dto";

import {
  EventoServiciosService
} from "./evento-servicios.service";

export class EventoServiciosController
  extends BaseController {

  public constructor(
    private readonly service:
      EventoServiciosService =
        new EventoServiciosService()
  ) {
    super();
  }

  public async getAll(
    _req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const eventoServicios =
          await this.service.getAll();

        res.status(200).json({
          eventoServicios
        });
      }
    );
  }

  public async getOne(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const eventoServicio =
          await this.service.getOne(
            this.paramId(req)
          );

        res.status(200).json({
          eventoServicio
        });
      }
    );
  }

  public async create(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const eventoServicio =
          await this.service.create(
            req.body as CreateEventoServicioDto
          );

        res.status(201).json({
          eventoServicio
        });
      }
    );
  }

  public async updatePut(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const eventoServicio =
          await this.service.updatePut(
            this.paramId(req),
            req.body as UpdateEventoServicioDto
          );

        res.status(200).json({
          eventoServicio
        });
      }
    );
  }

  public async updatePatch(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const eventoServicio =
          await this.service.updatePatch(
            this.paramId(req),
            req.body as PatchEventoServicioDto
          );

        res.status(200).json({
          eventoServicio
        });
      }
    );
  }

  public async deletePhysical(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const id =
          this.paramId(req);

        await this.service.deletePhysical(id);

        res.status(200).json({
          message:
            "EventoServicio eliminado permanentemente",
          id
        });
      }
    );
  }

  public async deleteLogical(
    req: Request,
    res: Response
  ): Promise<void> {

    await this.run(
      res,
      async () => {

        const eventoServicio =
          await this.service.deleteLogical(
            this.paramId(req)
          );

        res.status(200).json({
          message:
            "EventoServicio desactivado correctamente",
          eventoServicio
        });
      }
    );
  }
}
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 200733.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 48. Routes



``` bash
cat > src/features/business/evento-servicios/evento-servicios.routes.ts <<'EOF'
import {
  Application
} from "express";

import {
  EventoServiciosController
} from "./evento-servicios.controller";

export class EventoServiciosRoutes {

  public eventoServiciosController:
    EventoServiciosController =
      new EventoServiciosController();

  public routes(
    app: Application
  ): void {

    app
      .route("/api/evento-servicios")
      .get(
        this.eventoServiciosController
          .getAll
          .bind(
            this.eventoServiciosController
          )
      )
      .post(
        this.eventoServiciosController
          .create
          .bind(
            this.eventoServiciosController
          )
      );

    app
      .route("/api/evento-servicios/:id")
      .get(
        this.eventoServiciosController
          .getOne
          .bind(
            this.eventoServiciosController
          )
      )
      .put(
        this.eventoServiciosController
          .updatePut
          .bind(
            this.eventoServiciosController
          )
      )
      .patch(
        this.eventoServiciosController
          .updatePatch
          .bind(
            this.eventoServiciosController
          )
      )
      .delete(
        this.eventoServiciosController
          .deletePhysical
          .bind(
            this.eventoServiciosController
          )
      );

    app
      .route(
        "/api/evento-servicios/:id/deactivate"
      )
      .patch(
        this.eventoServiciosController
          .deleteLogical
          .bind(
            this.eventoServiciosController
          )
      );
  }
}
EOF
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-15 232327.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 49.  HTTP

## mkdir -p src/features/business/evento-servicios/http

``` bash
cat > src/features/business/evento-servicios/http/evento-servicios.http.ts <<'EOF'
### Obtener todos los eventos-servicios
GET http://localhost:3000/api/evento-servicios

### Obtener un evento-servicio por ID
GET http://localhost:3000/api/evento-servicios/1

### Crear un evento-servicio
POST http://localhost:3000/api/evento-servicios
Content-Type: application/json

{
  "referencia_id": 1,
  "tipo": "Servicio de alimentación",
  "fecha": "2026-10-10",
  "cantidad": 100,
  "observaciones": "Servicio para evento empresarial",
  "estado": "pendiente"
}

### Actualizar completamente un evento-servicio
PUT http://localhost:3000/api/evento-servicios/1
Content-Type: application/json

{
  "referencia_id": 1,
  "tipo": "Servicio de alimentación",
  "fecha": "2026-10-15",
  "cantidad": 120,
  "observaciones": "Servicio actualizado",
  "estado": "pendiente"
}

### Actualizar parcialmente un evento-servicio
PATCH http://localhost:3000/api/evento-servicios/1
Content-Type: application/json

{
  "cantidad": 150,
  "observaciones": "Cantidad modificada"
}

### Desactivar lógicamente un evento-servicio
PATCH http://localhost:3000/api/evento-servicios/1/deactivate

### Eliminar físicamente un evento-servicio
DELETE http://localhost:3000/api/evento-servicios/1
EOF
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-05 201600.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 50. common/utils/date.util.ts



``` bash
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

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-15 232842.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 51. common/utils/string.util.ts



``` bash
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

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-15 233124.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 52. Actualizar main.ts (bootstrap completo)



``` bash
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

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-15 233430.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 53. Actualizar app.module.ts (base sin features ni security)



``` bash
mkdir -p src
cat > src/app.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './config/environment/env.config';
import { appConfig } from './config/app/app.config';
import { LoggerModule } from './config/logger/logger.module';
import { SequelizeDatabaseModule } from './infrastructure/database/sequelize/sequelize.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig, appConfig],
      envFilePath: '.env',
    }),
    SequelizeDatabaseModule,
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

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-15 233635.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 54. Verificar bootstrap transversa



``` bash
npm run start:dev
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 124645.png">
</p>

**http://localhost:3002/api/docs**
<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 140858.png">
</p>
--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 55. fase 7 features/business/suppliers/domain/entities/provider.entity.ts



``` bash
mkdir -p src/features/business/suppliers/domain/entities
cat > src/features/business/suppliers/domain/entities/provider.entity.ts <<'EOF_BACKEND_IA'
import { isValidNit } from '../validators/provider-nit.validator';
import { isValidEmail } from '../validators/provider-email.validator';

export interface ProviderProps {
  id?: number;
  nit: string;
  razonSocial: string;
  contacto: string;
  telefono: string;
  email: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Provider {
  id?: number;
  nit: string;
  razonSocial: string;
  contacto: string;
  telefono: string;
  email: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  private constructor(props: ProviderProps) {
    this.id = props.id;
    this.nit = props.nit;
    this.razonSocial = props.razonSocial;
    this.contacto = props.contacto;
    this.telefono = props.telefono;
    this.email = props.email;
    this.isActive = props.isActive ?? true;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    props: Omit<ProviderProps, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>,
  ): Provider {
    if (!props.nit?.trim()) {
      throw new Error('El NIT del proveedor es requerido');
    }

    if (!isValidNit(props.nit)) {
      throw new Error('El NIT del proveedor no es válido');
    }

    if (!props.razonSocial?.trim()) {
      throw new Error('La razón social del proveedor es requerida');
    }

    if (!props.contacto?.trim()) {
      throw new Error('El contacto del proveedor es requerido');
    }

    if (!props.telefono?.trim()) {
      throw new Error('El teléfono del proveedor es requerido');
    }

    if (!props.email?.trim()) {
      throw new Error('El email del proveedor es requerido');
    }

    if (!isValidEmail(props.email)) {
      throw new Error('El email del proveedor no es válido');
    }

    return new Provider(props);
  }

  static reconstitute(props: ProviderProps): Provider {
    return new Provider(props);
  }

  update(
    props: Partial<
      Omit<ProviderProps, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>
    >,
  ): void {
    if (props.nit !== undefined) {
      if (!props.nit.trim()) {
        throw new Error('El NIT del proveedor es requerido');
      }
      if (!isValidNit(props.nit)) {
        throw new Error('El NIT del proveedor no es válido');
      }
      this.nit = props.nit;
    }

    if (props.razonSocial !== undefined) {
      if (!props.razonSocial.trim()) {
        throw new Error('La razón social del proveedor es requerida');
      }
      this.razonSocial = props.razonSocial;
    }

    if (props.contacto !== undefined) {
      if (!props.contacto.trim()) {
        throw new Error('El contacto del proveedor es requerido');
      }
      this.contacto = props.contacto;
    }

    if (props.telefono !== undefined) {
      if (!props.telefono.trim()) {
        throw new Error('El teléfono del proveedor es requerido');
      }
      this.telefono = props.telefono;
    }

    if (props.email !== undefined) {
      if (!props.email.trim()) {
        throw new Error('El email del proveedor es requerido');
      }
      if (!isValidEmail(props.email)) {
        throw new Error('El email del proveedor no es válido');
      }
      this.email = props.email;
    }
  }

  deactivate(): void {
    this.isActive = false;
  }

  activate(): void {
    this.isActive = true;
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 143651.png">
</p>
------------------------------------------------------------------------
--------------------------------------------------------------------------------
------------------------------------------------------------------------

## 56. features/business/suppliers/domain/exceptions/provider-nit-already-exists.exception.ts



``` bash
mkdir -p src/features/business/suppliers/domain/exceptions
cat > src/features/business/suppliers/domain/exceptions/provider-nit-already-exists.exception.ts <<'EOF_BACKEND_IA'
import { DomainException } from '../../../../../common/exceptions/domain.exception';

export class ProviderNitAlreadyExistsException extends DomainException {
  constructor(nit: string) {
    super(`El NIT '${nit}' ya está registrado`);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 143853.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 57. features/business/suppliers/domain/exceptions/provider-not-found.exception.ts



``` bash
mkdir -p src/features/business/suppliers/domain/exceptions
cat > src/features/business/suppliers/domain/exceptions/provider-not-found.exception.ts <<'EOF_BACKEND_IA'
import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception';

export class ProviderNotFoundException extends EntityNotFoundException {
  constructor(id: number) {
    super('Proveedor', id);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 144124.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 58. features/business/suppliers/domain/interfaces/provider-repository.interface.ts



``` bash
mkdir -p src/features/business/suppliers/domain/interfaces
cat > src/features/business/suppliers/domain/interfaces/provider-repository.interface.ts <<'EOF_BACKEND_IA'
import { PaginatedResult } from '../../../../../common/interfaces/pagination.interface';
import { Provider } from '../entities/provider.entity';

export const PROVIDER_REPOSITORY = 'PROVIDER_REPOSITORY';

export interface ProviderFindAllParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface IProviderRepository {
  create(provider: Provider): Promise<Provider>;
  update(provider: Provider): Promise<Provider>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<Provider | null>;
  findByNit(nit: string): Promise<Provider | null>;
  findAll(params: ProviderFindAllParams): Promise<PaginatedResult<Provider>>;
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 144257.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 59. features/business/suppliers/domain/validators/provider-nit.validator.ts

``` bash
mkdir -p src/features/business/suppliers/domain/validators
cat > src/features/business/suppliers/domain/validators/provider-nit.validator.ts <<'EOF_BACKEND_IA'
export function isValidNit(nit: string): boolean {
  // Dígitos, con guion y dígito de verificación opcional (ej. 900123456-7)
  const nitRegex = /^\d{5,15}(-\d)?$/;
  return nitRegex.test(nit.trim());
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 144435.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 60. features/business/suppliers/domain/validators/provider-email.validator.ts

``` bash
mkdir -p src/features/business/suppliers/domain/validators
cat > src/features/business/suppliers/domain/validators/provider-email.validator.ts <<'EOF_BACKEND_IA'
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 144631.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 61. features/business/suppliers/infrastructure/persistence/models/provider.model.ts

``` bash
mkdir -p src/features/business/suppliers/infrastructure/persistence/models
cat > src/features/business/suppliers/infrastructure/persistence/models/provider.model.ts <<'EOF_BACKEND_IA'
import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({ tableName: 'providers' })
export class ProviderModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING(20), allowNull: false, unique: true })
  declare nit: string;

  @Column({ type: DataType.STRING(200), allowNull: false })
  declare razonSocial: string;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare contacto: string;

  @Column({ type: DataType.STRING(20), allowNull: false })
  declare telefono: string;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare email: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isActive: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Asociación (eventoServicio) se agrega en la fase donde se
  // construya el feature de events/servicios, con import estático normal.
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 145332.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 62. features/business/suppliers/infrastructure/persistence/repositories/provider.repository.ts

``` bash
mkdir -p src/features/business/suppliers/infrastructure/persistence/repositories
cat > src/features/business/suppliers/infrastructure/persistence/repositories/provider.repository.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import {
  buildPaginatedResult,
  normalizePagination,
} from '../../../../../../common/utils/pagination.util';
import { Provider } from '../../../domain/entities/provider.entity';
import {
  ProviderFindAllParams,
  IProviderRepository,
} from '../../../domain/interfaces/provider-repository.interface';
import { ProviderMapper } from '../../../application/mappers/provider.mapper';
import { ProviderModel } from '../models/provider.model';

@Injectable()
export class ProviderRepository implements IProviderRepository {
  async create(provider: Provider): Promise<Provider> {
    const model = await ProviderModel.create(
      ProviderMapper.toPersistence(provider),
    );
    return ProviderMapper.toDomain(model);
  }

  async update(provider: Provider): Promise<Provider> {
    await ProviderModel.update(ProviderMapper.toPersistence(provider), {
      where: { id: provider.id },
    });
    const updated = await ProviderModel.findByPk(provider.id!);
    return ProviderMapper.toDomain(updated!);
  }

  async delete(id: number): Promise<void> {
    await ProviderModel.destroy({ where: { id } });
  }

  async findById(id: number): Promise<Provider | null> {
    const model = await ProviderModel.findByPk(id);
    return model ? ProviderMapper.toDomain(model) : null;
  }

  async findByNit(nit: string): Promise<Provider | null> {
    const model = await ProviderModel.findOne({ where: { nit } });
    return model ? ProviderMapper.toDomain(model) : null;
  }

  async findAll(params: ProviderFindAllParams) {
    const { page, limit, offset } = normalizePagination(
      params.page,
      params.limit,
    );

    const where = params.search
      ? {
          [Op.or]: [
            { razonSocial: { [Op.like]: `%${params.search}%` } },
            { nit: { [Op.like]: `%${params.search}%` } },
            { contacto: { [Op.like]: `%${params.search}%` } },
          ],
        }
      : {};

    const { rows, count } = await ProviderModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return buildPaginatedResult(
      rows.map((row) => ProviderMapper.toDomain(row)),
      count,
      page,
      limit,
    );
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 145611.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 63. features/business/suppliers/infrastructure/persistence/migrations/create-providers-table.migration.ts

``` bash
mkdir -p src/features/business/suppliers/infrastructure/persistence/migrations
cat > src/features/business/suppliers/infrastructure/persistence/migrations/create-providers-table.migration.ts <<'EOF_BACKEND_IA'
export const createProvidersTableMigration = {
  name: 'create-providers-table',
  async up(): Promise<void> {
    // Sequelize sync handles table creation in development.
    // Production: CREATE TABLE providers (id, nit, razonSocial, contacto, telefono, email, isActive, createdAt, updatedAt)
  },
  async down(): Promise<void> {
    // Production: DROP TABLE providers
  },
};
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 145941.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 64. features/business/suppliers/infrastructure/persistence/seeders/providers.seeder.ts

``` bash
mkdir -p src/features/business/suppliers/infrastructure/persistence/seeders
cat > src/features/business/suppliers/infrastructure/persistence/seeders/providers.seeder.ts <<'EOF_BACKEND_IA'
import { ProviderModel } from '../models/provider.model';

export async function seedProviders(): Promise<void> {
  const count = await ProviderModel.count();
  if (count > 0) {
    return;
  }

  await ProviderModel.bulkCreate([
    {
      nit: '900123456-7',
      razonSocial: 'Decoraciones y Eventos del Caribe S.A.S.',
      contacto: 'Laura Gómez',
      telefono: '3001234567',
      email: 'contacto@decoracionescaribe.com',
      isActive: true,
    },
    {
      nit: '901987654-3',
      razonSocial: 'Catering Riohacha Ltda.',
      contacto: 'Carlos Pérez',
      telefono: '3009876543',
      email: 'ventas@cateringriohacha.com',
      isActive: true,
    },
  ]);
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 150647.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 65. features/business/suppliers/application/dto/provider-filter.dto.ts

``` bash
mkdir -p src/features/business/suppliers/application/dto
cat > src/features/business/suppliers/application/dto/provider-filter.dto.ts <<'EOF_BACKEND_IA'
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class ProviderFilterDto {
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

  @ApiPropertyOptional({ example: 'caribe' })
  @IsOptional()
  @IsString()
  search?: string;
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 150922.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 66. features/business/suppliers/application/dto/provider-response.dto.ts

``` bash
mkdir -p src/features/business/suppliers/application/dto
cat > src/features/business/suppliers/application/dto/provider-response.dto.ts <<'EOF_BACKEND_IA'
import { ApiProperty } from '@nestjs/swagger';

export class ProviderResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '900123456-7' })
  nit: string;

  @ApiProperty({ example: 'Decoraciones y Eventos del Caribe S.A.S.' })
  razonSocial: string;

  @ApiProperty({ example: 'Laura Gómez' })
  contacto: string;

  @ApiProperty({ example: '3001234567' })
  telefono: string;

  @ApiProperty({ example: 'contacto@decoracionescaribe.com' })
  email: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 151140.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 67. features/business/suppliers/application/dto/create-provider.dto.ts
``` bash
mkdir -p src/features/business/suppliers/application/dto
cat > src/features/business/suppliers/application/dto/create-provider.dto.ts <<'EOF_BACKEND_IA'
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateProviderDto {
  @ApiProperty({ example: '900123456-7' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^\d{5,15}(-\d)?$/, {
    message: 'El NIT no tiene un formato válido',
  })
  nit: string;

  @ApiProperty({ example: 'Decoraciones y Eventos del Caribe S.A.S.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  razonSocial: string;

  @ApiProperty({ example: 'Laura Gómez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  contacto: string;

  @ApiProperty({ example: '3001234567' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^\+?\d{7,15}$/, {
    message: 'El teléfono no tiene un formato válido',
  })
  telefono: string;

  @ApiProperty({ example: 'contacto@decoracionescaribe.com' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email: string;
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 151327.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 68. features/business/suppliers/application/dto/update-provider.dto.ts

``` bash
mkdir -p src/features/business/suppliers/application/dto
cat > src/features/business/suppliers/application/dto/update-provider.dto.ts <<'EOF_BACKEND_IA'
import { PartialType } from '@nestjs/mapped-types';
import { CreateProviderDto } from './create-provider.dto';

export class UpdateProviderDto extends PartialType(CreateProviderDto) {}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 151531.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 69. features/business/suppliers/application/mappers/provider.mapper.ts

``` bash
mkdir -p src/features/business/suppliers/application/mappers
cat > src/features/business/suppliers/application/mappers/provider.mapper.ts <<'EOF_BACKEND_IA'
import { Provider } from '../../domain/entities/provider.entity';
import { ProviderResponseDto } from '../dto/provider-response.dto';
import { ProviderModel } from '../../infrastructure/persistence/models/provider.model';

export class ProviderMapper {
  static toDomain(model: ProviderModel): Provider {
    return Provider.reconstitute({
      id: model.id,
      nit: model.nit,
      razonSocial: model.razonSocial,
      contacto: model.contacto,
      telefono: model.telefono,
      email: model.email,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toResponse(entity: Provider): ProviderResponseDto {
    return {
      id: entity.id!,
      nit: entity.nit,
      razonSocial: entity.razonSocial,
      contacto: entity.contacto,
      telefono: entity.telefono,
      email: entity.email,
      isActive: entity.isActive,
      createdAt: entity.createdAt!,
      updatedAt: entity.updatedAt!,
    };
  }

  static toPersistence(entity: Provider): Partial<ProviderModel> {
    return {
      id: entity.id,
      nit: entity.nit,
      razonSocial: entity.razonSocial,
      contacto: entity.contacto,
      telefono: entity.telefono,
      email: entity.email,
      isActive: entity.isActive ?? true,
    };
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 151716.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 70. features/business/suppliers/application/use-cases/create-provider.use-case.ts

``` bash
mkdir -p src/features/business/suppliers/application/use-cases
cat > src/features/business/suppliers/application/use-cases/create-provider.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ProviderNitAlreadyExistsException } from '../../domain/exceptions/provider-nit-already-exists.exception';
import { Provider } from '../../domain/entities/provider.entity';
import {
  PROVIDER_REPOSITORY,
  type IProviderRepository,
} from '../../domain/interfaces/provider-repository.interface';
import { CreateProviderDto } from '../dto/create-provider.dto';
import { ProviderMapper } from '../mappers/provider.mapper';

@Injectable()
export class CreateProviderUseCase {
  constructor(
    @Inject(PROVIDER_REPOSITORY)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(dto: CreateProviderDto) {
    const existing = await this.providerRepository.findByNit(dto.nit);
    if (existing) {
      throw new ProviderNitAlreadyExistsException(dto.nit);
    }

    const provider = Provider.create({
      nit: dto.nit,
      razonSocial: dto.razonSocial,
      contacto: dto.contacto,
      telefono: dto.telefono,
      email: dto.email,
    });

    const created = await this.providerRepository.create(provider);
    return ProviderMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 151943.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 71. features/business/suppliers/application/use-cases/delete-provider.use-case.ts

``` bash
mkdir -p src/features/business/suppliers/application/use-cases
cat > src/features/business/suppliers/application/use-cases/delete-provider.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ProviderNotFoundException } from '../../domain/exceptions/provider-not-found.exception';
import {
  PROVIDER_REPOSITORY,
  type IProviderRepository,
} from '../../domain/interfaces/provider-repository.interface';

@Injectable()
export class DeleteProviderUseCase {
  constructor(
    @Inject(PROVIDER_REPOSITORY)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const provider = await this.providerRepository.findById(id);
    if (!provider) {
      throw new ProviderNotFoundException(id);
    }

    await this.providerRepository.delete(id);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 152303.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 72. features/business/suppliers/application/use-cases/get-provider.use-case.ts

``` bash
mkdir -p src/features/business/suppliers/application/use-cases
cat > src/features/business/suppliers/application/use-cases/get-provider.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ProviderNotFoundException } from '../../domain/exceptions/provider-not-found.exception';
import {
  PROVIDER_REPOSITORY,
  type IProviderRepository,
} from '../../domain/interfaces/provider-repository.interface';
import { ProviderMapper } from '../mappers/provider.mapper';

@Injectable()
export class GetProviderUseCase {
  constructor(
    @Inject(PROVIDER_REPOSITORY)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(id: number) {
    const provider = await this.providerRepository.findById(id);
    if (!provider) {
      throw new ProviderNotFoundException(id);
    }

    return ProviderMapper.toResponse(provider);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 152637.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 73. features/business/suppliers/application/use-cases/list-providers.use-case.ts

``` bash
mkdir -p src/features/business/suppliers/application/use-cases
cat > src/features/business/suppliers/application/use-cases/list-providers.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import {
  PROVIDER_REPOSITORY,
  type IProviderRepository,
} from '../../domain/interfaces/provider-repository.interface';
import { ProviderFilterDto } from '../dto/provider-filter.dto';
import { ProviderMapper } from '../mappers/provider.mapper';

@Injectable()
export class ListProvidersUseCase {
  constructor(
    @Inject(PROVIDER_REPOSITORY)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(filter: ProviderFilterDto) {
    const result = await this.providerRepository.findAll(filter);
    return {
      items: result.items.map((provider) => ProviderMapper.toResponse(provider)),
      meta: result.meta,
    };
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 153122.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 74. features/business/suppliers/application/use-cases/update-provider.use-case.ts

``` bash
mkdir -p src/features/business/suppliers/application/use-cases
cat > src/features/business/suppliers/application/use-cases/update-provider.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ProviderNitAlreadyExistsException } from '../../domain/exceptions/provider-nit-already-exists.exception';
import { ProviderNotFoundException } from '../../domain/exceptions/provider-not-found.exception';
import {
  PROVIDER_REPOSITORY,
  type IProviderRepository,
} from '../../domain/interfaces/provider-repository.interface';
import { UpdateProviderDto } from '../dto/update-provider.dto';
import { ProviderMapper } from '../mappers/provider.mapper';

@Injectable()
export class UpdateProviderUseCase {
  constructor(
    @Inject(PROVIDER_REPOSITORY)
    private readonly providerRepository: IProviderRepository,
  ) {}

  async execute(id: number, dto: UpdateProviderDto) {
    const provider = await this.providerRepository.findById(id);
    if (!provider) {
      throw new ProviderNotFoundException(id);
    }

    if (dto.nit && dto.nit !== provider.nit) {
      const existing = await this.providerRepository.findByNit(dto.nit);
      if (existing) {
        throw new ProviderNitAlreadyExistsException(dto.nit);
      }
    }

    provider.update(dto);
    const updated = await this.providerRepository.update(provider);
    return ProviderMapper.toResponse(updated);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 153430.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 75. features/business/suppliers/presentation/http/serializers/provider.serializer.ts

``` bash
mkdir -p src/features/business/suppliers/presentation/http/serializers
cat > src/features/business/suppliers/presentation/http/serializers/provider.serializer.ts <<'EOF_BACKEND_IA'
import { Provider } from '../../../domain/entities/provider.entity';
import { ProviderResponseDto } from '../../../application/dto/provider-response.dto';
import { ProviderMapper } from '../../../application/mappers/provider.mapper';

export class ProviderSerializer {
  static serialize(entity: Provider): ProviderResponseDto {
    return ProviderMapper.toResponse(entity);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 153859.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 76. features/business/suppliers/presentation/http/controllers/providers.controller.ts

``` bash
mkdir -p src/features/business/suppliers/presentation/http/controllers
cat > src/features/business/suppliers/presentation/http/controllers/providers.controller.ts <<'EOF_BACKEND_IA'
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
import { CreateProviderDto } from '../../../application/dto/create-provider.dto';
import { UpdateProviderDto } from '../../../application/dto/update-provider.dto';
import { ProviderFilterDto } from '../../../application/dto/provider-filter.dto';
import { ProviderResponseDto } from '../../../application/dto/provider-response.dto';
import { CreateProviderUseCase } from '../../../application/use-cases/create-provider.use-case';
import { UpdateProviderUseCase } from '../../../application/use-cases/update-provider.use-case';
import { DeleteProviderUseCase } from '../../../application/use-cases/delete-provider.use-case';
import { GetProviderUseCase } from '../../../application/use-cases/get-provider.use-case';
import { ListProvidersUseCase } from '../../../application/use-cases/list-providers.use-case';

@ApiTags('Providers')
@Controller('providers')
export class ProvidersController {
  constructor(
    private readonly createProviderUseCase: CreateProviderUseCase,
    private readonly updateProviderUseCase: UpdateProviderUseCase,
    private readonly deleteProviderUseCase: DeleteProviderUseCase,
    private readonly getProviderUseCase: GetProviderUseCase,
    private readonly listProvidersUseCase: ListProvidersUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un proveedor' })
  @ApiCreatedResponse({ type: ProviderResponseDto })
  create(@Body() dto: CreateProviderDto) {
    return this.createProviderUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar proveedores' })
  @ApiOkResponse({ type: [ProviderResponseDto] })
  findAll(@Query() filter: ProviderFilterDto) {
    return this.listProvidersUseCase.execute(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un proveedor por ID' })
  @ApiOkResponse({ type: ProviderResponseDto })
  findOne(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.getProviderUseCase.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un proveedor' })
  @ApiOkResponse({ type: ProviderResponseDto })
  update(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Body() dto: UpdateProviderDto,
  ) {
    return this.updateProviderUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un proveedor' })
  @ApiNoContentResponse()
  remove(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.deleteProviderUseCase.execute(id);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 154401.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 77. features/business/suppliers/index.ts

``` bash
mkdir -p src/features/business/suppliers
cat > src/features/business/suppliers/index.ts <<'EOF_BACKEND_IA'
export { SuppliersModule } from './suppliers.module';
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 154602.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 78. features/business/suppliers/suppliers.module.ts

``` bash
mkdir -p src/features/business/suppliers
cat > src/features/business/suppliers/suppliers.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { PROVIDER_REPOSITORY } from './domain/interfaces/provider-repository.interface';
import { ProviderRepository } from './infrastructure/persistence/repositories/provider.repository';
import { CreateProviderUseCase } from './application/use-cases/create-provider.use-case';
import { UpdateProviderUseCase } from './application/use-cases/update-provider.use-case';
import { DeleteProviderUseCase } from './application/use-cases/delete-provider.use-case';
import { GetProviderUseCase } from './application/use-cases/get-provider.use-case';
import { ListProvidersUseCase } from './application/use-cases/list-providers.use-case';
import { ProvidersController } from './presentation/http/controllers/providers.controller';

@Module({
  controllers: [ProvidersController],
  providers: [
    ProviderRepository,
    { provide: PROVIDER_REPOSITORY, useExisting: ProviderRepository },
    CreateProviderUseCase,
    UpdateProviderUseCase,
    DeleteProviderUseCase,
    GetProviderUseCase,
    ListProvidersUseCase,
  ],
  exports: [PROVIDER_REPOSITORY],
})
export class SuppliersModule {}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 155310.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 79. Actualizar sequelize.factory.ts (registrar ProviderModel)


``` bash
mkdir -p src/infrastructure/database/sequelize
cat > src/infrastructure/database/sequelize/sequelize.factory.ts <<'EOF_BACKEND_IA'
import { Sequelize } from 'sequelize-typescript';
import { DatabaseDialect } from '../../../config/environment/env.interface';
import { getSequelizeOptions } from './sequelize.options';

import { ProviderModel } from '../../../features/business/suppliers/infrastructure/persistence/models/provider.model';

export const ALL_MODELS = [
  ProviderModel,
];

async function loadDialectModule(moduleName: string): Promise<any> {
  // Proyecto ESM: require() no existe como global, se usa import() dinámico.
  const mod: any = await import(moduleName);
  return mod.default ?? mod;
}

export async function createSequelizeInstance(
  dialect: DatabaseDialect,
): Promise<Sequelize> {
  const options = getSequelizeOptions(dialect);

  let dialectModule: any;

  switch (dialect) {
    case DatabaseDialect.MySQL:
      dialectModule = await loadDialectModule('mysql2');
      break;
    case DatabaseDialect.Postgres:
      dialectModule = await loadDialectModule('pg');
      break;
    case DatabaseDialect.MSSQL:
      dialectModule = await loadDialectModule('tedious');
      break;
    case DatabaseDialect.Oracle:
      dialectModule = await loadDialectModule('oracledb');
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

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 160037.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 80. Crear business.module.ts

``` bash
mkdir -p src/features/business
cat > src/features/business/business.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { SuppliersModule } from './suppliers/suppliers.module';

@Module({
  imports: [SuppliersModule],
  exports: [SuppliersModule],
})
export class BusinessModule {}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 160249.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 81. Actualizar database-seeder.service.ts

``` bash
mkdir -p src/infrastructure/database/seeders
cat > src/infrastructure/database/seeders/database-seeder.service.ts <<'EOF_BACKEND_IA'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { seedProviders } from '../../../features/business/suppliers/infrastructure/persistence/seeders/providers.seeder';

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
      await seedProviders();
      this.logger.log('✅ Seeders ejecutados');
    } catch (error: any) {
      this.logger.error(`❌ Error en seeders: ${error.message}`, error.stack);
      throw error;
    }
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 161125.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
--------------------------------------------------------------------------------


------------------------------------------------------------------------

## 82. Actualizar app.module.ts

``` bash
mkdir -p src
cat > src/app.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './config/environment/env.config';
import { appConfig } from './config/app/app.config';
import { LoggerModule } from './config/logger/logger.module';
import { SequelizeDatabaseModule } from './infrastructure/database/sequelize/sequelize.module';
import { BusinessModule } from './features/business/business.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig, appConfig],
      envFilePath: '.env',
    }),
    SequelizeDatabaseModule,
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

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 161358.png">
</p>

--------------------------------------------------------------------------------


--------------------------------------------------------------------------------------------------------------------------------------------------------


------------------------------------------------------------------------

## 83. Verificar tabla física `companies` y API

``` bash
npm run start:dev
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 190141.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 84. Fase 8. 02_BUSINESS_CLIENTS`

## features/business/clients/domain/entities/client.entity.ts

``` bash
mkdir -p src/features/business/clients/domain/entities
cat > src/features/business/clients/domain/entities/client.entity.ts <<'EOF_BACKEND_IA'
import {
  isValidDocumentType,
  isValidDocumentNumber,
} from '../validators/client-document.validator.js';
import { isValidClientEmail } from '../validators/client-email.validator.js';

export interface ClientProps {
  id?: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  telefono: string;
  email: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Client {
  id?: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  telefono: string;
  email: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  private constructor(props: ClientProps) {
    this.id = props.id;
    this.tipoDocumento = props.tipoDocumento;
    this.numeroDocumento = props.numeroDocumento;
    this.nombre = props.nombre;
    this.telefono = props.telefono;
    this.email = props.email;
    this.isActive = props.isActive ?? true;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    props: Omit<ClientProps, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>,
  ): Client {
    if (!isValidDocumentType(props.tipoDocumento)) {
      throw new Error('El tipo de documento del cliente no es válido');
    }

    if (!isValidDocumentNumber(props.numeroDocumento)) {
      throw new Error('El número de documento del cliente no es válido');
    }

    if (!props.nombre?.trim()) {
      throw new Error('El nombre del cliente es requerido');
    }

    if (!props.telefono?.trim()) {
      throw new Error('El teléfono del cliente es requerido');
    }

    if (!props.email?.trim() || !isValidClientEmail(props.email)) {
      throw new Error('El email del cliente no es válido');
    }

    return new Client(props);
  }

  static reconstitute(props: ClientProps): Client {
    return new Client(props);
  }

  update(
    props: Partial<
      Omit<ClientProps, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>
    >,
  ): void {
    if (props.tipoDocumento !== undefined) {
      if (!isValidDocumentType(props.tipoDocumento)) {
        throw new Error('El tipo de documento del cliente no es válido');
      }
      this.tipoDocumento = props.tipoDocumento;
    }

    if (props.numeroDocumento !== undefined) {
      if (!isValidDocumentNumber(props.numeroDocumento)) {
        throw new Error('El número de documento del cliente no es válido');
      }
      this.numeroDocumento = props.numeroDocumento;
    }

    if (props.nombre !== undefined) {
      if (!props.nombre.trim()) {
        throw new Error('El nombre del cliente es requerido');
      }
      this.nombre = props.nombre;
    }

    if (props.telefono !== undefined) {
      if (!props.telefono.trim()) {
        throw new Error('El teléfono del cliente es requerido');
      }
      this.telefono = props.telefono;
    }

    if (props.email !== undefined) {
      if (!props.email.trim() || !isValidClientEmail(props.email)) {
        throw new Error('El email del cliente no es válido');
      }
      this.email = props.email;
    }
  }

  deactivate(): void {
    this.isActive = false;
  }

  activate(): void {
    this.isActive = true;
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 191701.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 85. features/business/clients/domain/exceptions/client-document-already-exists.exception.ts

``` bash
mkdir -p src/features/business/clients/domain/exceptions
cat > src/features/business/clients/domain/exceptions/client-document-already-exists.exception.ts <<'EOF_BACKEND_IA'
import { DomainException } from '../../../../../common/exceptions/domain.exception.js';

export class ClientDocumentAlreadyExistsException extends DomainException {
  constructor(numeroDocumento: string) {
    super(`El documento '${numeroDocumento}' ya está registrado`);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 104010.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 86. features/business/clients/domain/exceptions/client-not-found.exception.ts

``` bash
mkdir -p src/features/business/clients/domain/exceptions
cat > src/features/business/clients/domain/exceptions/client-not-found.exception.ts <<'EOF_BACKEND_IA'
import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception.js';

export class ClientNotFoundException extends EntityNotFoundException {
  constructor(id: number) {
    super('Cliente', id);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 104225.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 87. features/business/clients/domain/interfaces/client-repository.interface.ts

``` bash
mkdir -p src/features/business/clients/domain/interfaces
cat > src/features/business/clients/domain/interfaces/client-repository.interface.ts <<'EOF_BACKEND_IA'
import { PaginatedResult } from '../../../../../common/interfaces/pagination.interface.js';
import { Client } from '../entities/client.entity.js';

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
  findByDocumento(numeroDocumento: string): Promise<Client | null>;
  findAll(params: ClientFindAllParams): Promise<PaginatedResult<Client>>;
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 104622.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 88. features/business/clients/domain/validators/client-document.validator.ts

``` bash
mkdir -p src/features/business/clients/domain/validators
cat > src/features/business/clients/domain/validators/client-document.validator.ts <<'EOF_BACKEND_IA'
export const VALID_DOCUMENT_TYPES = ['CC', 'CE', 'TI', 'NIT', 'PASAPORTE'] as const;

export function isValidDocumentType(tipoDocumento: string): boolean {
  return (VALID_DOCUMENT_TYPES as readonly string[]).includes(tipoDocumento);
}

export function isValidDocumentNumber(numeroDocumento: string): boolean {
  const documentRegex = /^[A-Za-z0-9-]{5,20}$/;
  return documentRegex.test(numeroDocumento?.trim() ?? '');
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 104811.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 89. features/business/clients/domain/validators/client-email.validator.ts


``` bash
mkdir -p src/features/business/clients/domain/validators
cat > src/features/business/clients/domain/validators/client-email.validator.ts <<'EOF_BACKEND_IA'
export function isValidClientEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 105628.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 90. features/business/clients/infrastructure/persistence/models/client.model.ts


``` bash
mkdir -p src/features/business/clients/infrastructure/persistence/models
cat > src/features/business/clients/infrastructure/persistence/models/client.model.ts <<'EOF_BACKEND_IA'
import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({ tableName: 'clients' })
export class ClientModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING(15), allowNull: false })
  declare tipoDocumento: string;

  @Column({ type: DataType.STRING(20), allowNull: false, unique: true })
  declare numeroDocumento: string;

  @Column({ type: DataType.STRING(200), allowNull: false })
  declare nombre: string;

  @Column({ type: DataType.STRING(20), allowNull: false })
  declare telefono: string;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare email: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isActive: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // bookings se agrega en la fase de Reserva (sección 4.24).
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 105800.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 91. features/business/clients/infrastructure/persistence/repositories/client.repository.ts

``` bash
mkdir -p src/features/business/clients/infrastructure/persistence/repositories
cat > src/features/business/clients/infrastructure/persistence/repositories/client.repository.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import {
  buildPaginatedResult,
  normalizePagination,
} from '../../../../../../common/utils/pagination.util.js';
import { Client } from '../../../domain/entities/client.entity.js';
import {
  ClientFindAllParams,
  IClientRepository,
} from '../../../domain/interfaces/client-repository.interface.js';
import { ClientMapper } from '../../../application/mappers/client.mapper.js';
import { ClientModel } from '../models/client.model.js';

@Injectable()
export class ClientRepository implements IClientRepository {
  async create(client: Client): Promise<Client> {
    const model = await ClientModel.create(
      ClientMapper.toPersistence(client),
    );
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

  async findByDocumento(numeroDocumento: string): Promise<Client | null> {
    const model = await ClientModel.findOne({ where: { numeroDocumento } });
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
            { nombre: { [Op.like]: `%${params.search}%` } },
            { numeroDocumento: { [Op.like]: `%${params.search}%` } },
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

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 110035.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 92. features/business/clients/infrastructure/persistence/migrations/create-clients-table.

``` bash
mkdir -p src/features/business/clients/infrastructure/persistence/migrations
cat > src/features/business/clients/infrastructure/persistence/migrations/create-clients-table.migration.ts <<'EOF_BACKEND_IA'
export const createClientsTableMigration = {
  name: 'create-clients-table',
  async up(): Promise<void> {
    // Sequelize sync handles table creation in development.
    // Production: CREATE TABLE clients (id, tipoDocumento, numeroDocumento UQ, nombre,
    //   telefono, email, isActive, createdAt, updatedAt)
  },
  async down(): Promise<void> {
    // Production: DROP TABLE clients
  },
};
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 110244.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 93. features/business/clients/infrastructure/persistence/seeders/clients.seeder.ts

``` bash
mkdir -p src/features/business/clients/infrastructure/persistence/seeders
cat > src/features/business/clients/infrastructure/persistence/seeders/clients.seeder.ts <<'EOF_BACKEND_IA'
import { ClientModel } from '../models/client.model.js';

export async function seedClients(): Promise<void> {
  const count = await ClientModel.count();
  if (count > 0) {
    return;
  }

  await ClientModel.bulkCreate([
    {
      tipoDocumento: 'CC',
      numeroDocumento: '1121oi876543',
      nombre: 'María Fernanda Pérez',
      telefono: '3011234567',
      email: 'maria.perez@example.com',
      isActive: true,
    },
    {
      tipoDocumento: 'CC',
      numeroDocumento: '1121876544',
      nombre: 'Andrés Ipuana',
      telefono: '3007654321',
      email: 'andres.ipuana@example.com',
      isActive: true,
    },
  ]);
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 110403.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 94. features/business/clients/application/dto/client-filter.dto.ts

``` bash
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

  @ApiPropertyOptional({ example: 'maria' })
  @IsOptional()
  @IsString()
  search?: string;
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 110530.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 95. features/business/clients/application/dto/client-response.dto.ts

``` bash
mkdir -p src/features/business/clients/application/dto
cat > src/features/business/clients/application/dto/client-response.dto.ts <<'EOF_BACKEND_IA'
import { ApiProperty } from '@nestjs/swagger';

export class ClientResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'CC' })
  tipoDocumento: string;

  @ApiProperty({ example: '1121876543' })
  numeroDocumento: string;

  @ApiProperty({ example: 'María Fernanda Pérez' })
  nombre: string;

  @ApiProperty({ example: '3011234567' })
  telefono: string;

  @ApiProperty({ example: 'maria.perez@example.com' })
  email: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 111012.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 96. features/business/clients/application/dto/create-client.dto.ts

``` bash
mkdir -p src/features/business/clients/application/dto
cat > src/features/business/clients/application/dto/create-client.dto.ts <<'EOF_BACKEND_IA'
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { VALID_DOCUMENT_TYPES } from '../../domain/validators/client-document.validator.js';

export class CreateClientDto {
  @ApiProperty({ example: 'CC', enum: VALID_DOCUMENT_TYPES })
  @IsString()
  @IsIn(VALID_DOCUMENT_TYPES as unknown as string[])
  tipoDocumento: string;

  @ApiProperty({ example: '1121876543' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9-]{5,20}$/, {
    message: 'El número de documento no tiene un formato válido',
  })
  numeroDocumento: string;

  @ApiProperty({ example: 'María Fernanda Pérez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @ApiProperty({ example: '3011234567' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^\+?\d{7,15}$/, {
    message: 'El teléfono no tiene un formato válido',
  })
  telefono: string;

  @ApiProperty({ example: 'maria.perez@example.com' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email: string;
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 111145.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 97.features/business/clients/application/dto/update-client.dto.ts

``` bash
mkdir -p src/features/business/clients/application/dto
cat > src/features/business/clients/application/dto/update-client.dto.ts <<'EOF_BACKEND_IA'
import { PartialType } from '@nestjs/mapped-types';
import { CreateClientDto } from './create-client.dto.js';

export class UpdateClientDto extends PartialType(CreateClientDto) {}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 111300.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 98. features/business/clients/application/mappers/client.mapper.ts

``` bash
mkdir -p src/features/business/clients/application/mappers
cat > src/features/business/clients/application/mappers/client.mapper.ts <<'EOF_BACKEND_IA'
import { Client } from '../../domain/entities/client.entity.js';
import { ClientResponseDto } from '../dto/client-response.dto.js';
import { ClientModel } from '../../infrastructure/persistence/models/client.model.js';

export class ClientMapper {
  static toDomain(model: ClientModel): Client {
    return Client.reconstitute({
      id: model.id,
      tipoDocumento: model.tipoDocumento,
      numeroDocumento: model.numeroDocumento,
      nombre: model.nombre,
      telefono: model.telefono,
      email: model.email,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toResponse(entity: Client): ClientResponseDto {
    return {
      id: entity.id!,
      tipoDocumento: entity.tipoDocumento,
      numeroDocumento: entity.numeroDocumento,
      nombre: entity.nombre,
      telefono: entity.telefono,
      email: entity.email,
      isActive: entity.isActive,
      createdAt: entity.createdAt!,
      updatedAt: entity.updatedAt!,
    };
  }

  static toPersistence(entity: Client): Partial<ClientModel> {
    return {
      id: entity.id,
      tipoDocumento: entity.tipoDocumento,
      numeroDocumento: entity.numeroDocumento,
      nombre: entity.nombre,
      telefono: entity.telefono,
      email: entity.email,
      isActive: entity.isActive ?? true,
    };
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 111416.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 99.features/business/clients/application/use-cases/create-client.use-case.ts

``` bash
mkdir -p src/features/business/clients/application/use-cases
cat > src/features/business/clients/application/use-cases/create-client.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ClientDocumentAlreadyExistsException } from '../../domain/exceptions/client-document-already-exists.exception.js';
import { Client } from '../../domain/entities/client.entity.js';
import {
  CLIENT_REPOSITORY,
  type IClientRepository,
} from '../../domain/interfaces/client-repository.interface.js';
import { CreateClientDto } from '../dto/create-client.dto.js';
import { ClientMapper } from '../mappers/client.mapper.js';

@Injectable()
export class CreateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
  ) {}

  async execute(dto: CreateClientDto) {
    const existing = await this.clientRepository.findByDocumento(
      dto.numeroDocumento,
    );
    if (existing) {
      throw new ClientDocumentAlreadyExistsException(dto.numeroDocumento);
    }

    const client = Client.create({
      tipoDocumento: dto.tipoDocumento,
      numeroDocumento: dto.numeroDocumento,
      nombre: dto.nombre,
      telefono: dto.telefono,
      email: dto.email,
    });

    const created = await this.clientRepository.create(client);
    return ClientMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 111545.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 100. features/business/clients/application/use-cases/update-client.use-case.ts

``` bash
mkdir -p src/features/business/clients/application/use-cases
cat > src/features/business/clients/application/use-cases/update-client.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ClientDocumentAlreadyExistsException } from '../../domain/exceptions/client-document-already-exists.exception.js';
import { ClientNotFoundException } from '../../domain/exceptions/client-not-found.exception.js';
import {
  CLIENT_REPOSITORY,
  type IClientRepository,
} from '../../domain/interfaces/client-repository.interface.js';
import { UpdateClientDto } from '../dto/update-client.dto.js';
import { ClientMapper } from '../mappers/client.mapper.js';

@Injectable()
export class UpdateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
  ) {}

  async execute(id: number, dto: UpdateClientDto) {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new ClientNotFoundException(id);
    }

    if (dto.numeroDocumento && dto.numeroDocumento !== client.numeroDocumento) {
      const existing = await this.clientRepository.findByDocumento(
        dto.numeroDocumento,
      );
      if (existing) {
        throw new ClientDocumentAlreadyExistsException(dto.numeroDocumento);
      }
    }

    client.update(dto);
    const updated = await this.clientRepository.update(client);
    return ClientMapper.toResponse(updated);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 130346.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 101. features/business/clients/application/use-cases/delete-client.use-case.ts

``` bash
mkdir -p src/features/business/clients/application/use-cases
cat > src/features/business/clients/application/use-cases/delete-client.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ClientNotFoundException } from '../../domain/exceptions/client-not-found.exception.js';
import {
  CLIENT_REPOSITORY,
  type IClientRepository,
} from '../../domain/interfaces/client-repository.interface.js';

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

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 190141.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 102. features/business/clients/application/use-cases/get-client.use-case.ts

``` bash
mkdir -p src/features/business/clients/application/use-cases
cat > src/features/business/clients/application/use-cases/get-client.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { ClientNotFoundException } from '../../domain/exceptions/client-not-found.exception.js';
import {
  CLIENT_REPOSITORY,
  type IClientRepository,
} from '../../domain/interfaces/client-repository.interface.js';
import { ClientMapper } from '../mappers/client.mapper.js';

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

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 130925.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 103.  features/business/clients/application/use-cases/list-clients.use-case.ts

``` bash
mkdir -p src/features/business/clients/application/use-cases
cat > src/features/business/clients/application/use-cases/list-clients.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import {
  CLIENT_REPOSITORY,
  type IClientRepository,
} from '../../domain/interfaces/client-repository.interface.js';
import { ClientFilterDto } from '../dto/client-filter.dto.js';
import { ClientMapper } from '../mappers/client.mapper.js';

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

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-16 190141.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 104. features/business/clients/presentation/http/serializers/client.serializer.ts

``` bash
mkdir -p src/features/business/clients/presentation/http/serializers
cat > src/features/business/clients/presentation/http/serializers/client.serializer.ts <<'EOF_BACKEND_IA'
import { Client } from '../../../domain/entities/client.entity.js';
import { ClientResponseDto } from '../../../application/dto/client-response.dto.js';
import { ClientMapper } from '../../../application/mappers/client.mapper.js';

export class ClientSerializer {
  static serialize(entity: Client): ClientResponseDto {
    return ClientMapper.toResponse(entity);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 155057.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 105. features/business/clients/presentation/http/controllers/clients.controller.ts

``` bash
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
import { ParsePositiveIntPipe } from '../../../../../../common/pipes/parse-positive-int.pipe.js';
import { CreateClientDto } from '../../../application/dto/create-client.dto.js';
import { UpdateClientDto } from '../../../application/dto/update-client.dto.js';
import { ClientFilterDto } from '../../../application/dto/client-filter.dto.js';
import { ClientResponseDto } from '../../../application/dto/client-response.dto.js';
import { CreateClientUseCase } from '../../../application/use-cases/create-client.use-case.js';
import { UpdateClientUseCase } from '../../../application/use-cases/update-client.use-case.js';
import { DeleteClientUseCase } from '../../../application/use-cases/delete-client.use-case.js';
import { GetClientUseCase } from '../../../application/use-cases/get-client.use-case.js';
import { ListClientsUseCase } from '../../../application/use-cases/list-clients.use-case.js';

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

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 155309.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 106. features/business/clients/index.ts

``` bash
mkdir -p src/features/business/clients
cat > src/features/business/clients/index.ts <<'EOF_BACKEND_IA'
export { ClientsModule } from './clients.module.js';
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 155416.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 107. features/business/clients/clients.module.ts

``` bash
mkdir -p src/features/business/clients
cat > src/features/business/clients/clients.module.ts <<'EOF_BACKEND_IA'
import { Module } from '@nestjs/common';
import { CLIENT_REPOSITORY } from './domain/interfaces/client-repository.interface.js';
import { ClientRepository } from './infrastructure/persistence/repositories/client.repository.js';
import { CreateClientUseCase } from './application/use-cases/create-client.use-case.js';
import { UpdateClientUseCase } from './application/use-cases/update-client.use-case.js';
import { DeleteClientUseCase } from './application/use-cases/delete-client.use-case.js';
import { GetClientUseCase } from './application/use-cases/get-client.use-case.js';
import { ListClientsUseCase } from './application/use-cases/list-clients.use-case.js';
import { ClientsController } from './presentation/http/controllers/clients.controller.js';

@Module({
  controllers: [ClientsController],
  providers: [
    ClientRepository,
    { provide: CLIENT_REPOSITORY, useExisting: ClientRepository },
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

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 155844.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 108. features/business/venues/domain/entities/venue.entity.ts

``` bash
mkdir -p src/features/business/venues/domain/entities
cat > src/features/business/venues/domain/entities/venue.entity.ts <<'EOF_BACKEND_IA'
export interface VenueProps {
  id?: number;
  nombre: string;
  descripcion?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Venue {
  id?: number;
  nombre: string;
  descripcion?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  private constructor(props: VenueProps) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.descripcion = props.descripcion;
    this.isActive = props.isActive ?? true;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    props: Omit<VenueProps, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>,
  ): Venue {
    if (!props.nombre?.trim()) {
      throw new Error('El nombre del salón es requerido');
    }

    return new Venue(props);
  }

  static reconstitute(props: VenueProps): Venue {
    return new Venue(props);
  }

  update(
    props: Partial<
      Omit<VenueProps, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>
    >,
  ): void {
    if (props.nombre !== undefined) {
      if (!props.nombre.trim()) {
        throw new Error('El nombre del salón es requerido');
      }
      this.nombre = props.nombre;
    }

    if (props.descripcion !== undefined) {
      this.descripcion = props.descripcion;
    }
  }

  deactivate(): void {
    this.isActive = false;
  }

  activate(): void {
    this.isActive = true;
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 160024.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 109. features/business/venues/domain/exceptions/venue-not-found.exception.ts

``` bash
mkdir -p src/features/business/venues/domain/exceptions
cat > src/features/business/venues/domain/exceptions/venue-not-found.exception.ts <<'EOF_BACKEND_IA'
import { EntityNotFoundException } from '../../../../../common/exceptions/entity-not-found.exception.js';

export class VenueNotFoundException extends EntityNotFoundException {
  constructor(id: number) {
    super('Salon', id);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 160207.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 110. features/business/venues/domain/interfaces/venue-repository.interface.ts

``` bash
mkdir -p src/features/business/venues/domain/interfaces
cat > src/features/business/venues/domain/interfaces/venue-repository.interface.ts <<'EOF_BACKEND_IA'
import { PaginatedResult } from '../../../../../common/interfaces/pagination.interface.js';
import { Venue } from '../entities/venue.entity.js';

export const VENUE_REPOSITORY = 'VENUE_REPOSITORY';

export interface VenueFindAllParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface IVenueRepository {
  create(venue: Venue): Promise<Venue>;
  update(venue: Venue): Promise<Venue>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<Venue | null>;
  findAll(params: VenueFindAllParams): Promise<PaginatedResult<Venue>>;
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 160401.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 111. features/business/venues/infrastructure/persistence/models/venue.model.ts

``` bash
mkdir -p src/features/business/venues/infrastructure/persistence/models
cat > src/features/business/venues/infrastructure/persistence/models/venue.model.ts <<'EOF_BACKEND_IA'
import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({ tableName: 'venues' })
export class VenueModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare nombre: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare descripcion: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isActive: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // bookings se agrega en la fase de Reserva (sección 4.25).
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 161635.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 112.  features/business/venues/infrastructure/persistence/repositories/venue.repository.ts

``` bash
mkdir -p src/features/business/venues/infrastructure/persistence/repositories
cat > src/features/business/venues/infrastructure/persistence/repositories/venue.repository.ts <<'EOF_BACKEND_IA'
import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import {
  buildPaginatedResult,
  normalizePagination,
} from '../../../../../../common/utils/pagination.util.js';
import { Venue } from '../../../domain/entities/venue.entity.js';
import {
  VenueFindAllParams,
  IVenueRepository,
} from '../../../domain/interfaces/venue-repository.interface.js';
import { VenueMapper } from '../../../application/mappers/venue.mapper.js';
import { VenueModel } from '../models/venue.model.js';

@Injectable()
export class VenueRepository implements IVenueRepository {
  async create(venue: Venue): Promise<Venue> {
    const model = await VenueModel.create(VenueMapper.toPersistence(venue));
    return VenueMapper.toDomain(model);
  }

  async update(venue: Venue): Promise<Venue> {
    await VenueModel.update(VenueMapper.toPersistence(venue), {
      where: { id: venue.id },
    });
    const updated = await VenueModel.findByPk(venue.id!);
    return VenueMapper.toDomain(updated!);
  }

  async delete(id: number): Promise<void> {
    await VenueModel.destroy({ where: { id } });
  }

  async findById(id: number): Promise<Venue | null> {
    const model = await VenueModel.findByPk(id);
    return model ? VenueMapper.toDomain(model) : null;
  }

  async findAll(params: VenueFindAllParams) {
    const { page, limit, offset } = normalizePagination(
      params.page,
      params.limit,
    );

    const where = params.search
      ? { nombre: { [Op.like]: `%${params.search}%` } }
      : {};

    const { rows, count } = await VenueModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return buildPaginatedResult(
      rows.map((row) => VenueMapper.toDomain(row)),
      count,
      page,
      limit,
    );
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 161829.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 113. features/business/venues/infrastructure/persistence/migrations/create-venues-table.migration.ts

``` bash
mkdir -p src/features/business/venues/infrastructure/persistence/seeders
cat > src/features/business/venues/infrastructure/persistence/seeders/venues.seeder.ts <<'EOF_BACKEND_IA'
import { VenueModel } from '../models/venue.model.js';

export async function seedVenues(): Promise<void> {
  const count = await VenueModel.count();
  if (count > 0) {
    return;
  }

  await VenueModel.bulkCreate([
    {
      nombre: 'Salón Caribe Grand',
      descripcion: 'Salón principal, capacidad 300 personas, con terraza al mar.',
      isActive: true,
    },
    {
      nombre: 'Salón Wayuu',
      descripcion: 'Salón mediano, capacidad 120 personas, ideal para eventos íntimos.',
      isActive: true,
    },
  ]);
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 162029.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 114. features/business/venues/application/dto/venue-filter.dto.ts

``` bash
mkdir -p src/features/business/venues/application/dto
cat > src/features/business/venues/application/dto/venue-filter.dto.ts <<'EOF_BACKEND_IA'
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class VenueFilterDto {
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

  @ApiPropertyOptional({ example: 'caribe' })
  @IsOptional()
  @IsString()
  search?: string;
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 162159.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 115. features/business/venues/application/dto/venue-response.dto.ts

``` bash
mkdir -p src/features/business/venues/application/dto
cat > src/features/business/venues/application/dto/venue-response.dto.ts <<'EOF_BACKEND_IA'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VenueResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Salón Caribe Grand' })
  nombre: string;

  @ApiPropertyOptional({ example: 'Salón principal, capacidad 300 personas.' })
  descripcion?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 162338.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 116. features/business/venues/application/dto/create-venue.dto.ts

``` bash
mkdir -p src/features/business/venues/application/dto
cat > src/features/business/venues/application/dto/create-venue.dto.ts <<'EOF_BACKEND_IA'
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVenueDto {
  @ApiProperty({ example: 'Salón Caribe Grand' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @ApiPropertyOptional({ example: 'Salón principal, capacidad 300 personas.' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 162612.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 117. features/business/venues/application/dto/update-venue.dto.ts

``` bash
mkdir -p src/features/business/venues/application/dto
cat > src/features/business/venues/application/dto/update-venue.dto.ts <<'EOF_BACKEND_IA'
import { PartialType } from '@nestjs/mapped-types';
import { CreateVenueDto } from './create-venue.dto.js';

export class UpdateVenueDto extends PartialType(CreateVenueDto) {}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 162734.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 118.  features/business/venues/application/mappers/venue.mapper.ts

``` bash
mkdir -p src/features/business/venues/application/mappers
cat > src/features/business/venues/application/mappers/venue.mapper.ts <<'EOF_BACKEND_IA'
import { Venue } from '../../domain/entities/venue.entity.js';
import { VenueResponseDto } from '../dto/venue-response.dto.js';
import { VenueModel } from '../../infrastructure/persistence/models/venue.model.js';

export class VenueMapper {
  static toDomain(model: VenueModel): Venue {
    return Venue.reconstitute({
      id: model.id,
      nombre: model.nombre,
      descripcion: model.descripcion ?? undefined,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toResponse(entity: Venue): VenueResponseDto {
    return {
      id: entity.id!,
      nombre: entity.nombre,
      descripcion: entity.descripcion,
      isActive: entity.isActive,
      createdAt: entity.createdAt!,
      updatedAt: entity.updatedAt!,
    };
  }

  static toPersistence(entity: Venue): Partial<VenueModel> {
    return {
      id: entity.id,
      nombre: entity.nombre,
      descripcion: entity.descripcion ?? null,
      isActive: entity.isActive ?? true,
    };
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 162900.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------


------------------------------------------------------------------------
------------------------------------------------------------------------

## 120. features/business/venues/application/use-cases/update-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/update-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { VenueNotFoundException } from '../../domain/exceptions/venue-not-found.exception.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { UpdateVenueDto } from '../dto/update-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class UpdateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(id: number, dto: UpdateVenueDto) {
    const venue = await this.venueRepository.findById(id);
    if (!venue) {
      throw new VenueNotFoundException(id);
    }

    venue.update(dto);
    const updated = await this.venueRepository.update(venue);
    return VenueMapper.toResponse(updated);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------

------------------------------------------------------------------------
------------------------------------------------------------------------

## 119. features/business/venues/application/use-cases/create-venue.use-case.ts

``` bash
mkdir -p src/features/business/venues/application/use-cases
cat > src/features/business/venues/application/use-cases/create-venue.use-case.ts <<'EOF_BACKEND_IA'
import { Inject, Injectable } from '@nestjs/common';
import { Venue } from '../../domain/entities/venue.entity.js';
import {
  VENUE_REPOSITORY,
  type IVenueRepository,
} from '../../domain/interfaces/venue-repository.interface.js';
import { CreateVenueDto } from '../dto/create-venue.dto.js';
import { VenueMapper } from '../mappers/venue.mapper.js';

@Injectable()
export class CreateVenueUseCase {
  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venueRepository: IVenueRepository,
  ) {}

  async execute(dto: CreateVenueDto) {
    const venue = Venue.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });

    const created = await this.venueRepository.create(venue);
    return VenueMapper.toResponse(created);
  }
}
EOF_BACKEND_IA
```

<p align="center">
  <img src="imagenes/Captura de pantalla 2026-09-17 163248.png">
</p>

--------------------------------------------------------------------------------


------------------------------------------------------------------------
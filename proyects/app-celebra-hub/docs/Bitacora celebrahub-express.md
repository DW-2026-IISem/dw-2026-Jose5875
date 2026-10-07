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

## 50.
## 19. Fase II: Auth con RBAC — ISS-18 — Base de seguridad compartida y modelos Auth

**Objetivo:** documentar la incorporación de autenticación y RBAC a CelebraHub: hash de contraseñas, JWT, sesiones renovables y revocables, catálogo de rutas protegibles y sus asociaciones. La identidad autenticada es una cuenta interna del equipo; no se reutiliza la tabla `clientes`, que representa a los clientes de eventos.

**Punto de partida:** CelebraHub ya cuenta con `App` en `src/config/index.ts`, `Routes` en `src/routes/index.ts`, seeders en `src/database/seeders/index.ts` y Swagger en `src/swagger/index.ts`. Los ejemplos de esta guía amplían esos archivos y conservan las 11 features de negocio; no los reemplazan por la estructura de otro proyecto.

Criterios de aceptación (ISS-18) — consolidados

- [ ] **19.1** .env define JWT_SECRET, JWT_ACCESS_TTL y JWT_REFRESH_TTL_DAYS; jsonwebtoken y @types/jsonwebtoken instalados
- [ ] **19.2** src/shared/auth/password.ts con hashPassword, comparePassword, sha256Hex, generateOpaqueToken
- [ ] **19.3** src/shared/auth/jwt.ts firma y verifica con HS256, issuer, audience, expiresIn y jti
- [ ] **19.4** src/shared/auth/resource-match.ts casa /api/reservas/42 con el patrón /api/reservas/:id
- [ ] **19.5** src/shared/auth/auth-user.ts declara Request.auth y exporta requireAuthUser
- [ ] **19.6** sendError centraliza error → HTTP; BaseController lo reutiliza
- [ ] **19.7** bearerSecurityScheme, unauthorizedResponse y forbiddenResponse exportados
- [ ] **19.8** los 6 modelos (User, Role, Resource, RoleUser, ResourceRole, RefreshToken) con sus UK e  índices
- [ ] **19.9** rbac.associations.ts declara el grafo completo (User↔Role, Role↔Resource, User→RefreshToken)
- [ ] **19.10** config/index.ts y seeders/index.ts importan los modelos y las asociaciones, en ese orden
- [ ] npx tsc --noEmit OK

## 19.1 Dependencias y variables de entorno

```bash
npm install bcryptjs
npm install jsonwebtoken@^9.0.3
npm install -D @types/jsonwebtoken@^9.0.10
```

Añade estas variables al `.env` local existente. No reemplaces su configuración de motor/puerto y no publiques el secreto en el repositorio:

```bash
cat >> .env << 'EOF'
# Fase II — Seguridad (JWT + RBAC)
# Genera localmente con: openssl rand -base64 48
JWT_SECRET=REEMPLAZAR_POR_UN_SECRETO_ALEATORIO_DE_32_CARACTERES_O_MAS
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL_DAYS=7
EOF
```

`JWT_ACCESS_TTL` se expresa en segundos; `JWT_REFRESH_TTL_DAYS`, en días. Genera un valor distinto para cada entorno, guárdalo solo en el `.env` local y verifica que `.env` esté excluido de Git antes de compartir cambios. El valor de ejemplo no es una credencial válida.

> JWT_ACCESS_TTL se expresa en segundos y JWT_REFRESH_TTL_DAYS en días: son unidades distintas a propósito (el access token es de minutos; el refresh, de días). El service las convierte a milisegundos al persistir expires_at.

## 19.2 password.ts — hash de contraseña y hashes de tokens

Tres responsabilidades, todas de la capa shared (no son propias de un feature):

- hashPassword / verifyPassword: bcrypt con 12 rondas (coste alto, deliberado).

- sha256Hex: para los refresh tokens, que no se guardan en claro sino como hash.

- generateOpaqueToken: crypto.randomBytes(32).toString("base64url") → token opaco (no JWT).

```bash
: > src/shared/auth/password.ts
cat >> src/shared/auth/password.ts << 'EOF'
import { hash, compare } from "bcryptjs";

/**
 * Derivación y verificación de contraseñas (bcrypt).
 *
 * Se centraliza aquí porque lo usan tres sitios distintos y **debe** usar los
 * mismos parámetros en los tres:
 *  - el hook `beforeCreate/beforeUpdate` del modelo `User` (hash al persistir);
 *  - el service de usuarios al cambiar la contraseña;
 *  - el login, que compara la credencial en memoria (nunca la devuelve).
 *
 * Coste 12 rondas: compromiso entre el coste de CPU del servidor y el coste de
 * fuerza bruta para un atacante que obtuviera el hash.
 */
const SALT_ROUNDS = 12;

/** Devuelve el hash bcrypt de una contraseña en claro. */
export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, SALT_ROUNDS);
}

/** `true` si la contraseña en claro corresponde al hash almacenado. */
export async function comparePassword(plain: string, passwordHash: string): Promise<boolean> {
  return compare(plain, passwordHash);
}

/**
 * Hash determinista (SHA-256, hex) para credenciales de **alta entropía**.
 *
 * Se usa con los refresh tokens, no con contraseñas: un token aleatorio de 64
 * bytes no es adivinable, así que no necesita un algoritmo lento; basta con
 * impedir que el valor en claro quede en la base de datos. Esto permite, además,
 * buscar por índice único (`token_hash`) en O(1).
 */
import { createHash, randomBytes } from "node:crypto";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Genera un token opaco no adivinable (URL-safe, 64 bytes ≈ 86 caracteres). */
export function generateOpaqueToken(): string {
  return randomBytes(64).toString("base64url");
}
EOF
```

## 19.3 jwt.ts — firma y verificación del access token

¿Por qué JWT aquí y token opaco para el refresh? El access token viaja en cada petición y debe validarse sin tocar la BD (Stateless): JWT firmado. El refresh token, en cambio, debe poder revocarse; por eso es opaco y se persiste (hasheado) en refresh_tokens.

```bash
: > src/shared/auth/jwt.ts
cat >> src/shared/auth/jwt.ts << 'EOF'
import jwt, { JwtPayload } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { AppError } from "../errors/app-error";

/**
 * Emisión y verificación del **access token** (JWT firmado, HS256).
 *
 * Referencias (fuentes oficiales):
 *  - RFC 7519 — JSON Web Token (`sub`, `iss`, `aud`, `exp`, `iat`, `jti`).
 *  - RFC 8725 §3.1 — *Perform Algorithm Verification*: el algoritmo se fija en el
 *    código (lista permitida), nunca se toma del encabezado `alg` del token.
 *  - RFC 8725 §3.8/§3.9 — validar `iss` (emisor) y `aud` (audiencia).
 *  - RFC 6750 — el token viaja en `Authorization: Bearer <token>`.
 *
 * El access token es **autocontenido y no se persiste**: se valida con la firma.
 * La base de datos solo interviene para revalidar que el usuario sigue activo
 * (ver `authenticate`), y para los refresh tokens.
 */

const ALGORITHM = "HS256";

/** Emisor/audiencia del sistema. Sirven para rechazar tokens de otro servicio. */
export const TOKEN_ISSUER = "celebrahub-express";
export const TOKEN_AUDIENCE = "celebrahub-api";

/** Vida útil del access token. Corta por diseño (Owasp/OAuth2: token de vida corta). */
export const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.JWT_ACCESS_TTL ?? 900); // 15 min

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  usuario: string;
  jti: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new AppError(
      500,
      "JWT_SECRET no configurado (mínimo 32 caracteres). Ver .env"
    );
  }
  return secret;
}

/** Firma un access token para un usuario. */
export function signAccessToken(user: { id: number; usuario: string }): {
  token: string;
  expiresIn: number;
} {
  const token = jwt.sign(
    { usuario: user.usuario },
    getSecret(),
    {
      algorithm: ALGORITHM,
      subject: String(user.id),
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      jwtid: randomUUID(),
    }
  );
  return { token, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
}

/**
 * Verifica firma y *claims* y devuelve el payload.
 *
 * Se pasan las opciones explícitas (no se confía en el token): `algorithms`,
 * `issuer` y `audience`; y después se comprueban a mano `sub` y `jti`.
 *
 * Ojo: `jsonwebtoken` **no** tiene opción `require` (es de `jose`); pasarla no
 * valida nada. Por eso los claims obligatorios se verifican explícitamente.
 * Cualquier fallo se traduce a `AppError(401)` para que el middleware responda
 * **no autenticado**.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, getSecret(), {
      algorithms: [ALGORITHM],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      // Tolerancia de reloj: evita 401 espurios entre máquinas desincronizadas.
      clockTolerance: 5,
    }) as JwtPayload;
  } catch {
    throw new AppError(401, "Invalid or expired access token");
  }

  // Los claims obligatorios se comprueban AQUÍ, no en `jwt.verify`.
  //
  // `jsonwebtoken` **no** admite la opción `require` (esa opción es de `jose`):
  // pasarla no valida nada. `iss`, `aud` y `exp` sí los exige `jwt.verify` con
  // las opciones de arriba; `sub` y `jti` hay que verificarle explícitamente.
  //
  //  - sin `sub` no hay identidad -> no se puede autenticar;
  //  - `sub` debe ser un entero positivo: un valor no numérico llegaría al
  //    repositorio como `NaN` y provocaría un 500 en vez de un 401;
  //  - sin `jti` se pierde la trazabilidad del token (RFC 8725).
  if (
    typeof payload.sub !== "string" ||
    !/^[1-9]\d*$/.test(payload.sub) ||
    typeof payload.jti !== "string" ||
    payload.jti.length === 0
  ) {
    throw new AppError(401, "Invalid or expired access token");
  }

  return payload as AccessTokenPayload;
}

/** Extrae el token de `Authorization: Bearer <token>` (RFC 6750). */
export function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, value] = header.split(" ");
  if (!scheme || !value || scheme.toLowerCase() !== "bearer") return null;
  return value;
}
EOF
```

> Los roles NO viajan en el token. Si viajaran, revocar un permiso no tendría efecto hasta que caducara el token. La autorización se resuelve en cada petición contra la matriz (ISS-13), lo que hace la revocación inmediata (RFC 6749 / OWASP).

## 19.4 resource-match.ts — casar la petición con el recurso

Un recurso es un par (method, path) con el path en patrón: /api/reservas/:id. El middleware authorize recibe la petición real (GET /api/reservas/42) y debe encontrar el recurso. Este módulo hace esa traducción:

- normalizePath: quita barra final, query string y colapsa 
barras repetidas.

- buildPathMatcher: convierte /api/reservas/:id en una expresión regular anclada.

- pathsMatch: comprueba un patrón contra un path real.

```bash
: > src/shared/auth/resource-match.ts
cat >> src/shared/auth/resource-match.ts << 'EOF'
/**
 * Coincidencia entre la ruta de una petición y un **recurso** almacenado.
 *
 * Un recurso se guarda como patrón (`method` + `path` con parámetros):
 *
 * ```text
 * GET  /api/reservas/:id
 * ```
 *
 * Y la petición llega con el valor concreto:
 *
 * ```text
 * GET  /api/reservas/42
 * ```
 *
 * Reglas de la comparación (deliberadamente estrictas):
 *  - El verbo HTTP debe coincidir exactamente.
 *  - Un segmento `:param` del patrón casa con **un** segmento cualquiera.
 *  - El resto de segmentos deben ser iguales carácter a carácter.
 *  - El número de segmentos debe coincidir (no hay comodines tipo `*`).
 *
 * Así, `/api/reservas/42` **no** casa con `/api/reservas` (evita que un permiso
 * de listado autorice una lectura concreta por error) y `/api/reservas/42/lotes`
 * tampoco.
 */

/** Normaliza una ruta: sin cadena de consulta, sin barra final, sin duplicar `/`. */
export function normalizePath(path: string): string {
  const withoutQuery = path.split("?")[0].split("#")[0];
  const single = withoutQuery.replace(/\/{2,}/g, "/");
  const trimmed = single.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/** `true` si `path` (concreto) casa con `pattern` (con `:param`). */
export function pathMatches(pattern: string, path: string): boolean {
  const patternParts = normalizePath(pattern).split("/");
  const pathParts = normalizePath(path).split("/");

  if (patternParts.length !== pathParts.length) return false;

  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i];
    if (p.startsWith(":")) continue; // parámetro: casa con cualquier segmento
    if (p !== pathParts[i]) return false;
  }
  return true;
}

/**
 * `true` si el conjunto de recursos concedidos cubre la operación solicitada.
 *
 * Es la decisión final del RBAC: se compara el par `(method, path)` de la
 * petición contra las concesiones del usuario. **Deny by default**: si ninguna
 * coincide, se devuelve `false`.
 *
 * (Referencia: `base de datos.md` §16 — la base de datos es la única fuente
 * de verdad de la matriz de permisos; la coincidencia por patrón se hace aquí.)
 */
export function isOperationGranted(
  granted: ReadonlyArray<{ method: string; path: string }>,
  method: string,
  path: string
): boolean {
  const upper = method.toUpperCase();
  return granted.some(
    (resource) => resource.method.toUpperCase() === upper && pathMatches(resource.path, path)
  );
}
EOF
```

## 19.5 auth-user.ts — la identidad en Request

Extiende el tipo Request de Express con auth y expone requireAuthUser, que los controllers JWT usan para leer al usuario sin adivinar si el middleware corrió.

```bash
: > src/shared/auth/auth-user.ts
cat >> src/shared/auth/auth-user.ts << 'EOF'
import { Request } from "express";
import { AppError } from "../errors/app-error";

/**
 * Identidad resuelta que los middlewares de acceso dejan en la petición.
 *
 * Se guarda en `req.auth` (ver la ampliación de tipos más abajo) y la consumen:
 *  - los controllers que necesitan saber quién llama (`GET /api/sesion/perfil`);
 *  - `authorize`, para consultar los permisos efectivos del usuario.
 */
export interface AuthUser {
  id: number;
  usuario: string;
  email?: string;
  /** Token con el que se autenticó (útil para cerrar la sesión actual). */
  tokenId?: string;
}

/**
 * Devuelve la identidad de la petición o falla con 401.
 *
 * Lo usan los controllers de rutas con modalidad JWT (sin `authorize`): allí el
 * middleware ya garantizó que `req.auth` existe, pero el tipo es opcional, así
 * que esta función cierra el caso sin recurrir a `!`.
 */
export function requireAuthUser(req: Request): AuthUser {
  if (!req.auth) {
    throw new AppError(401, "Authentication required");
  }
  return req.auth;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Identidad resuelta por el middleware `authenticate`. `undefined` = OPEN. */
      auth?: AuthUser;
    }
  }
}

export {};
EOF
```

## 19.6 error-response.ts y PARCHE de BaseController

El mapeo error → HTTP deja de vivir solo en el controller: lo necesitan también los middlewares authenticate/authorize. Se extrae a un único punto (sendError) y BaseController lo reutiliza.

```bash
: > src/shared/http/error-response.ts
cat >> src/shared/http/error-response.ts << 'EOF'
import { Response } from "express";
import { AppError } from "../errors/app-error";

/**
 * Traduce cualquier error a una respuesta HTTP. **Único punto** del proyecto
 * donde se decide el mapeo error -> status.
 *
 * Lo usan los dos sitios que pueden fallar antes de llegar a un controller:
 *  - `BaseController.handleError` (handlers de los controllers);
 *  - los middlewares de acceso (`authenticate` / `authorize`), que responden
 *    401/403 sin pasar por un controller.
 *
 * Regla: `AppError` -> su `statusCode`; cualquier otra cosa -> **500** (y el
 * detalle solo en el cuerpo, nunca el stack).
 */
export function sendError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  res.status(500).json({ error: "Internal server error", detail: String(error) });
}
EOF
```

**PARCHE** en src/shared/http/base-controller.ts: handleError delega en sendError.

```bash
: > src/shared/http/base-controller.ts
cat >> src/shared/http/base-controller.ts << 'EOF'
import { Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { sendError } from "./error-response";

/**
 * Base de los controllers HTTP.
 *
 * Aísla las tres responsabilidades puramente HTTP que, si no, se repetirían en
 * los 24 métodos de cada controller:
 *
 *  - `run`:            ejecuta el cuerpo del handler y traduce el error a HTTP.
 *  - `paramId`:        lee y valida el `:id` de la URL.
 *  - `handleError`:    mapea `AppError` a su status y lo demás a 500.
 *
 * La capa de negocio (service) no conoce `req`/`res`.
 */
export abstract class BaseController {
  /**
   * Ejecuta el cuerpo de un handler y centraliza el manejo de errores.
   *
   * Sin este helper, cada uno de los 35 métodos de los controllers tendría su
   * propio `try/catch`. Aquí el `catch` vive una sola vez.
   */
  protected async run(res: Response, work: () => Promise<void>): Promise<void> {
    try {
      await work();
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Lee el `:id` de la URL y lo valida como entero positivo.
   *
   * Sin la validación, `GET /api/clientes/abc` llegaría al repository como
   * `Number("abc") === NaN` y devolvería un 404 engañoso en vez de un 400.
   */
  protected paramId(req: Request): number {
    const raw = req.params.id;
    const value = Array.isArray(raw) ? raw[0] : raw;

    if (!value || !/^\d+$/.test(value) || Number(value) < 1) {
      throw new AppError(400, "Invalid id: must be a positive integer");
    }
    return Number(value);
  }

  /**
   * Mapea errores: `AppError` -> su status; cualquier otro -> 500.
   *
   * La traducción vive en `sendError` porque los middlewares de acceso también
   * la necesitan: un único punto decide el mapeo error -> HTTP.
   */
  protected handleError(res: Response, error: unknown): void {
    sendError(res, error);
  }
}
EOF
```

## 19.7 swagger-security.ts — seguridad reutilizable para OpenAPI

|Export	| Para qué |
|-------|----------|
|bearerSecurityScheme |	Esquema bearerAuth (Authorization: Bearer <token>, RFC 6750) |
|unauthorizedResponse	| Respuesta 401 reutilizable ($ref) |
|forbiddenResponse |	Respuesta 403 reutilizable ($ref) |

```bash
: > src/shared/http/swagger-security.ts
cat >> src/shared/http/swagger-security.ts << 'EOF'
/**
 * Piezas reutilizables de OpenAPI para las **tres modalidades de acceso**.
 *
 * Centralizar aquí el esquema `bearerAuth` y las respuestas 401/403 evita repetir
 * la misma definición en los 24 módulos de Swagger (auth) y en los 5 de business.
 * Al cambiar una descripción, cambia en toda la documentación.
 *
 * Convención de uso en cada operación:
 *
 * | Modalidad | `security` |
 * |---|---|
 * | OPEN  | `openSecurity`  (arreglo vacío: no exige credencial) |
 * | JWT   | `bearerSecurity` |
 * | RBAC  | `bearerSecurity` + respuestas 401 **y** 403 |
 */

/** Esquema de seguridad (RFC 6750: `Authorization: Bearer <token>`). */
export const bearerSecurityScheme = {
  bearerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description:
      "Access token JWT obtenido en `POST /api/sesion/login`. Enviar como " +
      "`Authorization: Bearer <access_token>`. Vida útil corta (por defecto 15 min); " +
      "se renueva con `POST /api/sesion/refresh`.",
  },
};

/** `security` de un endpoint OPEN (no exige credencial). */
export const openSecurity: unknown[] = [];

/** `security` de un endpoint JWT o RBAC (exige access token válido). */
export const bearerSecurity = [{ bearerAuth: [] }];

/** Respuesta 401: no hay identidad válida (token ausente, inválido o usuario inactivo). */
export const unauthorizedResponse = {
  description:
    "401 No autenticado — falta el Bearer token, el token es inválido/expiró o el usuario está inactivo",
};

/** Respuesta 403: hay identidad, pero la matriz RBAC no concede `(method, path)`. */
export const forbiddenResponse = {
  description:
    "403 Prohibido — autenticado, pero sin concesión activa para esta operación (deny by default)",
};

/** Respuesta 400 ante un `:id` que no es entero positivo. */
export const invalidIdResponse = {
  description: "400 id inválido (debe ser un entero positivo)",
};

/** Respuesta 404 estándar. */
export const notFoundResponse = {
  description: "404 No encontrado",
};
EOF
```

## 19.8 Los seis modelos Sequelize

|Entidad | Tabla	Responsabilidad |
|--------|------------------------|
|User	| users	identidad del usuario (contraseña hasheada) |
|Role	| roles	agrupación de responsabilidades |
|RoleUser	| role_users	asignación User ↔ Role (N:M) |
|Resource	| resources	endpoint/acción protegible, (method, path) |
|ResourceRole	| resource_roles	el permiso: concesión Role ↔ Resource (N:M) |
|RefreshToken	| refresh_tokens	sesión renovable y revocable |

**User**

```bash
: > src/features/auth/users/user.model.ts
cat >> src/features/auth/users/user.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";
import { hashPassword } from "../../../shared/auth/password";

/**
 * Modelo `User` (tabla `users`) — la identidad del sistema.
 *
 * Se diferencia de los modelos de business en un punto clave: **`password` nunca
 * se guarda en claro**. El hash se calcula en los hooks, de modo que ningún
 * service, repository o seeder puede olvidarse de hacerlo.
 *
 * El algoritmo y el coste viven en `shared/auth/password.ts` (única fuente), no
 * aquí: si mañana se sube el coste, se cambia en un solo sitio.
 */
export interface UserI {
  id?: number;
  usuario: string;
  email: string;
  password: string;
  avatar?: string | null;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends Model {
  public id!: number;
  public usuario!: string;
  public email!: string;
  public password!: string;
  public avatar!: string | null;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    usuario: {
      type: DataTypes.STRING(80),
      allowNull: false,
      // `unique` con nombre explícito -> la BD nombra la restricción `uq_users_usuario`
      // (misma nomenclatura que el DDL de referencia en base de datos.md §14).
      unique: "uq_users_usuario",
      validate: {
        notEmpty: { msg: "Usuario cannot be empty" },
        len: { args: [3, 80], msg: "Usuario must be between 3 and 80 characters" },
      },
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: "uq_users_email",
      validate: {
        isEmail: { msg: "Email must be a valid email address" },
      },
    },
    password: {
      // 255: el hash bcrypt ocupa 60 y sobra margen para algoritmos futuros.
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Password cannot be empty" },
      },
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    hooks: {
      // Los tres hooks que crean/actualizan el hash. Cualquier ruta de escritura
      // (create, update, bulkCreate del seeder) pasa por aquí: no hay forma de
      // persistir una contraseña en claro.
      beforeCreate: async (user: User) => {
        if (user.password) {
          user.password = await hashPassword(user.password);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed("password") && user.password) {
          user.password = await hashPassword(user.password);
        }
      },
      beforeBulkCreate: async (users: User[]) => {
        for (const user of users) {
          if (user.password) {
            user.password = await hashPassword(user.password);
          }
        }
      },
      // Normalización: `usuario` y `email` siempre en minúsculas y sin espacios.
      // Se hace antes de validar para que el `isEmail`/`len` juzgue el valor final
      // y para que el login (que compara por igualdad) sea predecible.
      beforeValidate: (user: User) => {
        if (user.usuario) user.usuario = user.usuario.trim().toLowerCase();
        if (user.email) user.email = user.email.trim().toLowerCase();
      },
    },
  }
);
EOF
```

**Role**

```bash
: > src/features/auth/roles/role.model.ts
cat >> src/features/auth/roles/role.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

/**
 * Modelo `Role` (tabla `roles`) — agrupador lógico de responsabilidades.
 *
 * Nota de diseño: **el nombre del rol no autoriza nada**. La autorización se
 * decide por las concesiones (`resource_roles`) asociadas al rol. Un rol
 * `ADMIN` sin concesiones activas no habilita ninguna operación.
 */
export interface RoleI {
  id?: number;
  name: string;
  description?: string | null;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class Role extends Model {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Role.init(
  {
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: "uq_roles_name",
      validate: {
        notEmpty: { msg: "Role name cannot be empty" },
      },
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Role",
    tableName: "roles",
    timestamps: true,
    hooks: {
      // El nombre del rol se normaliza a MAYÚSCULAS (ADMIN, COORDINADOR, BUYER):
      // es un identificador funcional, no una etiqueta libre.
      beforeValidate: (role: Role) => {
        if (role.name) role.name = role.name.trim().toUpperCase();
      },
    },
  }
);
EOF
```

**RoleUser**

```bash
: > src/features/auth/role-users/role-user.model.ts
cat >> src/features/auth/role-users/role-user.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

/**
 * Modelo `RoleUser` (tabla `role_users`) — asignación N:M `User` ↔ `Role`.
 *
 * Es el **primer eslabón** de la cadena de autorización. Un usuario sin filas
 * activas aquí no tiene ningún permiso granular, aunque tenga roles asignados
 * con estado `inactive`.
 *
 * La restricción única `(user_id, role_id)` impide duplicar la asignación:
 * revocar y volver a conceder se hace cambiando `status`, no insertando filas.
 */
export interface RoleUserI {
  id?: number;
  user_id: number;
  role_id: number;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class RoleUser extends Model {
  public id!: number;
  public user_id!: number;
  public role_id!: number;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RoleUser.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "RoleUser",
    tableName: "role_users",
    timestamps: true,
    indexes: [
      { name: "uq_role_users_user_role", unique: true, fields: ["user_id", "role_id"] },
      { name: "ix_role_users_user_id", fields: ["user_id"] },
      { name: "ix_role_users_role_id", fields: ["role_id"] },
    ],
  }
);
EOF
```

**Resource**

```bash
: > src/features/auth/resources/resource.model.ts
cat >> src/features/auth/resources/resource.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";
import { normalizePath } from "../../../shared/auth/resource-match";

/**
 * Modelo `Resource` (tabla `resources`) — un punto de acceso protegible.
 *
 * Un recurso **no** es una entidad de negocio: es el par `(method, path)`.
 * `GET /api/reservas` y `POST /api/reservas` son **dos recursos distintos**.
 *
 * Las rutas se guardan con el patrón, no con el valor concreto:
 * `/api/reservas/:id`. Así no se crea una fila por cada identificador y la
 * coincidencia se resuelve por patrón (`shared/auth/resource-match.ts`).
 */
export interface ResourceI {
  id?: number;
  method: string;
  path: string;
  description?: string | null;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class Resource extends Model {
  public id!: number;
  public method!: string;
  public path!: string;
  public description!: string | null;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Resource.init(
  {
    method: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: {
          args: [["GET", "POST", "PUT", "PATCH", "DELETE"]],
          msg: "Method must be one of GET, POST, PUT, PATCH, DELETE",
        },
      },
    },
    path: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Path cannot be empty" },
      },
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Resource",
    tableName: "resources",
    timestamps: true,
    // Clave única compuesta: el mismo verbo con distinta ruta (o al revés) son
    // recursos distintos, pero la tupla exacta no se repite.
    indexes: [
      {
        name: "uq_resources_method_path",
        unique: true,
        fields: ["method", "path"],
      },
    ],
    hooks: {
      // Normalización: verbo en mayúsculas y ruta sin barra final ni duplicados,
      // para que la comparación por patrón sea determinista.
      beforeValidate: (resource: Resource) => {
        if (resource.method) resource.method = resource.method.trim().toUpperCase();
        if (resource.path) resource.path = normalizePath(resource.path.trim());
      },
    },
  }
);
EOF

```

**ResourceRole**

```bash
: > src/features/auth/resource-roles/resource-role.model.ts
cat >> src/features/auth/resource-roles/resource-role.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

/**
 * Modelo `ResourceRole` (tabla `resource_roles`) — la **concesión** `Role` ↔ `Resource`.
 *
 * Esta tabla **es el permiso**. No existe una entidad `Permission`: el permiso
 * es la tupla `(rol, recurso)` materializada aquí.
 *
 * - Conceder acceso   -> insertar o reactivar una fila.
 * - Retirar acceso    -> `status = inactive`.
 * - Cambiar la matriz -> no requiere código ni despliegue.
 */
export interface ResourceRoleI {
  id?: number;
  role_id: number;
  resource_id: number;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class ResourceRole extends Model {
  public id!: number;
  public role_id!: number;
  public resource_id!: number;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ResourceRole.init(
  {
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    resource_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "ResourceRole",
    tableName: "resource_roles",
    timestamps: true,
    indexes: [
      {
        name: "uq_resource_roles_role_resource",
        unique: true,
        fields: ["role_id", "resource_id"],
      },
      { name: "ix_resource_roles_role_id", fields: ["role_id"] },
      { name: "ix_resource_roles_resource_id", fields: ["resource_id"] },
    ],
  }
);
EOF
```

**RefreshToken**

```bash
: > src/features/auth/refresh-tokens/refresh-token.model.ts
cat >> src/features/auth/refresh-tokens/refresh-token.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

/**
 * Modelo `RefreshToken` (tabla `refresh_tokens`) — sesión renovable y revocable.
 *
 * Es el **único** artefacto de sesión que se persiste. El access token (JWT) es
 * autocontenido y no se guarda.
 *
 * Campos de seguridad:
 *  - `token_hash`: solo se almacena el SHA-256 del token opaco. Aunque se
 *    filtrara la tabla, no se puede reconstruir un token utilizable. Permite
 *    buscar por índice único en O(1).
 *  - `family_id`: agrupa todos los tokens derivados de un mismo login por
 *    rotación. Si un token ya rotado se reutiliza, se revoca **toda la familia**
 *    (detección de reutilización, Owasp/OAuth2).
 *  - `expires_at`: vigencia; un token vencido se trata como inválido.
 *  - `device_info`: soporte de auditoría y de listado de sesiones por dispositivo.
 *
 * Desviación deliberada: `status` predetermina **`active`**. Un token recién
 * emitido nace vigente por definición, a diferencia del resto de tablas.
 */
export interface RefreshTokenI {
  id?: number;
  user_id: number;
  token_hash: string;
  family_id: string;
  device_info?: string | null;
  expires_at: Date;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class RefreshToken extends Model {
  public id!: number;
  public user_id!: number;
  public token_hash!: string;
  public family_id!: string;
  public device_info!: string | null;
  public expires_at!: Date;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RefreshToken.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "uq_refresh_tokens_token_hash",
    },
    family_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    device_info: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      // Única tabla cuyo estado por defecto es `active` (ver doc del modelo).
      defaultValue: "active",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "RefreshToken",
    tableName: "refresh_tokens",
    timestamps: true,
    indexes: [
      { name: "ix_refresh_tokens_family_id", fields: ["family_id"] },
      { name: "ix_refresh_tokens_user_id", fields: ["user_id"] },
    ],
  }
);
EOF
```

## 19.9 rbac.associations.ts — el grafo en un solo lugar

Las asociaciones se declaran después de los modelos (referencian a los modelos, no al revés) y en un único archivo para que el grafo se lea entero:

```
User N:M Role           mediante RoleUser
User 1:N RefreshToken
Role N:M Resource       mediante ResourceRole
```

```bash
: > src/features/auth/rbac.associations.ts
cat >> src/features/auth/rbac.associations.ts << 'EOF'
import { User } from "./users/user.model";
import { Role } from "./roles/role.model";
import { Resource } from "./resources/resource.model";
import { RoleUser } from "./role-users/role-user.model";
import { ResourceRole } from "./resource-roles/resource-role.model";
import { RefreshToken } from "./refresh-tokens/refresh-token.model";

/**
 * Asociaciones de las seis entidades de seguridad.
 *
 * Se declaran en un solo archivo (y no dispersas por feature) porque la
 * autorización es una **cadena** que atraviesa cinco tablas; verla junta hace
 * evidente el camino que recorre la consulta de permisos:
 *
 * ```text
 * ResourceRole ──► Role ──► RoleUser ──► (filtro por user_id)
 *        │
 *        └────────► Resource  ──► (method, path)
 * ```
 *
 * Los alias (`as`) son los que usan los `include` de los repositories, así que
 * cambiar un alias aquí obliga a revisar las consultas RBAC.
 */

// --- La concesión conoce su rol y su recurso (los dos extremos del permiso) ---
ResourceRole.belongsTo(Role, { foreignKey: "role_id", as: "role" });
ResourceRole.belongsTo(Resource, { foreignKey: "resource_id", as: "resource" });
Role.hasMany(ResourceRole, { foreignKey: "role_id", as: "resource_roles" });
Resource.hasMany(ResourceRole, { foreignKey: "resource_id", as: "resource_roles" });

// --- La asignación conoce su usuario y su rol (primer eslabón de la cadena) ---
RoleUser.belongsTo(User, { foreignKey: "user_id", as: "user" });
RoleUser.belongsTo(Role, { foreignKey: "role_id", as: "role" });
User.hasMany(RoleUser, { foreignKey: "user_id", as: "role_users" });
Role.hasMany(RoleUser, { foreignKey: "role_id", as: "role_users" });

// --- Las sesiones pertenecen a un usuario ---
RefreshToken.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(RefreshToken, { foreignKey: "user_id", as: "refresh_tokens" });
EOF
```

## 19.10 Cableado de modelos en config y seeders

**PARCHE** en src/config/index.ts — los seis modelos, y después las asociaciones:

```bash
cat >> src/config/index.ts << 'EOF'
import dotenv from "dotenv";
import express, { Application, ErrorRequestHandler } from "express";
import morgan from "morgan";
var cors = require("cors");
import { sequelize, getDatabaseInfo, testConnection } from "../database/db";
import "../features/business/clientes/cliente.model";
import "../features/business/servicios/servicio.model";
import "../features/business/evento-servicios/evento-servicio.model";
import "../features/business/salones/salon.model";
import "../features/business/reservas/reserva.model";
import "../features/business/proveedores/proveedor.model";
import "../features/business/contratos/contrato.model";
import "../features/business/pagos/pago.model";
import "../features/business/cambios-contrato/cambio-contrato.model";
import "../features/business/cancelaciones/cancelacion.model";
import "../features/business/eventos/evento.model";
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
    // Features de negocio de CelebraHub (mantener estas rutas existentes).
    this.routePrv.clientesRoutes.routes(this.app);
    this.routePrv.serviciosRoutes.routes(this.app);
    this.routePrv.eventoServiciosRoutes.routes(this.app);
    this.routePrv.salonesRoutes.routes(this.app);
    this.routePrv.reservasRoutes.routes(this.app);
    this.routePrv.proveedoresRoutes.routes(this.app);
    this.routePrv.contratosRoutes.routes(this.app);
    this.routePrv.cambiosContratoRoutes.routes(this.app);
    this.routePrv.pagosRoutes.routes(this.app);
    this.routePrv.cancelacionesRoutes.routes(this.app);
    this.routePrv.eventosRoutes.routes(this.app);

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

PARCHE en src/database/seeders/index.ts — mismo bloque de imports (los seeders de auth se añaden en sus ISS). El orden importa: Sequelize solo conoce las asociaciones que se han declarado.

```bash

```

**Verificación**

```bash
npx tsc --noEmit
npm run db:seed     # sync({ alter: true }) crea las 6 tablas vacías
npm run dev         # el servidor debe arrancar
```


<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-06 222404.png">
</p>


## 20. ISS-19 — Feature Users (identidad y contraseña)

**Objetivo:** construir el CRUD de identidades como un feature más (mismas 4 capas y mismo contrato DTO que los de Fase I), con dos diferencias clave: la contraseña nunca entra ni reserva en claro, y el service expone una consulta de permisos efectivos que recorre el grafo RBAC.

**Bloqueado por:** ISS-19 (modelo User y rbac.associations.ts).

Criterios de aceptación (ISS-19) — consolidados

- [ ] 20.1 carpeta dto/ con create-user.dto.ts, update-user.dto.ts, patch-user.dto.ts, change-password.dto.ts, user-response.dto.ts e index.ts
- [ ] 20.2 users.repository.ts accede a Sequelize con UserEntity; incluye findByUsernameOrEmail
- [ ] 20.3 users.service.ts: hashea al crear/actualizar, valida unicidad de username/email (409) y ofrece getEffectivePermissions
- [ ] 20.4 users.controller.ts: usa this.run(res, …) y this.paramId(req); nunca devuelve el hash
- [ ] 20.5 users.routes.ts protege todas las operaciones con authenticate, authorize
- [ ] 20.6 users.seeder.ts crea admin y comercial de forma idempotente
- [ ] 20.7 users.swagger.ts documenta los 9 endpoints con security: bearerAuth
- [ ] 20.8 archivos .http de lectura y escritura
- [ ] npx tsc --noEmit OK

## 20.1 DTOs del feature

Contrato de la API (el repository no los conoce):

```bash
: > src/features/auth/users/dto/create-user.dto.ts
cat >> src/features/auth/users/dto/create-user.dto.ts << 'EOF'
/**
 * Datos de entrada de `POST /api/usuarios`.
 *
 * `status` es opcional y por defecto `active` (como en business). Después de
 * crear el usuario, el estado solo cambia con el borrado lógico.
 */
export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  avatar?: string | null;
  status?: "active" | "inactive";
}
EOF
```

```bash
: > src/features/auth/users/dto/update-user.dto.ts
cat >> src/features/auth/users/dto/update-user.dto.ts << 'EOF'
/**
 * Datos de entrada de `PUT /api/usuarios/:id` (reemplazo completo).
 *
 * Ni `password` ni `status` están aquí, a propósito:
 *  - la contraseña tiene su propia operación (`PATCH /api/usuarios/:id/password`),
 *    porque cambiar una credencial exige verificar la anterior;
 *  - el estado solo cambia con el borrado lógico (`/deactivate`).
 */
export interface UpdateUserDto {
  username: string;
  email: string;
  avatar?: string | null;
}
EOF
```

```bash
: > src/features/auth/users/dto/patch-user.dto.ts
cat >> src/features/auth/users/dto/patch-user.dto.ts << 'EOF'
import { UpdateUserDto } from "./update-user.dto";

/** Datos de entrada de `PATCH /api/usuarios/:id` (actualización parcial). */
export type PatchUserDto = Partial<UpdateUserDto>;
EOF
```

```bash
: > src/features/auth/users/dto/change-password.dto.ts
cat >> src/features/auth/users/dto/change-password.dto.ts << 'EOF'
/**
 * Datos de entrada de `PATCH /api/usuarios/:id/password`.
 *
 * Exige la contraseña **actual** además de la nueva. Es una defensa en
 * profundidad: aunque el RBAC autorice la operación, nadie puede cambiar la
 * credencial de otro usuario sin conocerla (evita que un administrador
 * comprometido rote contraseñas ajenas sin más).
 */
export interface ChangePasswordDto {
  current_password: string;
  new_password: string;
}
EOF
```

```bash
: > src/features/auth/users/dto/user-response.dto.ts
cat >> src/features/auth/users/dto/user-response.dto.ts << 'EOF'
import { User, UserI } from "../user.model";

/**
 * Respuesta HTTP de un usuario.
 *
 * Regla del DTO: `password` **nunca** reserva de la API. El repositorio ni siquiera
 * lo proyecta en las lecturas (`attributes: { exclude: ["password"] }`), pero el
 * mapper lo elimina igualmente por si el modelo se cargó con el hash (p. ej. al
 * cambiar la contraseña). Doble red: el tipo no lo permite y el mapper lo borra.
 */
export type UserResponseDto = Omit<UserI, "password">;

/** Mapper modelo -> DTO de respuesta (objeto plano; elimina `password`). */
export function toUserResponse(user: User): UserResponseDto {
  const { password, ...safe } = user.toJSON() as UserI & { password?: string };
  return safe;
}
EOF
```

```bash
: > src/features/auth/users/dto/index.ts
cat >> src/features/auth/users/dto/index.ts << 'EOF'
export * from "./create-user.dto";
export * from "./update-user.dto";
export * from "./patch-user.dto";
export * from "./change-password.dto";
export * from "./user-response.dto";
EOF
```

> **Regla transversal que se mantiene:** status no viaja en UpdateUserDto ni en PatchUserDto. Solo cambia al crear o con el borrado lógico /deactivate.

> change-password.dto.ts es específico del cambio de contraseña (no es un patch del recurso): exige la contraseña actual y la nueva, y permite revoke_sessions para cerrar las sesiones abiertas del usuario.

## 20.2 Repository

Única capa que usa Sequelize. Además del CRUD genérico, aporta findByUsernameOrEmail, que necesita el login (ISS-15): acepta usuario o correo en un solo campo.

```bash
: > src/features/auth/users/users.repository.ts
cat >> src/features/auth/users/users.repository.ts << 'EOF'
import { CreationAttributes, Op, Transaction } from "sequelize";
import { User } from "./user.model";

/**
 * Capa Repository del feature Users.
 *
 * Única que habla con Sequelize (el modelo `User`). No contiene reglas de
 * negocio ni conoce `req`/`res`.
 *
 * Detalle de seguridad: las lecturas **normales** excluyen `password` en la
 * proyección SQL. Solo dos consultas lo incluyen, ambas con nombre explícito en
 * su firma (`...WithPassword`), de modo que un `findById` cualquiera jamás puede
 * devolver el hash por descuido.
 */
export class UsersRepository {
  /** Proyección sin credencial: la que usan todas las lecturas de API. */
  private static readonly WITHOUT_PASSWORD = { exclude: ["password"] };

  /** Todos los usuarios activos (sin `password`). */
  public async findAllActive(): Promise<User[]> {
    return User.findAll({
      where: { status: "active" },
      attributes: UsersRepository.WITHOUT_PASSWORD,
    });
  }

  /** Un usuario por PK (o `null`), sin `password`. Acepta transacción. */
  public async findById(id: number, transaction?: Transaction): Promise<User | null> {
    return User.findByPk(id, {
      attributes: UsersRepository.WITHOUT_PASSWORD,
      transaction,
    });
  }

  /** Un usuario por PK **con** su hash. Uso exclusivo: cambio de contraseña. */
  public async findByIdWithPassword(id: number): Promise<User | null> {
    return User.findByPk(id);
  }

  /**
   * Un usuario por `username` **o** `email`, con su hash.
   *
   * Uso exclusivo: validación de credenciales en el login (única operación que
   * lee la credencial). Normaliza el identificador a minúsculas para casar con
   * el valor almacenado.
   */
  public async findByIdentifierWithPassword(identifier: string): Promise<User | null> {
    const value = identifier.trim().toLowerCase();
    return User.findOne({
      where: { [Op.or]: [{ username: value }, { email: value }] },
    });
  }

  /** Busca por `username` o `email` (sin `password`) para detectar duplicados. */
  public async findConflicts(username: string, email: string): Promise<User[]> {
    return User.findAll({
      where: {
        [Op.or]: [
          { username: username.trim().toLowerCase() },
          { email: email.trim().toLowerCase() },
        ],
      },
      attributes: ["id", "username", "email"],
    });
  }

  /** Inserta un usuario (el hook del modelo hashea `password`). */
  public async create(data: CreationAttributes<User>): Promise<User> {
    return User.create(data);
  }

  /** Persiste cambios sobre una instancia existente. */
  public async update(user: User, data: Partial<User>): Promise<User> {
    return user.update(data);
  }

  /** Elimina físicamente una instancia. */
  public async delete(user: User): Promise<void> {
    await user.destroy();
  }
}
EOF
```

## 20.3 Service

Aquí viven las reglas de User:

- Nunca se guarda la contraseña en claro (hashPassword, bcrypt 12).

- username y email son únicos: si ya existen, AppError(409, …).

- Al actualizar, si llega password se vuelve a hashear; si no llega, se conserva.

- El borrado lógico (deactivate) no borra el hash: el registro queda inactivo e invisible.

- getEffectivePermissions recorre el grafo y devuelve la lista de (method, path) vigentes.

```bash
: > src/features/auth/users/users.service.ts
cat >> src/features/auth/users/users.service.ts << 'EOF'
import {
  ChangePasswordDto,
  CreateUserDto,
  PatchUserDto,
  UpdateUserDto,
  UserResponseDto,
  toUserResponse,
} from "./dto";
import { UsersRepository } from "./users.repository";
import { User } from "./user.model";
import { AppError } from "../../../shared/errors/app-error";
import { comparePassword } from "../../../shared/auth/password";
import { ResourceRolesService } from "../resource-roles/resource-roles.service";
import { EffectivePermissionDto } from "../resource-roles/dto";

/**
 * Capa Service del feature Users.
 *
 * Reglas de negocio: unicidad de `username`/`email`, default de `status`,
 * política de borrado lógico, cambio de credencial y consulta de permisos
 * efectivos (que delega en el feature `resource-roles`: el permiso es una
 * concesión rol-recurso, no un atributo del usuario).
 *
 * No conoce `req`/`res` ni escribe Sequelize directamente.
 */
export class UsersService {
  public constructor(
    private readonly repository: UsersRepository = new UsersRepository(),
    private readonly resourceRolesService: ResourceRolesService = new ResourceRolesService()
  ) {}

  // ================== READ ==================
  public async getAll(): Promise<UserResponseDto[]> {
    const users = await this.repository.findAllActive();
    return users.map((user) => toUserResponse(user));
  }

  public async getOne(id: number): Promise<UserResponseDto> {
    return toUserResponse(await this.findOrFail(id));
  }

  /** Permisos efectivos del usuario (cadena RBAC completa). 404 si no existe. */
  public async getEffectivePermissions(id: number): Promise<EffectivePermissionDto[]> {
    await this.findOrFail(id);
    return this.resourceRolesService.findEffectiveForUser(id);
  }

  // ================== CREATE ==================
  public async create(body: CreateUserDto): Promise<UserResponseDto> {
    await this.assertUnique(body.username, body.email);

    // Copia campo a campo: solo lo que declara el DTO llega al modelo
    // (evita *mass assignment*, p. ej. inyectar un `id` o un `status` raro).
    const user = await this.repository.create({
      username: body.username,
      email: body.email,
      password: body.password,
      avatar: body.avatar ?? null,
      status: body.status ?? "active",
    });
    return toUserResponse(user);
  }

  // ================== UPDATE ==================
  public async updatePut(id: number, body: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findOrFail(id);
    await this.assertUnique(body.username, body.email, id);

    await this.repository.update(user, {
      username: body.username,
      email: body.email,
      avatar: body.avatar ?? null,
    });
    return toUserResponse(user);
  }

  public async updatePatch(id: number, body: PatchUserDto): Promise<UserResponseDto> {
    const user = await this.findOrFail(id);

    const username = body.username ?? user.username;
    const email = body.email ?? user.email;
    await this.assertUnique(username, email, id);

    await this.repository.update(user, body);
    return toUserResponse(user);
  }

  /**
   * Cambia la contraseña de un usuario.
   *
   * Verifica la credencial actual antes de aceptar la nueva. El hash lo vuelve a
   * calcular el hook `beforeUpdate` del modelo al detectar el campo cambiado.
   */
  public async changePassword(id: number, body: ChangePasswordDto): Promise<void> {
    if (!body.current_password || !body.new_password) {
      throw new AppError(400, "current_password and new_password are required");
    }

    const user = await this.repository.findByIdWithPassword(id);
    if (!user || user.status !== "active") {
      throw new AppError(404, "User not found");
    }

    const matches = await comparePassword(body.current_password, user.password);
    if (!matches) {
      throw new AppError(400, "Current password is incorrect");
    }

    await this.repository.update(user, { password: body.new_password });
  }

  // ================== DELETE ==================
  /** Eliminación física. */
  public async deletePhysical(id: number): Promise<void> {
    const user = await this.findOrFail(id, false);
    await this.repository.delete(user);
  }

  /** Eliminación lógica -> `status = inactive`. */
  public async deleteLogical(id: number): Promise<UserResponseDto> {
    const user = await this.findOrFail(id);
    await this.repository.update(user, { status: "inactive" });
    return toUserResponse(user);
  }

  // ================== HELPERS ==================
  /** Busca por PK y falla con 404. `onlyActive` aplica la política de borrado lógico. */
  private async findOrFail(id: number, onlyActive = true): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user || (onlyActive && user.status !== "active")) {
      throw new AppError(404, "User not found");
    }
    return user;
  }

  /**
   * Comprueba que `username` y `email` no estén tomados por **otro** usuario.
   *
   * `excludeId` permite excluir al propio usuario en las actualizaciones. Se
   * hace antes de escribir para responder 409 con un mensaje útil en lugar de
   * dejar que la restricción única de la BD reviente como un 500.
   */
  private async assertUnique(
    username: string,
    email: string,
    excludeId?: number
  ): Promise<void> {
    const conflicts = await this.repository.findConflicts(username, email);
    const taken = conflicts.find((candidate) => candidate.id !== excludeId);

    if (!taken) return;
    if (taken.username === username.trim().toLowerCase()) {
      throw new AppError(409, "Username already in use");
    }
    throw new AppError(409, "Email already in use");
  }
}
EOF
```

> User → (role_users.status = 'active') → Role → (resource_roles.status = 'active') → Resource con Role.status = 'active' y Resource.status = 'active'

## 20.4 Controller

HTTP puro: this.run(res, …), this.paramId(req) y findOrFail en el service. Expone dos operaciones que no son CRUD: cambio de contraseña y permisos efectivos.

```bash
: > src/features/auth/users/users.controller.ts
cat >> src/features/auth/users/users.controller.ts << 'EOF'
import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import {
  ChangePasswordDto,
  CreateUserDto,
  PatchUserDto,
  UpdateUserDto,
} from "./dto";
import { UsersService } from "./users.service";

/**
 * Capa Controller del feature Users.
 * Solo HTTP: lee `req`, llama al service y arma la respuesta.
 * El manejo de errores se delega en `run()` (ver `BaseController`).
 */
export class UsersController extends BaseController {
  public constructor(
    private readonly service: UsersService = new UsersService()
  ) {
    super();
  }

  // ================== READ ==================
  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const users = await this.service.getAll();
      res.status(200).json({ users });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const user = await this.service.getOne(this.paramId(req));
      res.status(200).json({ user });
    });
  }

  // ================== CREATE ==================
  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const user = await this.service.create(req.body as CreateUserDto);
      res.status(201).json({ user });
    });
  }

  // ================== UPDATE ==================
  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const user = await this.service.updatePut(
        this.paramId(req),
        req.body as UpdateUserDto
      );
      res.status(200).json({ user });
    });
  }

  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const user = await this.service.updatePatch(
        this.paramId(req),
        req.body as PatchUserDto
      );
      res.status(200).json({ user });
    });
  }

  // ================== DELETE ==================
  /** Eliminación física. */
  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.deletePhysical(id);
      res.status(200).json({ message: "User permanently deleted", id });
    });
  }

  /** Eliminación lógica -> `status = inactive`. */
  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const user = await this.service.deleteLogical(this.paramId(req));
      res.status(200).json({ message: "User deactivated (logical delete)", user });
    });
  }

  // ================== IDENTIDAD Y PERMISOS ==================
  /** Cambio de credencial (exige la contraseña actual). */
  public async changePassword(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.changePassword(id, req.body as ChangePasswordDto);
      res.status(200).json({ message: "Password updated", id });
    });
  }

  /** Permisos efectivos del usuario: recursos concedidos por sus roles activos. */
  public async getEffectivePermissions(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const permissions = await this.service.getEffectivePermissions(this.paramId(req));
      res.status(200).json({ permissions });
    });
  }
}
EOF
```

## 20.5 Rutas (modalidad JWT + RBAC)

Todos los endpoints de administración de identidades están ellos mismos protegidos por la matriz: no basta con estar autenticado, hay que tener la concesión concreta (GET /api/usuarios, POST /api/usuarios, …).

```bash
: > src/features/auth/users/users.routes.ts
cat >> src/features/auth/users/users.routes.ts << 'EOF'
import { Application } from "express";
import { UsersController } from "./users.controller";
import { authenticate, authorize } from "../access";

/**
 * Rutas del feature Users — **modalidad 3 (JWT + RBAC)** en todas las operaciones.
 *
 * La administración de identidades está ella misma protegida por la matriz de
 * permisos: no basta con estar autenticado, hay que tener la concesión concreta
 * (`GET /api/usuarios`, `POST /api/usuarios`, ...). El catálogo de recursos ya
 * incluye las 9 operaciones de este feature.
 */
export class UsersRoutes {
  public usersController: UsersController = new UsersController();

  public routes(app: Application): void {
    // getAll
    app
      .route("/api/usuarios")
      .get(authenticate, authorize, this.usersController.getAll.bind(this.usersController));

    // getOne
    app
      .route("/api/usuarios/:id")
      .get(authenticate, authorize, this.usersController.getOne.bind(this.usersController));

    // create
    app
      .route("/api/usuarios")
      .post(authenticate, authorize, this.usersController.create.bind(this.usersController));

    // update (PUT / PATCH)
    app
      .route("/api/usuarios/:id")
      .put(authenticate, authorize, this.usersController.updatePut.bind(this.usersController))
      .patch(authenticate, authorize, this.usersController.updatePatch.bind(this.usersController));

    // delete físico
    app
      .route("/api/usuarios/:id")
      .delete(
        authenticate,
        authorize,
        this.usersController.deletePhysical.bind(this.usersController)
      );

    // delete lógico
    app
      .route("/api/usuarios/:id/deactivate")
      .patch(
        authenticate,
        authorize,
        this.usersController.deleteLogical.bind(this.usersController)
      );

    // cambio de contraseña
    app
      .route("/api/usuarios/:id/password")
      .patch(
        authenticate,
        authorize,
        this.usersController.changePassword.bind(this.usersController)
      );

    // permisos efectivos del usuario
    app
      .route("/api/usuarios/:id/permisos")
      .get(
        authenticate,
        authorize,
        this.usersController.getEffectivePermissions.bind(this.usersController)
      );
  }
}
EOF
```

## 20.6 Seeder de usuarios canónicos

En CelebraHub se crean cinco usuarios de laboratorio, uno por cada rol definido en el proyecto. Son credenciales locales de prueba y **no representan contraseñas reales de producción**.

```bash
: > src/features/auth/users/users.seeder.ts
cat >> src/features/auth/users/users.seeder.ts << 'EOF'
import { User } from "./user.model";
import { faker } from "@faker-js/faker";

/**
 * Usuarios canónicos de CelebraHub.
 *
 * Los roles corresponden exactamente al modelo funcional del proyecto:
 * ADMIN, COMERCIAL, OPERACIONES, PROVEEDOR y CARTERA.
 *
 * Las contraseñas son únicamente de laboratorio. El modelo User las almacena
 * siempre como hash bcrypt.
 */
export const SEED_USERS = [
  { username: "admin", email: "admin@celebrahub.local", password: "Admin123!" },
  { username: "comercial", email: "comercial@celebrahub.local", password: "Comercial123!" },
  { username: "operaciones", email: "operaciones@celebrahub.local", password: "Operaciones123!" },
  { username: "proveedor", email: "proveedor@celebrahub.local", password: "Proveedor123!" },
  { username: "cartera", email: "cartera@celebrahub.local", password: "Cartera123!" },
] as const;

export async function seedUsers(count: number): Promise<number> {
  if (count <= 0) {
    console.log("⏭️ users: count=0, se omite");
    return 0;
  }

  let created = 0;

  for (const item of SEED_USERS) {
    const [user, wasCreated] = await User.findOrCreate({
      where: { username: item.username },
      defaults: {
        username: item.username,
        email: item.email,
        password: item.password,
        avatar: null,
        status: "active",
      },
    });

    if (wasCreated) {
      created++;
    } else if (user.status !== "active") {
      await user.update({ status: "active" });
    }
  }

  const extras = Math.max(0, count - SEED_USERS.length);

  for (let i = 0; i < extras; i++) {
    const username = `user.${i}.${faker.string.alphanumeric(6)}`.toLowerCase();

    await User.create({
      username,
      email: `${username}@celebrahub.local`,
      password: "Password123!",
      avatar: null,
      status: "active",
    });

    created++;
  }

  console.log(
    `✅ users: insertados ${created} usuario(s) ` +
    `(${SEED_USERS.length} canónicos + ${extras} aleatorios)`
  );

  return created;
}
EOF
```

| Usuario | Contraseña | Rol |
|---|---|---|
| admin | Admin123! | ADMIN |
| comercial | Comercial123! | COMERCIAL |
| operaciones | Operaciones123! | OPERACIONES |
| proveedor | Proveedor123! | PROVEEDOR |
| cartera | Cartera123! | CARTERA |

> **Nota de adaptación:** el documento fuente solo traía dos roles de ejemplo. CelebraHub usa los cinco roles definidos por su propio proyecto, por lo que esta versión amplía únicamente la capa Auth y no modifica ninguna tabla de negocio.

## 20.7 Swagger del feature

Los 9 endpoints (GET/POST /api/usuarios, GET/PUT/PATCH/DELETE /:id, /deactivate, /password, /:id/permisos) documentados con security: [{ bearerAuth: [] }] y las respuestas 401/403 reutilizables.

```bash
: > src/features/auth/users/users.swagger.ts
cat >> src/features/auth/users/users.swagger.ts << 'EOF'
import {
  bearerSecurity,
  forbiddenResponse,
  invalidIdResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "../../../shared/http/swagger-security";

/**
 * Documentación OpenAPI del feature Users.
 *
 * Modalidad de **todas** las operaciones: **JWT + RBAC**. La administración de
 * identidades está protegida por la propia matriz de permisos: además de un
 * token válido, se exige la concesión del recurso `(method, path)`.
 */
export const usersSwagger = {
  tags: [
    {
      name: "Usuarios",
      description:
        "CRUD de identidades + cambio de contraseña + permisos efectivos — **JWT + RBAC**",
    },
  ],
  paths: {
    "/api/usuarios": {
      get: {
        tags: ["Usuarios"],
        summary: "Listar usuarios activos",
        description: "JWT + RBAC — recurso `GET /api/usuarios`. Nunca devuelve `password`.",
        security: bearerSecurity,
        responses: {
          "200": { description: "Lista de usuarios (`{ users: [...] }`)" },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
        },
      },
      post: {
        tags: ["Usuarios"],
        summary: "Crear usuario",
        description:
          "JWT + RBAC — recurso `POST /api/usuarios`. El `password` se hashea (bcrypt, 12 rondas).",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UserCreate" } },
          },
        },
        responses: {
          "201": { description: "Usuario creado (`{ user }`)" },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "409": { description: "`username` o `email` ya en uso" },
        },
      },
    },
    "/api/usuarios/{id}": {
      get: {
        tags: ["Usuarios"],
        summary: "Obtener usuario por id",
        description: "JWT + RBAC — recurso `GET /api/usuarios/:id`. 404 si no existe o está inactivo.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Usuario (`{ user }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
      put: {
        tags: ["Usuarios"],
        summary: "Reemplazar usuario (PUT)",
        description: "JWT + RBAC — recurso `PUT /api/usuarios/:id`. No cambia `password` ni `status`.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UserUpdate" } },
          },
        },
        responses: {
          "200": { description: "Usuario actualizado (`{ user }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
          "409": { description: "`username` o `email` ya en uso" },
        },
      },
      patch: {
        tags: ["Usuarios"],
        summary: "Modificar usuario (PATCH)",
        description: "JWT + RBAC — recurso `PATCH /api/usuarios/:id`. Actualización parcial.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UserPatch" } },
          },
        },
        responses: {
          "200": { description: "Usuario actualizado (`{ user }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
      delete: {
        tags: ["Usuarios"],
        summary: "Eliminar usuario (físico)",
        description: "JWT + RBAC — recurso `DELETE /api/usuarios/:id`.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Eliminado (`{ message, id }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
    "/api/usuarios/{id}/deactivate": {
      patch: {
        tags: ["Usuarios"],
        summary: "Desactivar usuario (borrado lógico)",
        description:
          "JWT + RBAC — recurso `PATCH /api/usuarios/:id/deactivate`. " +
          "Efecto inmediato: la revalidación del middleware `authenticate` deja de reconocer al usuario (401).",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Desactivado (`{ message, user }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
    "/api/usuarios/{id}/password": {
      patch: {
        tags: ["Usuarios"],
        summary: "Cambiar contraseña",
        description:
          "JWT + RBAC — recurso `PATCH /api/usuarios/:id/password`. " +
          "Exige `current_password`: ni un administrador puede cambiar una credencial ajena sin conocerla (defensa en profundidad).",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ChangePassword" } },
          },
        },
        responses: {
          "200": { description: "Contraseña actualizada (`{ message, id }`)" },
          "400": { description: "Faltan campos o `current_password` incorrecta" },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
    "/api/usuarios/{id}/permisos": {
      get: {
        tags: ["Usuarios"],
        summary: "Permisos efectivos del usuario",
        description:
          "JWT + RBAC — recurso `GET /api/usuarios/:id/permisos`. Ejecuta la consulta de autorización " +
          "(`resource_roles → roles → role_users → resources`, todos los eslabones activos) y devuelve el par `(method, path)` de cada permiso.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Permisos efectivos (`{ permissions: [...] }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          username: { type: "string", example: "admin" },
          email: { type: "string", format: "email", example: "admin@celebrahub.local" },
          avatar: { type: "string", nullable: true, example: null },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      UserCreate: {
        type: "object",
        required: ["username", "email", "password"],
        properties: {
          username: { type: "string", minLength: 3, maxLength: 80, example: "nuevo.usuario" },
          email: { type: "string", format: "email", example: "nuevo@celebrahub.local" },
          password: { type: "string", format: "password", minLength: 8, example: "Password123!" },
          avatar: { type: "string", nullable: true },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      UserUpdate: {
        type: "object",
        required: ["username", "email"],
        properties: {
          username: { type: "string" },
          email: { type: "string", format: "email" },
          avatar: { type: "string", nullable: true },
        },
      },
      UserPatch: {
        type: "object",
        properties: {
          username: { type: "string" },
          email: { type: "string", format: "email" },
          avatar: { type: "string", nullable: true },
        },
      },
      ChangePassword: {
        type: "object",
        required: ["current_password", "new_password"],
        properties: {
          current_password: { type: "string", format: "password" },
          new_password: { type: "string", format: "password", minLength: 8 },
        },
      },
    },
  },
};
EOF
```

## 20.8 Pruebas HTTP

```bash
: > src/features/auth/users/http/users.get.http
cat >> src/features/auth/users/http/users.get.http << 'EOF'
### Feature Users — GET ALL / GET ONE (modalidad JWT + RBAC)
### JWT + RBAC: `authenticate` (401 si no hay identidad válida) +
### `authorize` (403 si la matriz no concede el par method+path).
@baseUrl = http://localhost:4000

# @name loginAdmin
POST {{baseUrl}}/api/sesion/login
Content-Type: application/json

{
  "identifier": "admin",
  "password": "Admin123!"
}

@adminToken = {{loginAdmin.response.body.$.access_token}}
@id = 1

### getAll — recurso `GET /api/usuarios` (solo ADMIN). Nunca devuelve `password`.
GET {{baseUrl}}/api/usuarios
Authorization: Bearer {{adminToken}}

### getOne — recurso `GET /api/usuarios/:id`
GET {{baseUrl}}/api/usuarios/{{id}}
Authorization: Bearer {{adminToken}}

### 400 — id no es entero positivo (validado en BaseController.paramId)
GET {{baseUrl}}/api/usuarios/abc
Authorization: Bearer {{adminToken}}

### 401 — sin token
GET {{baseUrl}}/api/usuarios

### 403 — el rol COMERCIAL no tiene concedido `GET /api/usuarios`
# @name loginComercial
POST {{baseUrl}}/api/sesion/login
Content-Type: application/json

{
  "identifier": "comercial",
  "password": "Comercial123!"
}

###
GET {{baseUrl}}/api/usuarios
Authorization: Bearer {{loginComercial.response.body.$.access_token}}
EOF
```

```bash
: > src/features/auth/users/http/users.create.http
cat >> src/features/auth/users/http/users.create.http << 'EOF'
### Feature Users — CREATE / UPDATE / DELETE (modalidad JWT + RBAC)
@baseUrl = http://localhost:4000

# @name loginAdmin
POST {{baseUrl}}/api/sesion/login
Content-Type: application/json

{
  "identifier": "admin",
  "password": "Admin123!"
}

@token = {{loginAdmin.response.body.$.access_token}}
@id = 2

### CREATE — recurso `POST /api/usuarios`. El `password` se hashea (bcrypt, 12 rondas).
POST {{baseUrl}}/api/usuarios
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "username": "nuevo.usuario",
  "email": "nuevo.usuario@celebrahub.local",
  "password": "Password123!",
  "avatar": null
}

### 409 — username/email ya en uso
POST {{baseUrl}}/api/usuarios
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "username": "admin",
  "email": "otro@celebrahub.local",
  "password": "Password123!"
}

### UPDATE PUT — reemplazo completo. No cambia `password` ni `status`.
PUT {{baseUrl}}/api/usuarios/{{id}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "username": "comercial",
  "email": "comercial@celebrahub.local",
  "avatar": "https://example.com/avatar.png"
}

### UPDATE PATCH — parcial
PATCH {{baseUrl}}/api/usuarios/{{id}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "avatar": null
}

### CAMBIO DE CONTRASEÑA — recurso `PATCH /api/usuarios/:id/password`.
### Exige la contraseña ACTUAL (defensa en profundidad, incluso para un admin).
PATCH {{baseUrl}}/api/usuarios/{{id}}/password
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "current_password": "Comercial123!",
  "new_password": "Comercial456!"
}

### PERMISOS EFECTIVOS del usuario — recurso `GET /api/usuarios/:id/permisos`.
### Ejecuta la cadena RBAC completa (comercial -> 7 permisos).
GET {{baseUrl}}/api/usuarios/{{id}}/permisos
Authorization: Bearer {{token}}

### DELETE lógico — `status = inactive`. Efecto inmediato: sus tokens dejan de valer (401).
PATCH {{baseUrl}}/api/usuarios/{{id}}/deactivate
Authorization: Bearer {{token}}

### DELETE físico — recurso `DELETE /api/usuarios/:id`
DELETE {{baseUrl}}/api/usuarios/{{id}}
Authorization: Bearer {{token}}
EOF
```

**Verificación**

```bash
npx tsc --noEmit
npm run db:seed
npm run dev
```
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-06 224201.png">
</p>
----
##  21. ISS-20 — Features Roles y Resources (catálogo de autorización)

**Objetivo:** construir los dos extremos del permiso:

- Role — el sujeto de la autorización (a quién se concede).

- Resource — el objeto (qué se concede), un par (method, path).

Bloqueado por: ISS-19.

Criterios de aceptación (ISS-19) — consolidados

- [ ] 21.1 features/auth/roles/dto/ completo (create, update, patch, role-response, index)
- [ ] 21.2 roles.repository.ts, roles.service.ts, roles.controller.ts, roles.routes.ts (JWT + RBAC)
- [ ] 21.3 roles.seeder.ts (ADMIN, COMERCIAL, idempotente) y roles.swagger.ts
- [ ] 21.4 features/auth/resources/dto/ + resource-catalog.ts con 58 recursos
- [ ] 21.5 resources.repository.ts, resources.service.ts, resources.controller.ts, resources.routes.ts (JWT + RBAC)
- [ ] 21.6 resources.seeder.ts (carga el catálogo) y resources.swagger.ts
- [ ] 21.7 archivos .http de ambos features
- [ ] npx tsc --noEmit OK

## 21.1 Feature Roles — DTOs

```bash
: > src/features/auth/roles/dto/create-role.dto.ts
cat >> src/features/auth/roles/dto/create-role.dto.ts << 'EOF'
/**
 * Datos de entrada de `POST /api/roles`.
 * `name` se normaliza a MAYÚSCULAS en el modelo.
 */
export interface CreateRoleDto {
  name: string;
  description?: string | null;
  status?: "active" | "inactive";
}
EOF
```

```bash
: > src/features/auth/roles/dto/update-role.dto.ts
cat >> src/features/auth/roles/dto/update-role.dto.ts << 'EOF'
/**
 * Datos de entrada de `PUT /api/roles/:id` (reemplazo completo).
 * `status` no está aquí: el estado solo cambia con el borrado lógico.
 */
export interface UpdateRoleDto {
  name: string;
  description?: string | null;
}
EOF
```

```bash
: > src/features/auth/roles/dto/patch-role.dto.ts
cat >> src/features/auth/roles/dto/patch-role.dto.ts << 'EOF'
import { UpdateRoleDto } from "./update-role.dto";

/** Datos de entrada de `PATCH /api/roles/:id` (actualización parcial). */
export type PatchRoleDto = Partial<UpdateRoleDto>;
EOF
```

```bash
: > src/features/auth/roles/dto/role-response.dto.ts
cat >> src/features/auth/roles/dto/role-response.dto.ts << 'EOF'
import { Role, RoleI } from "../role.model";

/** Respuesta HTTP de un rol. Sin campos internos: el DTO coincide con el modelo. */
export type RoleResponseDto = RoleI;

/** Mapper modelo -> DTO de respuesta (objeto plano). */
export function toRoleResponse(role: Role): RoleResponseDto {
  return role.toJSON() as RoleI;
}
EOF
```

```bash
: > src/features/auth/roles/dto/index.ts
cat >> src/features/auth/roles/dto/index.ts << 'EOF'
export * from "./create-role.dto";
export * from "./update-role.dto";
export * from "./patch-role.dto";
export * from "./role-response.dto";
EOF
```

> Un rol se identifica por name (UK). El nombre no autoriza nada: crear un rol AUDITOR no le concede ningún recurso; el rol nace sin permisos.

## 21.2 Feature Roles — repository, service, controller y rutas

```bash
: > src/features/auth/roles/roles.repository.ts
cat >> src/features/auth/roles/roles.repository.ts << 'EOF'
import { CreationAttributes, Transaction } from "sequelize";
import { Role } from "./role.model";

/**
 * Capa Repository del feature Roles.
 * Única que habla con Sequelize (el modelo `Role`).
 */
export class RolesRepository {
  /** Todos los roles activos. */
  public async findAllActive(): Promise<Role[]> {
    return Role.findAll({ where: { status: "active" } });
  }

  /** Un rol por PK (o `null`). */
  public async findById(id: number, transaction?: Transaction): Promise<Role | null> {
    return Role.findByPk(id, { transaction });
  }

  /** Un rol por nombre normalizado a MAYÚSCULAS (o `null`). */
  public async findByName(name: string): Promise<Role | null> {
    return Role.findOne({ where: { name: name.trim().toUpperCase() } });
  }

  /** Inserta un rol. */
  public async create(data: CreationAttributes<Role>): Promise<Role> {
    return Role.create(data);
  }

  /** Persiste cambios sobre una instancia existente. */
  public async update(role: Role, data: Partial<Role>): Promise<Role> {
    return role.update(data);
  }

  /** Elimina físicamente una instancia. */
  public async delete(role: Role): Promise<void> {
    await role.destroy();
  }
}
EOF
```

```bash
: > src/features/auth/roles/roles.service.ts
cat >> src/features/auth/roles/roles.service.ts << 'EOF'
import {
  CreateRoleDto,
  PatchRoleDto,
  RoleResponseDto,
  UpdateRoleDto,
  toRoleResponse,
} from "./dto";
import { RolesRepository } from "./roles.repository";
import { Role } from "./role.model";
import { AppError } from "../../../shared/errors/app-error";

/**
 * Capa Service del feature Roles.
 *
 * Regla de negocio: el nombre del rol es único. La autorización **nunca** se
 * decide por el nombre, sino por las concesiones (`resource_roles`) asociadas;
 * el nombre solo sirve para agrupar.
 */
export class RolesService {
  public constructor(
    private readonly repository: RolesRepository = new RolesRepository()
  ) {}

  // ================== READ ==================
  public async getAll(): Promise<RoleResponseDto[]> {
    const roles = await this.repository.findAllActive();
    return roles.map((role) => toRoleResponse(role));
  }

  public async getOne(id: number): Promise<RoleResponseDto> {
    return toRoleResponse(await this.findOrFail(id));
  }

  // ================== CREATE ==================
  public async create(body: CreateRoleDto): Promise<RoleResponseDto> {
    if (!body.name) {
      throw new AppError(400, "name is required");
    }
    await this.assertNameAvailable(body.name);

    const role = await this.repository.create({
      name: body.name,
      description: body.description ?? null,
      status: body.status ?? "active",
    });
    return toRoleResponse(role);
  }

  // ================== UPDATE ==================
  public async updatePut(id: number, body: UpdateRoleDto): Promise<RoleResponseDto> {
    const role = await this.findOrFail(id);
    await this.assertNameAvailable(body.name, id);

    await this.repository.update(role, {
      name: body.name,
      description: body.description ?? null,
    });
    return toRoleResponse(role);
  }

  public async updatePatch(id: number, body: PatchRoleDto): Promise<RoleResponseDto> {
    const role = await this.findOrFail(id);

    if (body.name) {
      await this.assertNameAvailable(body.name, id);
    }

    await this.repository.update(role, body);
    return toRoleResponse(role);
  }

  // ================== DELETE ==================
  /** Eliminación física. */
  public async deletePhysical(id: number): Promise<void> {
    const role = await this.findOrFail(id, false);
    await this.repository.delete(role);
  }

  /** Eliminación lógica -> `status = inactive`. Todos sus usuarios pierden ese rol. */
  public async deleteLogical(id: number): Promise<RoleResponseDto> {
    const role = await this.findOrFail(id);
    await this.repository.update(role, { status: "inactive" });
    return toRoleResponse(role);
  }

  // ================== HELPERS ==================
  private async findOrFail(id: number, onlyActive = true): Promise<Role> {
    const role = await this.repository.findById(id);
    if (!role || (onlyActive && role.status !== "active")) {
      throw new AppError(404, "Role not found");
    }
    return role;
  }

  private async assertNameAvailable(name: string, excludeId?: number): Promise<void> {
    const existing = await this.repository.findByName(name);
    if (existing && existing.id !== excludeId) {
      throw new AppError(409, "Role name already in use");
    }
  }
}
EOF
```

```bash
: > src/features/auth/roles/roles.controller.ts
cat >> src/features/auth/roles/roles.controller.ts << 'EOF'
import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { CreateRoleDto, PatchRoleDto, UpdateRoleDto } from "./dto";
import { RolesService } from "./roles.service";

/**
 * Capa Controller del feature Roles.
 * Solo HTTP: lee `req`, llama al service y arma la respuesta.
 */
export class RolesController extends BaseController {
  public constructor(
    private readonly service: RolesService = new RolesService()
  ) {
    super();
  }

  // ================== READ ==================
  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const roles = await this.service.getAll();
      res.status(200).json({ roles });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const role = await this.service.getOne(this.paramId(req));
      res.status(200).json({ role });
    });
  }

  // ================== CREATE ==================
  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const role = await this.service.create(req.body as CreateRoleDto);
      res.status(201).json({ role });
    });
  }

  // ================== UPDATE ==================
  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const role = await this.service.updatePut(
        this.paramId(req),
        req.body as UpdateRoleDto
      );
      res.status(200).json({ role });
    });
  }

  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const role = await this.service.updatePatch(
        this.paramId(req),
        req.body as PatchRoleDto
      );
      res.status(200).json({ role });
    });
  }

  // ================== DELETE ==================
  /** Eliminación física. */
  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.deletePhysical(id);
      res.status(200).json({ message: "Role permanently deleted", id });
    });
  }

  /** Eliminación lógica -> `status = inactive`. */
  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const role = await this.service.deleteLogical(this.paramId(req));
      res.status(200).json({ message: "Role deactivated (logical delete)", role });
    });
  }
}
EOF
```

```bash
: > src/features/auth/roles/roles.routes.ts
cat >> src/features/auth/roles/roles.routes.ts << 'EOF'
import { Application } from "express";
import { RolesController } from "./roles.controller";
import { authenticate, authorize } from "../access";

/** Rutas del feature Roles — **modalidad 3 (JWT + RBAC)** en todas las operaciones. */
export class RolesRoutes {
  public rolesController: RolesController = new RolesController();

  public routes(app: Application): void {
    // getAll
    app
      .route("/api/roles")
      .get(authenticate, authorize, this.rolesController.getAll.bind(this.rolesController));

    // getOne
    app
      .route("/api/roles/:id")
      .get(authenticate, authorize, this.rolesController.getOne.bind(this.rolesController));

    // create
    app
      .route("/api/roles")
      .post(authenticate, authorize, this.rolesController.create.bind(this.rolesController));

    // update (PUT / PATCH)
    app
      .route("/api/roles/:id")
      .put(authenticate, authorize, this.rolesController.updatePut.bind(this.rolesController))
      .patch(authenticate, authorize, this.rolesController.updatePatch.bind(this.rolesController));

    // delete físico
    app
      .route("/api/roles/:id")
      .delete(
        authenticate,
        authorize,
        this.rolesController.deletePhysical.bind(this.rolesController)
      );

    // delete lógico
    app
      .route("/api/roles/:id/deactivate")
      .patch(authenticate, authorize, this.rolesController.deleteLogical.bind(this.rolesController));
  }
}
EOF
```

## 21.3 Feature Roles — seeder y swagger

```bash
: > src/features/auth/roles/roles.seeder.ts
cat >> src/features/auth/roles/roles.seeder.ts << 'EOF'
import { Role } from "./role.model";

/**
 * Roles definidos por CelebraHub.
 *
 * La matriz de permisos se construye después, en resource_roles.
 */
export const SEED_ROLES = [
  {
    name: "ADMIN",
    description: "Administración completa de CelebraHub",
  },
  {
    name: "COMERCIAL",
    description: "Gestión comercial de clientes, reservas y cotizaciones",
  },
  {
    name: "OPERACIONES",
    description: "Gestión operativa de salones, eventos y servicios",
  },
  {
    name: "PROVEEDOR",
    description: "Gestión de proveedores y servicios asociados",
  },
  {
    name: "CARTERA",
    description: "Gestión de contratos, pagos y procesos de cartera",
  },
] as const;

export async function seedRoles(): Promise<number> {
  let created = 0;

  for (const item of SEED_ROLES) {
    const [role, wasCreated] = await Role.findOrCreate({
      where: { name: item.name },
      defaults: {
        name: item.name,
        description: item.description,
        status: "active",
      },
    });

    if (wasCreated) {
      created++;
      continue;
    }

    if (role.status !== "active") {
      await role.update({ status: "active" });
    }
  }

  console.log(
    `✅ roles: catálogo reconciliado (${SEED_ROLES.length} roles, ${created} nuevos)`
  );

  return created;
}
EOF
```

```bash
: > src/features/auth/roles/roles.swagger.ts
cat >> src/features/auth/roles/roles.swagger.ts << 'EOF'
import {
  bearerSecurity,
  forbiddenResponse,
  invalidIdResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "../../../shared/http/swagger-security";

/**
 * Documentación OpenAPI del feature Roles.
 *
 * Modalidad: **JWT + RBAC** en todas las operaciones.
 *
 * Recordatorio de diseño: el **nombre** del rol no autoriza nada. Un rol
 * `ADMIN` sin concesiones activas no habilita ninguna operación; la autorización
 * se decide por las filas de `resource_roles`.
 */
export const rolesSwagger = {
  tags: [
    { name: "Roles", description: "CRUD de roles (agrupadores de permisos) — **JWT + RBAC**" },
  ],
  paths: {
    "/api/roles": {
      get: {
        tags: ["Roles"],
        summary: "Listar roles activos",
        description: "JWT + RBAC — recurso `GET /api/roles`.",
        security: bearerSecurity,
        responses: {
          "200": { description: "Lista de roles (`{ roles: [...] }`)" },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
        },
      },
      post: {
        tags: ["Roles"],
        summary: "Crear rol",
        description:
          "JWT + RBAC — recurso `POST /api/roles`. El rol nace **sin permisos**: se conceden con `POST /api/concesiones-rol`.",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RoleCreate" } },
          },
        },
        responses: {
          "201": { description: "Rol creado (`{ role }`)" },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "409": { description: "Nombre de rol ya en uso" },
        },
      },
    },
    "/api/roles/{id}": {
      get: {
        tags: ["Roles"],
        summary: "Obtener rol por id",
        description: "JWT + RBAC — recurso `GET /api/roles/:id`.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Rol (`{ role }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
      put: {
        tags: ["Roles"],
        summary: "Reemplazar rol (PUT)",
        description: "JWT + RBAC — recurso `PUT /api/roles/:id`.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RoleUpdate" } },
          },
        },
        responses: {
          "200": { description: "Rol actualizado (`{ role }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
      patch: {
        tags: ["Roles"],
        summary: "Modificar rol (PATCH)",
        description: "JWT + RBAC — recurso `PATCH /api/roles/:id`.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RolePatch" } },
          },
        },
        responses: {
          "200": { description: "Rol actualizado (`{ role }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
      delete: {
        tags: ["Roles"],
        summary: "Eliminar rol (físico)",
        description: "JWT + RBAC — recurso `DELETE /api/roles/:id`.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Eliminado (`{ message, id }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
    "/api/roles/{id}/deactivate": {
      patch: {
        tags: ["Roles"],
        summary: "Desactivar rol (borrado lógico)",
        description:
          "JWT + RBAC — recurso `PATCH /api/roles/:id/deactivate`. " +
          "Efecto inmediato: todos los usuarios de ese rol pierden sus permisos (eslabón `roles` inactivo -> DENY).",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Desactivado (`{ message, role }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
  },
  components: {
    schemas: {
      Role: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "COMERCIAL" },
          description: { type: "string", nullable: true },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RoleCreate: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "OPERACIONES" },
          description: { type: "string", nullable: true },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      RoleUpdate: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          description: { type: "string", nullable: true },
        },
      },
      RolePatch: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string", nullable: true },
        },
      },
    },
  },
};
EOF
```

## 21.4 Feature Resources — DTOs y catálogo semilla

El catálogo de recursos se adapta completamente a las rutas reales de CelebraHub.
Las tablas de negocio existentes no se modifican; `resources` solamente registra
qué operaciones HTTP pueden ser protegidas por RBAC.

> **Criterio de adaptación:** el PDF de CelebraHub define los cinco roles
> `ADMIN`, `COMERCIAL`, `OPERACIONES`, `PROVEEDOR` y `CARTERA`, pero no entrega
> una matriz detallada de permisos por endpoint. Por eso esta primera matriz es
> una **política inicial de trabajo** basada en la responsabilidad de cada rol.
> Puede modificarse posteriormente desde `resource_roles` sin cambiar el código
> de negocio.

```bash
: > src/features/auth/resources/resource-catalog.ts
cat >> src/features/auth/resources/resource-catalog.ts << 'EOF'
export interface CatalogResource {
  method: string;
  path: string;
  description: string;
}

export const RESOURCE_CATALOG: readonly CatalogResource[] = [
  // ==================== CLIENTES ====================
  { method: "GET", path: "/api/clientes", description: "Listar clientes" },
  { method: "GET", path: "/api/clientes/:id", description: "Consultar cliente" },
  { method: "POST", path: "/api/clientes", description: "Crear cliente" },
  { method: "PUT", path: "/api/clientes/:id", description: "Reemplazar cliente" },
  { method: "PATCH", path: "/api/clientes/:id", description: "Modificar cliente" },
  { method: "DELETE", path: "/api/clientes/:id", description: "Eliminar cliente" },
  { method: "PATCH", path: "/api/clientes/:id/deactivate", description: "Desactivar cliente" },

  // ==================== SERVICIOS ====================
  { method: "GET", path: "/api/servicios", description: "Listar servicios" },
  { method: "GET", path: "/api/servicios/:id", description: "Consultar servicio" },
  { method: "POST", path: "/api/servicios", description: "Crear servicio" },
  { method: "PUT", path: "/api/servicios/:id", description: "Reemplazar servicio" },
  { method: "PATCH", path: "/api/servicios/:id", description: "Modificar servicio" },
  { method: "DELETE", path: "/api/servicios/:id", description: "Eliminar servicio" },
  { method: "PATCH", path: "/api/servicios/:id/deactivate", description: "Desactivar servicio" },

  // ==================== SALONES ====================
  { method: "GET", path: "/api/salones", description: "Listar salones" },
  { method: "GET", path: "/api/salones/:id", description: "Consultar salón" },
  { method: "POST", path: "/api/salones", description: "Crear salón" },
  { method: "PUT", path: "/api/salones/:id", description: "Reemplazar salón" },
  { method: "PATCH", path: "/api/salones/:id", description: "Modificar salón" },
  { method: "DELETE", path: "/api/salones/:id", description: "Eliminar salón" },
  { method: "PATCH", path: "/api/salones/:id/deactivate", description: "Desactivar salón" },

  // ==================== RESERVAS ====================
  { method: "GET", path: "/api/reservas", description: "Listar reservas" },
  { method: "GET", path: "/api/reservas/:id", description: "Consultar reserva" },
  { method: "POST", path: "/api/reservas", description: "Crear reserva" },
  { method: "PUT", path: "/api/reservas/:id", description: "Reemplazar reserva" },
  { method: "PATCH", path: "/api/reservas/:id", description: "Modificar reserva" },
  { method: "DELETE", path: "/api/reservas/:id", description: "Eliminar reserva" },

  // ==================== EVENTOS ====================
  { method: "GET", path: "/api/eventos", description: "Listar eventos" },
  { method: "GET", path: "/api/eventos/:id", description: "Consultar evento" },
  { method: "POST", path: "/api/eventos", description: "Crear evento" },
  { method: "PUT", path: "/api/eventos/:id", description: "Reemplazar evento" },
  { method: "PATCH", path: "/api/eventos/:id", description: "Modificar evento" },
  { method: "DELETE", path: "/api/eventos/:id", description: "Eliminar evento" },

  // ==================== PROVEEDORES ====================
  { method: "GET", path: "/api/proveedores", description: "Listar proveedores" },
  { method: "GET", path: "/api/proveedores/:id", description: "Consultar proveedor" },
  { method: "POST", path: "/api/proveedores", description: "Crear proveedor" },
  { method: "PUT", path: "/api/proveedores/:id", description: "Reemplazar proveedor" },
  { method: "PATCH", path: "/api/proveedores/:id", description: "Modificar proveedor" },
  { method: "DELETE", path: "/api/proveedores/:id", description: "Eliminar proveedor" },
  { method: "PATCH", path: "/api/proveedores/:id/deactivate", description: "Desactivar proveedor" },

  // ==================== EVENTO-SERVICIOS ====================
  { method: "GET", path: "/api/evento-servicios", description: "Listar servicios de eventos" },
  { method: "GET", path: "/api/evento-servicios/:id", description: "Consultar servicio de evento" },
  { method: "POST", path: "/api/evento-servicios", description: "Crear servicio de evento" },
  { method: "PUT", path: "/api/evento-servicios/:id", description: "Reemplazar servicio de evento" },
  { method: "PATCH", path: "/api/evento-servicios/:id", description: "Modificar servicio de evento" },
  { method: "DELETE", path: "/api/evento-servicios/:id", description: "Eliminar servicio de evento" },

  // ==================== CONTRATOS ====================
  { method: "GET", path: "/api/contratos", description: "Listar contratos" },
  { method: "GET", path: "/api/contratos/:id", description: "Consultar contrato" },
  { method: "POST", path: "/api/contratos", description: "Crear contrato" },
  { method: "PUT", path: "/api/contratos/:id", description: "Reemplazar contrato" },
  { method: "PATCH", path: "/api/contratos/:id", description: "Modificar contrato" },
  { method: "DELETE", path: "/api/contratos/:id", description: "Eliminar contrato" },

  // ==================== PAGOS ====================
  { method: "GET", path: "/api/pagos", description: "Listar pagos" },
  { method: "GET", path: "/api/pagos/:id", description: "Consultar pago" },
  { method: "POST", path: "/api/pagos", description: "Registrar pago" },
  { method: "PUT", path: "/api/pagos/:id", description: "Reemplazar pago" },
  { method: "PATCH", path: "/api/pagos/:id", description: "Modificar pago" },
  { method: "DELETE", path: "/api/pagos/:id", description: "Eliminar pago" },

  // ==================== CAMBIOS DE CONTRATO ====================
  { method: "GET", path: "/api/cambios-contrato", description: "Listar cambios de contrato" },
  { method: "GET", path: "/api/cambios-contrato/:id", description: "Consultar cambio de contrato" },
  { method: "POST", path: "/api/cambios-contrato", description: "Crear cambio de contrato" },
  { method: "PUT", path: "/api/cambios-contrato/:id", description: "Reemplazar cambio de contrato" },
  { method: "PATCH", path: "/api/cambios-contrato/:id", description: "Modificar cambio de contrato" },
  { method: "DELETE", path: "/api/cambios-contrato/:id", description: "Eliminar cambio de contrato" },
  { method: "PATCH", path: "/api/cambios-contrato/:id/deactivate", description: "Desactivar cambio de contrato" },

  // ==================== CANCELACIONES ====================
  { method: "GET", path: "/api/cancelaciones", description: "Listar cancelaciones" },
  { method: "GET", path: "/api/cancelaciones/:id", description: "Consultar cancelación" },
  { method: "POST", path: "/api/cancelaciones", description: "Crear cancelación" },
  { method: "PUT", path: "/api/cancelaciones/:id", description: "Reemplazar cancelación" },
  { method: "PATCH", path: "/api/cancelaciones/:id", description: "Modificar cancelación" },
  { method: "DELETE", path: "/api/cancelaciones/:id", description: "Eliminar cancelación" },

  // ==================== USUARIOS ====================
  { method: "GET", path: "/api/usuarios", description: "Listar usuarios" },
  { method: "GET", path: "/api/usuarios/:id", description: "Consultar usuario" },
  { method: "POST", path: "/api/usuarios", description: "Crear usuario" },
  { method: "PUT", path: "/api/usuarios/:id", description: "Reemplazar usuario" },
  { method: "PATCH", path: "/api/usuarios/:id", description: "Modificar usuario" },
  { method: "DELETE", path: "/api/usuarios/:id", description: "Eliminar usuario" },
  { method: "PATCH", path: "/api/usuarios/:id/deactivate", description: "Desactivar usuario" },
  { method: "PATCH", path: "/api/usuarios/:id/password", description: "Cambiar contraseña" },
  { method: "GET", path: "/api/usuarios/:id/permisos", description: "Consultar permisos efectivos" },

  // ==================== ROLES ====================
  { method: "GET", path: "/api/roles", description: "Listar roles" },
  { method: "GET", path: "/api/roles/:id", description: "Consultar rol" },
  { method: "POST", path: "/api/roles", description: "Crear rol" },
  { method: "PUT", path: "/api/roles/:id", description: "Reemplazar rol" },
  { method: "PATCH", path: "/api/roles/:id", description: "Modificar rol" },
  { method: "DELETE", path: "/api/roles/:id", description: "Eliminar rol" },
  { method: "PATCH", path: "/api/roles/:id/deactivate", description: "Desactivar rol" },

  // ==================== RECURSOS ====================
  { method: "GET", path: "/api/recursos", description: "Listar recursos" },
  { method: "GET", path: "/api/recursos/:id", description: "Consultar recurso" },
  { method: "POST", path: "/api/recursos", description: "Crear recurso" },
  { method: "PUT", path: "/api/recursos/:id", description: "Reemplazar recurso" },
  { method: "PATCH", path: "/api/recursos/:id", description: "Modificar recurso" },
  { method: "DELETE", path: "/api/recursos/:id", description: "Eliminar recurso" },
  { method: "PATCH", path: "/api/recursos/:id/deactivate", description: "Desactivar recurso" },

  // ==================== USUARIO ↔ ROL ====================
  { method: "GET", path: "/api/asignaciones-rol", description: "Listar asignaciones usuario-rol" },
  { method: "GET", path: "/api/asignaciones-rol/:id", description: "Consultar asignación usuario-rol" },
  { method: "POST", path: "/api/asignaciones-rol", description: "Asignar rol a usuario" },
  { method: "PATCH", path: "/api/asignaciones-rol/:id/deactivate", description: "Retirar rol a usuario" },
  { method: "PATCH", path: "/api/asignaciones-rol/:id/reactivate", description: "Reactivar rol a usuario" },

  // ==================== ROL ↔ RECURSO ====================
  { method: "GET", path: "/api/concesiones-rol", description: "Listar concesiones rol-recurso" },
  { method: "GET", path: "/api/concesiones-rol/:id", description: "Consultar concesión rol-recurso" },
  { method: "POST", path: "/api/concesiones-rol", description: "Conceder recurso a rol" },
  { method: "PATCH", path: "/api/concesiones-rol/:id/deactivate", description: "Retirar recurso a rol" },
  { method: "PATCH", path: "/api/concesiones-rol/:id/reactivate", description: "Reactivar recurso a rol" },
];

/**
 * Matriz inicial por responsabilidad funcional.
 *
 * ADMIN recibe todos los recursos.
 * Las otras cuatro listas son una política inicial de CelebraHub; la base RBAC
 * permite cambiarla sin tocar los módulos de negocio.
 */
export const COMERCIAL_RESOURCES = RESOURCE_CATALOG.filter((resource) =>
  [
    "/api/clientes",
    "/api/clientes/:id",
    "/api/reservas",
    "/api/reservas/:id",
    "/api/eventos",
    "/api/eventos/:id",
    "/api/servicios",
    "/api/servicios/:id",
  ].includes(resource.path)
);

export const OPERACIONES_RESOURCES = RESOURCE_CATALOG.filter((resource) =>
  [
    "/api/salones",
    "/api/salones/:id",
    "/api/reservas",
    "/api/reservas/:id",
    "/api/eventos",
    "/api/eventos/:id",
    "/api/servicios",
    "/api/servicios/:id",
    "/api/evento-servicios",
    "/api/evento-servicios/:id",
  ].includes(resource.path)
);

export const PROVEEDOR_RESOURCES = RESOURCE_CATALOG.filter((resource) =>
  [
    "/api/proveedores",
    "/api/proveedores/:id",
    "/api/evento-servicios",
    "/api/evento-servicios/:id",
  ].includes(resource.path)
);

export const CARTERA_RESOURCES = RESOURCE_CATALOG.filter((resource) =>
  [
    "/api/contratos",
    "/api/contratos/:id",
    "/api/pagos",
    "/api/pagos/:id",
    "/api/cambios-contrato",
    "/api/cambios-contrato/:id",
    "/api/cancelaciones",
    "/api/cancelaciones/:id",
  ].includes(resource.path)
);
EOF
```

### Composición del catálogo

| Grupo | Recursos aproximados |
|---|---:|
| Clientes | 7 |
| Servicios | 7 |
| Salones | 7 |
| Reservas | 6 |
| Eventos | 6 |
| Proveedores | 7 |
| Evento-Servicios | 6 |
| Contratos | 6 |
| Pagos | 6 |
| Cambios de contrato | 7 |
| Cancelaciones | 6 |
| Usuarios | 9 |
| Roles | 7 |
| Recursos | 7 |
| Asignaciones usuario-rol | 5 |
| Concesiones rol-recurso | 5 |
| **Total** | **104** |

> Las operaciones de sesión (`/api/sesion/*`, `/api/sesiones/*`) siguen fuera de la matriz RBAC, igual que en el manual.

## 21.5 Feature Resources — repository, service, controller y rutas

```bash
: > src/features/auth/resources/resources.repository.ts
cat >> src/features/auth/resources/resources.repository.ts << 'EOF'
import { CreationAttributes, Transaction } from "sequelize";
import { Resource } from "./resource.model";
import { normalizePath } from "../../../shared/auth/resource-match";

/**
 * Capa Repository del feature Resources.
 * Única que habla con Sequelize (el modelo `Resource`).
 */
export class ResourcesRepository {
  /** Todos los recursos activos. */
  public async findAllActive(): Promise<Resource[]> {
    return Resource.findAll({ where: { status: "active" } });
  }

  /** Un recurso por PK (o `null`). */
  public async findById(id: number, transaction?: Transaction): Promise<Resource | null> {
    return Resource.findByPk(id, { transaction });
  }

  /** Un recurso por su par `(method, path)` (o `null`). */
  public async findByOperation(method: string, path: string): Promise<Resource | null> {
    return Resource.findOne({
      where: { method: method.trim().toUpperCase(), path: normalizePath(path.trim()) },
    });
  }

  /** Inserta un recurso. */
  public async create(data: CreationAttributes<Resource>): Promise<Resource> {
    return Resource.create(data);
  }

  /** Persiste cambios sobre una instancia existente. */
  public async update(resource: Resource, data: Partial<Resource>): Promise<Resource> {
    return resource.update(data);
  }

  /** Elimina físicamente una instancia. */
  public async delete(resource: Resource): Promise<void> {
    await resource.destroy();
  }
}
EOF
```

```bash
: > src/features/auth/resources/resources.service.ts
cat >> src/features/auth/resources/resources.service.ts << 'EOF'
import {
  CreateResourceDto,
  PatchResourceDto,
  ResourceResponseDto,
  UpdateResourceDto,
  toResourceResponse,
} from "./dto";
import { ResourcesRepository } from "./resources.repository";
import { Resource } from "./resource.model";
import { AppError } from "../../../shared/errors/app-error";

/**
 * Capa Service del feature Resources.
 *
 * Reglas de negocio: la tupla `(method, path)` es única. Se comprueba antes de
 * escribir para responder 409 con un mensaje útil en lugar de dejar reventar la
 * restricción única de la base de datos como 500.
 */
export class ResourcesService {
  public constructor(
    private readonly repository: ResourcesRepository = new ResourcesRepository()
  ) {}

  // ================== READ ==================
  public async getAll(): Promise<ResourceResponseDto[]> {
    const resources = await this.repository.findAllActive();
    return resources.map((resource) => toResourceResponse(resource));
  }

  public async getOne(id: number): Promise<ResourceResponseDto> {
    return toResourceResponse(await this.findOrFail(id));
  }

  // ================== CREATE ==================
  public async create(body: CreateResourceDto): Promise<ResourceResponseDto> {
    if (!body.method || !body.path) {
      throw new AppError(400, "method and path are required");
    }
    await this.assertOperationAvailable(body.method, body.path);

    const resource = await this.repository.create({
      method: body.method,
      path: body.path,
      description: body.description ?? null,
      status: body.status ?? "active",
    });
    return toResourceResponse(resource);
  }

  // ================== UPDATE ==================
  public async updatePut(id: number, body: UpdateResourceDto): Promise<ResourceResponseDto> {
    const resource = await this.findOrFail(id);
    await this.assertOperationAvailable(body.method, body.path, id);

    await this.repository.update(resource, {
      method: body.method,
      path: body.path,
      description: body.description ?? null,
    });
    return toResourceResponse(resource);
  }

  public async updatePatch(id: number, body: PatchResourceDto): Promise<ResourceResponseDto> {
    const resource = await this.findOrFail(id);

    const method = body.method ?? resource.method;
    const path = body.path ?? resource.path;
    await this.assertOperationAvailable(method, path, id);

    await this.repository.update(resource, body);
    return toResourceResponse(resource);
  }

  // ================== DELETE ==================
  /** Eliminación física. */
  public async deletePhysical(id: number): Promise<void> {
    const resource = await this.findOrFail(id, false);
    await this.repository.delete(resource);
  }

  /** Eliminación lógica -> `status = inactive`. Deshabilita el punto de acceso. */
  public async deleteLogical(id: number): Promise<ResourceResponseDto> {
    const resource = await this.findOrFail(id);
    await this.repository.update(resource, { status: "inactive" });
    return toResourceResponse(resource);
  }

  // ================== HELPERS ==================
  private async findOrFail(id: number, onlyActive = true): Promise<Resource> {
    const resource = await this.repository.findById(id);
    if (!resource || (onlyActive && resource.status !== "active")) {
      throw new AppError(404, "Resource not found");
    }
    return resource;
  }

  /** 409 si otro recurso ya declara el mismo `(method, path)`. */
  private async assertOperationAvailable(
    method: string,
    path: string,
    excludeId?: number
  ): Promise<void> {
    const existing = await this.repository.findByOperation(method, path);
    if (existing && existing.id !== excludeId) {
      throw new AppError(409, `Resource ${method.toUpperCase()} ${path} already exists`);
    }
  }
}
EOF
```

```bash
: > src/features/auth/resources/resources.controller.ts
cat >> src/features/auth/resources/resources.controller.ts << 'EOF'
import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import {
  CreateResourceDto,
  PatchResourceDto,
  UpdateResourceDto,
} from "./dto";
import { ResourcesService } from "./resources.service";

/**
 * Capa Controller del feature Resources.
 * Solo HTTP: lee `req`, llama al service y arma la respuesta.
 */
export class ResourcesController extends BaseController {
  public constructor(
    private readonly service: ResourcesService = new ResourcesService()
  ) {
    super();
  }

  // ================== READ ==================
  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const resources = await this.service.getAll();
      res.status(200).json({ resources });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const resource = await this.service.getOne(this.paramId(req));
      res.status(200).json({ resource });
    });
  }

  // ================== CREATE ==================
  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const resource = await this.service.create(req.body as CreateResourceDto);
      res.status(201).json({ resource });
    });
  }

  // ================== UPDATE ==================
  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const resource = await this.service.updatePut(
        this.paramId(req),
        req.body as UpdateResourceDto
      );
      res.status(200).json({ resource });
    });
  }

  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const resource = await this.service.updatePatch(
        this.paramId(req),
        req.body as PatchResourceDto
      );
      res.status(200).json({ resource });
    });
  }

  // ================== DELETE ==================
  /** Eliminación física. */
  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.deletePhysical(id);
      res.status(200).json({ message: "Resource permanently deleted", id });
    });
  }

  /** Eliminación lógica -> `status = inactive`. */
  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const resource = await this.service.deleteLogical(this.paramId(req));
      res.status(200).json({ message: "Resource deactivated (logical delete)", resource });
    });
  }
}
EOF
```

```bash
: > src/features/auth/resources/resources.routes.ts
cat >> src/features/auth/resources/resources.routes.ts << 'EOF'
import { Application } from "express";
import { ResourcesController } from "./resources.controller";
import { authenticate, authorize } from "../access";

/** Rutas del feature Resources — **modalidad 3 (JWT + RBAC)** en todas las operaciones. */
export class ResourcesRoutes {
  public resourcesController: ResourcesController = new ResourcesController();

  public routes(app: Application): void {
    // getAll
    app
      .route("/api/recursos")
      .get(authenticate, authorize, this.resourcesController.getAll.bind(this.resourcesController));

    // getOne
    app
      .route("/api/recursos/:id")
      .get(authenticate, authorize, this.resourcesController.getOne.bind(this.resourcesController));

    // create
    app
      .route("/api/recursos")
      .post(authenticate, authorize, this.resourcesController.create.bind(this.resourcesController));

    // update (PUT / PATCH)
    app
      .route("/api/recursos/:id")
      .put(
        authenticate,
        authorize,
        this.resourcesController.updatePut.bind(this.resourcesController)
      )
      .patch(
        authenticate,
        authorize,
        this.resourcesController.updatePatch.bind(this.resourcesController)
      );

    // delete físico
    app
      .route("/api/recursos/:id")
      .delete(
        authenticate,
        authorize,
        this.resourcesController.deletePhysical.bind(this.resourcesController)
      );

    // delete lógico
    app
      .route("/api/recursos/:id/deactivate")
      .patch(
        authenticate,
        authorize,
        this.resourcesController.deleteLogical.bind(this.resourcesController)
      );
  }
}
EOF
```

> POST /api/recursos con un (method, path) ya existente → 409: lo impone la restricción UQ(method, path).

## 21.6 Feature Resources — seeder y swagger

El seeder es idempotente y reconciliador: findOrCreate por (method, path) y reactivación si la fila estaba inactiva. Reejecutarlo deja el catálogo exacto, sin duplicados.

```bash
: > src/features/auth/resources/resources.seeder.ts
cat >> src/features/auth/resources/resources.seeder.ts << 'EOF'
import { Resource } from "./resource.model";
import { RESOURCE_CATALOG } from "./resource-catalog";

/**
 * Seeder del catálogo de recursos (`resources`).
 *
 * A diferencia de los seeders de business, este **no usa datos aleatorios**: los
 * 58 recursos son un catálogo determinista definido en `resource-catalog.ts`.
 * Es idempotente por partida doble: `findOrCreate` por `(method, path)` y
 * reactivación de las filas que ya existían inactivas, de modo que volver a
 * ejecutarlo reconcilia el catálogo sin duplicar ni perder concesiones.
 */
export async function seedResources(): Promise<number> {
  let created = 0;

  for (const item of RESOURCE_CATALOG) {
    const [resource, wasCreated] = await Resource.findOrCreate({
      where: { method: item.method, path: item.path },
      defaults: {
        method: item.method,
        path: item.path,
        description: item.description,
        status: "active",
      },
    });

    if (wasCreated) {
      created++;
      continue;
    }
    if (resource.status !== "active") {
      await resource.update({ status: "active" });
    }
  }

  console.log(
    `✅ resources: catálogo reconciliado (${RESOURCE_CATALOG.length} recursos, ${created} nuevos)`
  );
  return created;
}
EOF
```

```bash
: > src/features/auth/resources/resources.swagger.ts
cat >> src/features/auth/resources/resources.swagger.ts << 'EOF'
import {
  bearerSecurity,
  forbiddenResponse,
  invalidIdResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "../../../shared/http/swagger-security";

/**
 * Documentación OpenAPI del feature Resources.
 *
 * Modalidad: **JWT + RBAC** en todas las operaciones.
 *
 * Un recurso es un par `(method, path)` con la ruta **en patrón**
 * (`/api/reservas/:id`). `GET` y `POST` sobre la misma ruta son dos recursos
 * distintos y se conceden por separado.
 */
export const resourcesSwagger = {
  tags: [
    {
      name: "Recursos",
      description:
        "Catálogo de puntos de acceso protegibles: par `(method, path)` — **JWT + RBAC**",
    },
  ],
  paths: {
    "/api/recursos": {
      get: {
        tags: ["Recursos"],
        summary: "Listar recursos activos",
        description: "JWT + RBAC — recurso `GET /api/recursos`.",
        security: bearerSecurity,
        responses: {
          "200": { description: "Lista de recursos (`{ resources: [...] }`)" },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
        },
      },
      post: {
        tags: ["Recursos"],
        summary: "Crear recurso",
        description:
          "JWT + RBAC — recurso `POST /api/recursos`. Alta de un nuevo punto de acceso; concederlo a un rol no requiere desplegar código.",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ResourceCreate" } },
          },
        },
        responses: {
          "201": { description: "Recurso creado (`{ resource }`)" },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "409": { description: "La tupla `(method, path)` ya existe" },
        },
      },
    },
    "/api/recursos/{id}": {
      get: {
        tags: ["Recursos"],
        summary: "Obtener recurso por id",
        description: "JWT + RBAC — recurso `GET /api/recursos/:id`.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Recurso (`{ resource }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
      put: {
        tags: ["Recursos"],
        summary: "Reemplazar recurso (PUT)",
        description: "JWT + RBAC — recurso `PUT /api/recursos/:id`.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ResourceUpdate" } },
          },
        },
        responses: {
          "200": { description: "Recurso actualizado (`{ resource }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
      patch: {
        tags: ["Recursos"],
        summary: "Modificar recurso (PATCH)",
        description: "JWT + RBAC — recurso `PATCH /api/recursos/:id`.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ResourcePatch" } },
          },
        },
        responses: {
          "200": { description: "Recurso actualizado (`{ resource }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
      delete: {
        tags: ["Recursos"],
        summary: "Eliminar recurso (físico)",
        description: "JWT + RBAC — recurso `DELETE /api/recursos/:id`.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Eliminado (`{ message, id }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
    "/api/recursos/{id}/deactivate": {
      patch: {
        tags: ["Recursos"],
        summary: "Desactivar recurso (borrado lógico)",
        description:
          "JWT + RBAC — recurso `PATCH /api/recursos/:id/deactivate`. " +
          "Efecto inmediato: ningún rol puede autorizar ese punto de acceso (eslabón `resources` inactivo -> DENY).",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Desactivado (`{ message, resource }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
  },
  components: {
    schemas: {
      Resource: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"], example: "GET" },
          path: { type: "string", example: "/api/reservas/:id" },
          description: { type: "string", nullable: true },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ResourceCreate: {
        type: "object",
        required: ["method", "path"],
        properties: {
          method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
          path: { type: "string", example: "/api/reportes/:id" },
          description: { type: "string", nullable: true },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      ResourceUpdate: {
        type: "object",
        required: ["method", "path"],
        properties: {
          method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
          path: { type: "string" },
          description: { type: "string", nullable: true },
        },
      },
      ResourcePatch: {
        type: "object",
        properties: {
          method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
          path: { type: "string" },
          description: { type: "string", nullable: true },
        },
      },
    },
  },
};
EOF
```

## 21.7 Pruebas HTTP

```bash
: > src/features/auth/roles/http/roles.get.http
cat >> src/features/auth/roles/http/roles.get.http << 'EOF'
### Feature Roles — CRUD (modalidad JWT + RBAC)
### El NOMBRE del rol no autoriza nada: la autorización son las filas de `resource_roles`.
@baseUrl = http://localhost:4000

# @name loginAdmin
POST {{baseUrl}}/api/sesion/login
Content-Type: application/json

{
  "identifier": "admin",
  "password": "Admin123!"
}

# @name loginComercial
POST {{baseUrl}}/api/sesion/login
Content-Type: application/json

{
  "identifier": "comercial",
  "password": "Comercial123!"
}

@token = {{loginAdmin.response.body.$.access_token}}

### getAll — recurso `GET /api/roles` (ADMIN y COMERCIAL)
GET {{baseUrl}}/api/roles
Authorization: Bearer {{token}}

### getOne
GET {{baseUrl}}/api/roles/1
Authorization: Bearer {{token}}

### CREATE — nace SIN permisos
POST {{baseUrl}}/api/roles
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "AUDITOR",
  "description": "Solo lectura de catálogo"
}

### UPDATE PUT
PUT {{baseUrl}}/api/roles/3
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "AUDITOR",
  "description": "Solo lectura de catálogo y ventas"
}

### UPDATE PATCH
PATCH {{baseUrl}}/api/roles/3
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "description": "Auditoría operativa"
}

### DELETE lógico — efecto inmediato: todos sus usuarios pierden esos permisos (403)
PATCH {{baseUrl}}/api/roles/3/deactivate
Authorization: Bearer {{token}}

### DELETE físico
DELETE {{baseUrl}}/api/roles/3
Authorization: Bearer {{token}}

### 403 — COMERCIAL no tiene concedido `GET /api/roles`
GET {{baseUrl}}/api/roles
Authorization: Bearer {{loginComercial.response.body.$.access_token}}
EOF
```

```bash
: > src/features/auth/resources/http/resources.get.http
cat >> src/features/auth/resources/http/resources.get.http << 'EOF'
### Feature Resources — catálogo de puntos de acceso (modalidad JWT + RBAC)
### Un recurso es el par (method, path) con la ruta EN PATRÓN: /api/reservas/:id
### GET y POST sobre la misma ruta son DOS recursos distintos.
@baseUrl = http://localhost:4000

# @name loginAdmin
POST {{baseUrl}}/api/sesion/login
Content-Type: application/json

{
  "identifier": "admin",
  "password": "Admin123!"
}

@token = {{loginAdmin.response.body.$.access_token}}

### getAll — el catálogo completo (58 recursos sembrados)
GET {{baseUrl}}/api/recursos
Authorization: Bearer {{token}}

### getOne
GET {{baseUrl}}/api/recursos/25
Authorization: Bearer {{token}}

### CREATE — alta de un punto de acceso nuevo
### Concederlo después a un rol no requiere desplegar código.
POST {{baseUrl}}/api/recursos
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "method": "GET",
  "path": "/api/reportes/ventas/:id",
  "description": "Consultar reporte de ventas"
}

### 409 — la tupla (method, path) ya existe
POST {{baseUrl}}/api/recursos
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "method": "GET",
  "path": "/api/clientes",
  "description": "Duplicado"
}

### UPDATE PUT
PUT {{baseUrl}}/api/recursos/59
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "method": "GET",
  "path": "/api/reportes/ventas/:id",
  "description": "Reporte de ventas por id"
}

### DELETE lógico — ningún rol puede ya autorizar ese endpoint (403 para todos)
PATCH {{baseUrl}}/api/recursos/59/deactivate
Authorization: Bearer {{token}}

### DELETE físico
DELETE {{baseUrl}}/api/recursos/59
Authorization: Bearer {{token}}
EOF
```
```bash
npx tsc --noEmit
npm run db:seed
```

```sql
SELECT COUNT(*) FROM resources;   -- 58
SELECT COUNT(*) FROM roles;       -- 2
SELECT name, status FROM roles;   -- ADMIN, COMERCIAL
```

<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-06 225332.png">
</p>

## 22. ISS-21 — Features RoleUsers y ResourceRoles (asignar roles y conceder permisos)

**Objetivo:** construir las dos tablas pivote que convierten el modelo en autorización real:

```
User   ──(RoleUser)────▶  Role   ──(ResourceRole)────▶  Resource
        «quién tiene        «qué agrupa»       «qué se concede»
         qué rol»
```

Son los métodos que añaden permisos a los recursos (el requisito explícito de la Fase II): sin estas dos features, Role y Resource serían catálogos inertes.

Bloqueado por: ISS-20.

Criterios de aceptación (ISS-21) — consolidados

- [ ] 22.1 role-users/dto/ (create-role-user.dto.ts, role-user-response.dto.ts, index.ts)
- [ ] 22.2 role-users.{repository,service,controller,routes}.ts; POST /api/asignaciones-rol idempotente (reactiva si existía inactiva)
- [ ] 22.3 role-users.seeder.ts (admin→ADMIN, comercial→COMERCIAL) y role-users.swagger.ts
- [ ] 22.4 resource-roles/dto/ (create-resource-role.dto.ts, list-resource-roles.dto.ts, resource-role-response.dto.ts, index.ts)
- [ ] 22.5 resource-roles.{repository,service,controller,routes}.ts; POST /api/concesiones-rol idempotente y /deactivate · /reactivate
- [ ] 22.6 ResourceRolesService.reconcileRole(roleId, resourceIds) determinista (concede lo que falta, reactiva, retira lo que sobra)
- [ ] 22.7 resource-roles.seeder.ts construye la matriz (ADMIN 58, COMERCIAL 7) y resource-roles.swagger.ts
- [ ] 22.8 archivos .http de ambos features
- [ ] npx tsc --noEmit OK

## 22.1 DTOs de RoleUsers

```bash
: > src/features/auth/role-users/dto/create-role-user.dto.ts
cat >> src/features/auth/role-users/dto/create-role-user.dto.ts << 'EOF'
/**
 * Datos de entrada de `POST /api/asignaciones-rol` — **asignar un rol a un usuario**.
 *
 * Es el primer eslabón de la autorización. Se envía la pareja de identificadores;
 * si la asignación ya existía inactiva, se **reactiva** en lugar de duplicarla
 * (la restricción única `(user_id, role_id)` lo garantiza).
 */
export interface CreateRoleUserDto {
  user_id: number;
  role_id: number;
}
EOF
```

```bash
: > src/features/auth/role-users/dto/role-user-response.dto.ts
cat >> src/features/auth/role-users/dto/role-user-response.dto.ts << 'EOF'
import { RoleUser, RoleUserI } from "../role-user.model";

/**
 * Respuesta HTTP de una asignación usuario-rol.
 *
 * Incluye, además de las claves foráneas, un resumen del usuario y del rol
 * (`user`, `role`) para que el consumidor no tenga que hacer dos peticiones
 * extra. La proyección del usuario **excluye la contraseña** por `attributes`
 * en el `include` del repository, no aquí: nunca reserva de la base de datos.
 */
export interface RoleUserResponseDto extends RoleUserI {
  user?: { id: number; username: string; email: string } | null;
  role?: { id: number; name: string } | null;
}

/** Mapper modelo -> DTO de respuesta (objeto plano, con resúmenes si vienen). */
export function toRoleUserResponse(roleUser: RoleUser): RoleUserResponseDto {
  return roleUser.toJSON() as RoleUserResponseDto;
}
EOF
```

```bash
: > src/features/auth/role-users/dto/index.ts
cat >> src/features/auth/role-users/dto/index.ts << 'EOF'
export * from "./create-role-user.dto";
export * from "./role-user-response.dto";
EOF
```

## 22.2 RoleUsers — repository, service, controller y rutas

Asignar un rol es un upsert lógico, no un alta a ciegas:

|Situación de (user_id, role_id) |Resultado|
|--------------------------------|---------|
|No existe	| se crea la fila active|
|Existe active|	409 (ya está asignado)|
|Existe inactive| se reactiva (no se duplica)|

> **No hay borrado físico:** retirar un rol es PATCH /:id/deactivate y la auditoría de quién tuvo qué rol se conserva.

```bash
: > src/features/auth/role-users/role-users.repository.ts
cat >> src/features/auth/role-users/role-users.repository.ts << 'EOF'
import { CreationAttributes, Transaction } from "sequelize";
import { RoleUser } from "./role-user.model";
import { Role } from "../roles/role.model";
import { User } from "../users/user.model";

/** `include` reutilizable: resumen del usuario (sin contraseña) y del rol. */
const SUMMARIES = [
  { model: User, as: "user", attributes: ["id", "username", "email"] },
  { model: Role, as: "role", attributes: ["id", "name"] },
];

/**
 * Capa Repository del feature RoleUsers (tabla `role_users`).
 * Única que habla con Sequelize. La proyección del usuario excluye `password`.
 */
export class RoleUsersRepository {
  /** Asignaciones activas (con resumen de usuario y rol). */
  public async findAllActive(): Promise<RoleUser[]> {
    return RoleUser.findAll({ where: { status: "active" }, include: SUMMARIES });
  }

  /** Una asignación por PK (o `null`). */
  public async findById(id: number, transaction?: Transaction): Promise<RoleUser | null> {
    return RoleUser.findByPk(id, { include: SUMMARIES, transaction });
  }

  /**
   * La asignación de un usuario a un rol, sea cual sea su estado.
   *
   * Permite la semántica *create-or-reactivate*: si ya existe inactiva, se
   * reactiva en lugar de chocar con la restricción única `(user_id, role_id)`.
   */
  public async findByUserAndRole(userId: number, roleId: number): Promise<RoleUser | null> {
    return RoleUser.findOne({ where: { user_id: userId, role_id: roleId } });
  }

  /** Inserta una asignación. */
  public async create(data: CreationAttributes<RoleUser>): Promise<RoleUser> {
    return RoleUser.create(data);
  }

  /** Persiste cambios sobre una instancia existente. */
  public async update(roleUser: RoleUser, data: Partial<RoleUser>): Promise<RoleUser> {
    return roleUser.update(data);
  }
}
EOF
```

```bash
: > src/features/auth/role-users/role-users.service.ts
cat >> src/features/auth/role-users/role-users.service.ts << 'EOF'
import {
  CreateRoleUserDto,
  RoleUserResponseDto,
  toRoleUserResponse,
} from "./dto";
import { RoleUsersRepository } from "./role-users.repository";
import { RoleUser } from "./role-user.model";
import { UsersRepository } from "../users/users.repository";
import { RolesRepository } from "../roles/roles.repository";
import { AppError } from "../../../shared/errors/app-error";

/**
 * Capa Service del feature RoleUsers — **asignaciones usuario ↔ rol**.
 *
 * Aquí empieza la administración de la autorización. Reglas de negocio:
 *  - Solo se asigna un rol **activo** a un usuario **activo** (un eslabón
 *    inactivo rompería la cadena y el permiso no se concedería de todos modos).
 *  - Asignar es **idempotente**: si la pareja ya existía desactivada, se
 *    reactiva; si ya estaba activa, se informa 409 sin duplicar filas.
 *  - Retirar es un borrado lógico: preserva la auditoría y es reversible.
 *
 * El efecto es inmediato: la próxima petición del usuario vuelve a consultar la
 * cadena RBAC y ya ve (o deja de ver) el permiso. No hay caché que invalidar.
 */
export class RoleUsersService {
  public constructor(
    private readonly repository: RoleUsersRepository = new RoleUsersRepository(),
    private readonly usersRepository: UsersRepository = new UsersRepository(),
    private readonly rolesRepository: RolesRepository = new RolesRepository()
  ) {}

  // ================== READ ==================
  public async getAll(): Promise<RoleUserResponseDto[]> {
    const assignments = await this.repository.findAllActive();
    return assignments.map((assignment) => toRoleUserResponse(assignment));
  }

  public async getOne(id: number): Promise<RoleUserResponseDto> {
    return toRoleUserResponse(await this.findOrFail(id));
  }

  // ================== CREATE (asignar) ==================
  /** Asigna un rol a un usuario (o reactiva la asignación existente). */
  public async assign(body: CreateRoleUserDto): Promise<RoleUserResponseDto> {
    if (!body.user_id || !body.role_id) {
      throw new AppError(400, "user_id and role_id are required");
    }

    await this.assertUserActive(body.user_id);
    await this.assertRoleActive(body.role_id);

    const existing = await this.repository.findByUserAndRole(body.user_id, body.role_id);
    if (existing) {
      if (existing.status === "active") {
        throw new AppError(409, "Role is already assigned to this user");
      }
      const reactivated = await this.repository.update(existing, { status: "active" });
      return toRoleUserResponse(await this.reload(reactivated.id));
    }

    const created = await this.repository.create({
      user_id: body.user_id,
      role_id: body.role_id,
      status: "active",
    });
    return toRoleUserResponse(await this.reload(created.id));
  }

  // ================== STATE (retirar / reactivar) ==================
  /** Retirar el rol -> `status = inactive`. El usuario pierde los permisos del rol. */
  public async deactivate(id: number): Promise<RoleUserResponseDto> {
    const assignment = await this.findOrFail(id);
    await this.repository.update(assignment, { status: "inactive" });
    return toRoleUserResponse(await this.reload(assignment.id));
  }

  /** Reactivar la asignación. */
  public async reactivate(id: number): Promise<RoleUserResponseDto> {
    const assignment = await this.findOrFail(id, false);
    if (assignment.status === "active") {
      throw new AppError(409, "Assignment is already active");
    }
    await this.repository.update(assignment, { status: "active" });
    return toRoleUserResponse(await this.reload(assignment.id));
  }

  // ================== HELPERS ==================
  private async findOrFail(id: number, onlyActive = true): Promise<RoleUser> {
    const assignment = await this.repository.findById(id);
    if (!assignment || (onlyActive && assignment.status !== "active")) {
      throw new AppError(404, "Role assignment not found");
    }
    return assignment;
  }

  /** Recarga con los `include` de resumen (el `findById` ya los trae). */
  private async reload(id: number): Promise<RoleUser> {
    const assignment = await this.repository.findById(id);
    if (!assignment) {
      throw new AppError(404, "Role assignment not found");
    }
    return assignment;
  }

  private async assertUserActive(userId: number): Promise<void> {
    const user = await this.usersRepository.findById(userId);
    if (!user || user.status !== "active") {
      throw new AppError(404, "User not found or inactive");
    }
  }

  private async assertRoleActive(roleId: number): Promise<void> {
    const role = await this.rolesRepository.findById(roleId);
    if (!role || role.status !== "active") {
      throw new AppError(404, "Role not found or inactive");
    }
  }
}
EOF
```

```bash
: > src/features/auth/role-users/role-users.controller.ts
cat >> src/features/auth/role-users/role-users.controller.ts << 'EOF'
import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { CreateRoleUserDto } from "./dto";
import { RoleUsersService } from "./role-users.service";

/**
 * Capa Controller del feature RoleUsers.
 *
 * Orden de operaciones (el mismo patrón del proyecto):
 * getAll → getOne → assign (create) → deactivate → reactivate.
 * No expone borrado físico: la revocación es lógica para preservar auditoría.
 */
export class RoleUsersController extends BaseController {
  public constructor(
    private readonly service: RoleUsersService = new RoleUsersService()
  ) {
    super();
  }

  // ================== READ ==================
  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const assignments = await this.service.getAll();
      res.status(200).json({ assignments });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const assignment = await this.service.getOne(this.paramId(req));
      res.status(200).json({ assignment });
    });
  }

  // ================== CREATE (asignar) ==================
  public async assign(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const assignment = await this.service.assign(req.body as CreateRoleUserDto);
      res.status(201).json({ assignment });
    });
  }

  // ================== STATE ==================
  /** Retirar el rol (borrado lógico). */
  public async deactivate(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const assignment = await this.service.deactivate(this.paramId(req));
      res.status(200).json({ message: "Role assignment deactivated", assignment });
    });
  }

  /** Reactivar la asignación. */
  public async reactivate(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const assignment = await this.service.reactivate(this.paramId(req));
      res.status(200).json({ message: "Role assignment reactivated", assignment });
    });
  }
}
EOF
```

```bash
: > src/features/auth/role-users/role-users.routes.ts
cat >> src/features/auth/role-users/role-users.routes.ts << 'EOF'
import { Application } from "express";
import { RoleUsersController } from "./role-users.controller";
import { authenticate, authorize } from "../access";

/**
 * Rutas del feature RoleUsers — **modalidad 3 (JWT + RBAC)**.
 *
 * Es la vía administrativa para **asignar un rol a un usuario**:
 * `POST /api/asignaciones-rol` con `{ user_id, role_id }`.
 *
 * No hay borrado físico: retirar un rol es un borrado lógico (`/deactivate`) y
 * es reversible (`/reactivate`). La auditoría de quién tuvo qué rol se conserva.
 */
export class RoleUsersRoutes {
  public roleUsersController: RoleUsersController = new RoleUsersController();

  public routes(app: Application): void {
    // getAll
    app
      .route("/api/asignaciones-rol")
      .get(
        authenticate,
        authorize,
        this.roleUsersController.getAll.bind(this.roleUsersController)
      );

    // getOne
    app
      .route("/api/asignaciones-rol/:id")
      .get(
        authenticate,
        authorize,
        this.roleUsersController.getOne.bind(this.roleUsersController)
      );

    // asignar rol (create)
    app
      .route("/api/asignaciones-rol")
      .post(
        authenticate,
        authorize,
        this.roleUsersController.assign.bind(this.roleUsersController)
      );

    // retirar rol (delete lógico)
    app
      .route("/api/asignaciones-rol/:id/deactivate")
      .patch(
        authenticate,
        authorize,
        this.roleUsersController.deactivate.bind(this.roleUsersController)
      );

    // reactivar asignación
    app
      .route("/api/asignaciones-rol/:id/reactivate")
      .patch(
        authenticate,
        authorize,
        this.roleUsersController.reactivate.bind(this.roleUsersController)
      );
  }
}
EOF
```

## 22.3 RoleUsers — seeder y swagger

```bash
: > src/features/auth/role-users/role-users.seeder.ts
cat >> src/features/auth/role-users/role-users.seeder.ts << 'EOF'
import { RoleUser } from "./role-user.model";
import { Role } from "../roles/role.model";
import { User } from "../users/user.model";

/**
 * Asignaciones canónicas usuario ↔ rol de CelebraHub.
 */
export const SEED_ROLE_USERS = [
  { username: "admin", roleName: "ADMIN" },
  { username: "comercial", roleName: "COMERCIAL" },
  { username: "operaciones", roleName: "OPERACIONES" },
  { username: "proveedor", roleName: "PROVEEDOR" },
  { username: "cartera", roleName: "CARTERA" },
] as const;

export async function seedRoleUsers(): Promise<number> {
  let created = 0;

  for (const item of SEED_ROLE_USERS) {
    const user = await User.findOne({
      where: { username: item.username },
    });

    const role = await Role.findOne({
      where: { name: item.roleName },
    });

    if (!user || !role) {
      console.log(
        `⏭️ role_users: falta ${item.username} o ${item.roleName}, se omite esa asignación`
      );
      continue;
    }

    const [assignment, wasCreated] = await RoleUser.findOrCreate({
      where: {
        user_id: user.id,
        role_id: role.id,
      },
      defaults: {
        user_id: user.id,
        role_id: role.id,
        status: "active",
      },
    });

    if (wasCreated) {
      created++;
    } else if (assignment.status !== "active") {
      await assignment.update({ status: "active" });
    }
  }

  console.log(
    `✅ role_users: asignaciones reconciliadas (${SEED_ROLE_USERS.length}, ${created} nuevas)`
  );

  return created;
}
EOF
```


```bash
: > src/features/auth/role-users/role-users.swagger.ts
cat >> src/features/auth/role-users/role-users.swagger.ts << 'EOF'
import {
  bearerSecurity,
  forbiddenResponse,
  invalidIdResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "../../../shared/http/swagger-security";

/**
 * Documentación OpenAPI del feature RoleUsers — **asignaciones usuario ↔ rol**.
 *
 * Modalidad: **JWT + RBAC** en todas las operaciones.
 *
 * Estas rutas son una de las dos vías administrativas de la autorización:
 * `POST /api/asignaciones-rol` **asigna un rol a un usuario**, primer eslabón de
 * la cadena. Sin asignación activa no hay permisos, por muchos roles que existan.
 */
export const roleUsersSwagger = {
  tags: [
    {
      name: "Asignaciones usuario-rol",
      description:
        "Asignar / retirar / reactivar el rol de un usuario (`role_users`) — **JWT + RBAC**",
    },
  ],
  paths: {
    "/api/asignaciones-rol": {
      get: {
        tags: ["Asignaciones usuario-rol"],
        summary: "Listar asignaciones activas",
        description:
          "JWT + RBAC — recurso `GET /api/asignaciones-rol`. Incluye un resumen del usuario (sin `password`) y del rol.",
        security: bearerSecurity,
        responses: {
          "200": { description: "Lista de asignaciones (`{ assignments: [...] }`)" },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
        },
      },
      post: {
        tags: ["Asignaciones usuario-rol"],
        summary: "Asignar rol a usuario",
        description:
          "JWT + RBAC — recurso `POST /api/asignaciones-rol`. " +
          "Cuerpo: `{ user_id, role_id }`. Es idempotente: si la pareja existía desactivada, se reactiva. " +
          "El usuario y el rol deben estar activos.",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RoleUserCreate" } },
          },
        },
        responses: {
          "201": { description: "Asignación creada (`{ assignment }`)" },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": { description: "Usuario o rol inexistente o inactivo" },
          "409": { description: "El rol ya está asignado a ese usuario" },
        },
      },
    },
    "/api/asignaciones-rol/{id}": {
      get: {
        tags: ["Asignaciones usuario-rol"],
        summary: "Obtener asignación por id",
        description: "JWT + RBAC — recurso `GET /api/asignaciones-rol/:id`.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Asignación (`{ assignment }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
    "/api/asignaciones-rol/{id}/deactivate": {
      patch: {
        tags: ["Asignaciones usuario-rol"],
        summary: "Retirar rol a usuario (borrado lógico)",
        description:
          "JWT + RBAC — recurso `PATCH /api/asignaciones-rol/:id/deactivate`. " +
          "Rompe el eslabón `role_users` -> el usuario pierde los permisos de ese rol de inmediato (403).",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Asignación desactivada (`{ message, assignment }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
    "/api/asignaciones-rol/{id}/reactivate": {
      patch: {
        tags: ["Asignaciones usuario-rol"],
        summary: "Reactivar asignación",
        description:
          "JWT + RBAC — recurso `PATCH /api/asignaciones-rol/:id/reactivate`. Reversible: vuelve a conceder los permisos del rol.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Asignación reactivada (`{ message, assignment }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
          "409": { description: "La asignación ya estaba activa" },
        },
      },
    },
  },
  components: {
    schemas: {
      RoleUser: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          user_id: { type: "integer", example: 1 },
          role_id: { type: "integer", example: 1 },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          user: {
            type: "object",
            properties: {
              id: { type: "integer" },
              username: { type: "string" },
              email: { type: "string", format: "email" },
            },
          },
          role: {
            type: "object",
            properties: { id: { type: "integer" }, name: { type: "string" } },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RoleUserCreate: {
        type: "object",
        required: ["user_id", "role_id"],
        properties: {
          user_id: { type: "integer", example: 2 },
          role_id: { type: "integer", example: 2 },
        },
      },
    },
  },
};
EOF
```

## 22.4 DTOs de ResourceRoles

```bash
: > src/features/auth/resource-roles/dto/create-resource-role.dto.ts
cat >> src/features/auth/resource-roles/dto/create-resource-role.dto.ts << 'EOF'
/**
 * Datos de entrada de `POST /api/concesiones-rol` — **conceder un recurso a un rol**.
 *
 * Esta operación **crea un permiso**: el permiso no es una entidad con nombre,
 * es la tupla `(role_id, resource_id)` materializada en `resource_roles`. Si la
 * concesión ya existía inactiva, se reactiva en lugar de duplicarla.
 *
 * Ejemplo: conceder `POST /api/reservas` al rol `COMERCIAL` significa que los
 * usuarios con ese rol podrán registrar ventas, sin tocar el código.
 */
export interface CreateResourceRoleDto {
  role_id: number;
  resource_id: number;
}
EOF
```

```bash
: > src/features/auth/resource-roles/dto/create-resource-role.dto.ts
cat >> src/features/auth/resource-roles/dto/create-resource-role.dto.ts << 'EOF'
/**
 * Datos de entrada de `POST /api/concesiones-rol` — **conceder un recurso a un rol**.
 *
 * Esta operación **crea un permiso**: el permiso no es una entidad con nombre,
 * es la tupla `(role_id, resource_id)` materializada en `resource_roles`. Si la
 * concesión ya existía inactiva, se reactiva en lugar de duplicarla.
 *
 * Ejemplo: conceder `POST /api/reservas` al rol `COMERCIAL` significa que los
 * usuarios con ese rol podrán registrar ventas, sin tocar el código.
 */
export interface CreateResourceRoleDto {
  role_id: number;
  resource_id: number;
}
EOF
```

```bash
: > src/features/auth/resource-roles/dto/resource-role-response.dto.ts
cat >> src/features/auth/resource-roles/dto/resource-role-response.dto.ts << 'EOF'
import { ResourceRole, ResourceRoleI } from "../resource-role.model";

/**
 * Respuesta HTTP de una concesión rol-recurso (un permiso).
 *
 * Incluye un resumen del rol y del recurso: `resource` lleva `(method, path)`,
 * que es exactamente el par que evalúa el middleware de autorización.
 */
export interface ResourceRoleResponseDto extends ResourceRoleI {
  role?: { id: number; name: string } | null;
  resource?: {
    id: number;
    method: string;
    path: string;
    description: string | null;
  } | null;
}

/** Mapper modelo -> DTO de respuesta (objeto plano). */
export function toResourceRoleResponse(resourceRole: ResourceRole): ResourceRoleResponseDto {
  return resourceRole.toJSON() as ResourceRoleResponseDto;
}

/**
 * Un permiso **efectivo**: el resultado de recorrer la cadena completa
 * `role_users → roles → resource_roles → resources` para un usuario concreto.
 *
 * Es plano a propósito: el middleware de autorización solo necesita
 * `(method, path)`; el resto es información útil para el endpoint de consulta.
 */
export interface EffectivePermissionDto {
  resource_id: number;
  method: string;
  path: string;
  description: string | null;
  role_id: number;
  role_name: string;
}
EOF
```

```bash
: > src/features/auth/resource-roles/dto/index.ts
cat >> src/features/auth/resource-roles/dto/index.ts << 'EOF'
export * from "./create-resource-role.dto";
export * from "./list-resource-roles.dto";
export * from "./resource-role-response.dto";
EOF
```

El DTO de listado admite dos filtros que se usan para auditar la matriz desde ambos lados:

- ?role_id= — «¿qué concede este rol?»

- ?resource_id= — «¿qué roles conceden este recurso?»

## 22.5 ResourceRoles — repository, service, controller y rutas

POST /api/concesiones-rol con { role_id, resource_id } materializa el permiso. Misma semántica idempotente que en RoleUsers.

```bash
: > src/features/auth/resource-roles/resource-roles.repository.ts
cat >> src/features/auth/resource-roles/resource-roles.repository.ts << 'EOF'
import { CreationAttributes, Op, Transaction } from "sequelize";
import { ResourceRole } from "./resource-role.model";
import { Role } from "../roles/role.model";
import { Resource } from "../resources/resource.model";
import { RoleUser } from "../role-users/role-user.model";
import { EffectivePermissionDto } from "./dto";

/** `include` reutilizable: resumen del rol y del recurso (con `method`/`path`). */
const SUMMARIES = [
  { model: Role, as: "role", attributes: ["id", "name"] },
  {
    model: Resource,
    as: "resource",
    attributes: ["id", "method", "path", "description"],
  },
];

/**
 * Capa Repository del feature ResourceRoles (tabla `resource_roles`).
 *
 * Aquí vive la **consulta de autorización efectiva**: la única que recorre la
 * cadena completa de seguridad. Es el corazón del RBAC.
 */
export class ResourceRolesRepository {
  /** Todas las concesiones activas (con resumen de rol y recurso). */
  public async findAllActive(): Promise<ResourceRole[]> {
    return ResourceRole.findAll({ where: { status: "active" }, include: SUMMARIES });
  }

  /** Concesiones activas filtradas por rol y/o recurso. */
  public async findAllActiveFiltered(filters: {
    role_id?: number;
    resource_id?: number;
  }): Promise<ResourceRole[]> {
    const where: Record<string, unknown> = { status: "active" };
    if (filters.role_id) where.role_id = filters.role_id;
    if (filters.resource_id) where.resource_id = filters.resource_id;

    return ResourceRole.findAll({ where, include: SUMMARIES, order: [["id", "ASC"]] });
  }

  /** Una concesión por PK (o `null`). */
  public async findById(id: number, transaction?: Transaction): Promise<ResourceRole | null> {
    return ResourceRole.findByPk(id, { include: SUMMARIES, transaction });
  }

  /** La concesión de un recurso a un rol, sea cual sea su estado. */
  public async findByRoleAndResource(
    roleId: number,
    resourceId: number
  ): Promise<ResourceRole | null> {
    return ResourceRole.findOne({
      where: { role_id: roleId, resource_id: resourceId },
    });
  }

  /** Todas las concesiones (activas e inactivas) de un rol. */
  public async findAllByRole(roleId: number, transaction?: Transaction): Promise<ResourceRole[]> {
    return ResourceRole.findAll({ where: { role_id: roleId }, transaction });
  }

  /** Inserta una concesión. */
  public async create(
    data: CreationAttributes<ResourceRole>,
    transaction?: Transaction
  ): Promise<ResourceRole> {
    return ResourceRole.create(data, { transaction });
  }

  /** Persiste cambios sobre una instancia existente. */
  public async update(
    resourceRole: ResourceRole,
    data: Partial<ResourceRole>,
    transaction?: Transaction
  ): Promise<ResourceRole> {
    return resourceRole.update(data, { transaction });
  }

  /**
   * **CONSULTA DE AUTORIZACIÓN EFECTIVA** (`PDF de CelebraHub – Centro de eventos` §16).
   *
   * Devuelve los recursos que un usuario puede ejecutar, recorriendo la cadena
   * y exigiendo `status = 'active'` en **los cuatro eslabones**:
   *
   * ```sql
   * resource_roles (rr)  -> rr.status = active
   *   JOIN roles (ro)     -> ro.status = active
   *   JOIN role_users(ru) -> ru.status = active AND ru.user_id = :userId
   *   JOIN resources (r)  -> r.status  = active
   * ```
   *
   * Si cualquier eslabón está inactivo o ausente, la fila no aparece: el
   * resultado vacío se traduce en **deny by default** en el middleware.
   *
   * Los `include` con `required: true` producen INNER JOIN; no se usan
   * `attributes` del `RoleUser` porque solo interesa que exista y cumpla el WHERE.
   */
  public async findEffectiveForUser(userId: number): Promise<EffectivePermissionDto[]> {
    const rows = await ResourceRole.findAll({
      where: { status: "active" },
      attributes: ["id"],
      include: [
        {
          model: Role,
          as: "role",
          required: true,
          attributes: ["id", "name"],
          where: { status: "active" },
          include: [
            {
              model: RoleUser,
              as: "role_users",
              required: true,
              attributes: [],
              where: { status: "active", user_id: userId },
            },
          ],
        },
        {
          model: Resource,
          as: "resource",
          required: true,
          attributes: ["id", "method", "path", "description"],
          where: { status: "active" },
        },
      ],
      order: [["id", "ASC"]],
    });

    return rows.map((row) => {
      const plain = row.toJSON() as unknown as {
        role: { id: number; name: string };
        resource: { id: number; method: string; path: string; description: string | null };
      };
      return {
        resource_id: plain.resource.id,
        method: plain.resource.method,
        path: plain.resource.path,
        description: plain.resource.description,
        role_id: plain.role.id,
        role_name: plain.role.name,
      };
    });
  }

  /** Cuenta las concesiones activas de un rol. */
  public async countActiveByRole(roleId: number): Promise<number> {
    return ResourceRole.count({ where: { role_id: roleId, status: "active" } });
  }

  /** Cuenta las concesiones activas totales. */
  public async countActive(): Promise<number> {
    return ResourceRole.count({ where: { status: "active" } });
  }

  /** Cuenta las concesiones activas cuyo recurso está en una lista de ids. */
  public async countActiveByResources(resourceIds: number[]): Promise<number> {
    if (resourceIds.length === 0) return 0;
    return ResourceRole.count({
      where: { resource_id: { [Op.in]: resourceIds }, status: "active" },
    });
  }
}
EOF
```

```bash
: > src/features/auth/resource-roles/resource-roles.service.ts
cat >> src/features/auth/resource-roles/resource-roles.service.ts << 'EOF'
import {
  CreateResourceRoleDto,
  EffectivePermissionDto,
  ListResourceRolesDto,
  ResourceRoleResponseDto,
  toResourceRoleResponse,
} from "./dto";
import { ResourceRolesRepository } from "./resource-roles.repository";
import { ResourceRole } from "./resource-role.model";
import { RolesRepository } from "../roles/roles.repository";
import { ResourcesRepository } from "../resources/resources.repository";
import { AppError } from "../../../shared/errors/app-error";
import { withTransaction } from "../../../shared/database/with-transaction";

/** Resumen de una reconciliación de concesiones de un rol. */
export interface ReconcileResult {
  role_id: number;
  activated: number;
  deactivated: number;
  total_active: number;
}

/**
 * Capa Service del feature ResourceRoles — **la gestión de permisos**.
 *
 * Aquí es donde el modelo "Role + Resource = permiso" se vuelve operativo:
 *  - `grant`     -> concede un recurso a un rol (crea o reactiva la concesión).
 *  - `deactivate`-> retira el permiso (borrado lógico, reversible).
 *  - `findEffectiveForUser` -> materializa los permisos de un usuario concreto.
 *  - `reconcileRole` -> deja el catálogo de un rol exactamente en un conjunto
 *    dado de recursos (idempotente); lo usa el seeder para el rol `COMERCIAL`.
 *
 * Nada de esto requiere desplegar código: son filas.
 */
export class ResourceRolesService {
  public constructor(
    private readonly repository: ResourceRolesRepository = new ResourceRolesRepository(),
    private readonly rolesRepository: RolesRepository = new RolesRepository(),
    private readonly resourcesRepository: ResourcesRepository = new ResourcesRepository()
  ) {}

  // ================== READ ==================
  public async getAll(filters: ListResourceRolesDto = {}): Promise<ResourceRoleResponseDto[]> {
    const grants = await this.repository.findAllActiveFiltered({
      role_id: filters.role_id,
      resource_id: filters.resource_id,
    });
    return grants.map((grant) => toResourceRoleResponse(grant));
  }

  public async getOne(id: number): Promise<ResourceRoleResponseDto> {
    return toResourceRoleResponse(await this.findOrFail(id));
  }

  /** Permisos efectivos de un usuario (cadena RBAC completa, todos los eslabones activos). */
  public async findEffectiveForUser(userId: number): Promise<EffectivePermissionDto[]> {
    return this.repository.findEffectiveForUser(userId);
  }

  // ================== CREATE (conceder) ==================
  /** Concede un recurso a un rol (crea el permiso o reactiva la concesión). */
  public async grant(body: CreateResourceRoleDto): Promise<ResourceRoleResponseDto> {
    if (!body.role_id || !body.resource_id) {
      throw new AppError(400, "role_id and resource_id are required");
    }

    const role = await this.rolesRepository.findById(body.role_id);
    if (!role || role.status !== "active") {
      throw new AppError(404, "Role not found or inactive");
    }
    const resource = await this.resourcesRepository.findById(body.resource_id);
    if (!resource || resource.status !== "active") {
      throw new AppError(404, "Resource not found or inactive");
    }

    const existing = await this.repository.findByRoleAndResource(body.role_id, body.resource_id);
    if (existing) {
      if (existing.status === "active") {
        throw new AppError(409, "Role already has this resource granted");
      }
      const reactivated = await this.repository.update(existing, { status: "active" });
      return toResourceRoleResponse(await this.reload(reactivated.id));
    }

    const created = await this.repository.create({
      role_id: body.role_id,
      resource_id: body.resource_id,
      status: "active",
    });
    return toResourceRoleResponse(await this.reload(created.id));
  }

  // ================== STATE (retirar / reactivar) ==================
  /** Retirar el permiso -> `status = inactive`. Solo se pierde esa operación. */
  public async deactivate(id: number): Promise<ResourceRoleResponseDto> {
    const grant = await this.findOrFail(id);
    await this.repository.update(grant, { status: "inactive" });
    return toResourceRoleResponse(await this.reload(grant.id));
  }

  /** Reactivar la concesión. */
  public async reactivate(id: number): Promise<ResourceRoleResponseDto> {
    const grant = await this.findOrFail(id, false);
    if (grant.status === "active") {
      throw new AppError(409, "Grant is already active");
    }
    await this.repository.update(grant, { status: "active" });
    return toResourceRoleResponse(await this.reload(grant.id));
  }

  // ================== RECONCILIACIÓN ==================
  /**
   * Deja las concesiones de un rol **exactamente** en `resourceIds`.
   *
   * - Recursos de la lista sin concesión -> se conceden.
   * - Recursos de la lista con concesión inactiva -> se reactivan.
   * - Recursos concedidos que no están en la lista -> se retiran (inactive).
   *
   * Todo dentro de una transacción: o el rol queda con ese catálogo exacto, o no
   * se toca nada. Lo usa el seeder para el rol `COMERCIAL` (7 recursos) y `ADMIN`
   * (58), de modo que volver a ejecutar el seeder reconcilia en vez de duplicar.
   */
  public async reconcileRole(roleId: number, resourceIds: number[]): Promise<ReconcileResult> {
    const role = await this.rolesRepository.findById(roleId);
    if (!role) {
      throw new AppError(404, "Role not found");
    }

    const wanted = new Set(resourceIds);

    return withTransaction(async (t) => {
      const existing = await this.repository.findAllByRole(roleId, t);
      const byResource = new Map(existing.map((row) => [row.resource_id, row]));

      let activated = 0;
      let deactivated = 0;

      for (const resourceId of wanted) {
        const row = byResource.get(resourceId);
        if (!row) {
          await this.repository.create(
            { role_id: roleId, resource_id: resourceId, status: "active" },
            t
          );
          activated++;
          continue;
        }
        if (row.status !== "active") {
          await this.repository.update(row, { status: "active" }, t);
          activated++;
        }
      }

      for (const row of existing) {
        if (wanted.has(row.resource_id)) continue;
        if (row.status === "active") {
          await this.repository.update(row, { status: "inactive" }, t);
          deactivated++;
        }
      }

      return {
        role_id: roleId,
        activated,
        deactivated,
        total_active: wanted.size,
      };
    });
  }

  // ================== HELPERS ==================
  private async findOrFail(id: number, onlyActive = true): Promise<ResourceRole> {
    const grant = await this.repository.findById(id);
    if (!grant || (onlyActive && grant.status !== "active")) {
      throw new AppError(404, "Grant not found");
    }
    return grant;
  }

  private async reload(id: number): Promise<ResourceRole> {
    const grant = await this.repository.findById(id);
    if (!grant) {
      throw new AppError(404, "Grant not found");
    }
    return grant;
  }
}
EOF
```

```bash
: > src/features/auth/resource-roles/resource-roles.controller.ts
cat >> src/features/auth/resource-roles/resource-roles.controller.ts << 'EOF'
import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { CreateResourceRoleDto } from "./dto";
import { ResourceRolesService } from "./resource-roles.service";

/**
 * Capa Controller del feature ResourceRoles.
 *
 * Orden de operaciones: getAll → getOne → grant (create) → deactivate → reactivate.
 * `GET /api/concesiones-rol` acepta filtros `?role_id=` y `?resource_id=`.
 */
export class ResourceRolesController extends BaseController {
  public constructor(
    private readonly service: ResourceRolesService = new ResourceRolesService()
  ) {
    super();
  }

  // ================== READ ==================
  public async getAll(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const grants = await this.service.getAll({
        role_id: toOptionalNumber(req.query.role_id),
        resource_id: toOptionalNumber(req.query.resource_id),
      });
      res.status(200).json({ grants });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const grant = await this.service.getOne(this.paramId(req));
      res.status(200).json({ grant });
    });
  }

  // ================== CREATE (conceder permiso) ==================
  public async grant(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const grant = await this.service.grant(req.body as CreateResourceRoleDto);
      res.status(201).json({ message: "Resource granted to role", grant });
    });
  }

  // ================== STATE ==================
  /** Retirar el permiso (borrado lógico). */
  public async deactivate(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const grant = await this.service.deactivate(this.paramId(req));
      res.status(200).json({ message: "Grant deactivated (permission revoked)", grant });
    });
  }

  /** Reactivar la concesión. */
  public async reactivate(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const grant = await this.service.reactivate(this.paramId(req));
      res.status(200).json({ message: "Grant reactivated", grant });
    });
  }
}

/** Convierte un `query param` en número o `undefined` (sin lanzar por basura). */
function toOptionalNumber(value: unknown): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) return undefined;
  return Number(raw);
}
EOF
```

```bash
: > src/features/auth/resource-roles/resource-roles.routes.ts
cat >> src/features/auth/resource-roles/resource-roles.routes.ts << 'EOF'
import { Application } from "express";
import { ResourceRolesController } from "./resource-roles.controller";
import { authenticate, authorize } from "../access";

/**
 * Rutas del feature ResourceRoles — **modalidad 3 (JWT + RBAC)**.
 *
 * Es la vía administrativa para **conceder un recurso a un rol** (crear un
 * permiso):
 * `POST /api/concesiones-rol` con `{ role_id, resource_id }`.
 *
 * El efecto es inmediato y por datos: la siguiente petición del usuario afectado
 * ya consulta la nueva matriz. No se reinicia el servidor ni se despliega nada.
 */
export class ResourceRolesRoutes {
  public resourceRolesController: ResourceRolesController = new ResourceRolesController();

  public routes(app: Application): void {
    // getAll (filtros ?role_id= y ?resource_id=)
    app
      .route("/api/concesiones-rol")
      .get(
        authenticate,
        authorize,
        this.resourceRolesController.getAll.bind(this.resourceRolesController)
      );

    // getOne
    app
      .route("/api/concesiones-rol/:id")
      .get(
        authenticate,
        authorize,
        this.resourceRolesController.getOne.bind(this.resourceRolesController)
      );

    // conceder recurso a rol (create)
    app
      .route("/api/concesiones-rol")
      .post(
        authenticate,
        authorize,
        this.resourceRolesController.grant.bind(this.resourceRolesController)
      );

    // retirar permiso (delete lógico)
    app
      .route("/api/concesiones-rol/:id/deactivate")
      .patch(
        authenticate,
        authorize,
        this.resourceRolesController.deactivate.bind(this.resourceRolesController)
      );

    // reactivar permiso
    app
      .route("/api/concesiones-rol/:id/reactivate")
      .patch(
        authenticate,
        authorize,
        this.resourceRolesController.reactivate.bind(this.resourceRolesController)
      );
  }
}
EOF
```

## 22.6 reconcileRole — la matriz determinista

reconcileRole(roleId, resourceIds) es el método que hace que un seeder (o un proceso de despliegue) pueda declarar los permisos de un rol en lugar de mutarlos a mano:

|Recurso en la lista | Fila previa | Acción |
|--------------------|-------------|--------|
|sí | no existe | concede|
|sí	| inactive | reactiva|
|sí	| active | no toca|
|no | active | retira (borrado lógico)|

Es total y determinista: al terminar, el conjunto de concesiones activas del rol es exactamente la lista recibida. Por eso el rol COMERCIAL nunca acumula permisos por accidente al reejecutar el seeder.

```
reconcileRole(ADMIN,  RESOURCE_CATALOG)  → 58 activas
reconcileRole(COMERCIAL, COMERCIAL_RESOURCES)  →  7 activas
```

## 22.7 Seeder de la matriz y swagger

```bash
: > src/features/auth/resource-roles/resource-roles.seeder.ts
cat >> src/features/auth/resource-roles/resource-roles.seeder.ts << 'EOF'
import { Resource } from "../resources/resource.model";
import { Role } from "../roles/role.model";
import {
  RESOURCE_CATALOG,
  COMERCIAL_RESOURCES,
  OPERACIONES_RESOURCES,
  PROVEEDOR_RESOURCES,
  CARTERA_RESOURCES,
} from "../resources/resource-catalog";
import { ResourceRolesService } from "./resource-roles.service";

export async function seedResourceRoles(): Promise<number> {
  const service = new ResourceRolesService();

  const resources = await Resource.findAll({
    where: { status: "active" },
  });

  const idByOperation = new Map(
    resources.map((resource) => [
      `${resource.method} ${resource.path}`,
      resource.id,
    ])
  );

  const idsFor = (
    catalog: ReadonlyArray<{ method: string; path: string }>
  ): number[] =>
    catalog
      .map((item) => idByOperation.get(`${item.method} ${item.path}`))
      .filter((id): id is number => typeof id === "number");

  const roleCatalogs = [
    { name: "ADMIN", resources: RESOURCE_CATALOG },
    { name: "COMERCIAL", resources: COMERCIAL_RESOURCES },
    { name: "OPERACIONES", resources: OPERACIONES_RESOURCES },
    { name: "PROVEEDOR", resources: PROVEEDOR_RESOURCES },
    { name: "CARTERA", resources: CARTERA_RESOURCES },
  ] as const;

  let total = 0;

  for (const item of roleCatalogs) {
    const role = await Role.findOne({
      where: { name: item.name },
    });

    if (!role) {
      console.log(`⏭️ resource_roles: no existe el rol ${item.name}`);
      continue;
    }

    const result = await service.reconcileRole(
      role.id,
      idsFor(item.resources)
    );

    console.log(
      `✅ resource_roles: ${item.name} -> ${result.total_active} recursos ` +
      `(${result.activated} altas, ${result.deactivated} bajas)`
    );

    total += result.total_active;
  }

  return total;
}
EOF
```


```bash
: > src/features/auth/resource-roles/resource-roles.swagger.ts
cat >> src/features/auth/resource-roles/resource-roles.swagger.ts << 'EOF'
import {
  bearerSecurity,
  forbiddenResponse,
  invalidIdResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "../../../shared/http/swagger-security";

/**
 * Documentación OpenAPI del feature ResourceRoles — **la gestión de permisos**.
 *
 * Modalidad: **JWT + RBAC** en todas las operaciones.
 *
 * Aquí se materializa el principio de diseño: **no existe una entidad
 * `Permission`**. Conceder un permiso es crear (o reactivar) una fila en
 * `resource_roles`; el permiso es la tupla `(rol, recurso)`.
 */
export const resourceRolesSwagger = {
  tags: [
    {
      name: "Concesiones rol-recurso",
      description:
        "Conceder / retirar / reactivar recursos a un rol: **el permiso** — **JWT + RBAC**",
    },
  ],
  paths: {
    "/api/concesiones-rol": {
      get: {
        tags: ["Concesiones rol-recurso"],
        summary: "Listar concesiones activas",
        description:
          "JWT + RBAC — recurso `GET /api/concesiones-rol`. " +
          "Filtros opcionales: `?role_id=` (permisos de un rol) y `?resource_id=` (roles que conceden un recurso).",
        security: bearerSecurity,
        parameters: [
          { name: "role_id", in: "query", required: false, schema: { type: "integer" } },
          { name: "resource_id", in: "query", required: false, schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Lista de concesiones (`{ grants: [...] }`)" },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
        },
      },
      post: {
        tags: ["Concesiones rol-recurso"],
        summary: "Conceder recurso a rol (crear permiso)",
        description:
          "JWT + RBAC — recurso `POST /api/concesiones-rol`. " +
          "Cuerpo: `{ role_id, resource_id }`. Idempotente: si la concesión existía retirada, se reactiva. " +
          "Efecto inmediato y sin despliegue: la siguiente petición del usuario ya consulta la nueva matriz.",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ResourceRoleCreate" } },
          },
        },
        responses: {
          "201": { description: "Permiso concedido (`{ message, grant }`)" },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": { description: "Rol o recurso inexistente o inactivo" },
          "409": { description: "El rol ya tiene concedido ese recurso" },
        },
      },
    },
    "/api/concesiones-rol/{id}": {
      get: {
        tags: ["Concesiones rol-recurso"],
        summary: "Obtener concesión por id",
        description: "JWT + RBAC — recurso `GET /api/concesiones-rol/:id`.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Concesión (`{ grant }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
    "/api/concesiones-rol/{id}/deactivate": {
      patch: {
        tags: ["Concesiones rol-recurso"],
        summary: "Retirar permiso (borrado lógico)",
        description:
          "JWT + RBAC — recurso `PATCH /api/concesiones-rol/:id/deactivate`. " +
          "Solo se pierde esa operación; el resto de permisos del rol siguen vigentes.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Permiso retirado (`{ message, grant }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
    "/api/concesiones-rol/{id}/reactivate": {
      patch: {
        tags: ["Concesiones rol-recurso"],
        summary: "Reactivar permiso",
        description: "JWT + RBAC — recurso `PATCH /api/concesiones-rol/:id/reactivate`.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Permiso reactivado (`{ message, grant }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
          "409": { description: "La concesión ya estaba activa" },
        },
      },
    },
  },
  components: {
    schemas: {
      ResourceRole: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          role_id: { type: "integer", example: 2 },
          resource_id: { type: "integer", example: 25 },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          role: {
            type: "object",
            properties: { id: { type: "integer" }, name: { type: "string", example: "COMERCIAL" } },
          },
          resource: {
            type: "object",
            properties: {
              id: { type: "integer" },
              method: { type: "string", example: "POST" },
              path: { type: "string", example: "/api/reservas" },
              description: { type: "string", nullable: true },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ResourceRoleCreate: {
        type: "object",
        required: ["role_id", "resource_id"],
        properties: {
          role_id: { type: "integer", example: 2 },
          resource_id: { type: "integer", example: 25 },
        },
      },
    },
  },
};
EOF
```

## 22.8 Pruebas HTTP

```bash
: > src/features/auth/role-users/http/role-users.assign.http
cat >> src/features/auth/role-users/http/role-users.assign.http << 'EOF'
### Feature RoleUsers — ASIGNAR ROL A USUARIO (modalidad JWT + RBAC)
### Primer eslabón de la cadena: sin asignación activa NO hay permisos.
@baseUrl = http://localhost:4000

# @name loginAdmin
POST {{baseUrl}}/api/sesion/login
Content-Type: application/json

{
  "identifier": "admin",
  "password": "Admin123!"
}

@token = {{loginAdmin.response.body.$.access_token}}

### getAll — asignaciones activas (con resumen de usuario y rol)
GET {{baseUrl}}/api/asignaciones-rol
Authorization: Bearer {{token}}

### getOne
GET {{baseUrl}}/api/asignaciones-rol/1
Authorization: Bearer {{token}}

### ASIGNAR — `POST /api/asignaciones-rol` con { user_id, role_id }
### (comercial = user_id 2 recibe ADMIN = role_id 1; no lo tiene todavía -> 201)
# @name assignCreate
POST {{baseUrl}}/api/asignaciones-rol
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "user_id": 2,
  "role_id": 1
}

@assignmentId = {{assignCreate.response.body.$.assignment.id}}

### 409 — ese rol ya está asignado a ese usuario (la tupla es única)
POST {{baseUrl}}/api/asignaciones-rol
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "user_id": 2,
  "role_id": 1
}

### 404 — usuario o rol inexistente/inactivo
POST {{baseUrl}}/api/asignaciones-rol
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "user_id": 9999,
  "role_id": 2
}

### RETIRAR ROL (borrado lógico) — el usuario pierde los permisos de ese rol de inmediato
PATCH {{baseUrl}}/api/asignaciones-rol/{{assignmentId}}/deactivate
Authorization: Bearer {{token}}

### Comprobación del efecto: los permisos efectivos cambian sin reiniciar nada
GET {{baseUrl}}/api/usuarios/2/permisos
Authorization: Bearer {{token}}

### REACTIVAR asignación (reversible, la auditoría se conserva)
PATCH {{baseUrl}}/api/asignaciones-rol/{{assignmentId}}/reactivate
Authorization: Bearer {{token}}
EOF
```

```bash
: > src/features/auth/resource-roles/http/resource-roles.grant.http
cat >> src/features/auth/resource-roles/http/resource-roles.grant.http << 'EOF'
### Feature ResourceRoles — CONCEDER / RETIRAR PERMISOS (modalidad JWT + RBAC)
### Aquí se ve el principio de diseño: NO existe entidad `Permission`.
### El permiso es la tupla (rol, recurso) materializada en `resource_roles`.
### resource_id 3 = `POST /api/clientes` (3.ª entrada del catálogo semilla).
@baseUrl = http://localhost:4000

# @name loginAdmin
POST {{baseUrl}}/api/sesion/login
Content-Type: application/json

{
  "identifier": "admin",
  "password": "Admin123!"
}

# @name loginComercial
POST {{baseUrl}}/api/sesion/login
Content-Type: application/json

{
  "identifier": "comercial",
  "password": "Comercial123!"
}

@token = {{loginAdmin.response.body.$.access_token}}
@comercialToken = {{loginComercial.response.body.$.access_token}}
@comercialRoleId = 2

### getAll — concesiones activas (ADMIN 58 + COMERCIAL 7 = 65)
GET {{baseUrl}}/api/concesiones-rol
Authorization: Bearer {{token}}

### Filtro: permisos de un rol (?role_id=)
GET {{baseUrl}}/api/concesiones-rol?role_id={{comercialRoleId}}
Authorization: Bearer {{token}}

### Filtro inverso: qué roles conceden un recurso (?resource_id=)
GET {{baseUrl}}/api/concesiones-rol?resource_id=1
Authorization: Bearer {{token}}

### getOne
GET {{baseUrl}}/api/concesiones-rol/1
Authorization: Bearer {{token}}

### ESTADO INICIAL — COMERCIAL no puede crear clientes -> 403 (deny by default)
POST {{baseUrl}}/api/clientes
Authorization: Bearer {{comercialToken}}
Content-Type: application/json

{
  "name": "Prueba RBAC",
  "phone": "3000000000",
  "email": "rbac.demo@example.com",
  "password": "x"
}

### CONCEDER — `POST /api/concesiones-rol` con { role_id: 2 (COMERCIAL), resource_id: 3 (POST /api/clientes) }
# @name grantCreate
POST {{baseUrl}}/api/concesiones-rol
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "role_id": 2,
  "resource_id": 3
}

@grantId = {{grantCreate.response.body.$.grant.id}}

### EFECTO INMEDIATO — el mismo comercial ahora sí puede (201), sin reiniciar el servidor
POST {{baseUrl}}/api/clientes
Authorization: Bearer {{comercialToken}}
Content-Type: application/json

{
  "name": "Prueba RBAC 2",
  "phone": "3000000001",
  "email": "rbac.demo2@example.com",
  "password": "x"
}

### RETIRAR EL PERMISO (borrado lógico) — solo se pierde esa operación
PATCH {{baseUrl}}/api/concesiones-rol/{{grantId}}/deactivate
Authorization: Bearer {{token}}

### El comercial vuelve a 403
POST {{baseUrl}}/api/clientes
Authorization: Bearer {{comercialToken}}
Content-Type: application/json

{
  "name": "Prueba RBAC 3",
  "phone": "3000000002",
  "email": "rbac.demo3@example.com",
  "password": "x"
}

### REACTIVAR EL PERMISO (reversible, la auditoría se conserva)
PATCH {{baseUrl}}/api/concesiones-rol/{{grantId}}/reactivate
Authorization: Bearer {{token}}

### 403 — el propio COMERCIAL no puede administrar la matriz de permisos
GET {{baseUrl}}/api/concesiones-rol
Authorization: Bearer {{comercialToken}}
EOF
```

> El archivo de concesiones demuestra el efecto inmediato: un POST concede POST /api/clientes al rol COMERCIAL, y la siguiente petición del mismo usuario deja de recibir 403 sin reiniciar el servidor. La autorización se resuelve por datos en cada petición.

**Verificación**

```bash
npx tsc --noEmit
npm run db:seed
```

```sql
SELECT COUNT(*) FROM role_users;      -- 2 (admin→ADMIN, comercial→COMERCIAL)
SELECT COUNT(*) FROM resource_roles;  -- 65 (ADMIN 58 + COMERCIAL 7)
```

## 23. ISS-22 — Middlewares de acceso y las tres modalidades en rutas

**Objetivo:** materializar las tres modalidades mediante dos middlewares componibles y aplicarlos a las rutas existentes sin tocar controllers, services ni repositories.

```
OPEN            app.route(...).get(controller)
JWT             app.route(...).get(authenticate, controller)
JWT + RBAC      app.route(...).get(authenticate, authorize, controller)
```

**Bloqueado por:** ISS-21 (la matriz debe existir para que authorize tenga algo que consultar).

Criterios de aceptación (ISS-22) — consolidados

- [ ] 23.1 authenticate valida el Bearer token, verifica algoritmo/issuer/audience/exp y carga el usuario activo en req.auth
- [ ] 23.2 authorize resuelve (method, path) y busca concesión activa; deny by default → 403
- [ ] 23.3 access/index.ts reexporta ambos middlewares
- [ ] 23.4 las 5 features de negocio (clients, salones, servicios, reservas, evento-servicios) aplican authenticate, authorize
- [ ] 23.5 documentadas las tres modalidades y qué códigos produce cada una
- [ ] 23.6 sin token → 401; con token pero sin concesión → 403; con concesión → 200/201
- [ ] npx tsc --noEmit OK

## 23.1 authenticate — modalidad JWT

Hace exactamente cuatro cosas, en este orden:

1. Lee el encabezado Authorization: Bearer <token> (RFC 6750). Si falta o está mal formado → 401.

2. Verifica el JWT con algoritmo, emisor y audiencia fijos (RFC 8725). Si falla → 401.

3. Carga el usuario en BD y exige status = 'active'. Si no existe o está inactivo → 401.

4. Deja la identidad en req.auth (tipado por auth-user.ts) y llama a next().

> No consulta roles ni permisos. La autorización es responsabilidad del siguiente middleware: mezclar ambas impediría tener endpoints solo-JWT.

```bash
: > src/features/auth/access/authenticate.middleware.ts
cat >> src/features/auth/access/authenticate.middleware.ts << 'EOF'
import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { sendError } from "../../../shared/http/error-response";
import { extractBearerToken, verifyAccessToken } from "../../../shared/auth/jwt";
import { UsersRepository } from "../users/users.repository";

/**
 * **MODALIDAD 2 — JWT (identidad).** Middleware de autenticación.
 *
 * Responde únicamente a la pregunta **¿quién eres?**:
 *
 *  1. Lee el token de `Authorization: Bearer <token>` (RFC 6750).
 *  2. Verifica firma, algoritmo, `iss`, `aud`, `exp` (RFC 8725).
 *  3. **Revalida contra la base de datos** que el usuario sigue existiendo y con
 *     `status = active`. Un token firmado sigue siendo válido después de
 *     desactivar la cuenta; esta revalidación hace que la desactivación tenga
 *     efecto inmediato.
 *
 * NO consulta la matriz de permisos: eso es responsabilidad de `authorize`.
 * Si todo va bien, deja la identidad en `req.auth` y cede el paso.
 *
 * Cualquier fallo se responde con **401 (no autenticado)**.
 */
const usersRepository = new UsersRepository();

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      throw new AppError(401, "Missing Bearer token");
    }

    const payload = verifyAccessToken(token);

    // Defensa en profundidad: `verifyAccessToken` ya garantiza que `sub` es un
    // entero positivo. Se vuelve a comprobar para que ningún cambio futuro en la
    // verificación pueda enviar un `NaN` al repositorio (500 en vez de 401).
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId < 1) {
      throw new AppError(401, "Invalid or expired access token");
    }

    const user = await usersRepository.findById(userId);

    if (!user || user.status !== "active") {
      throw new AppError(401, "User is not active");
    }

    req.auth = {
      id: user.id,
      username: user.username,
      email: user.email,
      tokenId: payload.jti,
    };
    next();
  } catch (error) {
    sendError(res, error);
  }
}
EOF
```

## 23.2 authorize — modalidad JWT + RBAC

Recibe la petición, normaliza el (method, path) real y comprueba si el usuario autenticado alcanza ese recurso por el grafo:

```
req.auth.user
  → role_users (active)
  → roles (active)
  → resource_roles (active)
  → resources (active, method = req.method, path ≈ req.path)
```

Si no hay concesión → 403 (deny by default). Como la consulta se hace en cada petición, revocar un permiso tiene efecto inmediato (no hay que esperar a que caduque el token, porque los permisos no viajan en él).

```bash
: > src/features/auth/access/authorize.middleware.ts
cat >> src/features/auth/access/authorize.middleware.ts << 'EOF'
import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { sendError } from "../../../shared/http/error-response";
import { isOperationGranted, normalizePath } from "../../../shared/auth/resource-match";
import { ResourceRolesRepository } from "../resource-roles/resource-roles.repository";

/**
 * **MODALIDAD 3 — RBAC (identidad + autorización granular).** Middleware de
 * autorización.
 *
 * Debe montarse **después** de `authenticate`. Responde a la segunda pregunta:
 * *¿puede esta identidad ejecutar `method + path`?*
 *
 * Cómo resuelve la decisión:
 *  1. Toma la identidad ya resuelta en `req.auth`.
 *  2. Consulta la **cadena completa** de autorización en la base de datos
 *     (`resource_roles → roles → role_users → resources`, todos los eslabones
 *     activos) para ese `user_id`.
 *  3. Compara el par `(method, path)` de la petición con las concesiones,
 *     por patrón (`/api/reservas/:id` casa con `/api/reservas/42`).
 *
 * Reglas:
 *  - **Deny by default**: sin concesión activa que cubra la operación -> 403.
 *  - **401** si no hay identidad (falta `authenticate` o el token no valió).
 *  - **403** si hay identidad válida pero no hay permiso.
 *
 * No recibe parámetros: el recurso y la acción se derivan de la propia petición.
 * Añadir un permiso es insertar filas en la base de datos, nunca tocar el código.
 */
const resourceRolesRepository = new ResourceRolesRepository();

export async function authorize(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      throw new AppError(401, "Authentication required");
    }

    const method = req.method.toUpperCase();
    const path = normalizePath(req.originalUrl);

    const granted = await resourceRolesRepository.findEffectiveForUser(req.auth.id);

    if (!isOperationGranted(granted, method, path)) {
      throw new AppError(403, `Forbidden: no grant for ${method} ${path}`);
    }

    next();
  } catch (error) {
    sendError(res, error);
  }
}
EOF
```

## 23.3 Barrel de acceso

```bash
: > src/features/auth/access/index.ts
cat >> src/features/auth/access/index.ts << 'EOF'
export * from "./authenticate.middleware";
export * from "./authorize.middleware";
EOF
```

## 23.4 PARCHE: las rutas de negocio de CelebraHub pasan a JWT + RBAC

El cambio es quirúrgico: se importa `authenticate` y `authorize` desde el barrel
de Auth y se insertan entre la ruta y el controller. **No se cambian las tablas,
DTOs, services ni repositories de negocio.**

En CelebraHub se protegen los once módulos de negocio existentes:

```text
clientes
servicios
salones
reservas
eventos
proveedores
evento-servicios
contratos
pagos
cambios-contrato
cancelaciones
```

Cada operación de negocio usa:

```text
authenticate → authorize → controller
```

`authenticate` devuelve 401 cuando no existe una identidad válida.
`authorize` devuelve 403 cuando el usuario está autenticado pero no posee una
concesión activa para `(method, path)`.

### Ejemplo: Clientes

```ts
import { Application } from "express";
import { ClientesController } from "./clientes.controller";
import { authenticate, authorize } from "../../auth/access";

export class ClientesRoutes {
  public clientesController = new ClientesController();

  public routes(app: Application): void {
    app
      .route("/api/clientes")
      .get(
        authenticate,
        authorize,
        this.clientesController.getAll.bind(this.clientesController)
      )
      .post(
        authenticate,
        authorize,
        this.clientesController.create.bind(this.clientesController)
      );

    app
      .route("/api/clientes/:id")
      .get(
        authenticate,
        authorize,
        this.clientesController.getOne.bind(this.clientesController)
      )
      .put(
        authenticate,
        authorize,
        this.clientesController.updatePut.bind(this.clientesController)
      )
      .patch(
        authenticate,
        authorize,
        this.clientesController.updatePatch.bind(this.clientesController)
      )
      .delete(
        authenticate,
        authorize,
        this.clientesController.deletePhysical.bind(this.clientesController)
      );

    app
      .route("/api/clientes/:id/deactivate")
      .patch(
        authenticate,
        authorize,
        this.clientesController.deleteLogical.bind(this.clientesController)
      );
  }
}
```

### Adaptación de los demás módulos

En cada archivo `*.routes.ts` de CelebraHub se conserva exactamente el controller
que ya existe y únicamente se agregan los dos middlewares.

Ejemplo:

```ts
.get(authenticate, authorize, controller.getAll.bind(controller))
.post(authenticate, authorize, controller.create.bind(controller))
.put(authenticate, authorize, controller.updatePut.bind(controller))
.patch(authenticate, authorize, controller.updatePatch.bind(controller))
.delete(authenticate, authorize, controller.deletePhysical.bind(controller))
```

Para las rutas que no tienen `/deactivate` en el módulo original, **no se inventa
esa operación**. Por tanto:

- `reservas` conserva sus operaciones existentes.
- `eventos` conserva sus operaciones existentes.
- `evento-servicios` conserva sus operaciones existentes.
- `contratos` conserva sus operaciones existentes.
- `pagos` conserva sus operaciones existentes.
- `cancelaciones` conserva sus operaciones existentes.

### Regla final

```text
Fase I — tablas y CRUD de CelebraHub: SIN CAMBIOS.
Fase II — Auth: agrega identidad, JWT, refresh tokens y RBAC.
Fase II — negocio: solo agrega authenticate + authorize a las rutas.
```

## 23.5 Las tres modalidades en una tabla

|Modalidad | Middleware en la ruta | Qué exige | Sin cumplir |
|----------|-----------------------|-----------|-------------|
|OPEN |	—	|nada |	—|
|JWT|	authenticate|	access token válido y usuario activo|	401|
|JWT + RBAC |	authenticate, authorize	|token válido y concesión activa de (method, path)	|401 (sin token) / 403 (sin permiso)|

|Petición |	Resultado|
|---------|----------|
|GET /api/clientes sin Authorization	|401|
|GET /api/clientes con token de comercial	|200 (COMERCIAL tiene esa lectura)|
|POST /api/clientes con token de comercial	|403 (COMERCIAL no tiene esa concesión)|
|POST /api/clientes con token de admin	|201 (ADMIN tiene los 58)|
|GET /api/clientes/abc con token válido	|400 (paramId)|
|Cualquier ruta con token caducado o manipulado	|401|

## 23.6 Verificación de 401 y 403

```bash
npm run dev
```

```bash
# 401 — sin token
curl -i http://localhost:4000/api/clientes

# 401 — token manipulado
curl -i -H "Authorization: Bearer no.es.un.jwt" http://localhost:4000/api/clientes

# 200 — comercial lee
TOKEN=$(curl -s -X POST http://localhost:4000/api/sesion/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"comercial","password":"Comercial123!"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).access_token")
curl -i -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/clientes

# 403 — comercial intenta crear (no tiene la concesión)
curl -i -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"x","phone":"1","email":"x@x.com","password":"x"}' \
  http://localhost:4000/api/clientes
```
<p align="center">
  <img src="capturas/Captura de pantalla 2026-10-06 231638.png">
</p>

## ## 24. ISS-23 — Feature RefreshTokens (sesiones renovables y revocables)

**Objetivo:** persistir las sesiones como tokens opacos, de modo que un access token corto pueda renovarse mientras el usuario trabaja, y que una sesión pueda revocarse de verdad.

**Bloqueado por:** ISS-13 (authenticate es lo que permite hablar de «sesiones propias»).

Criterios de aceptación (ISS-14) — consolidados

- [ ] 24.1 refresh-tokens/dto/ (refresh-token-response.dto.ts, index.ts)
- [ ] 24.2 refresh-tokens.repository.ts: busca por token_hash, lista por usuario, aplica lock pesimista al rotar y revoca por familia
- [ ] 24.3 refresh-tokens.service.ts: issue, rotate (con reuse detection) y revoke*
- [ ] 24.4 refresh-tokens.controller.ts y refresh-tokens.routes.ts (modalidad JWT, sin authorize)
- [ ] 24.5 refresh-tokens.swagger.ts
- [ ] 24.6 http/sessions.get.http
- [ ] npx tsc --noEmit OK

## 24.1 DTOs del feature

El service nunca devuelve la instancia de Sequelize: proyecta a un DTO plano que jamás incluye token_hash.

```bash
: > src/features/auth/refresh-tokens/dto/refresh-token-response.dto.ts
cat >> src/features/auth/refresh-tokens/dto/refresh-token-response.dto.ts << 'EOF'
import { RefreshToken, RefreshTokenI } from "../refresh-token.model";

/**
 * Respuesta HTTP de una sesión persistida (refresh token).
 *
 * `token_hash` **se omite deliberadamente**: es un artefacto de seguridad. Ni
 * siquiera su hash tiene por qué salir de la API. El `id` basta para revocar.
 */
export type RefreshTokenResponseDto = Omit<RefreshTokenI, "token_hash"> & {
  /** Derivado, no columna: `expires_at` ya pasó. */
  is_expired: boolean;
};

/** Mapper modelo -> DTO de respuesta (objeto plano; elimina `token_hash`). */
export function toRefreshTokenResponse(token: RefreshToken): RefreshTokenResponseDto {
  const { token_hash, ...safe } = token.toJSON() as RefreshTokenI & { token_hash?: string };
  return {
    ...safe,
    is_expired: new Date(token.expires_at).getTime() <= Date.now(),
  };
}
EOF
```

```bash
: > src/features/auth/refresh-tokens/dto/index.ts
cat >> src/features/auth/refresh-tokens/dto/index.ts << 'EOF'
export * from "./refresh-token-response.dto";
EOF
```

## 24.2 Repository

Tres operaciones son específicas y describen el diseño de seguridad:

|Método	|Por qué existe|
|-------|--------------|
|findByTokenHash| el token en claro no se almacena: se busca por su SHA-256|
|rotate con lock: UPDATE | la rotación es un read-modify-write; el lock evita que dos peticiones concurrentes consuman el mismo refresh token|
|revokeFamily |	la reutilización de un token ya rotado es señal de robo: se revoca toda la familia|

```bash
: > src/features/auth/refresh-tokens/refresh-tokens.repository.ts
cat >> src/features/auth/refresh-tokens/refresh-tokens.repository.ts << 'EOF'
import { CreationAttributes, Op, Transaction } from "sequelize";
import { RefreshToken } from "./refresh-token.model";

/**
 * Capa Repository del feature RefreshTokens (tabla `refresh_tokens`).
 *
 * Única que habla con Sequelize. Las consultas que participan en la rotación
 * aceptan transacción y, cuando corresponde, bloquean la fila (`FOR UPDATE`)
 * para que dos peticiones de refresh simultáneas no emitan dos tokens válidos.
 */
export class RefreshTokensRepository {
  /**
   * Busca por hash del token.
   *
   * `lock: true` añade `FOR UPDATE` dentro de la transacción: es lo que hace que
   * la rotación sea segura bajo concurrencia (solo una petición gana).
   */
  public async findByHash(
    tokenHash: string,
    transaction?: Transaction,
    lock = false
  ): Promise<RefreshToken | null> {
    return RefreshToken.findOne({
      where: { token_hash: tokenHash },
      transaction,
      ...(lock ? { lock: transaction?.LOCK.UPDATE } : {}),
    });
  }

  /** Sesiones de un usuario (activas o todas según `onlyActive`). */
  public async findAllByUser(userId: number, onlyActive = true): Promise<RefreshToken[]> {
    const where: Record<string, unknown> = { user_id: userId };
    if (onlyActive) where.status = "active";

    return RefreshToken.findAll({ where, order: [["createdAt", "DESC"]] });
  }

  /** Una sesión por PK (o `null`). */
  public async findById(id: number): Promise<RefreshToken | null> {
    return RefreshToken.findByPk(id);
  }

  /** Inserta un refresh token (alta de sesión o rotación). */
  public async create(
    data: CreationAttributes<RefreshToken>,
    transaction?: Transaction
  ): Promise<RefreshToken> {
    return RefreshToken.create(data, { transaction });
  }

  /** Persiste cambios sobre una instancia existente. */
  public async update(
    token: RefreshToken,
    data: Partial<RefreshToken>,
    transaction?: Transaction
  ): Promise<RefreshToken> {
    return token.update(data, { transaction });
  }

  /**
   * Revoca **toda la familia** de rotación.
   *
   * Se ejecuta al detectar reutilización de un token ya rotado: si un atacante
   * tiene una copia del token anterior, la sesión legítima se invalida por
   * completo y el usuario debe autenticarse de nuevo (Owasp/OAuth2: reuse
   * detection con revocación de familia).
   */
  public async revokeFamily(familyId: string, transaction?: Transaction): Promise<number> {
    const [updated] = await RefreshToken.update(
      { status: "inactive" },
      { where: { family_id: familyId, status: "active" }, transaction }
    );
    return updated;
  }

  /** Revoca todas las sesiones activas de un usuario (cierre de sesión global). */
  public async revokeAllByUser(userId: number): Promise<number> {
    const [updated] = await RefreshToken.update(
      { status: "inactive" },
      { where: { user_id: userId, status: "active" } }
    );
    return updated;
  }

  /** Elimina físicamente las sesiones ya expiradas o revocadas de un usuario. */
  public async purgeInactiveByUser(userId: number): Promise<number> {
    return RefreshToken.destroy({
      where: {
        user_id: userId,
        [Op.or]: [{ status: "inactive" }, { expires_at: { [Op.lt]: new Date() } }],
      },
    });
  }

  /** Cuenta las sesiones activas de un usuario. */
  public async countActiveByUser(userId: number): Promise<number> {
    return RefreshToken.count({ where: { user_id: userId, status: "active" } });
  }
}
EOF
```

## 24.3 Service — emitir, rotar, revocar

**Ciclo de vida:**

```
login  → emite family_id = <uuid>  +  refresh token (se guarda sha256)  +  access token (15 min)
uso    → POST /api/sesion/refresh con el refresh token
         ├─ token válido y no usado  → ROTA: el viejo pasa a `used`, nace uno nuevo (misma familia)
         └─ token ya usado           → REUSE DETECTION: se revoca la familia completa
logout → revoca el refresh token (o toda la familia)
```

|Decisión |	Motivo |
|---------|--------|
|Access token corto (15 min) |	acota la ventana de un token robado|
|Refresh token opaco y hasheado |	puede revocarse y, si roban la BD, no sirve para autenticarse|
|Rotación en cada refresh |	un refresh token es de un solo uso|
|Familia (family_id) |	permite revocar toda una cadena de sesión, no solo el último eslabón|
|Reuse detection |	un token ya consumido que reaparece implica robo -> se corta la familia entera|
|Lock pesimista al rotar |	dos refreshes simultáneos no pueden ganar los dos|

```bash
: > src/features/auth/refresh-tokens/refresh-tokens.service.ts
cat >> src/features/auth/refresh-tokens/refresh-tokens.service.ts << 'EOF'
import { Transaction } from "sequelize";
import { randomUUID } from "node:crypto";
import {
  RefreshTokenResponseDto,
  toRefreshTokenResponse,
} from "./dto";
import { RefreshTokensRepository } from "./refresh-tokens.repository";
import { RefreshToken } from "./refresh-token.model";
import { AppError } from "../../../shared/errors/app-error";
import { generateOpaqueToken, sha256Hex } from "../../../shared/auth/password";
import { withTransaction } from "../../../shared/database/with-transaction";

/** Vida útil de un refresh token (días). Configurable por entorno. */
const REFRESH_TTL_DAYS = Number(process.env.JWT_REFRESH_TTL_DAYS ?? 7);

/** Resultado de emitir una sesión nueva. */
export interface IssuedSession {
  rawToken: string;
  familyId: string;
  expiresAt: Date;
}

/**
 * Resultado de intentar rotar un refresh token.
 *
 * Se devuelve una **unión discriminada** en lugar de lanzar dentro de la
 * transacción: si se lanzara, el `rollback` desharía la revocación de la familia
 * que acabamos de escribir. El service de sesión decide el error **después** de
 * que la transacción confirme.
 */
export type RotationOutcome =
  | { kind: "rotated"; userId: number; rawToken: string; familyId: string; expiresAt: Date }
  | { kind: "invalid" }
  | { kind: "expired" }
  | { kind: "reuse"; familyId: string; revoked: number };

/**
 * Capa Service del feature RefreshTokens.
 *
 * Cubre dos responsabilidades:
 *  1. **Gestión de las sesiones propias** (listar, consultar, revocar): es la
 *     parte que se expone con la modalidad JWT, sin RBAC, porque opera solo sobre
 *     las sesiones del usuario autenticado.
 *  2. **Ciclo de vida del token** (emitir, rotar, revocar), que consume el
 *     feature `session` en login/refresh/logout.
 */
export class RefreshTokensService {
  public constructor(
    private readonly repository: RefreshTokensRepository = new RefreshTokensRepository()
  ) {}

  // ================== GESTIÓN (sesiones propias) ==================
  public async getAllMine(userId: number): Promise<RefreshTokenResponseDto[]> {
    const tokens = await this.repository.findAllByUser(userId);
    return tokens.map((token) => toRefreshTokenResponse(token));
  }

  public async getMine(userId: number, id: number): Promise<RefreshTokenResponseDto> {
    return toRefreshTokenResponse(await this.findMineOrFail(userId, id));
  }

  /** Revoca una sesión propia concreta. */
  public async revokeMine(userId: number, id: number): Promise<RefreshTokenResponseDto> {
    const token = await this.findMineOrFail(userId, id);
    await this.repository.update(token, { status: "inactive" });
    return toRefreshTokenResponse(token);
  }

  /** Revoca **todas** las sesiones propias (útil si se sospecha un robo). */
  public async revokeAllMine(userId: number): Promise<number> {
    return this.repository.revokeAllByUser(userId);
  }

  /** Purga las sesiones propias ya revocadas o expiradas. */
  public async purgeMine(userId: number): Promise<number> {
    return this.repository.purgeInactiveByUser(userId);
  }

  public async countActiveMine(userId: number): Promise<number> {
    return this.repository.countActiveByUser(userId);
  }

  // ================== CICLO DE VIDA ==================
  /** Emite una sesión nueva (alta de login). Genera un `family_id` nuevo. */
  public async issue(
    userId: number,
    deviceInfo: string | null,
    transaction?: Transaction
  ): Promise<IssuedSession> {
    const rawToken = generateOpaqueToken();
    const familyId = randomUUID();
    const expiresAt = expiryFromNow();

    await this.repository.create(
      {
        user_id: userId,
        token_hash: sha256Hex(rawToken),
        family_id: familyId,
        device_info: deviceInfo,
        expires_at: expiresAt,
        status: "active",
      },
      transaction
    );

    // El token en claro se devuelve **una sola vez**; en la base solo queda el hash.
    return { rawToken, familyId, expiresAt };
  }

  /**
   * Rota un refresh token: lo invalida y emite uno nuevo con el mismo
   * `family_id`. Todo dentro de una transacción con bloqueo de fila.
   *
   * Concurrencia: si dos peticiones presentan el mismo token, una rota y la otra
   * encuentra el token ya inactivo -> se interpreta como reutilización y se
   * revoca la familia completa.
   */
  public async rotate(rawToken: string, deviceInfo: string | null): Promise<RotationOutcome> {
    const hash = sha256Hex(rawToken);

    // El valor de retorno de la transacción se decide **dentro**, pero los
    // efectos de revocación quedan confirmados aunque el resultado final sea un
    // rechazo (por eso no se lanza aquí dentro).
    const outcome = await withTransaction<RotationOutcome>(async (t) => {
      const current = await this.repository.findByHash(hash, t, true);

      if (!current) {
        return { kind: "invalid" };
      }

      // REUSE DETECTION: el token existía pero ya no está activo (fue rotado).
      if (current.status !== "active") {
        const revoked = await this.repository.revokeFamily(current.family_id, t);
        return { kind: "reuse", familyId: current.family_id, revoked };
      }

      if (new Date(current.expires_at).getTime() <= Date.now()) {
        await this.repository.update(current, { status: "inactive" }, t);
        return { kind: "expired" };
      }

      // Rotación: el token usado se invalida y nace uno nuevo en la misma familia.
      await this.repository.update(current, { status: "inactive" }, t);

      const rawNext = generateOpaqueToken();
      const expiresAt = expiryFromNow();
      await this.repository.create(
        {
          user_id: current.user_id,
          token_hash: sha256Hex(rawNext),
          family_id: current.family_id,
          device_info: deviceInfo ?? current.device_info,
          expires_at: expiresAt,
          status: "active",
        },
        t
      );

      return {
        kind: "rotated",
        userId: current.user_id,
        rawToken: rawNext,
        familyId: current.family_id,
        expiresAt,
      };
    });

    return outcome;
  }

  /**
   * Cierra la sesión asociada a un refresh token (logout).
   *
   * Es idempotente: un token inexistente o ya revocado no es un error, porque el
   * efecto deseado (que no sirva) ya se cumple.
   */
  public async revokeByToken(rawToken: string): Promise<boolean> {
    const token = await this.repository.findByHash(sha256Hex(rawToken));
    if (!token) return false;
    if (token.status !== "active") return true;

    await this.repository.update(token, { status: "inactive" });
    return true;
  }

  // ================== HELPERS ==================
  /**
   * Busca una sesión **del propio usuario**.
   *
   * El filtro por `user_id` es la frontera de seguridad: aunque el RBAC no
   * intervenga en estas rutas, un usuario nunca puede ver ni revocar la sesión
   * de otro. Un `id` ajeno responde 404, no 403 (no se filtra su existencia).
   */
  private async findMineOrFail(userId: number, id: number): Promise<RefreshToken> {
    const token = await this.repository.findById(id);
    if (!token || token.user_id !== userId) {
      throw new AppError(404, "Session not found");
    }
    return token;
  }
}

/** `now + REFRESH_TTL_DAYS`. Ventana deslizante: cada rotación la renueva. */
function expiryFromNow(): Date {
  return new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}
EOF
```

## 24.4 Controller y rutas

A diferencia del CRUD de administración, estas rutas son modalidad JWT y sin authorize: ver y revocar las propias sesiones es un derecho derivado de estar autenticado, no una concesión de la matriz (no tendría sentido pedir un permiso para cerrar la propia sesión). Por eso tampoco figuran en el catálogo de 58 recursos.

```bash
: > src/features/auth/refresh-tokens/refresh-tokens.controller.ts
cat >> src/features/auth/refresh-tokens/refresh-tokens.controller.ts << 'EOF'
import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { requireAuthUser } from "../../../shared/auth/auth-user";
import { RefreshTokensService } from "./refresh-tokens.service";

/**
 * Capa Controller del feature RefreshTokens — **modalidad JWT**.
 *
 * Todas las operaciones actúan sobre las sesiones del usuario autenticado
 * (`req.auth.id`). No exigen RBAC: poder ver y revocar **tus propias** sesiones
 * es un derecho derivado de estar autenticado, no de tener un permiso concreto.
 *
 * Orden de operaciones (con una salvedad de enrutado, ver `refresh-tokens.routes.ts`):
 * getAll → getOne → revokeAll (literal) → revokeOne → purge.
 */
export class RefreshTokensController extends BaseController {
  public constructor(
    private readonly service: RefreshTokensService = new RefreshTokensService()
  ) {
    super();
  }

  // ================== READ ==================
  public async getAll(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const sessions = await this.service.getAllMine(requireAuthUser(req).id);
      res.status(200).json({ sessions });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const session = await this.service.getMine(requireAuthUser(req).id, this.paramId(req));
      res.status(200).json({ session });
    });
  }

  // ================== STATE (revocar) ==================
  /** Revoca **todas** las sesiones del usuario autenticado. */
  public async revokeAll(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const revoked = await this.service.revokeAllMine(requireAuthUser(req).id);
      res.status(200).json({ message: "All sessions revoked", revoked });
    });
  }

  /** Revoca una sesión propia. */
  public async revokeOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const session = await this.service.revokeMine(
        requireAuthUser(req).id,
        this.paramId(req)
      );
      res.status(200).json({ message: "Session revoked", session });
    });
  }

  // ================== PURGE ==================
  /** Purga (borrado físico) las sesiones propias ya revocadas o expiradas. */
  public async purge(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const purged = await this.service.purgeMine(requireAuthUser(req).id);
      res.status(200).json({ message: "Inactive sessions purged", purged });
    });
  }
}
EOF
```

```
: > src/features/auth/refresh-tokens/refresh-tokens.routes.ts
cat >> src/features/auth/refresh-tokens/refresh-tokens.routes.ts << 'EOF'
import { Application } from "express";
import { RefreshTokensController } from "./refresh-tokens.controller";
import { authenticate } from "../access";

/**
 * Rutas del feature RefreshTokens — **modalidad 2 (JWT, sin RBAC)**.
 *
 * Todas operan sobre las **sesiones del usuario autenticado**. Ver y revocar las
 * propias sesiones es un derecho derivado de estar autenticado, no de un permiso
 * concreto; por eso no llevan `authorize` ni figuran en el catálogo de recursos.
 *
 * Nota de enrutado: `/api/sesiones/deactivate-all` es una **ruta literal** del
 * mismo verbo (`PATCH`) que la ruta parametrizada de una sola sesión
 * (`/api/sesiones/:id/deactivate`). No colisionan porque tienen distinto número
 * de segmentos, pero la literal se registra primero por claridad y para que
 * cualquier ruta literal futura siga la misma regla (Express resuelve por orden
 * de registro).
 */
export class RefreshTokensRoutes {
  public refreshTokensController: RefreshTokensController = new RefreshTokensController();

  public routes(app: Application): void {
    // getAll (sesiones propias)
    app
      .route("/api/sesiones")
      .get(
        authenticate,
        this.refreshTokensController.getAll.bind(this.refreshTokensController)
      );

    // revocar todas las sesiones propias (ruta literal: va ANTES de /:id)
    app
      .route("/api/sesiones/deactivate-all")
      .patch(
        authenticate,
        this.refreshTokensController.revokeAll.bind(this.refreshTokensController)
      );

    // getOne
    app
      .route("/api/sesiones/:id")
      .get(
        authenticate,
        this.refreshTokensController.getOne.bind(this.refreshTokensController)
      );

    // revocar una sesión propia
    app
      .route("/api/sesiones/:id/deactivate")
      .patch(
        authenticate,
        this.refreshTokensController.revokeOne.bind(this.refreshTokensController)
      );

    // purga de sesiones propias revocadas/expiradas
    app
      .route("/api/sesiones")
      .delete(authenticate, this.refreshTokensController.purge.bind(this.refreshTokensController));
  }
}
EOF
```

> **Nota de enrutado: **/api/sesiones/deactivate-all es una ruta literal del mismo verbo (PATCH) que /api/sesiones/:id/deactivate. No colisionan (distinto número de segmentos), pero la literal se registra antes por claridad y por si en el futuro se añade otra ruta literal.

## 24.5 Swagger

```bash
: > src/features/auth/refresh-tokens/refresh-tokens.swagger.ts
cat >> src/features/auth/refresh-tokens/refresh-tokens.swagger.ts << 'EOF'
import { bearerSecurity, invalidIdResponse, unauthorizedResponse } from "../../../shared/http/swagger-security";

/**
 * Documentación OpenAPI del feature RefreshTokens — **sesiones propias**.
 *
 * Modalidad: **JWT** (sin RBAC). No forman parte del catálogo de recursos: ver y
 * revocar las **propias** sesiones deriva de estar autenticado, no de un permiso
 * concedido. Un `id` de sesión ajeno responde **404** (no se filtra su existencia).
 */
export const refreshTokensSwagger = {
  tags: [
    {
      name: "Sesiones",
      description:
        "Sesiones persistidas del usuario autenticado (refresh tokens): listar, consultar y revocar — **JWT**",
    },
  ],
  paths: {
    "/api/sesiones": {
      get: {
        tags: ["Sesiones"],
        summary: "Listar mis sesiones activas",
        description: "JWT — devuelve las sesiones del usuario del token. `token_hash` nunca se expone.",
        security: bearerSecurity,
        responses: {
          "200": { description: "Sesiones propias (`{ sessions: [...] }`)" },
          "401": unauthorizedResponse,
        },
      },
      delete: {
        tags: ["Sesiones"],
        summary: "Purgar mis sesiones revocadas/expiradas",
        description: "JWT — borrado físico de las sesiones propias ya inútiles.",
        security: bearerSecurity,
        responses: {
          "200": { description: "Purga realizada (`{ message, purged }`)" },
          "401": unauthorizedResponse,
        },
      },
    },
    "/api/sesiones/deactivate-all": {
      patch: {
        tags: ["Sesiones"],
        summary: "Revocar todas mis sesiones",
        description:
          "JWT — pone `inactive` todas las sesiones propias (todos los dispositivos). " +
          "Útil ante sospecha de robo: el refresh token deja de servir de inmediato.",
        security: bearerSecurity,
        responses: {
          "200": { description: "Sesiones revocadas (`{ message, revoked }`)" },
          "401": unauthorizedResponse,
        },
      },
    },
    "/api/sesiones/{id}": {
      get: {
        tags: ["Sesiones"],
        summary: "Consultar una sesión propia",
        description: "JWT — `family_id`, `device_info`, `expires_at`, `status`. 404 si no es del usuario.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Sesión (`{ session }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "404": { description: "No encontrada o no pertenece al usuario autenticado" },
        },
      },
    },
    "/api/sesiones/{id}/deactivate": {
      patch: {
        tags: ["Sesiones"],
        summary: "Revocar una sesión propia",
        description: "JWT — revocación lógica de una sesión concreta.",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Sesión revocada (`{ message, session }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "404": { description: "No encontrada o no pertenece al usuario autenticado" },
        },
      },
    },
  },
  components: {
    schemas: {
      Session: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          user_id: { type: "integer", example: 2 },
          family_id: { type: "string", format: "uuid" },
          device_info: { type: "string", nullable: true, example: "Mozilla/5.0 ..." },
          expires_at: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          is_expired: { type: "boolean", example: false },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};
EOF
```

## 24.6 Pruebas HTTP

```bash
: > src/features/auth/refresh-tokens/http/sessions.get.http
cat >> src/features/auth/refresh-tokens/http/sessions.get.http << 'EOF'
### Feature RefreshTokens — SESIONES PROPIAS (modalidad JWT, sin RBAC)
### Ver y revocar las propias sesiones deriva de estar autenticado, no de un permiso.
### Un id de sesión ajeno responde 404 (no se filtra su existencia).
@baseUrl = http://localhost:4000

# @name loginComercial
POST {{baseUrl}}/api/sesion/login
Content-Type: application/json

{
  "identifier": "comercial",
  "password": "Comercial123!"
}

@token = {{loginComercial.response.body.$.access_token}}

### Listar mis sesiones activas (nunca expone `token_hash`)
GET {{baseUrl}}/api/sesiones
Authorization: Bearer {{token}}

### Consultar una sesión propia
GET {{baseUrl}}/api/sesiones/1
Authorization: Bearer {{token}}

### Revocar TODAS mis sesiones (ruta literal; registrar antes que /:id)
PATCH {{baseUrl}}/api/sesiones/deactivate-all
Authorization: Bearer {{token}}

### Revocar una sesión concreta
PATCH {{baseUrl}}/api/sesiones/1/deactivate
Authorization: Bearer {{token}}

### Purgar (borrado físico) mis sesiones revocadas/expiradas
DELETE {{baseUrl}}/api/sesiones
Authorization: Bearer {{token}}

### Modalidad JWT: sin token -> 401
GET {{baseUrl}}/api/sesiones
EOF
```

**Verificación**

```sql
-- Tras un login hay una fila `active`; tras un refresh, la vieja queda `used`.
SELECT id, user_id, family_id, status, expires_at FROM refresh_tokens ORDER BY id;
```

---------

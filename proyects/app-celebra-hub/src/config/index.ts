import dotenv from "dotenv";
import express, { Application, ErrorRequestHandler } from "express";
import cors from "cors";
import morgan from "morgan";

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
    this.app.set("port", this.port || process.env.PORT || 4000);
  }

  private middlewares(): void {
    this.app.use(morgan("dev"));
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
  }

  private routes(): void {
    this.app.get("/", (_req, res) => {
      res.json({
        message: "CelebraHub API funcionando",
        project: "CelebraHub - Centro de eventos",
        status: "OK",
      });
    });

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

      const force = process.env.DB_SYNC_FORCE === "true";
      const isMysql = sequelize.getDialect() === "mysql" || sequelize.getDialect() === "mariadb";

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

      console.log(force ? "📦 Base de datos recreada (DB_SYNC_FORCE=true)" : "📦 Base de datos sincronizada exitosamente");
    } catch (error) {
      console.error("❌ Error al conectar con la base de datos:", error);
      process.exit(1);
    }
  }

  async listen() {
    await this.dbConnection();
    await this.app.listen(this.app.get("port"));
    console.log(`🚀 Servidor ejecutándose en puerto ${this.app.get("port")}`);
  }
}

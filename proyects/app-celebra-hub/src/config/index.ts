import dotenv from "dotenv";
import express, {
  Application,
  ErrorRequestHandler
} from "express";
import cors from "cors";
import morgan from "morgan";

import {
  sequelize,
  getDatabaseInfo,
  testConnection
} from "../database/db";


import "../features/business/clientes/cliente.model";
import "../features/business/servicios/servicio.model";
import "../features/business/evento-servicios/evento-servicio.model";
import "../features/business/salones/salon.model";
import "../features/business/reservas/reserva.model";
import "../features/business/proveedores/proveedor.model";
import "../features/business/contratos/contrato.model";
import "../features/business/pagos/pago.model";

import { Routes } from "../routes/index";
import { setupSwagger } from "../swagger/index";

dotenv.config();

export class App {

  private app: Application;

  private port: number;

  public routePrv: Routes =
    new Routes();

  constructor() {

    this.app = express();

    this.port =
      Number(process.env.PORT) || 4000;

    this.settings();

    this.middlewares();

    this.routes();

    this.docs();

    this.errorHandling();
  }

  private settings(): void {
    this.app.set(
      "port",
      this.port
    );
  }

  private middlewares(): void {

    this.app.use(cors());

    this.app.use(
      express.json()
    );

    this.app.use(
      express.urlencoded({
        extended: true
      })
    );

    this.app.use(
      morgan("dev")
    );
  }
private routes(): void {

  this.app.get(
    "/",
    (_req, res) => {

      res.json({
        message:
          "CelebraHub API funcionando",

        project:
          "CelebraHub - Centro de eventos",

        status: "OK"
      });
    }
  );

  this.routePrv
    .clientesRoutes
    .routes(this.app);

  this.routePrv
    .serviciosRoutes
    .routes(this.app);

    this.routePrv
    .eventoServiciosRoutes
    .routes(this.app);

    this.routePrv
    .salonesRoutes
    .routes(this.app);

    this.routePrv
    .reservasRoutes
    .routes(this.app);
    
    this.routePrv
    .proveedoresRoutes
    .routes(this.app);
    this.routePrv
      .contratosRoutes
      .routes(this.app);

    this.routePrv
      .pagosRoutes
      .routes(this.app);

    this.routePrv
      .pagosRoutes
      .routes(this.app);

}
  

  private docs(): void {

  setupSwagger(this.app);

}

  private async dbConnection(): Promise<void> {

    try {

      const dbInfo =
        getDatabaseInfo();

      console.log(
        `🔗 Intentando conectar a: ${dbInfo.engine.toUpperCase()}`
      );

      const isConnected =
        await testConnection();

      if (!isConnected) {

        throw new Error(
          `No se pudo conectar a la base de datos ${dbInfo.engine.toUpperCase()}`
        );
      }

      await sequelize.sync({
        force: false,
        alter: true
      });

      console.log(
        "📦 Base de datos sincronizada exitosamente"
      );

    } catch (error) {

      console.error(
        "❌ Error al conectar con la base de datos:",
        error
      );

      process.exit(1);
    }
  }

  private errorHandling(): void {

    const errorHandler:
      ErrorRequestHandler =
      (
        err,
        _req,
        res,
        _next
      ) => {

        console.error(err);

        res.status(500).json({
          message:
            "Error interno del servidor"
        });
      };

    this.app.use(
      errorHandler
    );
  }

  public async listen(): Promise<void> {

    await this.dbConnection();

    this.app.listen(
      this.port,
      () => {

        console.log(
          `CelebraHub API ejecutándose en http://localhost:${this.port}`
        );
      }
    );
  }
}

import { Router, Application } from "express";
import { ClientController } from "../controllers/client.controller";

export class ClientRoutes {
  public clientController: ClientController = new ClientController();

  public routes(app: Application): void {
    // ================== RUTAS SIN AUTENTICACIÓN ==================
     app.route("/api/clientes")
      .get(this.clientController.getAllClients)

    // ================== RUTAS CON AUTENTICACIÓN ==================


  }
}
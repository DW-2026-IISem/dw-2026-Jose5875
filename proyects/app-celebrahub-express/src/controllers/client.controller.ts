import { Request, Response } from "express";
import { Client, ClientI } from "../models/Client";

export class ClientController {
  // Get all clients with status "ACTIVE"
  public async getAllClients(req: Request, res: Response) {
    try {
      const clients: ClientI[] = await Client.findAll({
        where: { status: 'ACTIVE' },
      });
      res.status(200).json({ clients });
    } catch (error) {
      res.status(500).json({ error: "Error fetching clients" });
    }
  }

}
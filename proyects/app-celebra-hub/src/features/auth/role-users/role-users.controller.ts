import { Request, Response } from "express";
import { RoleUsersService } from "./role-users.service";
import { AuthenticatedRequest } from "../../../shared/auth/auth-user";

export class RoleUsersController {
  public constructor(private readonly service: RoleUsersService = new RoleUsersService()) {}

  public getAll = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    const assignments = await this.service.getAll();
    res.status(200).json(assignments);
  };

  public getOne = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const assignment = await this.service.getOne(id);
    res.status(200).json({ assignment });
  };

  public assign = async (req: Request, res: Response): Promise<void> => {
    const assignment = await this.service.assign(req.body);
    res.status(201).json({ assignment });
  };

  public deactivate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const assignment = await this.service.deactivate(id);
    res.status(200).json({ assignment });
  };

  public reactivate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const assignment = await this.service.reactivate(id);
    res.status(200).json({ assignment });
  };
}

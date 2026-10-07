import { Request, Response } from "express";
import { ResourceRolesService } from "./resource-roles.service";
import { AuthenticatedRequest } from "../../../shared/auth/auth-user";

export class ResourceRolesController {
  public constructor(private readonly service: ResourceRolesService = new ResourceRolesService()) {}

  public getAll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const filters = {
      role_id: req.query.role_id ? Number(req.query.role_id) : undefined,
      resource_id: req.query.resource_id ? Number(req.query.resource_id) : undefined,
    };

    const grants = await this.service.getAll(filters);
    res.status(200).json(grants);
  };

  public getOne = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const grant = await this.service.getOne(id);
    res.status(200).json({ grant });
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    const grant = await this.service.create(req.body);
    res.status(201).json({ grant });
  };

  public deactivate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const grant = await this.service.deactivate(id);
    res.status(200).json({ grant });
  };

  public reactivate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const grant = await this.service.reactivate(id);
    res.status(200).json({ grant });
  };
}

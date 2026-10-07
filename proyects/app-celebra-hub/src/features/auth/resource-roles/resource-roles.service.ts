import { Op } from "sequelize";
import { AppError } from "../../../shared/errors/app-error";
import { Resource } from "../resources/resource.model";
import { ResourceRole } from "./resource-role.model";
import { Role } from "../roles/role.model";
import { RoleUser } from "../role-users/role-user.model";
import { User } from "../users/user.model";
import { ResourceRolesRepository } from "./resource-roles.repository";
import { RolesRepository } from "../roles/roles.repository";
import { ResourcesRepository } from "../resources/resources.repository";
import { CreateResourceRoleDto, EffectivePermissionDto, ResourceRoleResponseDto, toResourceRoleResponse } from "./dto";

export class ResourceRolesService {
  public constructor(
    private readonly repository: ResourceRolesRepository = new ResourceRolesRepository(),
    private readonly rolesRepository: RolesRepository = new RolesRepository(),
    private readonly resourcesRepository: ResourcesRepository = new ResourcesRepository()
  ) {}

  public async getAll(filters?: { role_id?: number; resource_id?: number }): Promise<ResourceRoleResponseDto[]> {
    const grants = await this.repository.findAll(filters);
    return grants.map((grant) => toResourceRoleResponse(grant));
  }

  public async getOne(id: number): Promise<ResourceRoleResponseDto> {
    const grant = await this.findOrFail(id);
    return toResourceRoleResponse(grant);
  }

  public async create(payload: CreateResourceRoleDto): Promise<ResourceRoleResponseDto> {
    await this.assertRoleActive(payload.role_id);
    await this.assertResourceActive(payload.resource_id);

    const existing = await this.repository.findByRoleAndResource(payload.role_id, payload.resource_id);
    if (existing) {
      if (existing.status === "active") {
        throw new AppError(409, "Grant already exists for this role and resource");
      }
      const reactivated = await this.repository.update(existing, { status: "active" });
      return toResourceRoleResponse(await this.reload(reactivated.id));
    }

    const created = await this.repository.create({
      role_id: payload.role_id,
      resource_id: payload.resource_id,
      status: "active",
    });

    return toResourceRoleResponse(await this.reload(created.id));
  }

  public async deactivate(id: number): Promise<ResourceRoleResponseDto> {
    const grant = await this.findOrFail(id);
    await this.repository.update(grant, { status: "inactive" });
    return toResourceRoleResponse(await this.reload(grant.id));
  }

  public async reactivate(id: number): Promise<ResourceRoleResponseDto> {
    const grant = await this.findOrFail(id, false);
    if (grant.status === "active") {
      throw new AppError(409, "Grant is already active");
    }
    await this.repository.update(grant, { status: "active" });
    return toResourceRoleResponse(await this.reload(grant.id));
  }

  public async findEffectiveForUser(userId: number): Promise<EffectivePermissionDto[]> {
    const roleUsers = await RoleUser.findAll({
      where: { user_id: userId, status: "active" },
      include: [
        {
          model: Role,
          as: "role",
          where: { status: "active" },
          include: [
            {
              model: ResourceRole,
              as: "resource_roles",
              where: { status: "active" },
              include: [
                {
                  model: Resource,
                  as: "resource",
                  where: { status: "active" },
                },
              ],
            },
          ],
        },
      ],
    });

    const permissions = new Map<string, EffectivePermissionDto>();

    for (const roleUser of roleUsers) {
      const role = (roleUser as any).role as Role | undefined;
      if (!role) continue;

      const grants = ((role as any).resource_roles ?? []) as ResourceRole[];
      for (const grant of grants) {
        const resource = (grant as any).resource as Resource | undefined;
        if (!resource) continue;

        const key = `${resource.method}:${resource.path}`;
        permissions.set(key, { method: resource.method, path: resource.path });
      }
    }

    return Array.from(permissions.values());
  }

  private async findOrFail(id: number, onlyActive = true): Promise<ResourceRole> {
    const grant = await this.repository.findById(id);
    if (!grant || (onlyActive && grant.status !== "active")) {
      throw new AppError(404, "Resource role grant not found");
    }
    return grant;
  }

  private async reload(id: number): Promise<ResourceRole> {
    const grant = await this.repository.findById(id);
    if (!grant) {
      throw new AppError(404, "Resource role grant not found");
    }
    return grant;
  }

  private async assertRoleActive(roleId: number): Promise<void> {
    const role = await this.rolesRepository.findById(roleId);
    if (!role || role.status !== "active") {
      throw new AppError(404, "Role not found or inactive");
    }
  }

  private async assertResourceActive(resourceId: number): Promise<void> {
    const resource = await this.resourcesRepository.findById(resourceId);
    if (!resource || resource.status !== "active") {
      throw new AppError(404, "Resource not found or inactive");
    }
  }
}

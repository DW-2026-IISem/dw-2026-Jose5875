import { Op } from "sequelize";
import { Resource } from "../resources/resource.model";
import { ResourceRole } from "../resource-roles/resource-role.model";
import { Role } from "../roles/role.model";
import { RoleUser } from "../role-users/role-user.model";
import { EffectivePermissionDto } from "./dto";

export class ResourceRolesService {
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
}

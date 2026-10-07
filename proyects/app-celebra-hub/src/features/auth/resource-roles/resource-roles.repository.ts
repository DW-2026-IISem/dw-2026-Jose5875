import { CreationAttributes, Op, Transaction } from "sequelize";
import { ResourceRole } from "./resource-role.model";
import { Role } from "../roles/role.model";
import { Resource } from "../resources/resource.model";

const INCLUDES = [
  { model: Role, as: "role", attributes: ["id", "name"] },
  { model: Resource, as: "resource", attributes: ["id", "method", "path", "description"] },
];

export class ResourceRolesRepository {
  public async findAll(filters?: { role_id?: number; resource_id?: number }, transaction?: Transaction): Promise<ResourceRole[]> {
    const where: Record<string, any> = { status: "active" };

    if (filters?.role_id) where.role_id = filters.role_id;
    if (filters?.resource_id) where.resource_id = filters.resource_id;

    return ResourceRole.findAll({
      where,
      include: INCLUDES,
      transaction,
    });
  }

  public async findById(id: number, transaction?: Transaction): Promise<ResourceRole | null> {
    return ResourceRole.findByPk(id, { include: INCLUDES, transaction });
  }

  public async findByRoleAndResource(roleId: number, resourceId: number): Promise<ResourceRole | null> {
    return ResourceRole.findOne({
      where: { role_id: roleId, resource_id: resourceId },
      include: INCLUDES,
    });
  }

  public async create(data: CreationAttributes<ResourceRole>): Promise<ResourceRole> {
    return ResourceRole.create(data);
  }

  public async update(resourceRole: ResourceRole, data: Partial<ResourceRole>): Promise<ResourceRole> {
    return resourceRole.update(data);
  }
}

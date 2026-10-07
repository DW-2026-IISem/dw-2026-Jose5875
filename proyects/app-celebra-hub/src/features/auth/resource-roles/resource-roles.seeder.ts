import { ResourceRole } from "./resource-role.model";
import { Role } from "../roles/role.model";
import { Resource } from "../resources/resource.model";

export async function seedResourceRoles(): Promise<void> {
  const roles = await Role.findAll({ where: { status: "active" } });
  const resources = await Resource.findAll({ where: { status: "active" } });

  if (!roles.length || !resources.length) {
    return;
  }

  for (const role of roles) {
    const rule = resources.filter((resource) => {
      if (role.name === "ADMIN") return true;
      if (role.name === "COMERCIAL") {
        return ["GET", "POST"].includes(resource.method) && [
          "/api/clientes",
          "/api/reservas",
          "/api/eventos",
          "/api/servicios",
          "/api/salones",
          "/api/proveedores",
          "/api/contratos",
        ].some((path) => path === resource.path);
      }
      return false;
    });

    for (const resource of rule) {
      await ResourceRole.findOrCreate({
        where: { role_id: role.id, resource_id: resource.id },
        defaults: { status: "active" },
      });
    }
  }
}

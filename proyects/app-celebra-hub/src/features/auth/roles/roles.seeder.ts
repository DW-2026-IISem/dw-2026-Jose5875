import { Role } from "./role.model";

/**
 * Roles definidos por CelebraHub.
 *
 * La matriz de permisos se construye después, en resource_roles.
 */
export const SEED_ROLES = [
  {
    name: "ADMIN",
    description: "Administración completa de CelebraHub",
  },
  {
    name: "COMERCIAL",
    description: "Gestión comercial de clientes, reservas y cotizaciones",
  },
  {
    name: "OPERACIONES",
    description: "Gestión operativa de salones, eventos y servicios",
  },
  {
    name: "PROVEEDOR",
    description: "Gestión de proveedores y servicios asociados",
  },
  {
    name: "CARTERA",
    description: "Gestión de contratos, pagos y procesos de cartera",
  },
] as const;

export async function seedRoles(): Promise<number> {
  let created = 0;

  for (const item of SEED_ROLES) {
    const [role, wasCreated] = await Role.findOrCreate({
      where: { name: item.name },
      defaults: {
        name: item.name,
        description: item.description,
        status: "active",
      },
    });

    if (wasCreated) {
      created++;
      continue;
    }

    if (role.status !== "active") {
      await role.update({ status: "active" });
    }
  }

  console.log(
    `✅ roles: catálogo reconciliado (${SEED_ROLES.length} roles, ${created} nuevos)`
  );

  return created;
}

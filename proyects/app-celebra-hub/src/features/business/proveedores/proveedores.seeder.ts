import { faker } from "@faker-js/faker";

import { Proveedor } from "./proveedor.model";

export async function seedProveedores(
  count: number
): Promise<number> {

  if (count <= 0) {
    console.log(
      "⏭️ proveedores: count=0, se omite"
    );

    return 0;
  }

  const existing =
    await Proveedor.count();

  if (existing > 0) {
    console.log(
      `⏭️ proveedores: ya hay ${existing} registro(s), se omite seeder`
    );

    return 0;
  }

  const rows = Array.from(
    { length: count },
    (_, index) => ({
      nit: `900${Date.now()}${index}`,
      razon_social:
        faker.company.name(),
      contacto:
        faker.person.fullName(),
      telefono:
        faker.phone.number(),
      email:
        faker.internet.email(),
      is_active: true
    })
  );

  await Proveedor.bulkCreate(
    rows
  );

  console.log(
    `✅ proveedores: insertados ${count} registro(s) de prueba`
  );

  return count;
}

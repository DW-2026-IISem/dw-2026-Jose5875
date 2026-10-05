import { faker } from "@faker-js/faker";

import { Cliente } from "./cliente.model";

export async function seedClientes(
  count: number
): Promise<void> {

  console.log(
    `🌱 Creando ${count} clientes...`
  );

  const clientes = [];

  for (let i = 0; i < count; i++) {

    clientes.push({
      tipo_documento:
        faker.helpers.arrayElement([
          "CC",
          "CE",
          "TI",
          "NIT"
        ]),

      numero_documento:
        faker.string.numeric(10),

      nombre:
        faker.person.fullName(),

      telefono:
        faker.phone.number(),

      email:
        faker.internet.email(),

      is_active: true
    });
  }

  await Cliente.bulkCreate(clientes);

  console.log(
    `✅ Se crearon ${count} clientes`
  );
}

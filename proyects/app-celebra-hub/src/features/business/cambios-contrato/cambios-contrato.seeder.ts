import { faker } from "@faker-js/faker";
import { CambioContrato } from "./cambio-contrato.model";

export async function seedCambiosContrato(
  count: number
): Promise<number> {
  if (count <= 0) {
    console.log("⏭️ cambios-contrato: count=0, se omite");
    return 0;
  }

  const existing = await CambioContrato.count();

  if (existing > 0) {
    console.log(
      `⏭️ cambios-contrato: ya hay ${existing} registro(s), se omite seeder`
    );
    return 0;
  }

  const rows = Array.from({ length: count }, () => ({
    nombre: faker.helpers.arrayElement([
      "Cambio de fecha",
      "Cambio de cantidad",
      "Cambio de servicio",
      "Cambio de horario",
      "Ampliación del evento",
    ]),
    descripcion: faker.lorem.sentence(),
    is_active: true,
  }));

  await CambioContrato.bulkCreate(rows);

  console.log(
    `✅ cambios-contrato: insertados ${count} registro(s) de prueba`
  );

  return count;
}

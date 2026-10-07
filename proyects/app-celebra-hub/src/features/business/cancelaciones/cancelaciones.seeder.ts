import { faker } from "@faker-js/faker";
import { Cancelacion } from "./cancelacion.model";

export async function seedCancelaciones(
  count: number
): Promise<number> {
  if (count <= 0) {
    console.log("⏭️ cancelaciones: count=0, se omite");
    return 0;
  }

  const existing = await Cancelacion.count();

  if (existing > 0) {
    console.log(
      `⏭️ cancelaciones: ya hay ${existing} registro(s), se omite seeder`
    );
    return 0;
  }

  const rows = Array.from({ length: count }, () => ({
    nombre: faker.helpers.arrayElement([
      "Cancelación por cliente",
      "Cancelación por disponibilidad",
      "Cancelación por incumplimiento",
      "Cancelación por fuerza mayor",
      "Cancelación administrativa",
    ]),
    descripcion: faker.lorem.sentence(),
    is_active: true,
  }));

  await Cancelacion.bulkCreate(rows);

  console.log(
    `✅ cancelaciones: insertados ${count} registro(s) de prueba`
  );

  return count;
}

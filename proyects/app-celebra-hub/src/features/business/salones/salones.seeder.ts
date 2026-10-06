import { faker } from "@faker-js/faker";
import { Salon } from "./salon.model";

/**
 * Seeder del feature Salon de CelebraHub.
 * Genera salones de prueba para el centro de eventos.
 *
 * Es idempotente: si ya existen salones,
 * no vuelve a insertar registros.
 */
export async function seedSalones(
  count: number
): Promise<number> {

  if (count <= 0) {
    console.log(
      "⏭️ salones: count=0, se omite"
    );

    return 0;
  }

  const existing =
    await Salon.count();

  if (existing > 0) {
    console.log(
      `⏭️ salones: ya hay ${existing} registro(s), se omite seeder`
    );

    return 0;
  }

  const nombres = [
    "Salón Principal",
    "Salón Ejecutivo",
    "Salón Familiar",
    "Salón Empresarial",
    "Salón Jardín",
    "Salón Celebración",
    "Salón Terraza",
    "Salón Eventos"
  ];

  const rows = Array.from(
    { length: count },
    (_, index) => ({
      nombre:
        nombres[index % nombres.length],

      descripcion:
        faker.lorem.sentence(),

      is_active: true
    })
  );

  await Salon.bulkCreate(rows);

  console.log(
    `✅ salones: insertados ${count} registro(s) de prueba`
  );

  return count;
}

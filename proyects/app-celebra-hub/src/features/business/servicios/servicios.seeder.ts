import { faker } from "@faker-js/faker";
import { Servicio } from "./servicio.model";

/**
 * Seeder del feature Servicio de CelebraHub.
 * Genera servicios de prueba para el centro de eventos.
 *
 * Es idempotente: si ya existen servicios,
 * no vuelve a insertar registros.
 */
export async function seedServicios(
  count: number
): Promise<number> {

  if (count <= 0) {
    console.log("⏭️ servicios: count=0, se omite");
    return 0;
  }

  const existing =
    await Servicio.count();

  if (existing > 0) {
    console.log(
      `⏭️ servicios: ya hay ${existing} registro(s), se omite seeder`
    );

    return 0;
  }

  const tiposServicio = [
    "Decoración",
    "Catering",
    "Mobiliario",
    "Sonido",
    "Iluminación",
    "Fotografía",
    "Animación",
    "Organización de eventos"
  ];

  const rows = Array.from(
    { length: count },
    (_, index) => ({
      nombre:
        tiposServicio[index % tiposServicio.length],

      descripcion:
        faker.commerce.productDescription(),

      is_active: true
    })
  );

  await Servicio.bulkCreate(rows);

  console.log(
    `✅ servicios: insertados ${count} registro(s) de prueba`
  );

  return count;
}

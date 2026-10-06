import { faker } from "@faker-js/faker";
import { EventoServicio } from "./evento-servicio.model";

/**
 * Seeder del feature EventoServicio de CelebraHub.
 * Genera registros de prueba para servicios asociados
 * a eventos del centro de eventos.
 *
 * Es idempotente: si ya existen registros,
 * no vuelve a insertar.
 */
export async function seedEventoServicios(
  count: number
): Promise<number> {

  if (count <= 0) {
    console.log(
      "⏭️ evento-servicios: count=0, se omite"
    );

    return 0;
  }

  const existing =
    await EventoServicio.count();

  if (existing > 0) {
    console.log(
      `⏭️ evento-servicios: ya hay ${existing} registro(s), se omite seeder`
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
      referencia_id:
        index + 1,

      tipo:
        tiposServicio[
          index % tiposServicio.length
        ],

      fecha:
        faker.date.future({
          years: 1
        }),

      cantidad:
        faker.number.int({
          min: 1,
          max: 100
        }),

      observaciones:
        faker.lorem.sentence(),

      estado:
        "pendiente"
    })
  );

  await EventoServicio.bulkCreate(rows);

  console.log(
    `✅ evento-servicios: insertados ${count} registro(s) de prueba`
  );

  return count;
}

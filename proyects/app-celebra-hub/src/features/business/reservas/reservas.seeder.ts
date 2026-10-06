import { faker } from "@faker-js/faker";

import { Reserva } from "./reserva.model";

export async function seedReservas(
  count: number
): Promise<number> {

  if (count <= 0) {
    console.log(
      "⏭️ reservas: count=0, se omite"
    );

    return 0;
  }

  const existing =
    await Reserva.count();

  if (existing > 0) {
    console.log(
      `⏭️ reservas: ya hay ${existing} registro(s), se omite seeder`
    );

    return 0;
  }

  const rows = Array.from(
    { length: count },
    (_, index) => {

      const fechaInicio =
        faker.date.future();

      const fechaFin =
        new Date(fechaInicio);

      fechaFin.setHours(
        fechaFin.getHours() + 4
      );

      return {
        cliente_id:
          (index % 10) + 1,

        fecha_inicio:
          fechaInicio,

        fecha_fin:
          fechaFin,

        estado:
          "pendiente",

        observaciones:
          faker.lorem.sentence()
      };
    }
  );

  await Reserva.bulkCreate(
    rows
  );

  console.log(
    `✅ reservas: insertados ${count} registro(s) de prueba`
  );

  return count;
}

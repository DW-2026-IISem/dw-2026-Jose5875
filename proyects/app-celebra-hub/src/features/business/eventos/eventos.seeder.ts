import { faker } from "@faker-js/faker";
import { Evento } from "./evento.model";

export async function seedEventos(count: number): Promise<number> {
  if (count <= 0) {
    console.log("⏭️ eventos: count=0, se omite");
    return 0;
  }

  const existing = await Evento.count();

  if (existing > 0) {
    console.log(
      `⏭️ eventos: ya hay ${existing} registro(s), se omite seeder`
    );
    return 0;
  }

  const rows = Array.from({ length: count }, () => ({
    referencia_id: faker.number.int({ min: 1, max: 100 }),
    tipo: faker.helpers.arrayElement([
      "Boda",
      "Cumpleaños",
      "Conferencia",
      "Reunión empresarial",
      "Evento social",
    ]),
    fecha: faker.date.future(),
    cantidad: faker.number.int({ min: 10, max: 300 }),
    observaciones: faker.lorem.sentence(),
    estado: faker.helpers.arrayElement([
      "pendiente",
      "confirmado",
      "realizado",
      "cancelado",
    ]),
  }));

  await Evento.bulkCreate(rows);

  console.log(`✅ eventos: insertados ${count} registro(s) de prueba`);

  return count;
}

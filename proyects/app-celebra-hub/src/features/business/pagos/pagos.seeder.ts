import { faker } from "@faker-js/faker";
import { Pago } from "./pago.model";

export async function seedPagos(count: number): Promise<number> {
  if (count <= 0) {
    console.log("⏭️ pagos: count=0, se omite");
    return 0;
  }

  const existing = await Pago.count();

  if (existing > 0) {
    console.log(
      `⏭️ pagos: ya hay ${existing} registro(s), se omite seeder`
    );
    return 0;
  }

  const rows = Array.from({ length: count }, (_, index) => ({
    referencia_tipo: "Contrato",
    referencia_id: (index % 5) + 1,
    metodo: faker.helpers.arrayElement([
      "efectivo",
      "transferencia",
      "tarjeta",
    ]),
    monto: faker.number.int({
      min: 100000,
      max: 10000000,
    }),
    fecha: faker.date.recent({
      days: 30,
    }),
    estado: "aprobado",
  }));

  await Pago.bulkCreate(rows);

  console.log(
    `✅ pagos: insertados ${count} registro(s) de prueba`
  );

  return count;
}

import { faker } from "@faker-js/faker";
import { Contrato } from "./contrato.model";

export async function seedContratos(count: number): Promise<number> {
  if (count <= 0) {
    console.log("⏭️ contratos: count=0, se omite");
    return 0;
  }

  const existing = await Contrato.count();

  if (existing > 0) {
    console.log(
      `⏭️ contratos: ya hay ${existing} registro(s), se omite seeder`
    );
    return 0;
  }

  const rows = Array.from({ length: count }, (_, index) => {
    const fechaInicio = faker.date.future();

    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + 30);

    return {
      cliente_id: (index % 10) + 1,
      numero: `CTR-${Date.now()}-${index + 1}`,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      valor: faker.number.int({
        min: 500000,
        max: 20000000,
      }),
      estado: "vigente",
    };
  });

  await Contrato.bulkCreate(rows);

  console.log(
    `✅ contratos: insertados ${count} registro(s) de prueba`
  );

  return count;
}

import dotenv from "dotenv";

import {
  sequelize,
  testConnection
} from "../db";

import "../../features/business/clientes/cliente.model";

import {
  seedClientes
} from "../../features/business/clientes/clientes.seeder";

import "../../features/business/servicios/servicio.model";

import {
  seedServicios
} from "../../features/business/servicios/servicios.seeder";

import "../../features/business/salones/salon.model";

import {
  seedSalones
} from "../../features/business/salones/salones.seeder";

import "../../features/business/evento-servicios/evento-servicio.model";

import {
  seedEventoServicios
} from "../../features/business/evento-servicios/evento-servicios.seeder";

import {
  resolveSeedCounts
} from "./counts";

dotenv.config();

/**
 * SeedersRunner — ejecuta todos los seeders
 * de las features de CelebraHub.
 */
export async function runAllSeeders(): Promise<void> {

  const counts = resolveSeedCounts();

  console.log("🌱 Iniciando SeedersRunner...");
  console.log("📊 Conteos:", counts);

  const ok = await testConnection();

  if (!ok) {
    throw new Error(
      "No hay conexión a la base de datos"
    );
  }

  await sequelize.sync({
    force: false,
    alter: true
  });

  // Orden: business (padres → hijos)
  await seedClientes(counts.clientes);

  await seedServicios(counts.servicios);

  await seedSalones(counts.salones);

  await seedEventoServicios(
    counts.eventoServicios
  );

  console.log("🌱 SeedersRunner finalizado");
}

if (require.main === module) {

  runAllSeeders()

    .then(async () => {
      await sequelize.close();
      process.exit(0);
    })

    .catch(async (err) => {

      console.error(
        "❌ Error en seeders:",
        err
      );

      await sequelize.close();
      process.exit(1);
    });
}

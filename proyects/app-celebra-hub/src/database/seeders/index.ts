import dotenv from "dotenv";

import {
  sequelize,
  testConnection
} from "../db";

import "../../features/business/clientes/cliente.model";
import "../../features/business/servicios/servicio.model";
import "../../features/business/salones/salon.model";
import "../../features/business/evento-servicios/evento-servicio.model";
import "../../features/business/reservas/reserva.model";
import "../../features/business/proveedores/proveedor.model";

import {
  seedClientes
} from "../../features/business/clientes/clientes.seeder";

import {
  seedServicios
} from "../../features/business/servicios/servicios.seeder";

import {
  seedSalones
} from "../../features/business/salones/salones.seeder";

import {
  seedEventoServicios
} from "../../features/business/evento-servicios/evento-servicios.seeder";

import {
  seedReservas
} from "../../features/business/reservas/reservas.seeder";

import {
  resolveSeedCounts
} from "./counts";

import {
  seedProveedores
} from "../../features/business/proveedores/proveedores.seeder";

dotenv.config();

export async function runAllSeeders(): Promise<void> {

  const counts =
    resolveSeedCounts();

  console.log(
    "🌱 Iniciando SeedersRunner..."
  );

  console.log(
    "📊 Conteos:",
    counts
  );

  const ok =
    await testConnection();

  if (!ok) {
    throw new Error(
      "No hay conexión a la base de datos"
    );
  }

  await sequelize.sync({
    force: false,
    alter: true
  });

  await seedClientes(
    counts.clientes
  );

  await seedServicios(
    counts.servicios
  );

  await seedSalones(
    counts.salones
  );

  await seedEventoServicios(
    counts.eventoServicios
  );

  await seedReservas(
    counts.reservas
  );

  await seedProveedores(
   counts.proveedores
  );

  console.log(
    "🌱 SeedersRunner finalizado"
  );
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

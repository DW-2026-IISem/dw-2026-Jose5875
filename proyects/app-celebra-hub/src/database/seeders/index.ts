import "../../features/business/clientes/cliente.model";
import "../../features/business/servicios/servicio.model";
import "../../features/business/salones/salon.model";
import "../../features/business/reservas/reserva.model";
import "../../features/business/proveedores/proveedor.model";
import "../../features/business/contratos/contrato.model";
import "../../features/business/pagos/pago.model";
import "../../features/business/cambios-contrato/cambio-contrato.model";
import "../../features/business/cancelaciones/cancelacion.model";
import "../../features/business/evento-servicios/evento-servicio.model";
import "../../features/business/eventos/evento.model";
import "../../features/auth/users/user.model";
import "../../features/auth/roles/role.model";
import "../../features/auth/resources/resource.model";
import "../../features/auth/role-users/role-user.model";
import "../../features/auth/resource-roles/resource-role.model";
import "../../features/auth/refresh-tokens/refresh-token.model";
import "../../features/auth/rbac.associations";

import { sequelize } from "../db";
import { resolveSeedCounts } from "./counts";

import { seedClientes } from "../../features/business/clientes/clientes.seeder";
import { seedServicios } from "../../features/business/servicios/servicios.seeder";
import { seedSalones } from "../../features/business/salones/salones.seeder";
import { seedReservas } from "../../features/business/reservas/reservas.seeder";
import { seedProveedores } from "../../features/business/proveedores/proveedores.seeder";
import { seedContratos } from "../../features/business/contratos/contratos.seeder";
import { seedPagos } from "../../features/business/pagos/pagos.seeder";
import { seedCambiosContrato } from "../../features/business/cambios-contrato/cambios-contrato.seeder";
import { seedCancelaciones } from "../../features/business/cancelaciones/cancelaciones.seeder";
import { seedEventoServicios } from "../../features/business/evento-servicios/evento-servicios.seeder";
import { seedEventos } from "../../features/business/eventos/eventos.seeder";
import { seedUsers } from "../../features/auth/users/users.seeder";
import { seedRoles } from "../../features/auth/roles/roles.seeder";
import { seedResources } from "../../features/auth/resources/resources.seeder";

async function runSeeders() {
  console.log("🌱 Iniciando SeedersRunner...");

  const counts = resolveSeedCounts();

  console.log("📊 Conteos:", counts);

  try {
    await sequelize.authenticate();

    console.log("✅ Conexión exitosa a MYSQL");

    await sequelize.sync({
      force: false,
      alter: false,
    });

    await seedClientes(counts.clientes);
    await seedServicios(counts.servicios);
    await seedSalones(counts.salones);
    await seedReservas(counts.reservas);
    await seedProveedores(counts.proveedores);
    await seedContratos(counts.contratos);
    await seedPagos(counts.pagos);
    await seedCambiosContrato(counts.cambiosContrato);
    await seedCancelaciones(counts.cancelaciones);
    await seedEventoServicios(counts.eventoServicios);
    await seedEventos(counts.eventos);
    await seedUsers(counts.clientes > 0 ? counts.clientes : 5);
    await seedRoles();
    await seedResources();

    console.log("🌱 SeedersRunner finalizado");
  } catch (error) {
    console.error("❌ Error ejecutando SeedersRunner:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

runSeeders();

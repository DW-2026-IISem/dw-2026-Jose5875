
import { Application } from "express";

import { clientesSwagger } from "../features/business/clientes/clientes.swagger";
import { serviciosSwagger } from "../features/business/servicios/servicios.swagger";
import { salonesSwagger } from "../features/business/salones/salones.swagger";
import { reservasSwagger } from "../features/business/reservas/reservas.swagger";
import { proveedoresSwagger } from "../features/business/proveedores/proveedores.swagger";
import { contratosSwagger } from "../features/business/contratos/contratos.swagger";
import { pagosSwagger } from "../features/business/pagos/pagos.swagger";
import { cambiosContratoSwagger } from "../features/business/cambios-contrato/cambios-contrato.swagger";
import { eventoServiciosSwagger } from "../features/business/evento-servicios/evento-servicios.swagger";

const featureSwaggerModules = [
  clientesSwagger,
  serviciosSwagger,
  salonesSwagger,
  reservasSwagger,
  proveedoresSwagger,
  contratosSwagger,
  pagosSwagger,
  cambiosContratoSwagger,
  eventoServiciosSwagger,
];

const schemas = Object.assign(
  {},
  ...featureSwaggerModules.map(
    (module) =>
      "schemas" in module
        ? module.schemas
        : "components" in module
          ? module.components?.schemas ?? {}
          : {}
  )
);

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "CelebraHub API",
    version: "1.0.0",
    description: "API del sistema CelebraHub - Centro de eventos",
  },
  tags: featureSwaggerModules.flatMap((module) => module.tags ?? []),
  paths: Object.assign(
    {},
    ...featureSwaggerModules.map((module) => module.paths ?? {})
  ),
  components: {
    schemas,
  },
};

export function setupSwagger(app: Application) {
  const swaggerUi = require("swagger-ui-express");

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
  );
}

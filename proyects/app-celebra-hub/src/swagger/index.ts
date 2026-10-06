import swaggerUi from "swagger-ui-express";
import { Application } from "express";

import { clientesSwagger } from "../features/business/clientes/clientes.swagger";
import { serviciosSwagger } from "../features/business/servicios/servicios.swagger";
import { salonesSwagger } from "../features/business/salones/salones.swagger";
import { eventoServiciosSwagger } from "../features/business/evento-servicios/evento-servicios.swagger";
import { reservasSwagger } from "../features/business/reservas/reservas.swagger";
import { proveedoresSwagger } from "../features/business/proveedores/proveedores.swagger";

export type FeatureSwaggerModule = {
  tags: unknown[];
  paths: Record<string, unknown>;
  components?: {
    schemas?: Record<string, unknown>;
  };
};

const featureSwaggerModules = [
  clientesSwagger,
  serviciosSwagger,
  salonesSwagger,
  reservasSwagger,
  proveedoresSwagger,
  eventoServiciosSwagger
];

const tags = featureSwaggerModules.flatMap(
  (module) => module.tags
);

const paths = Object.assign(
  {},
  ...featureSwaggerModules.map(
    (module) => module.paths
  )
);

const schemas = Object.assign(
  {},
  ...featureSwaggerModules.map(
    (module) =>
      ("schemas" in module
        ? module.schemas
        : "components" in module
          ? module.components?.schemas ?? {}
          : {})
  )
);

export const swaggerDocument = {
  openapi: "3.0.0",

  info: {
    title: "CelebraHub API",
    version: "1.0.0",
    description:
      "API para la gestión del centro de eventos CelebraHub"
  },

  tags,

  paths,

  components: {
    schemas
  }
};

export function setupSwagger(
  app: Application
): void {

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(
      swaggerDocument
    )
  );

  app.get(
    "/api/docs.json",
    (_req, res) => {
      res.json(
        swaggerDocument
      );
    }
  );
}

export const resourceRolesSwagger = {
  tags: [{ name: "ResourceRoles", description: "Concesión de permisos por rol" }],
  paths: {
    "/api/concesiones-rol": {
      get: {
        tags: ["ResourceRoles"],
        summary: "Listar concesiones activas",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" } },
      },
      post: {
        tags: ["ResourceRoles"],
        summary: "Conceder permiso a un rol",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role_id", "resource_id"],
                properties: {
                  role_id: { type: "integer", example: 2 },
                  resource_id: { type: "integer", example: 3 },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Creado" } },
      },
    },
    "/api/concesiones-rol/{id}": {
      get: {
        tags: ["ResourceRoles"],
        summary: "Obtener una concesión",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/concesiones-rol/{id}/deactivate": {
      patch: {
        tags: ["ResourceRoles"],
        summary: "Desactivar concesión",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/concesiones-rol/{id}/reactivate": {
      patch: {
        tags: ["ResourceRoles"],
        summary: "Reactivar concesión",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "OK" } },
      },
    },
  },
};

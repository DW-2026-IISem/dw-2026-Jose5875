export const roleUsersSwagger = {
  tags: [{ name: "RoleUsers", description: "Asignación de roles a usuarios" }],
  paths: {
    "/api/asignaciones-rol": {
      get: {
        tags: ["RoleUsers"],
        summary: "Listar asignaciones activas",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "OK" },
        },
      },
      post: {
        tags: ["RoleUsers"],
        summary: "Asignar rol a usuario",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["user_id", "role_id"],
                properties: {
                  user_id: { type: "integer", example: 2 },
                  role_id: { type: "integer", example: 1 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Creado" },
          "409": { description: "Conflicto" },
        },
      },
    },
    "/api/asignaciones-rol/{id}": {
      get: {
        tags: ["RoleUsers"],
        summary: "Obtener asignación por id",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/asignaciones-rol/{id}/deactivate": {
      patch: {
        tags: ["RoleUsers"],
        summary: "Desactivar asignación",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/asignaciones-rol/{id}/reactivate": {
      patch: {
        tags: ["RoleUsers"],
        summary: "Reactivar asignación",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "OK" } },
      },
    },
  },
};

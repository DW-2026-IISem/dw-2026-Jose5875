export const cancelacionesSwagger = {
  tags: [
    {
      name: "Cancelaciones",
      description: "Gestión de cancelaciones de CelebraHub",
    },
  ],

  paths: {
    "/api/cancelaciones": {
      get: {
        tags: ["Cancelaciones"],
        summary: "Listar cancelaciones",
        responses: {
          "200": {
            description: "Lista de cancelaciones",
          },
        },
      },

      post: {
        tags: ["Cancelaciones"],
        summary: "Crear una cancelación",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateCancelacionDto",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Cancelación creada correctamente",
          },
        },
      },
    },

    "/api/cancelaciones/{id}": {
      get: {
        tags: ["Cancelaciones"],
        summary: "Obtener una cancelación por ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
          },
        ],
        responses: {
          "200": {
            description: "Cancelación encontrada",
          },
          "404": {
            description: "Cancelación no encontrada",
          },
        },
      },

      put: {
        tags: ["Cancelaciones"],
        summary: "Actualizar una cancelación",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateCancelacionDto",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Cancelación actualizada",
          },
        },
      },

      patch: {
        tags: ["Cancelaciones"],
        summary: "Actualizar parcialmente una cancelación",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PatchCancelacionDto",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Cancelación actualizada",
          },
        },
      },

      delete: {
        tags: ["Cancelaciones"],
        summary: "Eliminar una cancelación",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
          },
        ],
        responses: {
          "204": {
            description: "Cancelación eliminada",
          },
          "404": {
            description: "Cancelación no encontrada",
          },
        },
      },
    },
  },

  schemas: {
    CreateCancelacionDto: {
      type: "object",
      required: ["nombre", "descripcion"],
      properties: {
        nombre: {
          type: "string",
          example: "Cancelación por cliente",
        },
        descripcion: {
          type: "string",
          example: "Cancelación solicitada por el cliente",
        },
        is_active: {
          type: "boolean",
          example: true,
        },
      },
    },

    UpdateCancelacionDto: {
      type: "object",
      required: ["nombre", "descripcion", "is_active"],
      properties: {
        nombre: {
          type: "string",
          example: "Cancelación por cliente",
        },
        descripcion: {
          type: "string",
          example: "Cancelación solicitada por el cliente",
        },
        is_active: {
          type: "boolean",
          example: true,
        },
      },
    },

    PatchCancelacionDto: {
      type: "object",
      properties: {
        nombre: {
          type: "string",
        },
        descripcion: {
          type: "string",
        },
        is_active: {
          type: "boolean",
        },
      },
    },
  },
};

export const cambiosContratoSwagger = {
  tags: [
    {
      name: "CambiosContrato",
      description: "Gestión de cambios de contratos de CelebraHub",
    },
  ],

  paths: {
    "/api/cambios-contrato": {
      get: {
        tags: ["CambiosContrato"],
        summary: "Listar cambios de contrato",
        responses: {
          "200": {
            description: "Lista de cambios de contrato",
          },
        },
      },

      post: {
        tags: ["CambiosContrato"],
        summary: "Crear cambio de contrato",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CambioContratoCreate",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Cambio de contrato creado correctamente",
          },
        },
      },
    },

    "/api/cambios-contrato/{id}": {
      get: {
        tags: ["CambiosContrato"],
        summary: "Obtener cambio de contrato por ID",
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
            description: "Cambio encontrado",
          },
          "404": {
            description: "Cambio de contrato no encontrado",
          },
        },
      },

      put: {
        tags: ["CambiosContrato"],
        summary: "Actualizar cambio de contrato",
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
                $ref: "#/components/schemas/CambioContratoUpdate",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Cambio actualizado",
          },
          "404": {
            description: "Cambio no encontrado",
          },
        },
      },

      patch: {
        tags: ["CambiosContrato"],
        summary: "Actualizar parcialmente un cambio de contrato",
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
                $ref: "#/components/schemas/CambioContratoPatch",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Cambio actualizado parcialmente",
          },
          "404": {
            description: "Cambio no encontrado",
          },
        },
      },

      delete: {
        tags: ["CambiosContrato"],
        summary: "Eliminar cambio de contrato",
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
            description: "Cambio eliminado",
          },
          "404": {
            description: "Cambio no encontrado",
          },
        },
      },
    },
  },

  schemas: {
    CambioContratoCreate: {
      type: "object",
      required: ["nombre", "descripcion"],
      properties: {
        nombre: {
          type: "string",
          example: "Cambio de fecha",
        },
        descripcion: {
          type: "string",
          example: "Modificación de la fecha del evento",
        },
        is_active: {
          type: "boolean",
          example: true,
        },
      },
    },

    CambioContratoUpdate: {
      type: "object",
      required: ["nombre", "descripcion", "is_active"],
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

    CambioContratoPatch: {
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

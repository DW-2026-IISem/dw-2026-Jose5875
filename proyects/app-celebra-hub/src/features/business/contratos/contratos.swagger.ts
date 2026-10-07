export const contratosSwagger = {
  tags: [
    {
      name: "Contratos",
      description: "Gestión de contratos de CelebraHub",
    },
  ],

  paths: {
    "/api/contratos": {
      get: {
        tags: ["Contratos"],
        summary: "Listar contratos",
        responses: {
          "200": {
            description: "Lista de contratos",
          },
        },
      },

      post: {
        tags: ["Contratos"],
        summary: "Crear contrato",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ContratoCreate",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Contrato creado correctamente",
          },
          "409": {
            description: "El número de contrato ya existe",
          },
        },
      },
    },

    "/api/contratos/{id}": {
      get: {
        tags: ["Contratos"],
        summary: "Obtener contrato por ID",
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
            description: "Contrato encontrado",
          },
          "404": {
            description: "Contrato no encontrado",
          },
        },
      },

      put: {
        tags: ["Contratos"],
        summary: "Actualizar completamente un contrato",
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
                $ref: "#/components/schemas/ContratoUpdate",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Contrato actualizado",
          },
          "404": {
            description: "Contrato no encontrado",
          },
        },
      },

      patch: {
        tags: ["Contratos"],
        summary: "Actualizar parcialmente un contrato",
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
                $ref: "#/components/schemas/ContratoPatch",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Contrato actualizado parcialmente",
          },
          "404": {
            description: "Contrato no encontrado",
          },
        },
      },

      delete: {
        tags: ["Contratos"],
        summary: "Eliminar contrato",
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
            description: "Contrato eliminado",
          },
          "404": {
            description: "Contrato no encontrado",
          },
        },
      },
    },
  },

  schemas: {
    ContratoCreate: {
      type: "object",
      required: [
        "cliente_id",
        "numero",
        "fecha_inicio",
        "fecha_fin",
        "valor",
        "estado",
      ],
      properties: {
        cliente_id: {
          type: "integer",
          example: 1,
        },
        numero: {
          type: "string",
          example: "CTR-001",
        },
        fecha_inicio: {
          type: "string",
          format: "date-time",
        },
        fecha_fin: {
          type: "string",
          format: "date-time",
        },
        valor: {
          type: "number",
          example: 5000000,
        },
        estado: {
          type: "string",
          example: "vigente",
        },
      },
    },

    ContratoUpdate: {
      type: "object",
      required: [
        "cliente_id",
        "numero",
        "fecha_inicio",
        "fecha_fin",
        "valor",
        "estado",
      ],
      properties: {
        cliente_id: {
          type: "integer",
        },
        numero: {
          type: "string",
        },
        fecha_inicio: {
          type: "string",
          format: "date-time",
        },
        fecha_fin: {
          type: "string",
          format: "date-time",
        },
        valor: {
          type: "number",
        },
        estado: {
          type: "string",
        },
      },
    },

    ContratoPatch: {
      type: "object",
      properties: {
        cliente_id: {
          type: "integer",
        },
        numero: {
          type: "string",
        },
        fecha_inicio: {
          type: "string",
          format: "date-time",
        },
        fecha_fin: {
          type: "string",
          format: "date-time",
        },
        valor: {
          type: "number",
        },
        estado: {
          type: "string",
        },
      },
    },
  },
};

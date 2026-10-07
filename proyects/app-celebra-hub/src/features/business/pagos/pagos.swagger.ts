export const pagosSwagger = {
  tags: [
    {
      name: "Pagos",
      description: "Gestión de pagos de CelebraHub",
    },
  ],

  paths: {
    "/api/pagos": {
      get: {
        tags: ["Pagos"],
        summary: "Listar pagos",
        responses: {
          "200": {
            description: "Lista de pagos",
          },
        },
      },

      post: {
        tags: ["Pagos"],
        summary: "Crear pago",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PagoCreate",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Pago creado correctamente",
          },
        },
      },
    },

    "/api/pagos/{id}": {
      get: {
        tags: ["Pagos"],
        summary: "Obtener pago por ID",
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
            description: "Pago encontrado",
          },
          "404": {
            description: "Pago no encontrado",
          },
        },
      },

      put: {
        tags: ["Pagos"],
        summary: "Actualizar pago",
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
                $ref: "#/components/schemas/PagoUpdate",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Pago actualizado",
          },
          "404": {
            description: "Pago no encontrado",
          },
        },
      },

      patch: {
        tags: ["Pagos"],
        summary: "Actualizar parcialmente un pago",
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
                $ref: "#/components/schemas/PagoPatch",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Pago actualizado parcialmente",
          },
          "404": {
            description: "Pago no encontrado",
          },
        },
      },

      delete: {
        tags: ["Pagos"],
        summary: "Eliminar pago",
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
            description: "Pago eliminado",
          },
          "404": {
            description: "Pago no encontrado",
          },
        },
      },
    },
  },

  schemas: {
    PagoCreate: {
      type: "object",
      required: [
        "referencia_tipo",
        "referencia_id",
        "metodo",
        "monto",
        "fecha",
        "estado",
      ],
      properties: {
        referencia_tipo: {
          type: "string",
          example: "Contrato",
        },
        referencia_id: {
          type: "integer",
          example: 1,
        },
        metodo: {
          type: "string",
          example: "transferencia",
        },
        monto: {
          type: "number",
          example: 3500000,
        },
        fecha: {
          type: "string",
          format: "date-time",
        },
        estado: {
          type: "string",
          example: "aprobado",
        },
      },
    },

    PagoUpdate: {
      type: "object",
      required: [
        "referencia_tipo",
        "referencia_id",
        "metodo",
        "monto",
        "fecha",
        "estado",
      ],
      properties: {
        referencia_tipo: {
          type: "string",
        },
        referencia_id: {
          type: "integer",
        },
        metodo: {
          type: "string",
        },
        monto: {
          type: "number",
        },
        fecha: {
          type: "string",
          format: "date-time",
        },
        estado: {
          type: "string",
        },
      },
    },

    PagoPatch: {
      type: "object",
      properties: {
        referencia_tipo: {
          type: "string",
        },
        referencia_id: {
          type: "integer",
        },
        metodo: {
          type: "string",
        },
        monto: {
          type: "number",
        },
        fecha: {
          type: "string",
          format: "date-time",
        },
        estado: {
          type: "string",
        },
      },
    },
  },
};

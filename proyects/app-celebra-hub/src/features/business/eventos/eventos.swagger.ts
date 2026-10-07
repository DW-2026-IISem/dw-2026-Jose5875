export const eventosSwagger = {
  tags: [
    {
      name: "Eventos",
      description: "Gestión de eventos de CelebraHub",
    },
  ],

  paths: {
    "/api/eventos": {
      get: {
        tags: ["Eventos"],
        summary: "Listar eventos",
        responses: {
          "200": {
            description: "Lista de eventos",
          },
        },
      },

      post: {
        tags: ["Eventos"],
        summary: "Crear un evento",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateEventoDto",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Evento creado correctamente",
          },
        },
      },
    },

    "/api/eventos/{id}": {
      get: {
        tags: ["Eventos"],
        summary: "Obtener un evento por ID",
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
            description: "Evento encontrado",
          },
          "404": {
            description: "Evento no encontrado",
          },
        },
      },

      put: {
        tags: ["Eventos"],
        summary: "Actualizar un evento",
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
                $ref: "#/components/schemas/UpdateEventoDto",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Evento actualizado correctamente",
          },
        },
      },

      patch: {
        tags: ["Eventos"],
        summary: "Actualizar parcialmente un evento",
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
                $ref: "#/components/schemas/PatchEventoDto",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Evento actualizado correctamente",
          },
        },
      },

      delete: {
        tags: ["Eventos"],
        summary: "Eliminar un evento",
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
            description: "Evento eliminado correctamente",
          },
          "404": {
            description: "Evento no encontrado",
          },
        },
      },
    },
  },

  schemas: {
    CreateEventoDto: {
      type: "object",
      required: [
        "referencia_id",
        "tipo",
        "fecha",
        "cantidad",
        "observaciones",
        "estado",
      ],
      properties: {
        referencia_id: {
          type: "integer",
          example: 1,
        },
        tipo: {
          type: "string",
          example: "Boda",
        },
        fecha: {
          type: "string",
          format: "date-time",
          example: "2026-11-15T18:00:00.000Z",
        },
        cantidad: {
          type: "integer",
          example: 100,
        },
        observaciones: {
          type: "string",
          example: "Evento familiar",
        },
        estado: {
          type: "string",
          example: "confirmado",
        },
      },
    },

    UpdateEventoDto: {
      type: "object",
      required: [
        "referencia_id",
        "tipo",
        "fecha",
        "cantidad",
        "observaciones",
        "estado",
      ],
      properties: {
        referencia_id: {
          type: "integer",
        },
        tipo: {
          type: "string",
        },
        fecha: {
          type: "string",
          format: "date-time",
        },
        cantidad: {
          type: "integer",
        },
        observaciones: {
          type: "string",
        },
        estado: {
          type: "string",
        },
      },
    },

    PatchEventoDto: {
      type: "object",
      properties: {
        referencia_id: {
          type: "integer",
        },
        tipo: {
          type: "string",
        },
        fecha: {
          type: "string",
          format: "date-time",
        },
        cantidad: {
          type: "integer",
        },
        observaciones: {
          type: "string",
        },
        estado: {
          type: "string",
        },
      },
    },
  },
};

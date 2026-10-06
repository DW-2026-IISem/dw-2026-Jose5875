export const reservasSwagger = {
  tags: [
    {
      name: "Reservas",
      description: "Gestión de reservas de CelebraHub"
    }
  ],

  paths: {
    "/api/reservas": {
      get: {
        tags: ["Reservas"],
        summary: "Listar reservas",
        responses: {
          200: {
            description: "Lista de reservas"
          }
        }
      },

      post: {
        tags: ["Reservas"],
        summary: "Crear una reserva",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateReservaDto"
              }
            }
          }
        },
        responses: {
          201: {
            description: "Reserva creada"
          },
          400: {
            description: "Datos inválidos"
          }
        }
      }
    },

    "/api/reservas/{id}": {
      get: {
        tags: ["Reservas"],
        summary: "Obtener una reserva por ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],
        responses: {
          200: {
            description: "Reserva encontrada"
          },
          404: {
            description: "Reserva no encontrada"
          }
        }
      },

      put: {
        tags: ["Reservas"],
        summary: "Actualizar una reserva",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateReservaDto"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Reserva actualizada"
          },
          400: {
            description: "Datos inválidos"
          },
          404: {
            description: "Reserva no encontrada"
          }
        }
      },

      patch: {
        tags: ["Reservas"],
        summary: "Actualizar parcialmente una reserva",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PatchReservaDto"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Reserva actualizada parcialmente"
          },
          400: {
            description: "Datos inválidos"
          },
          404: {
            description: "Reserva no encontrada"
          }
        }
      },

      delete: {
        tags: ["Reservas"],
        summary: "Eliminar una reserva",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],
        responses: {
          200: {
            description: "Reserva eliminada"
          },
          404: {
            description: "Reserva no encontrada"
          }
        }
      }
    }
  },

  schemas: {
    CreateReservaDto: {
      type: "object",
      required: [
        "cliente_id",
        "fecha_inicio",
        "fecha_fin",
        "estado"
      ],
      properties: {
        cliente_id: {
          type: "integer",
          example: 1
        },
        fecha_inicio: {
          type: "string",
          format: "date-time",
          example: "2026-11-15T09:00:00.000Z"
        },
        fecha_fin: {
          type: "string",
          format: "date-time",
          example: "2026-11-15T13:00:00.000Z"
        },
        estado: {
          type: "string",
          example: "pendiente"
        },
        observaciones: {
          type: "string",
          nullable: true,
          example: "Reserva para evento familiar"
        }
      }
    },

    UpdateReservaDto: {
      type: "object",
      required: [
        "cliente_id",
        "fecha_inicio",
        "fecha_fin",
        "estado"
      ],
      properties: {
        cliente_id: {
          type: "integer",
          example: 1
        },
        fecha_inicio: {
          type: "string",
          format: "date-time"
        },
        fecha_fin: {
          type: "string",
          format: "date-time"
        },
        estado: {
          type: "string",
          example: "confirmada"
        },
        observaciones: {
          type: "string",
          nullable: true
        }
      }
    },

    PatchReservaDto: {
      type: "object",
      properties: {
        cliente_id: {
          type: "integer"
        },
        fecha_inicio: {
          type: "string",
          format: "date-time"
        },
        fecha_fin: {
          type: "string",
          format: "date-time"
        },
        estado: {
          type: "string"
        },
        observaciones: {
          type: "string",
          nullable: true
        }
      }
    }
  }
};

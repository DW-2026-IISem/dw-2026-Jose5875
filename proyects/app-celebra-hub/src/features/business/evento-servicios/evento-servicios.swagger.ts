export const eventoServiciosSwagger = {

  tags: [
    {
      name: "EventoServicios",
      description:
        "CRUD de servicios asociados a eventos en CelebraHub"
    }
  ],

  paths: {

    "/api/evento-servicios": {

      get: {
        tags: ["EventoServicios"],
        summary: "Listar eventos-servicios activos",

        responses: {
          "200": {
            description:
              "Lista de eventos-servicios activos",

            content: {
              "application/json": {
                schema: {
                  type: "object",

                  properties: {
                    eventoServicios: {
                      type: "array",

                      items: {
                        $ref:
                          "#/components/schemas/EventoServicio"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },

      post: {
        tags: ["EventoServicios"],
        summary: "Crear un evento-servicio",

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/EventoServicioCreate"
              }
            }
          }
        },

        responses: {
          "201": {
            description:
              "Evento-servicio creado correctamente",

            content: {
              "application/json": {
                schema: {
                  type: "object",

                  properties: {
                    eventoServicio: {
                      $ref:
                        "#/components/schemas/EventoServicio"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/api/evento-servicios/{id}": {

      get: {
        tags: ["EventoServicios"],
        summary:
          "Obtener un evento-servicio por ID",

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "integer",
              minimum: 1
            }
          }
        ],

        responses: {
          "200": {
            description:
              "Evento-servicio encontrado",

            content: {
              "application/json": {
                schema: {
                  type: "object",

                  properties: {
                    eventoServicio: {
                      $ref:
                        "#/components/schemas/EventoServicio"
                    }
                  }
                }
              }
            }
          },

          "404": {
            description:
              "Evento-servicio no encontrado"
          }
        }
      },

      put: {
        tags: ["EventoServicios"],
        summary:
          "Actualizar completamente un evento-servicio",

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "integer",
              minimum: 1
            }
          }
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/EventoServicioUpdate"
              }
            }
          }
        },

        responses: {
          "200": {
            description:
              "Evento-servicio actualizado"
          },

          "404": {
            description:
              "Evento-servicio no encontrado"
          }
        }
      },

      patch: {
        tags: ["EventoServicios"],
        summary:
          "Actualizar parcialmente un evento-servicio",

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "integer",
              minimum: 1
            }
          }
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/EventoServicioPatch"
              }
            }
          }
        },

        responses: {
          "200": {
            description:
              "Evento-servicio actualizado"
          },

          "404": {
            description:
              "Evento-servicio no encontrado"
          }
        }
      },

      delete: {
        tags: ["EventoServicios"],
        summary:
          "Eliminar físicamente un evento-servicio",

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "integer",
              minimum: 1
            }
          }
        ],

        responses: {
          "200": {
            description:
              "Evento-servicio eliminado"
          },

          "404": {
            description:
              "Evento-servicio no encontrado"
          }
        }
      }
    },

    "/api/evento-servicios/{id}/deactivate": {

      patch: {
        tags: ["EventoServicios"],
        summary:
          "Desactivar un evento-servicio",

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "integer",
              minimum: 1
            }
          }
        ],

        responses: {
          "200": {
            description:
              "Evento-servicio desactivado correctamente"
          },

          "404": {
            description:
              "Evento-servicio no encontrado"
          }
        }
      }
    }
  },

  components: {

    schemas: {

      EventoServicio: {

        type: "object",

        properties: {

          id: {
            type: "integer",
            example: 1
          },

          referencia_id: {
            type: "integer",
            example: 1
          },

          tipo: {
            type: "string",
            example:
              "Catering"
          },

          fecha: {
            type: "string",
            format: "date-time",
            example:
              "2026-10-10T15:00:00.000Z"
          },

          cantidad: {
            type: "integer",
            example: 100
          },

          observaciones: {
            type: "string",
            nullable: true,
            example:
              "Servicio de alimentación para el evento"
          },

          estado: {
            type: "string",
            example:
              "pendiente"
          },

          createdAt: {
            type: "string",
            format: "date-time"
          },

          updatedAt: {
            type: "string",
            format: "date-time"
          }
        }
      },

      EventoServicioCreate: {

        type: "object",

        required: [
          "referencia_id",
          "tipo",
          "fecha",
          "cantidad"
        ],

        properties: {

          referencia_id: {
            type: "integer",
            example: 1
          },

          tipo: {
            type: "string",
            example:
              "Decoración"
          },

          fecha: {
            type: "string",
            format: "date-time",
            example:
              "2026-10-10T15:00:00.000Z"
          },

          cantidad: {
            type: "integer",
            example: 50
          },

          observaciones: {
            type: "string",
            nullable: true
          },

          estado: {
            type: "string",
            example:
              "pendiente"
          }
        }
      },

      EventoServicioUpdate: {

        type: "object",

        required: [
          "referencia_id",
          "tipo",
          "fecha",
          "cantidad"
        ],

        properties: {

          referencia_id: {
            type: "integer"
          },

          tipo: {
            type: "string"
          },

          fecha: {
            type: "string",
            format: "date-time"
          },

          cantidad: {
            type: "integer"
          },

          observaciones: {
            type: "string",
            nullable: true
          },

          estado: {
            type: "string"
          }
        }
      },

      EventoServicioPatch: {

        type: "object",

        properties: {

          referencia_id: {
            type: "integer"
          },

          tipo: {
            type: "string"
          },

          fecha: {
            type: "string",
            format: "date-time"
          },

          cantidad: {
            type: "integer"
          },

          observaciones: {
            type: "string",
            nullable: true
          },

          estado: {
            type: "string"
          }
        }
      }
    }
  }
};

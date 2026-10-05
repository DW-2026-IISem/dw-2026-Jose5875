export const serviciosSwagger = {

  tags: [
    {
      name: "Servicios",
      description:
        "CRUD de servicios disponibles para eventos en CelebraHub"
    }
  ],

  paths: {

    "/api/servicios": {

      get: {
        tags: ["Servicios"],
        summary: "Listar servicios activos",
        responses: {
          "200": {
            description:
              "Lista de servicios activos",

            content: {
              "application/json": {
                schema: {
                  type: "object",

                  properties: {
                    servicios: {
                      type: "array",

                      items: {
                        $ref:
                          "#/components/schemas/Servicio"
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
        tags: ["Servicios"],
        summary: "Crear un servicio",

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ServicioCreate"
              }
            }
          }
        },

        responses: {
          "201": {
            description:
              "Servicio creado correctamente",

            content: {
              "application/json": {
                schema: {
                  type: "object",

                  properties: {
                    servicio: {
                      $ref:
                        "#/components/schemas/Servicio"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/api/servicios/{id}": {

      get: {
        tags: ["Servicios"],
        summary: "Obtener un servicio por ID",

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
              "Servicio encontrado",

            content: {
              "application/json": {
                schema: {
                  type: "object",

                  properties: {
                    servicio: {
                      $ref:
                        "#/components/schemas/Servicio"
                    }
                  }
                }
              }
            }
          },

          "404": {
            description:
              "Servicio no encontrado"
          }
        }
      },

      put: {
        tags: ["Servicios"],
        summary:
          "Actualizar completamente un servicio",

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
                  "#/components/schemas/ServicioUpdate"
              }
            }
          }
        },

        responses: {
          "200": {
            description:
              "Servicio actualizado"
          },

          "404": {
            description:
              "Servicio no encontrado"
          }
        }
      },

      patch: {
        tags: ["Servicios"],
        summary:
          "Actualizar parcialmente un servicio",

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
                  "#/components/schemas/ServicioPatch"
              }
            }
          }
        },

        responses: {
          "200": {
            description:
              "Servicio actualizado"
          },

          "404": {
            description:
              "Servicio no encontrado"
          }
        }
      },

      delete: {
        tags: ["Servicios"],
        summary:
          "Eliminar físicamente un servicio",

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
              "Servicio eliminado"
          },

          "404": {
            description:
              "Servicio no encontrado"
          }
        }
      }
    },

    "/api/servicios/{id}/deactivate": {

      patch: {
        tags: ["Servicios"],
        summary:
          "Desactivar un servicio",

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
              "Servicio desactivado correctamente"
          },

          "404": {
            description:
              "Servicio no encontrado"
          }
        }
      }
    }
  },

  components: {

    schemas: {

      Servicio: {

        type: "object",

        properties: {

          id: {
            type: "integer",
            example: 1
          },

          nombre: {
            type: "string",
            example:
              "Decoración para eventos"
          },

          descripcion: {
            type: "string",
            nullable: true,

            example:
              "Decoración temática para celebraciones"
          },

          is_active: {
            type: "boolean",
            example: true
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

      ServicioCreate: {

        type: "object",

        required: [
          "nombre"
        ],

        properties: {

          nombre: {
            type: "string",
            example:
              "Catering"
          },

          descripcion: {
            type: "string",

            example:
              "Servicio de alimentación para eventos"
          }
        }
      },

      ServicioUpdate: {

        type: "object",

        required: [
          "nombre"
        ],

        properties: {

          nombre: {
            type: "string"
          },

          descripcion: {
            type: "string",
            nullable: true
          }
        }
      },

      ServicioPatch: {

        type: "object",

        properties: {

          nombre: {
            type: "string"
          },

          descripcion: {
            type: "string",
            nullable: true
          }
        }
      }
    }
  }
};

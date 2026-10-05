/**
 * Documentación OpenAPI del feature Clientes.
 *
 * La documentación se agrega desde
 * src/swagger/index.ts.
 *
 * Este archivo solamente describe
 * el contrato de la API.
 */

export const clientesSwagger = {
  tags: [
    {
      name: "Clientes",
      description:
        "CRUD de clientes de CelebraHub"
    }
  ],

  paths: {

    "/api/clientes": {

      get: {
        tags: ["Clientes"],
        summary: "Listar clientes activos",
        description:
          "Obtiene todos los clientes activos de CelebraHub.",
        responses: {
          "200": {
            description:
              "Lista de clientes activos"
          }
        }
      },

      post: {
        tags: ["Clientes"],
        summary: "Crear cliente",
        description:
          "Registra un nuevo cliente en CelebraHub.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref:
                  "#/components/schemas/ClienteCreate"
              }
            }
          }
        },
        responses: {
          "201": {
            description:
              "Cliente creado correctamente"
          },
          "400": {
            description:
              "Datos inválidos"
          }
        }
      }
    },

    "/api/clientes/{id}": {

      get: {
        tags: ["Clientes"],
        summary: "Obtener cliente por ID",
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
              "Cliente encontrado"
          },
          "400": {
            description:
              "ID inválido"
          },
          "404": {
            description:
              "Cliente no encontrado"
          }
        }
      },

      put: {
        tags: ["Clientes"],
        summary: "Actualizar cliente",
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
                  "#/components/schemas/ClienteUpdate"
              }
            }
          }
        },
        responses: {
          "200": {
            description:
              "Cliente actualizado correctamente"
          },
          "400": {
            description:
              "Datos inválidos"
          },
          "404": {
            description:
              "Cliente no encontrado"
          }
        }
      },

      patch: {
        tags: ["Clientes"],
        summary:
          "Actualizar parcialmente un cliente",
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
                  "#/components/schemas/ClientePatch"
              }
            }
          }
        },
        responses: {
          "200": {
            description:
              "Cliente actualizado correctamente"
          },
          "404": {
            description:
              "Cliente no encontrado"
          }
        }
      },

      delete: {
        tags: ["Clientes"],
        summary:
          "Eliminar cliente físicamente",
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
              "Cliente eliminado correctamente"
          },
          "404": {
            description:
              "Cliente no encontrado"
          }
        }
      }
    },

    "/api/clientes/{id}/deactivate": {

      patch: {
        tags: ["Clientes"],
        summary:
          "Desactivar cliente",
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
              "Cliente desactivado correctamente"
          },
          "404": {
            description:
              "Cliente no encontrado"
          }
        }
      }
    }
  },

  components: {

    schemas: {

      Cliente: {
        type: "object",
        properties: {
          id: {
            type: "integer",
            example: 1
          },
          tipo_documento: {
            type: "string",
            example: "CC"
          },
          numero_documento: {
            type: "string",
            example: "1234567890"
          },
          nombre: {
            type: "string",
            example: "Ana Perez"
          },
          telefono: {
            type: "string",
            example: "3001234567"
          },
          email: {
            type: "string",
            format: "email",
            example:
              "ana.perez@gmail.com"
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

      ClienteCreate: {
        type: "object",
        required: [
          "tipo_documento",
          "numero_documento",
          "nombre",
          "telefono",
          "email"
        ],
        properties: {
          tipo_documento: {
            type: "string",
            example: "CC"
          },
          numero_documento: {
            type: "string",
            example: "1234567890"
          },
          nombre: {
            type: "string",
            example: "Ana Perez"
          },
          telefono: {
            type: "string",
            example: "3001234567"
          },
          email: {
            type: "string",
            format: "email",
            example:
              "ana.perez@gmail.com"
          }
        }
      },

      ClienteUpdate: {
        type: "object",
        required: [
          "tipo_documento",
          "numero_documento",
          "nombre",
          "telefono",
          "email"
        ],
        properties: {
          tipo_documento: {
            type: "string"
          },
          numero_documento: {
            type: "string"
          },
          nombre: {
            type: "string"
          },
          telefono: {
            type: "string"
          },
          email: {
            type: "string",
            format: "email"
          }
        }
      },

      ClientePatch: {
        type: "object",
        properties: {
          tipo_documento: {
            type: "string"
          },
          numero_documento: {
            type: "string"
          },
          nombre: {
            type: "string"
          },
          telefono: {
            type: "string"
          },
          email: {
            type: "string",
            format: "email"
          }
        }
      }
    }
  }
};

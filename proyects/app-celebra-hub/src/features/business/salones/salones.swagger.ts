export const salonesSwagger = {
  tags: [
    {
      name: "Salones",
      description: "Gestión de salones de CelebraHub"
    }
  ],

  paths: {
    "/api/salones": {
      get: {
        tags: ["Salones"],
        summary: "Listar salones activos",
        responses: {
          200: {
            description: "Lista de salones"
          }
        }
      },

      post: {
        tags: ["Salones"],
        summary: "Crear un salón",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateSalonDto"
              }
            }
          }
        },
        responses: {
          201: {
            description: "Salón creado"
          },
          400: {
            description: "Datos inválidos"
          }
        }
      }
    },

    "/api/salones/{id}": {
      get: {
        tags: ["Salones"],
        summary: "Obtener un salón por ID",
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
            description: "Salón encontrado"
          },
          404: {
            description: "Salón no encontrado"
          }
        }
      },

      put: {
        tags: ["Salones"],
        summary: "Actualizar completamente un salón",
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
                $ref: "#/components/schemas/UpdateSalonDto"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Salón actualizado"
          },
          404: {
            description: "Salón no encontrado"
          }
        }
      },

      patch: {
        tags: ["Salones"],
        summary: "Actualizar parcialmente un salón",
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
                $ref: "#/components/schemas/PatchSalonDto"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Salón actualizado parcialmente"
          },
          404: {
            description: "Salón no encontrado"
          }
        }
      },

      delete: {
        tags: ["Salones"],
        summary: "Eliminar físicamente un salón",
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
            description: "Salón eliminado"
          },
          404: {
            description: "Salón no encontrado"
          }
        }
      }
    },

    "/api/salones/{id}/deactivate": {
      patch: {
        tags: ["Salones"],
        summary: "Desactivar un salón",
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
            description: "Salón desactivado"
          },
          404: {
            description: "Salón no encontrado"
          }
        }
      }
    }
  },

  schemas: {
    CreateSalonDto: {
      type: "object",
      required: ["nombre"],
      properties: {
        nombre: {
          type: "string",
          example: "Salón Principal"
        },
        descripcion: {
          type: "string",
          nullable: true,
          example: "Salón amplio para eventos sociales"
        },
        is_active: {
          type: "boolean",
          example: true
        }
      }
    },

    UpdateSalonDto: {
      type: "object",
      required: ["nombre"],
      properties: {
        nombre: {
          type: "string",
          example: "Salón Principal"
        },
        descripcion: {
          type: "string",
          nullable: true,
          example: "Salón amplio para eventos"
        },
        is_active: {
          type: "boolean",
          example: true
        }
      }
    },

    PatchSalonDto: {
      type: "object",
      properties: {
        nombre: {
          type: "string",
          example: "Salón Ejecutivo"
        },
        descripcion: {
          type: "string",
          nullable: true
        },
        is_active: {
          type: "boolean",
          example: true
        }
      }
    }
  }
};

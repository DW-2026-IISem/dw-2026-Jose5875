export const proveedoresSwagger = {
  tags: [
    {
      name: "Proveedores",
      description: "Gestión de proveedores de CelebraHub"
    }
  ],

  paths: {
    "/api/proveedores": {
      get: {
        tags: ["Proveedores"],
        summary: "Listar proveedores activos",
        responses: {
          200: {
            description: "Lista de proveedores"
          }
        }
      },

      post: {
        tags: ["Proveedores"],
        summary: "Crear un proveedor",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateProveedorDto"
              }
            }
          }
        },
        responses: {
          201: {
            description: "Proveedor creado"
          },
          409: {
            description: "El NIT ya existe"
          }
        }
      }
    },

    "/api/proveedores/{id}": {
      get: {
        tags: ["Proveedores"],
        summary: "Obtener proveedor por ID",
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
            description: "Proveedor encontrado"
          },
          404: {
            description: "Proveedor no encontrado"
          }
        }
      },

      put: {
        tags: ["Proveedores"],
        summary: "Actualizar proveedor",
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
                $ref: "#/components/schemas/UpdateProveedorDto"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Proveedor actualizado"
          },
          404: {
            description: "Proveedor no encontrado"
          },
          409: {
            description: "El NIT ya existe"
          }
        }
      },

      patch: {
        tags: ["Proveedores"],
        summary: "Actualizar parcialmente un proveedor",
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
                $ref: "#/components/schemas/PatchProveedorDto"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Proveedor actualizado parcialmente"
          },
          404: {
            description: "Proveedor no encontrado"
          },
          409: {
            description: "El NIT ya existe"
          }
        }
      },

      delete: {
        tags: ["Proveedores"],
        summary: "Eliminar proveedor",
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
            description: "Proveedor eliminado"
          },
          404: {
            description: "Proveedor no encontrado"
          }
        }
      }
    },

    "/api/proveedores/{id}/deactivate": {
      patch: {
        tags: ["Proveedores"],
        summary: "Desactivar proveedor",
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
            description: "Proveedor desactivado"
          },
          404: {
            description: "Proveedor no encontrado"
          }
        }
      }
    }
  },

  schemas: {
    CreateProveedorDto: {
      type: "object",
      required: [
        "nit",
        "razon_social",
        "contacto",
        "telefono",
        "email"
      ],
      properties: {
        nit: {
          type: "string",
          example: "900123456-7"
        },
        razon_social: {
          type: "string",
          example: "Servicios para Eventos SAS"
        },
        contacto: {
          type: "string",
          example: "Carlos Pérez"
        },
        telefono: {
          type: "string",
          example: "3001234567"
        },
        email: {
          type: "string",
          example: "contacto@proveedor.com"
        },
        is_active: {
          type: "boolean",
          example: true
        }
      }
    },

    UpdateProveedorDto: {
      type: "object",
      required: [
        "nit",
        "razon_social",
        "contacto",
        "telefono",
        "email",
        "is_active"
      ],
      properties: {
        nit: {
          type: "string"
        },
        razon_social: {
          type: "string"
        },
        contacto: {
          type: "string"
        },
        telefono: {
          type: "string"
        },
        email: {
          type: "string"
        },
        is_active: {
          type: "boolean"
        }
      }
    },

    PatchProveedorDto: {
      type: "object",
      properties: {
        nit: {
          type: "string"
        },
        razon_social: {
          type: "string"
        },
        contacto: {
          type: "string"
        },
        telefono: {
          type: "string"
        },
        email: {
          type: "string"
        },
        is_active: {
          type: "boolean"
        }
      }
    }
  }
};

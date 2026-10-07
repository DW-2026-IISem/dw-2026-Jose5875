import {
  bearerSecurity,
  invalidIdResponse,
  unauthorizedResponse,
} from "../../../shared/http/swagger-security";

export const refreshTokensSwagger = {
  tags: [
    {
      name: "Sesiones",
      description: "Sesiones persistidas del usuario autenticado (refresh tokens)",
    },
  ],
  paths: {
    "/api/sesiones": {
      get: {
        tags: ["Sesiones"],
        summary: "Listar mis sesiones activas",
        description: "JWT; devuelve las sesiones del usuario autenticado. Nunca expone token_hash.",
        security: bearerSecurity,
        responses: {
          "200": { description: "Sesiones propias (`{ sessions: [...] }`)" },
          "401": unauthorizedResponse,
        },
      },
      delete: {
        tags: ["Sesiones"],
        summary: "Purgar mis sesiones revocadas o expiradas",
        security: bearerSecurity,
        responses: {
          "200": { description: "Purga realizada (`{ message, purged }`)" },
          "401": unauthorizedResponse,
        },
      },
    },
    "/api/sesiones/deactivate-all": {
      patch: {
        tags: ["Sesiones"],
        summary: "Revocar todas mis sesiones",
        security: bearerSecurity,
        responses: {
          "200": { description: "Sesiones revocadas (`{ message, revoked }`)" },
          "401": unauthorizedResponse,
        },
      },
    },
    "/api/sesiones/{id}": {
      get: {
        tags: ["Sesiones"],
        summary: "Consultar una sesión propia",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Sesión propia (`{ session }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "404": { description: "No encontrada o no pertenece al usuario autenticado" },
        },
      },
    },
    "/api/sesiones/{id}/deactivate": {
      patch: {
        tags: ["Sesiones"],
        summary: "Revocar una sesión propia",
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Sesión revocada (`{ message, session }`)" },
          "400": invalidIdResponse,
          "401": unauthorizedResponse,
          "404": { description: "No encontrada o no pertenece al usuario autenticado" },
        },
      },
    },
  },
  components: {
    schemas: {
      Session: {
        type: "object",
        properties: {
          id: { type: "integer" },
          user_id: { type: "integer" },
          family_id: { type: "string", format: "uuid" },
          device_info: { type: "string", nullable: true },
          expires_at: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["active", "inactive"] },
          is_expired: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};
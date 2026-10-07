import {
  bearerSecurity,
  openSecurity,
  unauthorizedResponse,
} from "../../../shared/http/swagger-security";

export const sessionSwagger = {
  tags: [
    { name: "Sesión", description: "Login, renovación, cierre, perfil y permisos — OPEN + JWT" },
  ],
  paths: {
    "/api/sesion/login": {
      post: {
        tags: ["Sesión"],
        summary: "Iniciar sesión (OPEN)",
        description: "Valida username o email y contraseña; responde con un access y refresh token.",
        security: openSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Login" } },
          },
        },
        responses: {
          "200": {
            description: "Par de tokens",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SessionTokens" } } },
          },
          "400": { description: "Faltan identifier o password" },
          "401": { description: "Credenciales inválidas o usuario inactivo" },
        },
      },
    },
    "/api/sesion/refresh": {
      post: {
        tags: ["Sesión"],
        summary: "Renovar tokens (OPEN con credencial de sesión)",
        description: "Rota el refresh token presentado. La reutilización revoca toda la familia.",
        security: openSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RefreshSession" } },
          },
        },
        responses: {
          "200": { description: "Nuevo par de tokens" },
          "400": { description: "Falta refresh_token" },
          "401": { description: "Token inválido, expirado o reutilizado" },
        },
      },
    },
    "/api/sesion/logout": {
      post: {
        tags: ["Sesión"],
        summary: "Cerrar sesión (OPEN con credencial de sesión)",
        description: "Revoca idempotentemente el refresh token presentado.",
        security: openSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/LogoutSession" } },
          },
        },
        responses: {
          "200": { description: "Sesión cerrada" },
          "400": { description: "Falta refresh_token" },
        },
      },
    },
    "/api/sesion/perfil": {
      get: {
        tags: ["Sesión"],
        summary: "Consultar mi perfil (JWT)",
        security: bearerSecurity,
        responses: {
          "200": { description: "Perfil público del usuario autenticado" },
          "401": unauthorizedResponse,
        },
      },
    },
    "/api/permisos": {
      get: {
        tags: ["Sesión"],
        summary: "Consultar mis permisos efectivos (JWT)",
        description: "Devuelve los pares method/path que usa authorize para conceder acceso.",
        security: bearerSecurity,
        responses: {
          "200": { description: "Permisos efectivos (`{ permissions: [...] }`)" },
          "401": unauthorizedResponse,
        },
      },
    },
  },
  components: {
    schemas: {
      Login: {
        type: "object",
        required: ["identifier", "password"],
        properties: {
          identifier: { type: "string", example: "admin", description: "Username o email" },
          password: { type: "string", format: "password" },
        },
      },
      RefreshSession: {
        type: "object",
        required: ["refresh_token"],
        properties: { refresh_token: { type: "string" } },
      },
      LogoutSession: {
        type: "object",
        required: ["refresh_token"],
        properties: { refresh_token: { type: "string" } },
      },
      SessionTokens: {
        type: "object",
        properties: {
          access_token: { type: "string" },
          token_type: { type: "string", example: "Bearer" },
          expires_in: { type: "integer", example: 900 },
          refresh_token: { type: "string" },
          refresh_expires_in: { type: "integer", example: 604800 },
        },
      },
    },
  },
};
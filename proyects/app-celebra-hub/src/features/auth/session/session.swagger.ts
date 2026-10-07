import { bearerSecurity, unauthorizedResponse } from "../../../shared/http/swagger-security";

export const sessionSwagger = {
  tags: [{ name: "Autenticación", description: "Inicio de sesión y renovación de tokens" }],
  paths: {
    "/api/sesion/login": {
      post: {
        tags: ["Autenticación"],
        summary: "Iniciar sesión",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["identifier", "password"],
                properties: {
                  identifier: { type: "string", example: "comercial" },
                  password: { type: "string", format: "password" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Access token y refresh token opaco" },
          "400": { description: "Credenciales incompletas" },
          "401": { description: "Credenciales inválidas" },
        },
      },
    },
    "/api/sesion/refresh": {
      post: {
        tags: ["Autenticación"],
        summary: "Renovar tokens",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refresh_token"],
                properties: { refresh_token: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Tokens renovados; el refresh token anterior queda invalidado" },
          "401": unauthorizedResponse,
        },
      },
    },
    "/api/sesion/logout": {
      post: {
        tags: ["Autenticación"],
        summary: "Cerrar sesión",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refresh_token"],
                properties: { refresh_token: { type: "string" } },
              },
            },
          },
        },
        responses: { "200": { description: "Refresh token revocado" } },
      },
    },
    "/api/sesion/perfil": {
      get: {
        tags: ["Autenticación"],
        summary: "Consultar mi perfil autenticado",
        security: bearerSecurity,
        responses: {
          "200": { description: "Perfil del usuario autenticado" },
          "401": unauthorizedResponse,
        },
      },
    },
  },
};
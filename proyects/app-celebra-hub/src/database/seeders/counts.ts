export interface SeedCounts {
  clientes: number;
  servicios: number;
  salones: number;
  reservas: number;
  eventos: number;
  proveedores: number;
  contratos: number;
  pagos: number;
  cambiosContrato: number;
  cancelaciones: number;
  eventoServicios: number;
}

function getArgValue(name: string): number | undefined {
  const arg = process.argv.find((item) =>
    item.startsWith(`--${name}=`)
  );

  if (!arg) return undefined;

  const value = Number(arg.split("=")[1]);

  return Number.isFinite(value) ? value : undefined;
}

function getEnvValue(name: string): number | undefined {
  const value = Number(process.env[name]);

  return Number.isFinite(value) ? value : undefined;
}

export function resolveSeedCounts(): SeedCounts {
  return {
    clientes:
      getArgValue("clientes") ??
      getEnvValue("SEED_CLIENTES") ??
      10,

    servicios:
      getArgValue("servicios") ??
      getEnvValue("SEED_SERVICIOS") ??
      5,

    salones:
      getArgValue("salones") ??
      getEnvValue("SEED_SALONES") ??
      5,

    reservas:
      getArgValue("reservas") ??
      getEnvValue("SEED_RESERVAS") ??
      5,

    eventos:
      getArgValue("eventos") ??
      getEnvValue("SEED_EVENTOS") ??
      5,

    proveedores:
      getArgValue("proveedores") ??
      getEnvValue("SEED_PROVEEDORES") ??
      5,

    contratos:
      getArgValue("contratos") ??
      getEnvValue("SEED_CONTRATOS") ??
      10,

    pagos:
      getArgValue("pagos") ??
      getEnvValue("SEED_PAGOS") ??
      10,

    cambiosContrato:
      getArgValue("cambios-contrato") ??
      getEnvValue("SEED_CAMBIOS_CONTRATO") ??
      5,

    cancelaciones:
      getArgValue("cancelaciones") ??
      getEnvValue("SEED_CANCELACIONES") ??
      5,

    eventoServicios:
      getArgValue("evento-servicios") ??
      getEnvValue("SEED_EVENTO_SERVICIOS") ??
      5,
  };
}

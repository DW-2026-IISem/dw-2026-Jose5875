import "dotenv/config";

export interface SeedCounts {
  clientes: number;
  servicios: number;
  salones: number;
  eventoServicios: number;
}

function readEnvCount(
  name: string,
  fallback: number
): number {
  const value = process.env[name];

  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0
    ? Math.floor(parsed)
    : fallback;
}

function readCliCount(
  prefix: string
): number | undefined {
  const argument =
    process.argv.find(
      (arg) => arg.startsWith(`${prefix}=`)
    );

  if (!argument) {
    return undefined;
  }

  const value =
    Number(argument.split("=")[1]);

  return Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : undefined;
}

export function resolveSeedCounts(): SeedCounts {

  const clientesCli =
    readCliCount("--clientes");

  const serviciosCli =
    readCliCount("--servicios");

  const salonesCli =
    readCliCount("--salones");

  const eventoServiciosCli =
    readCliCount("--evento-servicios");

  return {
    clientes:
      clientesCli ??
      readEnvCount("SEED_CLIENTES", 10),

    servicios:
      serviciosCli ??
      readEnvCount("SEED_SERVICIOS", 10),

    salones:
      salonesCli ??
      readEnvCount("SEED_SALONES", 10),

    eventoServicios:
      eventoServiciosCli ??
      readEnvCount(
        "SEED_EVENTO_SERVICIOS",
        10
      )
  };
}

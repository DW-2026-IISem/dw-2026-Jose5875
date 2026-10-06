import "dotenv/config";

export interface SeedCounts {
  clientes: number;
  servicios: number;
  salones: number;
  eventoServicios: number;
  reservas: number;
  proveedores: number;
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

  return {
    clientes:
      readCliCount("--clientes") ??
      readEnvCount(
        "SEED_CLIENTES",
        10
      ),

    servicios:
      readCliCount("--servicios") ??
      readEnvCount(
        "SEED_SERVICIOS",
        10
      ),

    salones:
      readCliCount("--salones") ??
      readEnvCount(
        "SEED_SALONES",
        10
      ),

    eventoServicios:
      readCliCount("--evento-servicios") ??
      readEnvCount(
        "SEED_EVENTO_SERVICIOS",
        10
      ),

    reservas:
      readCliCount("--reservas") ??
      readEnvCount(
        "SEED_RESERVAS",
        10
      ),

    proveedores:
      readCliCount("--proveedores") ??
      readEnvCount(
        "SEED_PROVEEDORES",
        10
      )
  };
}

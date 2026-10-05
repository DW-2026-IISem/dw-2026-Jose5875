/**
 * Cantidad de registros por feature/entidad.
 *
 * Prioridad:
 * CLI (--clientes=N, --servicios=N)
 * > env (SEED_CLIENTES, SEED_SERVICIOS)
 * > default
 */
export type SeedCounts = {
  clientes: number;
  servicios: number;
};

export const DEFAULT_SEED_COUNTS: SeedCounts = {
  clientes: 10,
  servicios: 10,
};

export function resolveSeedCounts(
  argv: string[] = process.argv.slice(2)
): SeedCounts {

  const counts: SeedCounts = {
    ...DEFAULT_SEED_COUNTS
  };

  const envClientes =
    process.env.SEED_CLIENTES;

  const envServicios =
    process.env.SEED_SERVICIOS;

  if (
    envClientes !== undefined &&
    envClientes !== ""
  ) {
    counts.clientes =
      Number(envClientes);
  }

  if (
    envServicios !== undefined &&
    envServicios !== ""
  ) {
    counts.servicios =
      Number(envServicios);
  }

  for (const arg of argv) {

    const m = arg.match(
      /^--([a-zA-Z_]+)=(\d+)$/
    );

    if (!m) continue;

    const key =
      m[1] as keyof SeedCounts;

    const value =
      Number(m[2]);

    if (key in counts) {
      counts[key] = value;
    }
  }

  return counts;
}

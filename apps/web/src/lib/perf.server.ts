import "server-only";

export function startServerTimer(): () => number {
  const startedAt = performance.now();
  return () => Math.round(performance.now() - startedAt);
}

/** Records a short structured duration in Vercel's function logs. */
export async function measureServer<T>(
  route: string,
  operation: string,
  work: () => T,
): Promise<Awaited<T>> {
  const startedAt = performance.now();
  let outcome: "ok" | "error" = "ok";

  try {
    return await work();
  } catch (error) {
    outcome = "error";
    throw error;
  } finally {
    console.info(
      "[perf]",
      JSON.stringify({
        route,
        operation,
        durationMs: Math.round(performance.now() - startedAt),
        outcome,
      }),
    );
  }
}

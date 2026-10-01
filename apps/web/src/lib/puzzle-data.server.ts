import "server-only";
import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import type { Database } from "@/lib/supabase/types";

function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

const cacheOptions = {
  revalidate: 60,
  tags: ["public-puzzles"],
};
const cacheKeyParts = [
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
];

/** Public puzzle content is the same for every visitor, so keep it out of the
 * request-scoped Supabase client and share it through Next's data cache. */
export const getPublicPuzzleByDate = unstable_cache(
  async (date: string) => {
    const { data, error } = await createPublicClient()
      .from("puzzles")
      .select("id, difficulty, grid_spec")
      .eq("date", date)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
  ["public-puzzle-by-date", ...cacheKeyParts],
  cacheOptions,
);

export const getPublicPuzzleArchive = unstable_cache(
  async (throughDate: string) => {
    const { data, error } = await createPublicClient()
      .from("puzzles")
      .select("id, date, difficulty")
      .not("date", "is", null)
      .lte("date", throughDate)
      .order("date", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },
  ["public-puzzle-archive", ...cacheKeyParts],
  cacheOptions,
);

export const getPublicPuzzleDayNumber = unstable_cache(
  async (date: string) => {
    const { count, error } = await createPublicClient()
      .from("puzzles")
      .select("id", { count: "exact", head: true })
      .not("date", "is", null)
      .lte("date", date);

    if (error) throw error;
    return count ?? undefined;
  },
  ["public-puzzle-day-number", ...cacheKeyParts],
  cacheOptions,
);

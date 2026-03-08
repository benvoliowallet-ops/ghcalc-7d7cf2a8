export const isSupabaseConfigured = false;

type Row = Record<string, unknown>;
type SBResult = Promise<{ data: Row[] | null; error: { message: string } | null }>;

const noop = (): SBResult => Promise.resolve({ data: null, error: null });

export const supabase = {
  from: (_table: string) => ({
    select: (_cols: string) => ({
      eq: (_col: string, _val: string): SBResult => noop(),
    }),
  }),
} as const;

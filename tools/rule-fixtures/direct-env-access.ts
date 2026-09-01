// klay/no-direct-env-access — §3, config/env.ts is the only legal reader
export const KEY = import.meta.env.VITE_SUPABASE_URL;

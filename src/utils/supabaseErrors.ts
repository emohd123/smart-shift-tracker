export function isMissingTableError(err: unknown, tableName?: string): boolean {
  const message =
    typeof err === "string"
      ? err
      : (err as any)?.message || (err as any)?.error_description || (err as any)?.error || "";

  if (typeof message !== "string") return false;

  // PostgREST / Supabase common messages
  const looksLikeMissingTable =
    message.includes("Could not find the table") ||
    message.includes("schema cache") ||
    message.includes("does not exist");

  if (!looksLikeMissingTable) return false;
  if (!tableName) return true;

  return message.includes(tableName);
}



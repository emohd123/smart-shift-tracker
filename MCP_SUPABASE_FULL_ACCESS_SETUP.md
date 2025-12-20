# Supabase MCP (Cursor) — Full Access Setup (Windows)

This project can be explored/managed via the Supabase MCP server in Cursor.

## Important: project must match

Your Cursor MCP `project_ref` MUST match the project your app is using:
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_PROJECT_ID` in your local `.env`
- `project_id` in `supabase/config.toml`

## Security first

- **Do not hardcode tokens in `mcp.json`.** Keep secrets in environment variables.
- If a token ever appears in chat, commits, screenshots, or shared files, **revoke/rotate it** in Supabase immediately.

## Enable full access (write enabled)

In your Cursor MCP config at `C:\Users\<YOU>\.cursor\mcp.json`, configure the Supabase MCP URL with your `project_ref`
and pass an access token via environment variable.

Minimal example (recommended):

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF",
      "headers": {
        "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}"
      }
    }
  }
}
```

## Provide credentials via environment variable (recommended)

Set your Supabase access token in Windows, then restart Cursor so it picks it up:

PowerShell (User-scoped):

```powershell
[Environment]::SetEnvironmentVariable("SUPABASE_ACCESS_TOKEN","<YOUR_TOKEN>","User")
```

To verify it’s set (new terminal session):

```powershell
$env:SUPABASE_ACCESS_TOKEN
```

## Notes

- Removing `--read-only` enables **write operations**. Treat this like production access.
- Keep `.cursor/mcp.json` uncommitted (the repo `.gitignore` already ignores it).


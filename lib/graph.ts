// Which Graph API host the app talks to.
// Default: graph.instagram.com (apps set up with "Instagram login").
// Newer Meta apps only get "Unified login", whose tokens work on graph.facebook.com only.
// For those, set INSTAGRAM_GRAPH_HOST=https://graph.facebook.com and
// INSTAGRAM_ACCOUNT_ID=<Instagram professional account ID>, because "me" would point
// at the token's system user instead of the Instagram account.
export const GRAPH_HOST = (process.env.INSTAGRAM_GRAPH_HOST || "https://graph.instagram.com").replace(/\/+$/, "")
export const GRAPH = `${GRAPH_HOST}/v24.0`

export function igPath(path: string): string {
  const id = process.env.INSTAGRAM_ACCOUNT_ID
  if (id && (path === "me" || path.startsWith("me/"))) return id + path.slice(2)
  return path
}

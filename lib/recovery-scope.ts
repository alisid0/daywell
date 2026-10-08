// An account binding for browser drafts, never a credential or auth substitute.
export async function recoveryScopeForUser(userId: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`daywell-recovery:${userId}`));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

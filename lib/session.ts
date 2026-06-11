import { cookies } from "next/headers";

export const SESSION_COOKIE = "bp_session";

export async function getSessionId(): Promise<string> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? "";
}

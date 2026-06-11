import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/sessionConfig";

export { SESSION_COOKIE };

export async function getSessionId(): Promise<string> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? "";
}

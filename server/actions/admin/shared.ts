import type { ActionResult } from "@/server/actions/types";
import { UNAUTHORIZED } from "@/lib/messages";

export type { ActionResult };
export const forbidden = (): ActionResult => ({
  ok: false,
  error: UNAUTHORIZED,
});

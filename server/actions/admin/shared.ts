import type { ActionResult } from "@/server/actions/types";

export type { ActionResult };
export const forbidden = (): ActionResult => ({
  ok: false,
  error: "Não autorizado.",
});

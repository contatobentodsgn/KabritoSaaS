export type ActionResult = { ok: true } | { ok: false; error: string };
export const forbidden = (): ActionResult => ({
  ok: false,
  error: "Não autorizado.",
});

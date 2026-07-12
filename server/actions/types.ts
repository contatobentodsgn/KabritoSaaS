/**
 * Retorno padrão de Server Actions IMPERATIVAS (chamadas de clique/toggle, não
 * ligadas a `useActionState`) — sucesso opcionalmente carrega um payload `T`,
 * falha sempre um `error` em pt-BR pronto pra exibir. Substitui as ~15
 * variantes `{ok:true; ...} | {ok:false; error}` que cada arquivo de action
 * declarava por conta própria (REF-4) — os nomes de domínio (`EnrollResult`,
 * `ToggleResult` etc.) continuam existindo, como alias deste genérico, pra não
 * precisar tocar os call sites.
 */
export type ActionResult<T = undefined> = T extends undefined
  ? { ok: true } | { ok: false; error: string }
  : ({ ok: true } & T) | { ok: false; error: string };

/**
 * Estado retornado por Server Actions de FORMULÁRIO (`useActionState`) — forma
 * diferente de propósito, não só de payload: além de `ok`/`error`, carrega
 * `fieldErrors` (validação Zod por campo) e ecoa dados pro formulário
 * re-renderizar (ex.: `email`). Mantido separado de `ActionResult` porque a
 * convenção de chamada do `useActionState` (prevState, formData) já é distinta
 * de uma action imperativa — forçar as duas no mesmo tipo só complicaria os dois.
 */
export type FormState = {
  ok?: boolean;
  error?: string;
  message?: string;
  email?: string; // ecoa o e-mail no sucesso de cadastro (para o "reenviar link")
  fieldErrors?: Record<string, string[]>;
  resetAt?: number; // epoch ms: quando o rate-limit da ação libera de novo (UX-1/4)
};

export const emptyFormState: FormState = {};

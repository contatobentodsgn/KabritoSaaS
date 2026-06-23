/** Estado padrão retornado por Server Actions de formulário (useActionState). */
export type FormState = {
  ok?: boolean;
  error?: string;
  message?: string;
  email?: string; // ecoa o e-mail no sucesso de cadastro (para o "reenviar link")
  fieldErrors?: Record<string, string[]>;
};

export const emptyFormState: FormState = {};

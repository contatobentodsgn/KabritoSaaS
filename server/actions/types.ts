/** Estado padrão retornado por Server Actions de formulário (useActionState). */
export type FormState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const emptyFormState: FormState = {};

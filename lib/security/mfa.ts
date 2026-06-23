/**
 * MFA (TOTP) — verificação em duas etapas, via Supabase Auth.
 *
 * Estratégia STAGED (como a CSP Report-Only): a ATIVAÇÃO (enroll opt-in nas
 * configurações) está sempre disponível e é inofensiva. O ENFORCEMENT — exigir
 * a verificação no login de quem ativou + exigir 2FA do staff para acessar
 * /admin — fica atrás deste flag, DESLIGADO por padrão. Assim ninguém é trancado
 * fora: dá para testar o enroll no ambiente real e só então ligar o flag.
 */
export const MFA_ENFORCE = false;

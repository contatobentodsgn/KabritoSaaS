/**
 * Constantes do produto. Valores que NÃO são segredos podem viver aqui.
 * Segredos ficam só em variáveis de ambiente de servidor (server/env.ts).
 */

/** Rotas privadas protegidas pelo middleware. */
export const PROTECTED_ROUTES = [
  "/dashboard",
  "/daily-briefing",
  "/trends",
  "/headlines",
  "/prompts",
  "/favorites",
  "/adaptar",
  "/calendario",
  "/convite",
  "/settings",
  "/admin",
] as const;

/** Rotas só para staff (editor/superadmin). */
export const STAFF_ROUTES = ["/admin"] as const;

/** Rotas de auth (redireciona para /dashboard se já logado). */
export const AUTH_ROUTES = ["/login", "/register"] as const;

export const DEFAULT_REDIRECT = "/dashboard";
export const LOGIN_ROUTE = "/login";

/** Cookie httpOnly que identifica o dispositivo (controle de sessão). */
export const DEVICE_COOKIE_NAME = "device_id";

/** Tipos de entidade que podem ser favoritados (conteúdo global). */
export const FAVORITE_ENTITY_TYPES = [
  "trend_item",
  "explore_report",
  "copy_pattern",
  "visual_pattern",
  "headline",
  "content_suggestion",
  "prompt_template",
] as const;
export type FavoriteEntityType = (typeof FAVORITE_ENTITY_TYPES)[number];

/** Slug do plano único (definitivo — sem tiers). */
export const SINGLE_PLAN_SLUG = "plano-unico";

/** Versão atual dos prompts do pipeline (versionada — ver generator-prompts.md). */
export const CURRENT_PROMPT_VERSION = "v1";

/** Ações auditadas (audit_logs / access_logs). */
export const AUDIT_ACTIONS = {
  LOGIN: "auth.login",
  LOGIN_FAILED: "auth.login_failed",
  LOGOUT: "auth.logout",
  REGISTER: "auth.register",
  PASSWORD_CHANGED: "auth.password_changed",
  SESSION_NEW_DEVICE: "session.new_device",
  SESSION_REVOKED: "session.revoked",
  CONTENT_CREATED: "content.created",
  CONTENT_EDITED: "content.edited",
  CONTENT_PUBLISHED: "content.published",
  CONTENT_REJECTED: "content.rejected",
  CONTENT_ARCHIVED: "content.archived",
  CONTENT_DELETED: "content.deleted",
  FAVORITE_ADDED: "favorite.added",
  FAVORITE_REMOVED: "favorite.removed",
  ACCOUNT_DELETED: "account.deleted",
  GENERATION_ADAPT: "generation.adapt",
  // Mudanças de privilégio / equipe (trilha de auditoria — SECURITY_CHECKLIST).
  MEMBER_ADDED: "team.member_added",
  MEMBER_REMOVED: "team.member_removed",
  MEMBER_ROLE_CHANGED: "team.role_changed",
  INVITE_CREATED: "team.invite_created",
  INVITE_CANCELLED: "team.invite_cancelled",
  INVITE_ACCEPTED: "team.invite_accepted",
  STAFF_ROLE_SET: "staff.role_set",
  ACCESS_GRANTED: "billing.access_granted",
} as const;

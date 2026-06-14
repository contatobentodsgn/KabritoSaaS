-- ============================================================================
-- 0003_audit_insert.sql
-- Permite que o usuário registre auditoria das PRÓPRIAS ações via cliente de
-- usuário (RLS), em vez do service_role — honra a regra dura da §3 (service_role
-- só em pipeline/cron/admin). O `action` é sempre definido no servidor; o
-- usuário só consegue inserir linhas com user_id = auth.uid().
-- Eventos de SISTEMA (pipeline/publicação automática) são escritos pelo
-- service_role isolado no pipeline.
-- ============================================================================
create policy "audit_logs_own_insert" on audit_logs for insert
  with check (user_id = auth.uid());

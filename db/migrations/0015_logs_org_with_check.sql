-- Endurece o WITH CHECK dos INSERTs de trilha (access_logs / audit_logs): além
-- de user_id = auth.uid(), amarra organization_id ao contexto — null OU uma org
-- da qual o ator é membro. Antes, um usuário podia inserir um registro com
-- organization_id de OUTRA org (poluição da trilha cross-tenant; sem vazamento
-- de dados, mas mina a confiabilidade da auditoria). is_org_member é o helper
-- SECURITY DEFINER do 0005 (sem recursão de policy).

drop policy if exists "access_logs_own_insert" on access_logs;
create policy "access_logs_own_insert" on access_logs for insert
  with check (
    user_id = auth.uid()
    and (organization_id is null or public.is_org_member(auth.uid(), organization_id))
  );

drop policy if exists "audit_logs_own_insert" on audit_logs;
create policy "audit_logs_own_insert" on audit_logs for insert
  with check (
    user_id = auth.uid()
    and (organization_id is null or public.is_org_member(auth.uid(), organization_id))
  );

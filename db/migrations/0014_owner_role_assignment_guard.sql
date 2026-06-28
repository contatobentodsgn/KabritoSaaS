-- Anti-escalada de privilégio admin→owner na RLS de organization_members.
--
-- As policies do 0005 permitiam que QUALQUER owner/admin inserisse/atualizasse
-- membership sem restringir o VALOR do papel. Via PostgREST direto, um admin
-- podia dar UPDATE no próprio registro para role='owner' (ou inserir um novo
-- owner) e tomar o workspace. Aqui amarramos: só quem JÁ É owner pode atribuir
-- 'owner', e só o owner pode alterar o registro de um owner.
--
-- (A Server Action setMemberRole também passou a checar isto no app; esta é a
-- camada de defesa para o caminho PostgREST direto, que ignora a Server Action.)

drop policy if exists "members_insert" on organization_members;
create policy "members_insert" on organization_members for insert
  with check (
    public.org_role(auth.uid(), organization_id) in ('owner', 'admin')
    -- só owner pode inserir um novo membro como owner
    and (role <> 'owner' or public.org_role(auth.uid(), organization_id) = 'owner')
  );

drop policy if exists "members_update" on organization_members;
create policy "members_update" on organization_members for update
  using (
    public.org_role(auth.uid(), organization_id) in ('owner', 'admin')
    -- admin não pode tocar o registro de um owner (role atual)
    and (role <> 'owner' or public.org_role(auth.uid(), organization_id) = 'owner')
  )
  with check (
    public.org_role(auth.uid(), organization_id) in ('owner', 'admin')
    -- o registro resultante só pode ser owner se o ator for owner
    and (role <> 'owner' or public.org_role(auth.uid(), organization_id) = 'owner')
  );

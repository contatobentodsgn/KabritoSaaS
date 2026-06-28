-- Publicação ATÔMICA de edição (G7): UPDATE da edição + INSERT na trilha de
-- auditoria numa ÚNICA transação (a da função). Substitui o UPDATE + recordAudit
-- separados — garante que TODA publicação tem trilha (ou nenhuma das duas).
--
-- SECURITY INVOKER (padrão): a RLS continua valendo — só staff publica
-- (editions_staff_all) e o audit_logs respeita user_id = auth.uid(). Gated a
-- review_status = 'pending' (não republica edição arquivada/rejeitada — G8).
--
-- O reviewer vem como PARÂMETRO (não auth.uid() no corpo): chamar auth.uid()
-- direto exigiria USAGE no schema `auth` para o papel authenticated, o que nem
-- todo ambiente concede. A RLS de WITH CHECK do audit_logs (user_id = auth.uid())
-- ainda garante que p_reviewer NÃO pode ser forjado — se != auth.uid(), o INSERT
-- é rejeitado e a transação inteira (inclusive o UPDATE) é desfeita.

drop function if exists public.approve_edition(uuid, timestamptz);

create or replace function public.approve_edition(
  p_edition_id uuid,
  p_reviewer uuid,
  p_expires timestamptz
)
returns integer
language plpgsql
security invoker
as $$
declare
  v_count integer;
begin
  update public.content_editions
     set status = 'published',
         review_status = 'approved',
         published_at = now(),
         reviewed_by = p_reviewer,
         reviewed_at = now(),
         content_expires_at = p_expires
   where id = p_edition_id
     and review_status = 'pending';
  get diagnostics v_count = row_count;

  -- Só audita se de fato publicou (mesma transação → atômico).
  if v_count > 0 then
    insert into public.audit_logs (user_id, action, entity_type, entity_id)
    values (p_reviewer, 'content.published', 'content_edition', p_edition_id);
  end if;

  return v_count;
end;
$$;

-- O cliente JWT (papel authenticated) precisa poder chamar a função via PostgREST.
grant execute on function public.approve_edition(uuid, uuid, timestamptz) to authenticated;

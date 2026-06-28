-- Publicação ATÔMICA de edição (G7): UPDATE da edição + INSERT na trilha de
-- auditoria numa ÚNICA transação (a da função). Substitui o UPDATE + recordAudit
-- separados — garante que TODA publicação tem trilha (ou nenhuma das duas).
--
-- SECURITY INVOKER (padrão): a RLS continua valendo — só staff publica
-- (editions_staff_all) e o audit_logs respeita user_id = auth.uid(). Gated a
-- review_status = 'pending' (não republica edição arquivada/rejeitada — G8).
-- `create or replace` torna a migration idempotente em re-execução.

create or replace function public.approve_edition(
  p_edition_id uuid,
  p_expires timestamptz
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_count integer;
  v_uid uuid := auth.uid();
begin
  update content_editions
     set status = 'published',
         review_status = 'approved',
         published_at = now(),
         reviewed_by = v_uid,
         reviewed_at = now(),
         content_expires_at = p_expires
   where id = p_edition_id
     and review_status = 'pending';
  get diagnostics v_count = row_count;

  -- Só audita se de fato publicou (mesma transação → atômico).
  if v_count > 0 then
    insert into audit_logs (user_id, action, entity_type, entity_id)
    values (v_uid, 'content.published', 'content_edition', p_edition_id);
  end if;

  return v_count;
end;
$$;

-- O cliente JWT (papel authenticated) precisa poder chamar a função via PostgREST.
grant execute on function public.approve_edition(uuid, timestamptz) to authenticated;

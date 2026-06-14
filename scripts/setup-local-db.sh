#!/usr/bin/env bash
# ============================================================================
# setup-local-db.sh — sobe um Postgres LOCAL emulando o Supabase (roles + auth)
# e aplica bootstrap + migrations nos bancos `kabrito` (dev) e `kabrito_test`.
#
# Requer: postgresql@16 (brew install postgresql@16).
# NÃO usar em produção — no Supabase real os roles/auth já existem.
# ============================================================================
set -euo pipefail

PGBIN="${PGBIN:-/opt/homebrew/opt/postgresql@16/bin}"
PGPORT="${PGPORT:-54329}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGDATA="$ROOT/.pgdata"

if [ ! -d "$PGDATA" ]; then
  echo "==> initdb"
  "$PGBIN/initdb" -D "$PGDATA" -U postgres --auth=trust --encoding=UTF8 >/dev/null
fi

if ! "$PGBIN/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1; then
  echo "==> start postgres (porta $PGPORT)"
  mkdir -p "$ROOT/.pglogs"
  "$PGBIN/pg_ctl" -D "$PGDATA" \
    -o "-p $PGPORT -k /tmp -c listen_addresses='localhost'" \
    -l "$ROOT/.pglogs/server.log" -w start
fi

for DB in kabrito kabrito_test; do
  echo "==> (re)criando $DB"
  "$PGBIN/dropdb" -h localhost -p "$PGPORT" -U postgres --if-exists "$DB"
  "$PGBIN/createdb" -h localhost -p "$PGPORT" -U postgres "$DB"
  echo "    bootstrap (roles + auth)"
  "$PGBIN/psql" -h localhost -p "$PGPORT" -U postgres -d "$DB" -v ON_ERROR_STOP=1 \
    -f "$ROOT/tests/rls/bootstrap.local.sql" >/dev/null
  echo "    migrations"
  DATABASE_URL="postgres://postgres@localhost:$PGPORT/$DB" \
    node --import tsx "$ROOT/db/migrate.ts"
done

echo "==> pronto. DATABASE_URL=postgres://postgres@localhost:$PGPORT/kabrito"

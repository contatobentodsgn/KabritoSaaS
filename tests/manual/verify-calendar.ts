/**
 * Verificação MANUAL (MVP 3 — Gerador de calendário): saída válida pelo Zod (mock).
 * Uso: node --conditions=react-server --env-file=.env.local --import tsx tests/manual/verify-calendar.ts
 */
import { gerarCalendario } from "@/server/services/calendar";

let fail = 0;
const check = (l: string, c: boolean) => {
  console.log(`${c ? "✅" : "❌"} ${l}`);
  if (!c) fail++;
};

const r = await gerarCalendario({
  niche: "nutrição materna",
  platform: "instagram",
  days: 5,
  goal: "engajar",
});
check("calendário retornou ok (mock)", r.ok);
if (r.ok) {
  check("tema da semana preenchido", r.data.week_theme.length >= 3);
  check("gerou exatamente 5 dias", r.data.days.length === 5);
  check(
    "cada dia tem headline+hook+cta",
    r.data.days.every((d) => d.headline && d.hook && d.cta),
  );
}
console.log(fail === 0 ? "\n✅ CALENDAR OK" : `\n❌ ${fail} falha(s)`);
process.exit(fail === 0 ? 0 : 1);

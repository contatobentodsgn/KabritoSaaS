/**
 * Verificação MANUAL (MVP 2 — Adaptar ao meu nicho): a geração sob demanda
 * (provider MOCK) produz saída válida pelo schema Zod.
 * Uso: node --conditions=react-server --env-file=.env.local --import tsx tests/manual/verify-adapt.ts
 */
import { adaptToNiche } from "@/server/services/translate";

let fail = 0;
const check = (l: string, c: boolean) => {
  console.log(`${c ? "✅" : "❌"} ${l}`);
  if (!c) fail++;
};

const r = await adaptToNiche({
  niche: "nutrição materna",
  source: "Carrosséis educativos com dados estão em alta no Instagram",
  platform: "instagram",
  format: "carrossel",
});

check("adaptação retornou ok (mock, sem AI_API_KEY)", r.ok);
if (r.ok) {
  check("headline adaptada preenchida", r.data.adapted_headline.length >= 3);
  check("legenda preenchida", r.data.caption.length >= 10);
  check("estrutura preenchida", r.data.post_structure.length >= 10);
  check("tips entre 1 e 5", r.data.tips.length >= 1 && r.data.tips.length <= 5);
  check("menciona o nicho", JSON.stringify(r.data).includes("nutrição materna"));
}
console.log(fail === 0 ? "\n✅ ADAPT OK" : `\n❌ ${fail} falha(s)`);
process.exit(fail === 0 ? 0 : 1);

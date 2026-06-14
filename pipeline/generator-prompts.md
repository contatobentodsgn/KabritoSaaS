# Generator Prompts — Pipeline de Geração

Prompts (system + user) de cada gerador. A saída de cada um é validada pelo schema Zod correspondente em `generation-schemas.ts`. **Gerar módulo a módulo** (não a edição inteira de uma vez): isola falhas, reduz custo por chamada e permite reprocessar só o módulo que quebrou.

## Regras gerais (válidas para todos)
- O `SYSTEM` exige **JSON puro** que satisfaça o schema; sem texto fora do JSON, sem crases, sem explicação.
- Enums usam **exatamente** os valores permitidos do schema. Slugs em minúsculas, sem acento, com hífen.
- Toda saída passa por `safeParseGenerated()` antes de gravar. Inválida → `generation_runs.error_message` e reprocessa.
- Registrar `prompt_version` em cada `generation_run`. Versione estes prompts (ex.: `v1`, `v1.1`).
- Idioma do conteúdo: **português do Brasil**.

## Variáveis injetadas no USER prompt
- `{{platform}}` — ex.: `instagram`
- `{{edition_date}}` — `YYYY-MM-DD`
- `{{signals}}` — sinais coletados de `raw_signals` (resumo/itens das fontes legais)
- `{{niches}}` — lista de slugs de nichos válidos (da tabela `niches`)
- `{{formats}}` — formatos válidos (enum `contentFormat`)

---

## SYSTEM base (reutilizar em todos)
```
Você é um gerador de inteligência criativa para criadores de conteúdo e social media.
Responda SOMENTE com um objeto JSON válido que satisfaça EXATAMENTE o schema indicado.
Não inclua texto fora do JSON, não use crases, não explique.
Use apenas os valores de enum permitidos. Slugs em minúsculas, sem acento, com hífen.
Escreva em português do Brasil. Seja específico e aplicável; evite generalidades.
Não invente dados de redes sociais; baseie-se apenas nos sinais fornecidos e em conhecimento de copy/design.
```

---

## 1. Briefing (`briefingSchema`)
**USER**
```
Plataforma: {{platform}} | Data: {{edition_date}}
Sinais do dia:
{{signals}}

Gere o briefing diário com: summary (1–3 frases), whats_growing, whats_saturated,
opportunities, recommended_formats (use apenas: {{formats}}), practical_recommendations.
Foque no que é acionável hoje para quem produz conteúdo.
Saída: JSON conforme briefingSchema.
```

## 2. Pautas quentes (`trendItemSchema[]`, 1–8)
**USER**
```
Plataforma: {{platform}} | Data: {{edition_date}}
Sinais do dia:
{{signals}}
Nichos válidos: {{niches}} | Formatos válidos: {{formats}}

Gere de 3 a 6 pautas quentes. Para cada uma: title, context, why_it_matters,
adaptation_tips, risk_level (baixo|medio|alto), saturation_level
(emergente|baixo|medio|alto|saturado), opportunity_score (0–100),
content_format (subset de formatos válidos), recommended_niches (subset de nichos válidos),
adaptation_examples (2–6 pares niche+example).
Inclua pelo menos uma pauta "emergente" (baixa saturação) quando os sinais permitirem.
Saída: JSON array conforme trendItemSchema.
```

## 3. Radar de Descoberta (`exploreReportSchema[]`, 1–4)
**USER**
```
Plataforma: {{platform}} | Data: {{edition_date}}
Sinais do dia:
{{signals}}

Gere de 1 a 3 análises de padrões observados (formatos, ganchos, estilos recorrentes),
SEM afirmar captura automática de redes. Cada uma: title, summary,
observed_patterns (2–10 itens curtos), recommendation.
Saída: JSON array conforme exploreReportSchema.
```

## 4. Análise de copy (`copyPatternSchema[]`, 1–6)
**USER**
```
Plataforma: {{platform}} | Data: {{edition_date}}
Sinais/headlines observadas:
{{signals}}
Nichos válidos: {{niches}}

Gere de 2 a 5 análises de copy. Cada uma: title, observed_headline,
category (autoridade|identificacao|polemica|quebra_de_crenca|tutorial|lista|bastidor|opiniao|venda),
hook_type, trigger_type (curiosidade|medo_de_errar|prova_social|urgencia|novidade|identificacao|autoridade|polemica|ganho|perda),
explanation, structure (o molde reutilizável), adaptation_examples (2–8 niche+example), tags.
Saída: JSON array conforme copyPatternSchema.
```

## 5. Análise visual (`visualPatternSchema[]`, 1–6)
**USER**
```
Plataforma: {{platform}} | Data: {{edition_date}}
Sinais visuais do dia:
{{signals}}

Gere de 1 a 4 padrões visuais. Cada um: title, visual_style, colors (descrições),
typography_notes, composition_notes, why_it_works, how_to_adapt, tags.
Foque em padrões reproduzíveis por quem não é designer avançado.
Saída: JSON array conforme visualPatternSchema.
```

## 6. Headlines (`headlineSchema[]`, 3–20)
**USER**
```
Plataforma: {{platform}} | Data: {{edition_date}}
Sinais/temas do dia:
{{signals}}
Nichos válidos: {{niches}}

Gere de 5 a 12 headlines. Cada uma: headline, category, trigger_type,
why_it_works, adaptations (2–10 variações), saturation_level, recommended_niches.
Varie os gatilhos; evite repetir a mesma estrutura em todas.
Saída: JSON array conforme headlineSchema.
```

## 7. Sugestões de posts (`contentSuggestionSchema[]`, 1–10)
**USER**
```
Plataforma: {{platform}} | Data: {{edition_date}}
Pautas/headlines do dia (use como base):
{{signals}}
Nichos válidos: {{niches}} | Formatos válidos: {{formats}}

Gere de 3 a 6 sugestões de post prontas para adaptar. Cada uma: title, central_idea,
recommended_format (1 dos formatos válidos), suggested_headline, post_structure
(passo a passo / slides), caption_base, cta, recommended_niches, difficulty_level
(facil|medio|dificil), opportunity_score (0–100), personalization_prompt
(um prompt que o usuário usa para adaptar ao próprio nicho).
Saída: JSON array conforme contentSuggestionSchema.
```

## 8. Prompts sugeridos (`promptTemplateSchema[]`, opcional, 0–6)
**USER**
```
Com base nos temas do dia, sugira de 0 a 4 novos prompts úteis para revisão.
Cada um: title, category_slug, objective, when_to_use, required_input,
prompt_body, example_output, tags.
Só sugira prompts que agreguem além dos já existentes.
Saída: JSON array conforme promptTemplateSchema.
```

---

## Montagem da edição
Após validar todos os módulos, o orquestrador monta o objeto `editionGenerationSchema`
(com `title`, `summary`, `meta.prompt_version`, `meta.model_used`) e grava a edição como
`draft` / `review_status=pending`. Nada é publicado até a aprovação humana na fila de revisão.

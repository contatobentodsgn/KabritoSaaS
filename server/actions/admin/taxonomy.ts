"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canReviewContent } from "@/server/permissions";
import {
  platformSchema,
  nicheSchema,
  tagSchema,
  categorySchema,
  templateSchema,
} from "@/lib/validations/admin";
import type { FormState } from "@/server/actions/types";

const csv = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

/* ===========================================================================
 * CRUD — taxonomia / prompts (editor)
 * =========================================================================== */

export async function createPlatform(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!(await canReviewContent())) return { error: "Não autorizado." };
  const parsed = platformSchema.safeParse({
    name: fd.get("name"),
    slug: fd.get("slug"),
    isActive: fd.get("isActive") !== "off",
  });
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { error } = await supabase.from("platforms").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    is_active: parsed.data.isActive,
  });
  if (error) return { error: "Falha ao criar plataforma (slug duplicado?)." };
  revalidatePath("/admin/sources");
  return { ok: true, message: "Plataforma criada." };
}

export async function createNiche(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!(await canReviewContent())) return { error: "Não autorizado." };
  const parsed = nicheSchema.safeParse({
    name: fd.get("name"),
    slug: fd.get("slug"),
    description: fd.get("description") ?? "",
  });
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { error } = await supabase.from("niches").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
  });
  if (error) return { error: "Falha ao criar nicho (slug duplicado?)." };
  revalidatePath("/admin/prompts");
  return { ok: true, message: "Nicho criado." };
}

export async function createTag(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!(await canReviewContent())) return { error: "Não autorizado." };
  const parsed = tagSchema.safeParse({
    name: fd.get("name"),
    slug: fd.get("slug"),
  });
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_tags")
    .insert({ name: parsed.data.name, slug: parsed.data.slug });
  if (error) return { error: "Falha ao criar tag (slug duplicado?)." };
  revalidatePath("/admin/prompts");
  return { ok: true, message: "Tag criada." };
}

export async function createCategory(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!(await canReviewContent())) return { error: "Não autorizado." };
  const parsed = categorySchema.safeParse({
    name: fd.get("name"),
    slug: fd.get("slug"),
    description: fd.get("description") ?? "",
  });
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { error } = await supabase.from("prompt_categories").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
  });
  if (error) return { error: "Falha ao criar categoria (slug duplicado?)." };
  revalidatePath("/admin/prompts");
  return { ok: true, message: "Categoria criada." };
}

export async function createTemplate(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!(await canReviewContent())) return { error: "Não autorizado." };
  const parsed = templateSchema.safeParse({
    categoryId: fd.get("categoryId"),
    title: fd.get("title"),
    objective: fd.get("objective"),
    whenToUse: fd.get("whenToUse"),
    requiredInput: fd.get("requiredInput") ?? "",
    promptBody: fd.get("promptBody"),
    exampleOutput: fd.get("exampleOutput"),
    tags: fd.get("tags") ?? "",
  });
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { error } = await supabase.from("prompt_templates").insert({
    category_id: parsed.data.categoryId,
    title: parsed.data.title,
    objective: parsed.data.objective,
    when_to_use: parsed.data.whenToUse,
    required_input: csv(parsed.data.requiredInput),
    prompt_body: parsed.data.promptBody,
    example_output: parsed.data.exampleOutput,
    tags: csv(parsed.data.tags),
  });
  if (error) return { error: "Falha ao criar prompt." };
  revalidatePath("/admin/prompts");
  return { ok: true, message: "Prompt criado." };
}

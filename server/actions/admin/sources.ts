"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canManagePipeline } from "@/server/permissions";
import { sourceSchema } from "@/lib/validations/admin";
import type { FormState } from "@/server/actions/types";
import type { Json } from "@/types/supabase";
import { type ActionResult, forbidden } from "./shared";

/* ===========================================================================
 * CRUD — fontes de ingestão (superadmin: canManagePipeline)
 * =========================================================================== */

export async function createSource(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!(await canManagePipeline())) return { error: "Não autorizado." };
  const parsed = sourceSchema.safeParse({
    name: fd.get("name"),
    type: fd.get("type"),
    configJson: fd.get("configJson") ?? "{}",
    isActive: fd.get("isActive") === "on",
  });
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };

  let config: Json;
  try {
    config = JSON.parse(parsed.data.configJson || "{}");
    if (typeof config !== "object" || Array.isArray(config)) throw new Error();
  } catch {
    return { error: "config precisa ser um objeto JSON válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ingestion_sources").insert({
    name: parsed.data.name,
    type: parsed.data.type,
    config,
    is_active: parsed.data.isActive,
  });
  if (error) return { error: "Falha ao criar fonte." };
  revalidatePath("/admin/sources");
  return { ok: true, message: "Fonte criada." };
}

export async function toggleSourceActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  if (!(await canManagePipeline())) return forbidden();
  if (!z.string().uuid().safeParse(id).success)
    return { ok: false, error: "ID inválido." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("ingestion_sources")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { ok: false, error: "Falha." };
  revalidatePath("/admin/sources");
  return { ok: true };
}

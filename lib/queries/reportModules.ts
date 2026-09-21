import type { Module } from '@/content/types'
import type { createClient } from '@/lib/supabase/server'
import { MODULES } from '@/content/registry'
import { getAllAdminModules, getAllAdminModulesWithContent } from '@/lib/queries/adminContent'
import { getCustomModulesForSection, getCustomModuleTree } from '@/lib/queries/customContent'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export interface PickableModule {
  id: string
  title: string
  icon: string
}

function toPickable(mods: { id: string; title: string; icon: string }[]): PickableModule[] {
  return mods.map((m) => ({ id: m.id, title: m.title, icon: m.icon }))
}

/** Derives the picker list from an already-fetched full Module[] (e.g. getReportableModulesForSection's result), avoiding a second round of queries. */
export function toPickableFromModules(modules: Module[]): PickableModule[] {
  return toPickable(modules.filter((m) => m.subModules.length > 0))
}

/**
 * Built-in + this section's assigned custom modules + all (global) admin
 * modules — id/title/icon only, for the report module-picker checklist.
 * sectionId null (unassigned student) simply omits custom modules.
 */
export async function getPickableModulesForSection(supabase: SupabaseServerClient, sectionId: string | null): Promise<PickableModule[]> {
  const builtIn = toPickable(MODULES.filter((m) => m.subModules.length > 0))
  const [admin, custom] = await Promise.all([
    getAllAdminModules(supabase),
    sectionId ? getCustomModulesForSection(supabase, sectionId) : Promise.resolve([]),
  ])
  return [...builtIn, ...toPickable(custom), ...toPickable(admin)]
}

/**
 * Same three sources as getPickableModulesForSection, but with full
 * sub-module/sign data — what buildTopicReportData actually needs to
 * compute per-topic percentages and weak-sign breakdowns.
 */
export async function getReportableModulesForSection(supabase: SupabaseServerClient, sectionId: string | null): Promise<Module[]> {
  const admin = await getAllAdminModulesWithContent(supabase)

  let custom: Module[] = []
  if (sectionId) {
    const summaries = await getCustomModulesForSection(supabase, sectionId)
    const trees = await Promise.all(summaries.map((s) => getCustomModuleTree(supabase, s.id)))
    custom = trees.filter((m): m is Module => m !== null)
  }

  return [...MODULES, ...custom, ...admin]
}

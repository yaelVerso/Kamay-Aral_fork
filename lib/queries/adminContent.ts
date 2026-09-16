import type { Module, SubModule, SignItem } from '@/content/types'
import type { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

// Same reasoning as customContent.ts: no per-sub-module activity-sequence
// configuration in the admin UI, every admin sub-module gets the default.
const DEFAULT_ACTIVITY_SEQUENCE: SubModule['activitySequence'] = [
  'lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling',
]

interface AdminSignRow {
  id: string
  submodule_id: string
  label: string
  label_fil: string | null
  video_url: string
  image_url: string | null
  accepted_answers: string[]
}

function mapSign(row: AdminSignRow): SignItem {
  return {
    id: row.id,
    label: row.label,
    labelFil: row.label_fil ?? undefined,
    videoPath: row.video_url,
    imagePath: row.image_url ?? undefined,
    acceptedAnswers: row.accepted_answers,
  }
}

/**
 * One admin module's full tree (sub-modules + signs) — used by the
 * Learn/Activity/Quiz pages. Unlike custom modules, there's no
 * assignment-table check needed: admin_modules/admin_submodules/admin_signs
 * RLS already allows every authenticated user to read every row.
 */
export async function getAdminModuleTree(supabase: SupabaseServerClient, moduleId: string): Promise<Module | null> {
  const { data: mod } = await supabase
    .from('admin_modules')
    .select('id, title, description, icon, color, order')
    .eq('id', moduleId)
    .maybeSingle()
  if (!mod) return null

  const { data: submodules } = await supabase
    .from('admin_submodules')
    .select('id, title, short_title, order')
    .eq('module_id', moduleId)
    .order('order')

  const submoduleIds = (submodules ?? []).map((s) => s.id)
  const { data: signs } = submoduleIds.length > 0
    ? await supabase
        .from('admin_signs')
        .select('id, submodule_id, label, label_fil, video_url, image_url, accepted_answers, order')
        .in('submodule_id', submoduleIds)
        .order('order')
    : { data: [] }

  const subModules: SubModule[] = (submodules ?? []).map((sm) => ({
    id: sm.id,
    moduleId: mod.id,
    title: sm.title,
    shortTitle: sm.short_title,
    items: (signs ?? []).filter((s) => s.submodule_id === sm.id).map(mapSign),
    activitySequence: DEFAULT_ACTIVITY_SEQUENCE,
  }))

  return {
    id: mod.id,
    order: mod.order,
    title: mod.title,
    description: mod.description ?? '',
    icon: mod.icon,
    subModules,
    color: mod.color,
  }
}

export interface AdminModuleSummary {
  id: string
  title: string
  icon: string
  subModules: { id: string; title: string }[]
}

/**
 * Every admin module's title/icon and sub-module id/title — no signs —
 * for the teacher's per-section quiz toggle list (mirrors how built-in
 * modules are listed there, since admin content is equally global).
 */
export async function getAllAdminModules(supabase: SupabaseServerClient): Promise<AdminModuleSummary[]> {
  const { data: modules } = await supabase
    .from('admin_modules')
    .select('id, title, icon')
    .order('order')
  if (!modules || modules.length === 0) return []

  const moduleIds = modules.map((m) => m.id)
  const { data: submodules } = await supabase
    .from('admin_submodules')
    .select('id, module_id, title')
    .in('module_id', moduleIds)
    .order('order')

  return modules.map((mod) => ({
    id: mod.id,
    title: mod.title,
    icon: mod.icon,
    subModules: (submodules ?? [])
      .filter((sm) => sm.module_id === mod.id)
      .map((sm) => ({ id: sm.id, title: sm.title })),
  }))
}

/**
 * Every admin module, each with its full sub-module/sign tree — used by
 * the student-facing module list (admin content is visible to everyone,
 * no per-student/per-section filtering needed).
 */
export async function getAllAdminModulesWithContent(supabase: SupabaseServerClient): Promise<Module[]> {
  const { data: modules } = await supabase
    .from('admin_modules')
    .select('id, title, description, icon, color, order')
    .order('order')
  if (!modules || modules.length === 0) return []

  const moduleIds = modules.map((m) => m.id)
  const { data: submodules } = await supabase
    .from('admin_submodules')
    .select('id, module_id, title, short_title, order')
    .in('module_id', moduleIds)
    .order('order')

  const submoduleIds = (submodules ?? []).map((s) => s.id)
  const { data: signs } = submoduleIds.length > 0
    ? await supabase
        .from('admin_signs')
        .select('id, submodule_id, label, label_fil, video_url, image_url, accepted_answers, order')
        .in('submodule_id', submoduleIds)
        .order('order')
    : { data: [] }

  return modules.map((mod) => ({
    id: mod.id,
    order: mod.order,
    title: mod.title,
    description: mod.description ?? '',
    icon: mod.icon,
    color: mod.color,
    subModules: (submodules ?? [])
      .filter((sm) => sm.module_id === mod.id)
      .map((sm) => ({
        id: sm.id,
        moduleId: mod.id,
        title: sm.title,
        shortTitle: sm.short_title,
        items: (signs ?? []).filter((s) => s.submodule_id === sm.id).map(mapSign),
        activitySequence: DEFAULT_ACTIVITY_SEQUENCE,
      })),
  }))
}

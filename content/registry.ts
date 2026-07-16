import type { Module, SubModule, SignItem } from './types'
import alphabet from './modules/01-alphabet'
import numbers from './modules/02-numbers'
import greetings from './modules/03-greetings'
import family from './modules/04-family'
import questionsPronouns from './modules/05-questions-pronouns'
import colorsShapes from './modules/06-colors-shapes'
import school from './modules/07-school'
import food from './modules/08-food'
import time from './modules/09-time'
import feelings from './modules/10-feelings'

export const MODULES: Module[] = [
  alphabet,
  numbers,
  greetings,
  family,
  questionsPronouns,
  colorsShapes,
  school,
  food,
  time,
  feelings,
]

export function getModule(moduleId: string): Module | undefined {
  return MODULES.find((m) => m.id === moduleId)
}

export function getSubModule(moduleId: string, subModuleId: string): SubModule | undefined {
  return getModule(moduleId)?.subModules.find((s) => s.id === subModuleId)
}

export function getItem(moduleId: string, subModuleId: string, itemId: string): SignItem | undefined {
  return getSubModule(moduleId, subModuleId)?.items.find((i) => i.id === itemId)
}

/** Returns all sub-module IDs across all modules — used for quiz settings lookups */
export function getAllSubModuleIds(): string[] {
  return MODULES.flatMap((m) => m.subModules.map((s) => s.id))
}

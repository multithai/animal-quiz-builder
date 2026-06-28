import type { QuizAppearanceConfig, QuizFontFamily, QuizModel } from '../types'

export const FONT_OPTIONS: Array<{ id: QuizFontFamily; label: string; family: string }> = [
  { id: 'noto-sans-thai', label: 'Noto Sans Thai', family: '"Noto Sans Thai"' },
  { id: 'prompt', label: 'Prompt', family: '"Prompt"' },
  { id: 'kanit', label: 'Kanit', family: '"Kanit"' },
  { id: 'sarabun', label: 'Sarabun', family: '"Sarabun"' },
  { id: 'ibm-plex-sans-thai', label: 'IBM Plex Sans Thai', family: '"IBM Plex Sans Thai"' },
]

export const FONT_WEIGHT_OPTIONS = [
  { value: 400, label: 'ปกติ' },
  { value: 500, label: 'กลาง' },
  { value: 600, label: 'หนา' },
  { value: 700, label: 'หนามาก' },
  { value: 800, label: 'หนาสุด' },
]

export const DEFAULT_APPEARANCE: QuizAppearanceConfig = {
  fontFamily: 'noto-sans-thai',
  fontScale: 1,
  fontWeight: 500,
}

const FALLBACK_FONT_STACK = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function getFontOption(fontFamily: QuizFontFamily) {
  return FONT_OPTIONS.find((font) => font.id === fontFamily) ?? FONT_OPTIONS[0]
}

export function getFontFamilyStack(fontFamily: QuizFontFamily): string {
  return `${getFontOption(fontFamily).family}, ${FALLBACK_FONT_STACK}`
}

export function getQuizAppearance(quiz: QuizModel): QuizAppearanceConfig {
  const appearance = quiz.appearance
  const storedFontFamily = appearance?.fontFamily
  const fontFamily = storedFontFamily && FONT_OPTIONS.some((font) => font.id === storedFontFamily)
    ? storedFontFamily
    : DEFAULT_APPEARANCE.fontFamily
  const fontScale = clamp(Number(appearance?.fontScale ?? DEFAULT_APPEARANCE.fontScale), 0.85, 1.25)
  const fontWeight = clamp(Number(appearance?.fontWeight ?? DEFAULT_APPEARANCE.fontWeight), 400, 800)

  return {
    fontFamily,
    fontScale,
    fontWeight,
  }
}

export function normalizeQuizAppearance(quiz: QuizModel): QuizModel {
  return {
    ...quiz,
    appearance: getQuizAppearance(quiz),
  }
}

export function getAppearanceCssVariables(quiz: QuizModel): Record<string, string | number> {
  const appearance = getQuizAppearance(quiz)
  const weight = appearance.fontWeight

  return {
    '--font': getFontFamilyStack(appearance.fontFamily),
    '--font-scale': appearance.fontScale,
    '--app-font-weight': weight,
    '--app-font-weight-medium': clamp(weight + 100, 400, 850),
    '--app-font-weight-bold': clamp(weight + 200, 500, 900),
    '--app-font-weight-heavy': clamp(weight + 300, 600, 900),
  }
}

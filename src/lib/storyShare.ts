import type { QuizEvaluation } from './quizEngine'
import { formatNumber } from './quizEngine'
import type { QuizModel, ResultNode } from '../types'

export interface StoryImageInput {
  quiz: QuizModel
  result: ResultNode
  evaluation: QuizEvaluation
  shareUrl: string
}

const STORY_WIDTH = 1080
const STORY_HEIGHT = 1920

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map((item) => item + item).join('')
    : normalized.padEnd(6, '0').slice(0, 6)

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  }
}

function colorWithAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

function splitLongToken(context: CanvasRenderingContext2D, token: string, maxWidth: number): string[] {
  const parts: string[] = []
  let current = ''

  for (const character of Array.from(token)) {
    const next = current + character
    if (current && context.measureText(next).width > maxWidth) {
      parts.push(current)
      current = character
    } else {
      current = next
    }
  }

  if (current) {
    parts.push(current)
  }

  return parts
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4,
): number {
  const tokens = text.split(/(\s+)/).filter(Boolean)
  const lines: string[] = []
  let line = ''

  for (const token of tokens) {
    const pieces = context.measureText(token).width > maxWidth
      ? splitLongToken(context, token, maxWidth)
      : [token]

    for (const piece of pieces) {
      const nextLine = line + piece
      if (line && context.measureText(nextLine).width > maxWidth) {
        lines.push(line.trimEnd())
        line = piece.trimStart()
      } else {
        line = nextLine
      }

      if (lines.length === maxLines) {
        break
      }
    }

    if (lines.length === maxLines) {
      break
    }
  }

  if (line && lines.length < maxLines) {
    lines.push(line.trim())
  }

  const visibleLines = lines.slice(0, maxLines)
  if (lines.length > maxLines || tokens.join('').length > visibleLines.join('').length) {
    const lastIndex = visibleLines.length - 1
    visibleLines[lastIndex] = `${visibleLines[lastIndex].slice(0, -1)}…`
  }

  visibleLines.forEach((visibleLine, index) => {
    context.fillText(visibleLine, x, y + index * lineHeight)
  })

  return y + visibleLines.length * lineHeight
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Unable to create story image'))
      }
    }, 'image/png')
  })
}

export function buildStoryFileName(resultTitle: string): string {
  const safeTitle = resultTitle.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'result'
  return `animal-quiz-${safeTitle}-story.png`
}

export async function createStoryImageBlob({
  quiz,
  result,
  evaluation,
  shareUrl,
}: StoryImageInput): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = STORY_WIDTH
  canvas.height = STORY_HEIGHT

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas is not supported')
  }

  const ranking = evaluation.ranking.find((item) => item.resultId === result.id)
  const gradient = context.createLinearGradient(0, 0, STORY_WIDTH, STORY_HEIGHT)
  gradient.addColorStop(0, colorWithAlpha(result.color, 0.9))
  gradient.addColorStop(0.58, '#f7f2e8')
  gradient.addColorStop(1, '#ffffff')
  context.fillStyle = gradient
  context.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT)

  context.fillStyle = 'rgba(255, 255, 255, 0.82)'
  roundedRect(context, 72, 86, 936, 1748, 42)
  context.fill()

  context.fillStyle = colorWithAlpha(result.color, 0.12)
  roundedRect(context, 118, 142, 844, 620, 36)
  context.fill()

  context.textAlign = 'left'
  context.textBaseline = 'alphabetic'
  context.fillStyle = '#24413d'
  context.font = '800 34px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  context.fillText('ANIMAL PROFILE QUIZ', 144, 215)

  context.fillStyle = colorWithAlpha(result.color, 0.94)
  context.font = '800 230px "Segoe UI Emoji", "Apple Color Emoji", system-ui'
  context.textAlign = 'center'
  context.fillText(result.emoji || '✦', STORY_WIDTH / 2, 468)

  context.textAlign = 'left'
  context.fillStyle = '#43524f'
  context.font = '800 46px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  context.fillText('ฉันคือ', 144, 560)

  context.fillStyle = '#12201e'
  context.font = '900 104px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  wrapText(context, result.title, 144, 670, 792, 118, 2)

  context.fillStyle = result.color
  context.font = '800 44px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  context.fillText(result.subtitle, 144, 872)

  context.fillStyle = '#3a4845'
  context.font = '500 34px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  wrapText(context, result.description, 144, 940, 792, 48, 5)

  const cardTop = 1210
  context.fillStyle = '#ffffff'
  roundedRect(context, 118, cardTop, 844, 364, 30)
  context.fill()

  context.fillStyle = '#182623'
  context.font = '850 34px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  context.fillText('คะแนนที่ใกล้ที่สุด', 150, cardTop + 62)

  context.fillStyle = '#63716e'
  context.font = '700 26px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  context.fillText(
    ranking ? `distance ${formatNumber(ranking.distance)}` : 'direct route',
    150,
    cardTop + 104,
  )

  const rows = quiz.scoring.dimensions.slice(0, 5)
  rows.forEach((dimension, index) => {
    const top = cardTop + 146 + index * 42
    const max = dimension.max || 3
    const value = evaluation.profile[dimension.id] ?? (dimension.min + dimension.max) / 2
    const target = result.profile[dimension.id] ?? (dimension.min + dimension.max) / 2
    const playerWidth = Math.min(Math.max(value / max, 0), 1) * 310
    const targetX = 504 + Math.min(Math.max(target / max, 0), 1) * 310

    context.fillStyle = '#243330'
    context.font = '700 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    context.fillText(dimension.label, 150, top + 21)

    context.fillStyle = '#e8eeeb'
    roundedRect(context, 504, top, 310, 18, 9)
    context.fill()

    if (playerWidth > 0) {
      context.fillStyle = result.color
      roundedRect(context, 504, top, playerWidth, 18, Math.min(9, playerWidth / 2))
      context.fill()
    }

    context.fillStyle = '#bc7a22'
    context.fillRect(targetX - 3, top - 6, 6, 30)

    context.fillStyle = '#64716e'
    context.font = '700 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    context.fillText(formatNumber(value), 842, top + 21)
  })

  context.fillStyle = '#182623'
  context.font = '900 38px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  context.fillText(quiz.title, 118, 1698)

  context.fillStyle = '#5c6966'
  context.font = '600 25px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  wrapText(context, shareUrl, 118, 1744, 844, 34, 2)

  return canvasToBlob(canvas)
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

import type { QuizEvaluation } from './quizEngine'
import { formatNumber } from './quizEngine'
import type { QuizModel, ResultNode } from '../types'
import { getFontFamilyStack, getQuizAppearance } from './appearance'

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

async function waitForStoryFonts() {
  try {
    await document.fonts.ready
  } catch {
    // If font loading is unavailable, canvas will use the fallback stack.
  }
}

function storyFont(weight: number, size: number, fontStack: string, fontScale: number): string {
  return `${weight} ${Math.round(size * fontScale)}px ${fontStack}`
}

function loadCanvasImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    if (!src.startsWith('data:')) {
      image.crossOrigin = 'anonymous'
      image.referrerPolicy = 'no-referrer'
    }
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to load result image'))
    image.src = src
  })
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const imageRatio = image.width / image.height
  const boxRatio = width / height
  const sourceWidth = imageRatio > boxRatio ? image.height * boxRatio : image.width
  const sourceHeight = imageRatio > boxRatio ? image.height : image.width / boxRatio
  const sourceX = (image.width - sourceWidth) / 2
  const sourceY = (image.height - sourceHeight) / 2

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
}

async function drawResultVisual(context: CanvasRenderingContext2D, result: ResultNode) {
  if (result.imageUrl) {
    try {
      const image = await loadCanvasImage(result.imageUrl)
      const imageSize = 320
      const imageX = (STORY_WIDTH - imageSize) / 2
      const imageY = 216

      context.save()
      roundedRect(context, imageX, imageY, imageSize, imageSize, 44)
      context.clip()
      drawCoverImage(context, image, imageX, imageY, imageSize, imageSize)
      context.restore()
      return
    } catch {
      // External URLs can fail CORS; fallback keeps story generation usable.
    }
  }

  context.fillStyle = colorWithAlpha(result.color, 0.94)
  context.font = '800 230px "Segoe UI Emoji", "Apple Color Emoji", system-ui'
  context.textAlign = 'center'
  context.fillText(result.emoji || '✦', STORY_WIDTH / 2, 468)
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
  await waitForStoryFonts()

  const appearance = getQuizAppearance(quiz)
  const fontStack = getFontFamilyStack(appearance.fontFamily)
  const fontScale = appearance.fontScale
  const weight = appearance.fontWeight
  const mediumWeight = Math.min(weight + 100, 850)
  const boldWeight = Math.min(weight + 200, 900)
  const heavyWeight = Math.min(weight + 300, 900)
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
  context.font = storyFont(heavyWeight, 34, fontStack, fontScale)
  context.fillText('ANIMAL PROFILE QUIZ', 144, 215)

  await drawResultVisual(context, result)

  context.textAlign = 'left'
  context.fillStyle = '#43524f'
  context.font = storyFont(heavyWeight, 46, fontStack, fontScale)
  context.fillText('ฉันคือ', 144, 560)

  context.fillStyle = '#12201e'
  context.font = storyFont(heavyWeight, 104, fontStack, fontScale)
  wrapText(context, result.title, 144, 670, 792, 118, 2)

  context.fillStyle = result.color
  context.font = storyFont(heavyWeight, 44, fontStack, fontScale)
  context.fillText(result.subtitle, 144, 872)

  context.fillStyle = '#3a4845'
  context.font = storyFont(weight, 34, fontStack, fontScale)
  wrapText(context, result.description, 144, 940, 792, 48, 5)

  const cardTop = 1210
  context.fillStyle = '#ffffff'
  roundedRect(context, 118, cardTop, 844, 364, 30)
  context.fill()

  context.fillStyle = '#182623'
  context.font = storyFont(heavyWeight, 34, fontStack, fontScale)
  context.fillText('คะแนนที่ใกล้ที่สุด', 150, cardTop + 62)

  context.fillStyle = '#63716e'
  context.font = storyFont(boldWeight, 26, fontStack, fontScale)
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
    context.font = storyFont(boldWeight, 24, fontStack, fontScale)
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
    context.font = storyFont(boldWeight, 22, fontStack, fontScale)
    context.fillText(formatNumber(value), 842, top + 21)
  })

  context.fillStyle = '#182623'
  context.font = storyFont(heavyWeight, 38, fontStack, fontScale)
  context.fillText(quiz.title, 118, 1698)

  context.fillStyle = '#5c6966'
  context.font = storyFont(mediumWeight, 25, fontStack, fontScale)
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

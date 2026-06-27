import type {
  PlayedAnswer,
  QuestionNode,
  QuizEdge,
  QuizModel,
  QuizNode,
  ResultNode,
  ScoreDimension,
  ScoreEffect,
  ScoreProfile,
} from '../types'

export interface ScoreCalculation {
  dimensionId: string
  dimensionLabel: string
  operation: ScoreEffect['operation']
  previous: number | null
  value: number
  next: number
  questionTitle: string
  answerLabel: string
}

export interface DimensionDistance {
  dimensionId: string
  dimensionLabel: string
  player: number
  target: number
  delta: number
}

export interface ResultRanking {
  resultId: string
  title: string
  distance: number
  color: string
  dimensions: DimensionDistance[]
}

export interface QuizEvaluation {
  profile: ScoreProfile
  calculations: ScoreCalculation[]
  ranking: ResultRanking[]
  result: ResultNode | null
  forcedResult: ResultNode | null
}

export function isQuestionNode(node: QuizNode | undefined): node is QuestionNode {
  return node?.type === 'question'
}

export function isResultNode(node: QuizNode | undefined): node is ResultNode {
  return node?.type === 'result'
}

export function getNodeById(quiz: QuizModel, nodeId: string): QuizNode | undefined {
  return quiz.nodes.find((node) => node.id === nodeId)
}

export function getQuestionNodes(quiz: QuizModel): QuestionNode[] {
  return quiz.nodes.filter(isQuestionNode)
}

export function getResultNodes(quiz: QuizModel): ResultNode[] {
  return quiz.nodes.filter(isResultNode)
}

export function getOutgoingEdge(
  quiz: QuizModel,
  sourceNodeId: string,
  sourceAnswerId: string,
): QuizEdge | undefined {
  return quiz.edges.find(
    (edge) => edge.sourceNodeId === sourceNodeId && edge.sourceAnswerId === sourceAnswerId,
  )
}

export function findDimension(
  dimensions: ScoreDimension[],
  dimensionId: string,
): ScoreDimension | undefined {
  return dimensions.find((dimension) => dimension.id === dimensionId)
}

export function applyEffect(previous: number | undefined, effect: ScoreEffect): number {
  if (effect.operation === 'add') {
    return (previous ?? 0) + effect.value
  }

  if (effect.operation === 'set') {
    return effect.value
  }

  return previous === undefined ? effect.value : (previous + effect.value) / 2
}

export function evaluateQuiz(
  quiz: QuizModel,
  history: PlayedAnswer[],
  forcedResultId?: string,
): QuizEvaluation {
  const profile: ScoreProfile = {}
  const calculations: ScoreCalculation[] = []

  for (const step of history) {
    for (const effect of step.effects) {
      const previous = profile[effect.dimensionId]
      const next = applyEffect(previous, effect)
      const dimension = findDimension(quiz.scoring.dimensions, effect.dimensionId)

      profile[effect.dimensionId] = next
      calculations.push({
        dimensionId: effect.dimensionId,
        dimensionLabel: dimension?.label ?? effect.dimensionId,
        operation: effect.operation,
        previous: previous ?? null,
        value: effect.value,
        next,
        questionTitle: step.questionTitle,
        answerLabel: step.answerLabel,
      })
    }
  }

  const ranking = rankResults(quiz, profile)
  const forcedNode = forcedResultId ? getNodeById(quiz, forcedResultId) : undefined
  const forcedResult = isResultNode(forcedNode) ? forcedNode : null
  const calculatedResultId = ranking[0]?.resultId
  const calculatedNode = calculatedResultId ? getNodeById(quiz, calculatedResultId) : undefined

  return {
    profile,
    calculations,
    ranking,
    result: forcedResult ?? (isResultNode(calculatedNode) ? calculatedNode : null),
    forcedResult,
  }
}

export function rankResults(quiz: QuizModel, profile: ScoreProfile): ResultRanking[] {
  return getResultNodes(quiz)
    .map((result) => {
      const dimensions = quiz.scoring.dimensions.map((dimension) => {
        const fallback = (dimension.min + dimension.max) / 2
        const player = profile[dimension.id] ?? fallback
        const target = result.profile[dimension.id] ?? fallback
        const delta = Math.abs(player - target)

        return {
          dimensionId: dimension.id,
          dimensionLabel: dimension.label,
          player,
          target,
          delta,
        }
      })

      return {
        resultId: result.id,
        title: result.title,
        color: result.color,
        distance: dimensions.reduce((sum, dimension) => sum + dimension.delta, 0),
        dimensions,
      }
    })
    .sort((left, right) => left.distance - right.distance)
}

export function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

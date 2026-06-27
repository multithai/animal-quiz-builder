export type NodeKind = 'question' | 'result'

export type ScoreOperation = 'average' | 'add' | 'set'

export type ScoreMode = 'profile-distance'

export type ScoreProfile = Record<string, number>

export interface Position {
  x: number
  y: number
}

export interface ScoreDimension {
  id: string
  label: string
  min: number
  max: number
}

export interface ScoreEffect {
  dimensionId: string
  value: number
  operation: ScoreOperation
}

export interface AnswerOption {
  id: string
  label: string
  effects: ScoreEffect[]
}

export interface BaseQuizNode {
  id: string
  type: NodeKind
  position: Position
}

export interface QuestionNode extends BaseQuizNode {
  type: 'question'
  title: string
  note?: string
  answers: AnswerOption[]
}

export interface ResultNode extends BaseQuizNode {
  type: 'result'
  title: string
  subtitle: string
  description: string
  emoji: string
  imageUrl?: string
  color: string
  profile: ScoreProfile
}

export type QuizNode = QuestionNode | ResultNode

export interface QuizEdge {
  id: string
  sourceNodeId: string
  sourceAnswerId: string
  targetNodeId: string
}

export interface QuizScoringConfig {
  mode: ScoreMode
  dimensions: ScoreDimension[]
}

export interface QuizModel {
  id: string
  title: string
  description: string
  startNodeId: string
  scoring: QuizScoringConfig
  nodes: QuizNode[]
  edges: QuizEdge[]
}

export interface PlayedAnswer {
  questionId: string
  questionTitle: string
  answerId: string
  answerLabel: string
  effects: ScoreEffect[]
}

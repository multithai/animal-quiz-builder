import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import type { AnswerOption, PlayedAnswer, QuizModel, ScoreEffect } from '../types'
import {
  evaluateQuiz,
  formatNumber,
  getNodeById,
  getOutgoingEdge,
  getQuestionNodes,
  isQuestionNode,
  isResultNode,
} from '../lib/quizEngine'

interface QuizPlayerProps {
  quiz: QuizModel
}

function getInitialQuestionId(quiz: QuizModel): string {
  const startNode = getNodeById(quiz, quiz.startNodeId)
  if (isQuestionNode(startNode)) {
    return startNode.id
  }

  return getQuestionNodes(quiz)[0]?.id ?? ''
}

function effectLabel(quiz: QuizModel, effect: ScoreEffect): string {
  const dimension = quiz.scoring.dimensions.find((item) => item.id === effect.dimensionId)
  const operator = effect.operation === 'average' ? 'avg' : effect.operation === 'add' ? '+' : '='
  return `${dimension?.label ?? effect.dimensionId} ${operator} ${effect.value}`
}

function answerSummary(quiz: QuizModel, answer: AnswerOption): string {
  if (answer.effects.length === 0) {
    return 'ไม่เพิ่มคะแนน'
  }

  return answer.effects.map((effect) => effectLabel(quiz, effect)).join(' · ')
}

export function QuizPlayer({ quiz }: QuizPlayerProps) {
  const initialQuestionId = useMemo(() => getInitialQuestionId(quiz), [quiz])
  const [currentNodeId, setCurrentNodeId] = useState(initialQuestionId)
  const [history, setHistory] = useState<PlayedAnswer[]>([])
  const [forcedResultId, setForcedResultId] = useState<string>()

  useEffect(() => {
    setCurrentNodeId(initialQuestionId)
    setHistory([])
    setForcedResultId(undefined)
  }, [initialQuestionId])

  const currentNode = getNodeById(quiz, currentNodeId)
  const currentQuestion = isQuestionNode(currentNode) ? currentNode : null
  const evaluation = useMemo(
    () => evaluateQuiz(quiz, history, forcedResultId),
    [forcedResultId, history, quiz],
  )
  const isComplete = !currentQuestion && history.length > 0
  const totalQuestions = getQuestionNodes(quiz).length
  const progressPercent = totalQuestions > 0 ? Math.min((history.length / totalQuestions) * 100, 100) : 0

  function resetPlayer() {
    setCurrentNodeId(initialQuestionId)
    setHistory([])
    setForcedResultId(undefined)
  }

  function goBack() {
    if (history.length === 0) {
      resetPlayer()
      return
    }

    const previousHistory = history.slice(0, -1)
    const lastStep = history[history.length - 1]
    setHistory(previousHistory)
    setForcedResultId(undefined)
    setCurrentNodeId(lastStep.questionId)
  }

  function chooseAnswer(answer: AnswerOption) {
    if (!currentQuestion) {
      return
    }

    const nextHistory: PlayedAnswer[] = [
      ...history,
      {
        questionId: currentQuestion.id,
        questionTitle: currentQuestion.title,
        answerId: answer.id,
        answerLabel: answer.label,
        effects: answer.effects,
      },
    ]
    const outgoingEdge = getOutgoingEdge(quiz, currentQuestion.id, answer.id)
    const targetNode = outgoingEdge ? getNodeById(quiz, outgoingEdge.targetNodeId) : undefined

    setHistory(nextHistory)

    if (isQuestionNode(targetNode)) {
      setCurrentNodeId(targetNode.id)
      return
    }

    setForcedResultId(isResultNode(targetNode) ? targetNode.id : undefined)
    setCurrentNodeId('')
  }

  if (!currentQuestion && !isComplete) {
    return (
      <section className="empty-state">
        <h2>ยังไม่มีคำถามเริ่มต้น</h2>
        <p>เลือกคำถามเริ่มต้นในหลังบ้านก่อนเปิดให้เล่น</p>
      </section>
    )
  }

  return (
    <main className="player-shell">
      <section className="quiz-card">
        <div className="player-topbar">
          <button className="icon-button ghost" type="button" onClick={goBack} title="ย้อนกลับ">
            <ArrowLeft size={18} />
          </button>
          <div className="progress-wrap" aria-label="quiz progress">
            <div className="progress-meta">
              <span>{isComplete ? 'ผลลัพธ์' : `ข้อ ${history.length + 1}`}</span>
              <span>{history.length}/{totalQuestions}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <button className="icon-button ghost" type="button" onClick={resetPlayer} title="เริ่มใหม่">
            <RotateCcw size={18} />
          </button>
        </div>

        {!isComplete && currentQuestion ? (
          <section className="question-panel">
            <p className="eyebrow">Animal profile quiz</p>
            <h1>{currentQuestion.title}</h1>
            {currentQuestion.note ? <p className="question-note">{currentQuestion.note}</p> : null}
            <div className="answer-list">
              {currentQuestion.answers.map((answer) => (
                <button
                  key={answer.id}
                  className="answer-button"
                  type="button"
                  onClick={() => chooseAnswer(answer)}
                >
                  <span>{answer.label}</span>
                  <small>{answerSummary(quiz, answer)}</small>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <ResultView quiz={quiz} history={history} evaluation={evaluation} onReset={resetPlayer} />
        )}
      </section>
    </main>
  )
}

interface ResultViewProps {
  quiz: QuizModel
  history: PlayedAnswer[]
  evaluation: ReturnType<typeof evaluateQuiz>
  onReset: () => void
}

function ResultView({ quiz, history, evaluation, onReset }: ResultViewProps) {
  const result = evaluation.result

  if (!result) {
    return (
      <section className="empty-state compact">
        <h2>ยังไม่มีผลลัพธ์</h2>
        <p>เพิ่ม result node หรือเชื่อมคำตอบไปยังผลลัพธ์ก่อน</p>
      </section>
    )
  }

  const resultRanking = evaluation.ranking.find((item) => item.resultId === result.id)
  const topRanking = evaluation.ranking.slice(0, 4)

  return (
    <section className="result-panel">
      <div className="result-hero" style={{ ['--result-color' as string]: result.color }}>
        <div className="result-visual">
          {result.imageUrl ? <img src={result.imageUrl} alt="" /> : <span>{result.emoji}</span>}
        </div>
        <div>
          <p className="eyebrow">คุณคือ</p>
          <h1>{result.title}</h1>
          <h2>{result.subtitle}</h2>
          <p>{result.description}</p>
        </div>
      </div>

      <div className="result-grid">
        <section className="analysis-panel">
          <div className="section-heading">
            <span>โปรไฟล์คะแนน</span>
            <strong>
              {resultRanking ? `distance ${formatNumber(resultRanking.distance)}` : 'direct route'}
            </strong>
          </div>
          <div className="profile-bars">
            {quiz.scoring.dimensions.map((dimension) => {
              const max = dimension.max || 3
              const player = evaluation.profile[dimension.id] ?? (dimension.min + dimension.max) / 2
              const target = result.profile[dimension.id] ?? (dimension.min + dimension.max) / 2
              return (
                <div className="profile-row" key={dimension.id}>
                  <div>
                    <span>{dimension.label}</span>
                    <small>
                      คุณ {formatNumber(player)} / ผลลัพธ์ {formatNumber(target)}
                    </small>
                  </div>
                  <div className="dual-meter">
                    <span style={{ width: `${Math.min((player / max) * 100, 100)}%` }} />
                    <i style={{ left: `${Math.min((target / max) * 100, 100)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="analysis-panel">
          <div className="section-heading">
            <span>วิธีคิด</span>
            <strong>Σ |คุณ - ผลลัพธ์|</strong>
          </div>
          <div className="ranking-list">
            {topRanking.map((item, index) => (
              <div className="ranking-item" key={item.resultId}>
                <b>{index + 1}</b>
                <span>{item.title}</span>
                <small>{formatNumber(item.distance)}</small>
              </div>
            ))}
          </div>
          {evaluation.forcedResult ? (
            <p className="hint-text">เส้นทางนี้ถูกส่งเข้าผลลัพธ์โดยตรง แต่ระบบยังคำนวณ ranking ไว้ให้เทียบ</p>
          ) : null}
        </section>
      </div>

      <section className="analysis-panel wide">
        <div className="section-heading">
          <span>คำตอบและคะแนน</span>
          <strong>{evaluation.calculations.length} changes</strong>
        </div>
        <div className="history-list">
          {history.map((step, index) => (
            <article className="history-card" key={`${step.questionId}-${step.answerId}-${index}`}>
              <div>
                <b>{index + 1}. {step.questionTitle}</b>
                <span>{step.answerLabel}</span>
              </div>
              <div className="effect-chip-wrap">
                {step.effects.length > 0 ? (
                  step.effects.map((effect, effectIndex) => (
                    <span className="effect-chip" key={`${effect.dimensionId}-${effectIndex}`}>
                      {effectLabel(quiz, effect)}
                    </span>
                  ))
                ) : (
                  <span className="effect-chip muted">no score</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <button className="primary-action" type="button" onClick={onReset}>
        <RotateCcw size={18} />
        เล่นอีกครั้ง
      </button>
    </section>
  )
}

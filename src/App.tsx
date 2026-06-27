import { useEffect, useState } from 'react'
import { GitBranch, Play, Settings2 } from 'lucide-react'
import './App.css'
import { AdminBuilder } from './components/AdminBuilder'
import { QuizPlayer } from './components/QuizPlayer'
import { sampleQuiz } from './data/sampleQuiz'
import type { QuizModel } from './types'

const STORAGE_KEY = 'animal-quiz-builder-v1'

function cloneQuiz(quiz: QuizModel): QuizModel {
  return JSON.parse(JSON.stringify(quiz)) as QuizModel
}

function loadStoredQuiz(): QuizModel {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return cloneQuiz(sampleQuiz)
    }

    const parsed = JSON.parse(stored) as QuizModel
    return Array.isArray(parsed.nodes) && Array.isArray(parsed.edges) ? parsed : cloneQuiz(sampleQuiz)
  } catch {
    return cloneQuiz(sampleQuiz)
  }
}

type ViewMode = 'play' | 'admin'

function App() {
  const [quiz, setQuiz] = useState<QuizModel>(() => loadStoredQuiz())
  const [viewMode, setViewMode] = useState<ViewMode>('play')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [saveState, setSaveState] = useState('saved')

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quiz))
    setSaveState('saved')
  }, [quiz])

  function saveNow() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quiz))
    setSaveState('saved now')
    window.setTimeout(() => setSaveState('saved'), 900)
  }

  function resetSample() {
    setQuiz(cloneQuiz(sampleQuiz))
    setSelectedNodeId(null)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <GitBranch size={22} />
          <div>
            <strong>Animal Quiz Builder</strong>
            <span>{quiz.scoring.mode} · {saveState}</span>
          </div>
        </div>
        <nav className="segmented-control" aria-label="view mode">
          <button
            className={viewMode === 'play' ? 'active' : ''}
            type="button"
            onClick={() => setViewMode('play')}
          >
            <Play size={16} />
            เล่น Quiz
          </button>
          <button
            className={viewMode === 'admin' ? 'active' : ''}
            type="button"
            onClick={() => setViewMode('admin')}
          >
            <Settings2 size={16} />
            หลังบ้าน
          </button>
        </nav>
      </header>

      {viewMode === 'play' ? (
        <QuizPlayer quiz={quiz} />
      ) : (
        <AdminBuilder
          quiz={quiz}
          selectedNodeId={selectedNodeId}
          onQuizChange={(nextQuiz) => {
            setSaveState('saving')
            setQuiz(nextQuiz)
          }}
          onSelectedNodeChange={setSelectedNodeId}
          onResetSample={resetSample}
          onSave={saveNow}
        />
      )}
    </div>
  )
}

export default App

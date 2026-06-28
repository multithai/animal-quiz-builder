import { useEffect, useState, type CSSProperties } from 'react'
import { BookOpen, GitBranch, Play, Settings2 } from 'lucide-react'
import './App.css'
import { AdminBuilder } from './components/AdminBuilder'
import { QuizPlayer } from './components/QuizPlayer'
import { UserGuideDialog } from './components/UserGuideDialog'
import { sampleQuiz } from './data/sampleQuiz'
import { getAppearanceCssVariables, normalizeQuizAppearance } from './lib/appearance'
import type { QuizModel } from './types'

const STORAGE_KEY = 'animal-quiz-builder-v1'

function getBasePath(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return base === '' ? '' : base
}

function getRoutePath(): string {
  const basePath = getBasePath()
  const pathname = window.location.pathname.replace(/\/$/, '') || '/'

  if (basePath && pathname.startsWith(basePath)) {
    return pathname.slice(basePath.length).replace(/\/$/, '') || '/'
  }

  return pathname
}

function getViewModeFromLocation(): ViewMode {
  return getRoutePath() === '/admin' ? 'admin' : 'play'
}

function getViewPath(mode: ViewMode, options: { draft?: boolean } = {}): string {
  const basePath = getBasePath()
  return mode === 'admin' ? `${basePath}/admin` : `${basePath || ''}/${options.draft ? '?draft=1' : ''}`
}

function isDraftPreviewFromLocation(): boolean {
  return new URLSearchParams(window.location.search).get('draft') === '1'
}

function usesLocalDraftFromLocation(): boolean {
  return getViewModeFromLocation() === 'admin' || isDraftPreviewFromLocation()
}

function cloneQuiz(quiz: QuizModel): QuizModel {
  return normalizeQuizAppearance(JSON.parse(JSON.stringify(quiz)) as QuizModel)
}

function loadStoredQuiz(): QuizModel {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return cloneQuiz(sampleQuiz)
    }

    const parsed = JSON.parse(stored) as QuizModel
    return Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)
      ? normalizeQuizAppearance(parsed)
      : cloneQuiz(sampleQuiz)
  } catch {
    return cloneQuiz(sampleQuiz)
  }
}

function loadPublishedQuiz(): QuizModel {
  return cloneQuiz(sampleQuiz)
}

function loadQuizForCurrentLocation(): QuizModel {
  return usesLocalDraftFromLocation() ? loadStoredQuiz() : loadPublishedQuiz()
}

type ViewMode = 'play' | 'admin'

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => getViewModeFromLocation())
  const [usesLocalDraft, setUsesLocalDraft] = useState(() => usesLocalDraftFromLocation())
  const [quiz, setQuiz] = useState<QuizModel>(() => loadQuizForCurrentLocation())
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)
  const [saveState, setSaveState] = useState('saved')

  useEffect(() => {
    if (!usesLocalDraft) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quiz))
    setSaveState('saved')
  }, [quiz, usesLocalDraft])

  useEffect(() => {
    function handlePopState() {
      const nextViewMode = getViewModeFromLocation()
      const nextUsesLocalDraft = usesLocalDraftFromLocation()
      setViewMode(nextViewMode)
      setUsesLocalDraft(nextUsesLocalDraft)
      setSelectedNodeId(null)
      setQuiz(nextUsesLocalDraft ? loadStoredQuiz() : loadPublishedQuiz())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigateToView(mode: ViewMode) {
    const draftPreview = mode === 'play' && usesLocalDraft
    const nextUsesLocalDraft = mode === 'admin' || draftPreview
    const nextPath = getViewPath(mode, { draft: draftPreview })
    const currentPath = `${window.location.pathname}${window.location.search}`

    if (currentPath !== nextPath) {
      window.history.pushState({ mode }, '', nextPath)
    }

    setViewMode(mode)
    setUsesLocalDraft(nextUsesLocalDraft)

    if (mode === 'admin') {
      setQuiz(loadStoredQuiz())
    } else if (!draftPreview) {
      setQuiz(loadPublishedQuiz())
    }
  }

  function saveNow() {
    setUsesLocalDraft(true)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quiz))
    setSaveState('saved now')
    window.setTimeout(() => setSaveState('saved'), 900)
  }

  function resetSample() {
    setQuiz(cloneQuiz(sampleQuiz))
    setSelectedNodeId(null)
  }

  return (
    <div
      className={`app-shell ${viewMode === 'play' ? 'public-play-shell' : 'admin-app-shell'}`}
      style={getAppearanceCssVariables(quiz) as CSSProperties}
    >
      {viewMode === 'admin' ? (
        <header className="app-header">
          <div className="brand-lockup">
            <GitBranch size={22} />
            <div>
              <strong>Animal Quiz Builder</strong>
              <span>{quiz.scoring.mode} · {saveState}</span>
            </div>
          </div>
          <div className="header-actions">
            <button className="guide-button" type="button" onClick={() => setGuideOpen(true)}>
              <BookOpen size={16} />
              คู่มือ
            </button>
            <nav className="segmented-control" aria-label="view mode">
              <button
                type="button"
                onClick={() => navigateToView('play')}
              >
                <Play size={16} />
                เล่น Quiz
              </button>
              <button
                className="active"
                type="button"
                onClick={() => navigateToView('admin')}
              >
                <Settings2 size={16} />
                หลังบ้าน
              </button>
            </nav>
          </div>
        </header>
      ) : null}

      {viewMode === 'play' ? (
        <QuizPlayer quiz={quiz} />
      ) : (
        <AdminBuilder
          quiz={quiz}
          selectedNodeId={selectedNodeId}
          onQuizChange={(nextQuiz) => {
            setSaveState('saving')
            setUsesLocalDraft(true)
            setQuiz(nextQuiz)
          }}
          onSelectedNodeChange={setSelectedNodeId}
          onResetSample={resetSample}
          onSave={saveNow}
        />
      )}
      {viewMode === 'admin' ? (
        <UserGuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} />
      ) : null}
    </div>
  )
}

export default App

import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { normalizeQuizAppearance } from './appearance'
import { db } from './firebaseClient'
import type { QuizModel } from '../types'

const QUIZ_DOC_PATH = ['quizzes', 'main'] as const

interface QuizDocument {
  quiz?: QuizModel
}

const quizDocRef = doc(db, ...QUIZ_DOC_PATH)

function parseQuizDocument(data: unknown): QuizModel | null {
  const document = data as QuizDocument | undefined
  const quiz = document?.quiz

  if (!quiz || !Array.isArray(quiz.nodes) || !Array.isArray(quiz.edges)) {
    return null
  }

  return normalizeQuizAppearance(quiz)
}

export async function loadCloudQuiz(): Promise<QuizModel | null> {
  const snapshot = await getDoc(quizDocRef)
  return snapshot.exists() ? parseQuizDocument(snapshot.data()) : null
}

export function watchCloudQuiz(
  onQuiz: (quiz: QuizModel) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    quizDocRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        return
      }

      const quiz = parseQuizDocument(snapshot.data())
      if (quiz) {
        onQuiz(quiz)
      }
    },
    (error) => onError(error),
  )
}

export async function publishCloudQuiz(quiz: QuizModel): Promise<void> {
  await setDoc(
    quizDocRef,
    {
      quiz: normalizeQuizAppearance(quiz),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

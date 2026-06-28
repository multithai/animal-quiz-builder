import { useCallback, useMemo, useRef, useState } from 'react'
import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  getSmoothStepPath,
  type Connection,
  type Edge as FlowEdge,
  type EdgeChange,
  type EdgeProps,
  type Node as FlowNode,
  type NodeChange,
  type NodePositionChange,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Download,
  Plus,
  RefreshCcw,
  Save,
  Settings2,
  Trash2,
  Upload,
  Workflow,
} from 'lucide-react'
import type {
  AnswerOption,
  QuestionNode,
  QuizAppearanceConfig,
  QuizModel,
  QuizNode,
  QuizEdge,
  ResultNode,
  ScoreDimension,
  ScoreEffect,
} from '../types'
import {
  findDimension,
  formatNumber,
  getNodeById,
  getQuestionNodes,
  getResultNodes,
  isQuestionNode,
  isResultNode,
} from '../lib/quizEngine'
import {
  FONT_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  getQuizAppearance,
  normalizeQuizAppearance,
} from '../lib/appearance'

interface AdminBuilderProps {
  quiz: QuizModel
  selectedNodeId: string | null
  onQuizChange: (quiz: QuizModel) => void
  onSelectedNodeChange: (nodeId: string | null) => void
  onResetSample: () => void
  onSave: () => void
}

interface QuestionFlowData extends Record<string, unknown> {
  node: QuestionNode
  dimensions: ScoreDimension[]
}

interface ResultFlowData extends Record<string, unknown> {
  node: ResultNode
  dimensions: ScoreDimension[]
}

interface RouteFlowData extends Record<string, unknown> {
  label: string
  selected: boolean
  onDelete: (edgeId: string) => void
  onSelect: (edgeId: string) => void
}

type QuestionGraphNode = FlowNode<QuestionFlowData, 'questionNode'>
type ResultGraphNode = FlowNode<ResultFlowData, 'resultNode'>
type RouteGraphEdge = FlowEdge<RouteFlowData, 'routeEdge'>

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

const MAX_RESULT_IMAGE_SIZE = 960
const RESULT_IMAGE_QUALITY = 0.82

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Unable to read image file'))
    reader.readAsDataURL(file)
  })
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to load image file'))
    image.src = dataUrl
  })
}

async function prepareResultImage(file: File): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(dataUrl)
  const scale = Math.min(1, MAX_RESULT_IMAGE_SIZE / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    return dataUrl
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', RESULT_IMAGE_QUALITY)
}

function scoreSummary(answer: AnswerOption, dimensions: ScoreDimension[]): string {
  if (answer.effects.length === 0) {
    return 'no score'
  }

  return answer.effects
    .map((effect) => {
      const dimension = findDimension(dimensions, effect.dimensionId)
      const mark = effect.operation === 'average' ? 'avg' : effect.operation === 'add' ? '+' : '='
      return `${dimension?.label ?? effect.dimensionId} ${mark}${effect.value}`
    })
    .join(' · ')
}

function QuestionCardNode({ data, selected }: NodeProps<QuestionGraphNode>) {
  return (
    <article className={`graph-node question-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} id="in" />
      <div className="node-kicker">Question</div>
      <h3>{data.node.title}</h3>
      <div className="graph-answer-list">
        {data.node.answers.map((answer) => (
          <div className="graph-answer-row" key={answer.id}>
            <span>{answer.label}</span>
            <small>{scoreSummary(answer, data.dimensions)}</small>
            <Handle className="answer-handle" type="source" position={Position.Right} id={answer.id} />
          </div>
        ))}
      </div>
    </article>
  )
}

function ResultCardNode({ data, selected }: NodeProps<ResultGraphNode>) {
  return (
    <article
      className={`graph-node result-node ${selected ? 'selected' : ''}`}
      style={{ ['--node-color' as string]: data.node.color }}
    >
      <Handle type="target" position={Position.Left} id="in" />
      <div className="result-node-visual">
        {data.node.imageUrl ? <img src={data.node.imageUrl} alt="" /> : <span>{data.node.emoji}</span>}
      </div>
      <div>
        <div className="node-kicker">Result</div>
        <h3>{data.node.title}</h3>
        <p>{data.node.subtitle}</p>
      </div>
    </article>
  )
}

const nodeTypes = {
  questionNode: QuestionCardNode,
  resultNode: ResultCardNode,
}

function RouteEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  selected,
  data,
}: EdgeProps<RouteGraphEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })
  const isSelected = selected || data?.selected

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} interactionWidth={40} />
      {isSelected ? (
        <EdgeLabelRenderer>
          <div
            className="route-edge-popup nodrag nopan"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <span>Route</span>
              <strong>{data?.label ?? 'route'}</strong>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                data?.onDelete(id)
              }}
              title="ลบเส้นนี้"
            >
              <Trash2 size={15} />
              ลบเส้นนี้
            </button>
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}

const edgeTypes = {
  routeEdge: RouteEdge,
}

export function AdminBuilder({
  quiz,
  selectedNodeId,
  onQuizChange,
  onSelectedNodeChange,
  onResetSample,
  onSave,
}: AdminBuilderProps) {
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

  const selectRouteEdge = useCallback(
    (edgeId: string) => {
      setSelectedEdgeId(edgeId)
      onSelectedNodeChange(null)
    },
    [onSelectedNodeChange],
  )

  const deleteRouteEdge = useCallback(
    (edgeId: string) => {
      onQuizChange({
        ...quiz,
        edges: quiz.edges.filter((edge) => edge.id !== edgeId),
      })
      setSelectedEdgeId((currentEdgeId) => (currentEdgeId === edgeId ? null : currentEdgeId))
    },
    [onQuizChange, quiz],
  )

  const flowNodes = useMemo<FlowNode[]>(() => {
    return quiz.nodes.map((node) => ({
      id: node.id,
      type: node.type === 'question' ? 'questionNode' : 'resultNode',
      position: node.position,
      data: {
        node,
        dimensions: quiz.scoring.dimensions,
      },
    }))
  }, [quiz.nodes, quiz.scoring.dimensions])

  const flowEdges = useMemo<FlowEdge[]>(() => {
    return quiz.edges.map((edge) => {
      const sourceNode = getNodeById(quiz, edge.sourceNodeId)
      const targetNode = getNodeById(quiz, edge.targetNodeId)
      const answerLabel = isQuestionNode(sourceNode)
        ? sourceNode.answers.find((answer) => answer.id === edge.sourceAnswerId)?.label
        : undefined

      return {
        id: edge.id,
        source: edge.sourceNodeId,
        sourceHandle: edge.sourceAnswerId,
        target: edge.targetNodeId,
        targetHandle: 'in',
        type: 'routeEdge',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {
          label: answerLabel ?? 'route',
          selected: edge.id === selectedEdgeId,
          onDelete: deleteRouteEdge,
          onSelect: selectRouteEdge,
        },
        interactionWidth: 34,
        selected: edge.id === selectedEdgeId,
        style: {
          stroke: edge.id === selectedEdgeId ? '#0b72ff' : isResultNode(targetNode) ? targetNode.color : '#1b7a6f',
          strokeWidth: edge.id === selectedEdgeId ? 3 : 2,
        },
      }
    })
  }, [deleteRouteEdge, quiz, selectRouteEdge, selectedEdgeId])

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const positionChanges = changes.filter(
        (change): change is NodePositionChange => change.type === 'position' && Boolean(change.position),
      )

      if (positionChanges.length === 0) {
        return
      }

      onQuizChange({
        ...quiz,
        nodes: quiz.nodes.map((node) => {
          const positionChange = positionChanges.find((change) => change.id === node.id)
          return positionChange?.type === 'position' && positionChange.position
            ? { ...node, position: positionChange.position }
            : node
        }),
      })
    },
    [onQuizChange, quiz],
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const removedEdgeIds = changes
        .filter((change) => change.type === 'remove')
        .map((change) => change.id)

      if (removedEdgeIds.length === 0) {
        return
      }

      if (selectedEdgeId && removedEdgeIds.includes(selectedEdgeId)) {
        setSelectedEdgeId(null)
      }

      onQuizChange({
        ...quiz,
        edges: quiz.edges.filter((edge) => !removedEdgeIds.includes(edge.id)),
      })
    },
    [onQuizChange, quiz, selectedEdgeId],
  )

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.sourceHandle || !connection.target) {
        return
      }

      const sourceNode = getNodeById(quiz, connection.source)
      const answerExists =
        isQuestionNode(sourceNode) &&
        sourceNode.answers.some((answer) => answer.id === connection.sourceHandle)

      if (!answerExists) {
        return
      }

      const nextEdge = {
        id: uid('edge'),
        sourceNodeId: connection.source,
        sourceAnswerId: connection.sourceHandle,
        targetNodeId: connection.target,
      }

      onQuizChange({
        ...quiz,
        edges: [
          ...quiz.edges.filter(
            (edge) =>
              !(
                edge.sourceNodeId === nextEdge.sourceNodeId &&
                edge.sourceAnswerId === nextEdge.sourceAnswerId
              ),
          ),
          nextEdge,
        ],
      })
      setSelectedEdgeId(nextEdge.id)
      onSelectedNodeChange(null)
    },
    [onQuizChange, onSelectedNodeChange, quiz],
  )

  function addQuestionNode() {
    const id = uid('q')
    const rightMost = Math.max(...quiz.nodes.map((node) => node.position.x), 0)
    const newNode: QuestionNode = {
      id,
      type: 'question',
      title: 'คำถามใหม่',
      position: { x: rightMost + 360, y: 80 },
      answers: [
        {
          id: uid('a'),
          label: 'คำตอบใหม่',
          effects: [],
        },
      ],
    }

    onQuizChange({
      ...quiz,
      startNodeId: quiz.startNodeId || id,
      nodes: [...quiz.nodes, newNode],
    })
    onSelectedNodeChange(id)
  }

  function addResultNode() {
    const id = uid('r')
    const profile = Object.fromEntries(
      quiz.scoring.dimensions.map((dimension) => [dimension.id, (dimension.min + dimension.max) / 2]),
    )
    const newNode: ResultNode = {
      id,
      type: 'result',
      title: 'ผลลัพธ์ใหม่',
      subtitle: 'คำอธิบายสั้น',
      description: 'ใส่รายละเอียดผลลัพธ์ที่นี่',
      emoji: '✨',
      color: '#1f8a70',
      profile,
      position: { x: 2400, y: 120 + getResultNodes(quiz).length * 210 },
    }

    onQuizChange({
      ...quiz,
      nodes: [...quiz.nodes, newNode],
    })
    onSelectedNodeChange(id)
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(quiz, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${quiz.id || 'quiz'}-config.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function importJson(file: File | undefined) {
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as QuizModel
        if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
          throw new Error('Invalid quiz file')
        }
        onQuizChange(normalizeQuizAppearance(parsed))
        onSelectedNodeChange(null)
      } catch {
        window.alert('ไฟล์ JSON นี้ไม่ใช่ quiz config ที่ถูกต้อง')
      }
    }
    reader.readAsText(file)
  }

  function resetToSample() {
    if (window.confirm('รีเซ็ตกลับเป็นตัวอย่างเริ่มต้นหรือไม่')) {
      onResetSample()
    }
  }

  return (
    <main className="admin-shell">
      <header className="admin-toolbar">
        <div className="toolbar-title">
          <Workflow size={19} />
          <div>
            <strong>{quiz.title}</strong>
            <span>{quiz.nodes.length} nodes · {quiz.edges.length} routes</span>
          </div>
        </div>
        <div className="toolbar-actions">
          <button className="tool-button" type="button" onClick={addQuestionNode} title="เพิ่มคำถาม">
            <Plus size={17} />
            คำถาม
          </button>
          <button className="tool-button" type="button" onClick={addResultNode} title="เพิ่มผลลัพธ์">
            <Plus size={17} />
            ผลลัพธ์
          </button>
          <button className="icon-button" type="button" onClick={onSave} title="บันทึกในเครื่อง">
            <Save size={17} />
          </button>
          <button className="icon-button" type="button" onClick={exportJson} title="Export JSON">
            <Download size={17} />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => importInputRef.current?.click()}
            title="Import JSON"
          >
            <Upload size={17} />
          </button>
          <button className="icon-button danger" type="button" onClick={resetToSample} title="รีเซ็ตตัวอย่าง">
            <RefreshCcw size={17} />
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(event) => importJson(event.currentTarget.files?.[0])}
          />
        </div>
      </header>

      <section className="admin-workbench">
        <div className="flow-canvas">
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onEdgeClick={(event, edge) => {
              event.stopPropagation()
              setSelectedEdgeId(edge.id)
              onSelectedNodeChange(null)
            }}
            onNodeClick={(_, node) => {
              setSelectedEdgeId(null)
              onSelectedNodeChange(node.id)
            }}
            onPaneClick={() => {
              setSelectedEdgeId(null)
              onSelectedNodeChange(null)
            }}
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background gap={18} size={1} />
            <Controls />
            <MiniMap pannable zoomable nodeStrokeWidth={3} />
          </ReactFlow>
        </div>
        <AdminInspector
          quiz={quiz}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          onQuizChange={onQuizChange}
          onSelectedNodeChange={onSelectedNodeChange}
          onSelectedEdgeChange={setSelectedEdgeId}
        />
      </section>
    </main>
  )
}

interface InspectorProps {
  quiz: QuizModel
  selectedNodeId: string | null
  selectedEdgeId: string | null
  onQuizChange: (quiz: QuizModel) => void
  onSelectedNodeChange: (nodeId: string | null) => void
  onSelectedEdgeChange: (edgeId: string | null) => void
}

function AdminInspector({
  quiz,
  selectedNodeId,
  selectedEdgeId,
  onQuizChange,
  onSelectedNodeChange,
  onSelectedEdgeChange,
}: InspectorProps) {
  const selectedNode = selectedNodeId ? getNodeById(quiz, selectedNodeId) : undefined
  const selectedEdge = selectedEdgeId ? quiz.edges.find((edge) => edge.id === selectedEdgeId) : undefined

  function replaceNode(nodeId: string, replacer: (node: QuizNode) => QuizNode): QuizModel {
    return {
      ...quiz,
      nodes: quiz.nodes.map((node) => (node.id === nodeId ? replacer(node) : node)),
    }
  }

  function deleteNode(nodeId: string) {
    const remainingNodes = quiz.nodes.filter((node) => node.id !== nodeId)
    const nextStart = remainingNodes.find(isQuestionNode)?.id ?? ''

    onQuizChange({
      ...quiz,
      startNodeId: quiz.startNodeId === nodeId ? nextStart : quiz.startNodeId,
      nodes: remainingNodes,
      edges: quiz.edges.filter(
        (edge) => edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId,
      ),
    })
    onSelectedNodeChange(null)
  }

  function deleteEdge(edgeId: string) {
    onQuizChange({
      ...quiz,
      edges: quiz.edges.filter((edge) => edge.id !== edgeId),
    })
    onSelectedEdgeChange(null)
  }

  if (selectedEdge) {
    return <RouteInspector quiz={quiz} edge={selectedEdge} onDelete={() => deleteEdge(selectedEdge.id)} />
  }

  if (isQuestionNode(selectedNode)) {
    return (
      <QuestionInspector
        quiz={quiz}
        node={selectedNode}
        replaceNode={replaceNode}
        deleteNode={deleteNode}
        onQuizChange={onQuizChange}
      />
    )
  }

  if (isResultNode(selectedNode)) {
    return (
      <ResultInspector
        quiz={quiz}
        node={selectedNode}
        replaceNode={replaceNode}
        deleteNode={deleteNode}
        onQuizChange={onQuizChange}
      />
    )
  }

  return <GlobalInspector quiz={quiz} onQuizChange={onQuizChange} />
}

interface RouteInspectorProps {
  quiz: QuizModel
  edge: QuizEdge
  onDelete: () => void
}

function RouteInspector({ quiz, edge, onDelete }: RouteInspectorProps) {
  const sourceNode = getNodeById(quiz, edge.sourceNodeId)
  const targetNode = getNodeById(quiz, edge.targetNodeId)
  const answerLabel = isQuestionNode(sourceNode)
    ? sourceNode.answers.find((answer) => answer.id === edge.sourceAnswerId)?.label
    : undefined
  const sourceTitle = isQuestionNode(sourceNode) ? sourceNode.title : 'ไม่พบคำถามต้นทาง'
  const targetTitle = targetNode ? targetNode.title : 'ไม่พบปลายทาง'

  return (
    <aside className="inspector">
      <InspectorHeader icon={<Workflow size={18} />} title="Route" subtitle={edge.id} />

      <section className="route-detail-card">
        <span>จากคำถาม</span>
        <strong>{sourceTitle}</strong>
      </section>

      <section className="route-detail-card">
        <span>คำตอบ</span>
        <strong>{answerLabel ?? edge.sourceAnswerId}</strong>
      </section>

      <section className="route-detail-card">
        <span>ไปยัง</span>
        <strong>{targetTitle}</strong>
        <small>{targetNode?.type ?? edge.targetNodeId}</small>
      </section>

      <button className="route-delete-action" type="button" onClick={onDelete}>
        <Trash2 size={17} />
        ลบเส้นนี้
      </button>

      <p className="hint-text">เลือกเส้น route แล้วกดปุ่มนี้เพื่อลบการเชื่อมโยงของคำตอบนั้น</p>
    </aside>
  )
}

interface NodeInspectorProps {
  quiz: QuizModel
  node: QuizNode
  replaceNode: (nodeId: string, replacer: (node: QuizNode) => QuizNode) => QuizModel
  deleteNode: (nodeId: string) => void
  onQuizChange: (quiz: QuizModel) => void
}

function QuestionInspector({
  quiz,
  node,
  replaceNode,
  deleteNode,
  onQuizChange,
}: NodeInspectorProps & { node: QuestionNode }) {
  function updateQuestion(patch: Partial<QuestionNode>) {
    onQuizChange(
      replaceNode(node.id, (item) => (isQuestionNode(item) ? { ...item, ...patch } : item)),
    )
  }

  function updateAnswer(answerId: string, updater: (answer: AnswerOption) => AnswerOption) {
    updateQuestion({
      answers: node.answers.map((answer) => (answer.id === answerId ? updater(answer) : answer)),
    })
  }

  function addAnswer() {
    updateQuestion({
      answers: [
        ...node.answers,
        {
          id: uid('a'),
          label: 'คำตอบใหม่',
          effects: [],
        },
      ],
    })
  }

  function removeAnswer(answerId: string) {
    onQuizChange({
      ...replaceNode(node.id, (item) =>
        isQuestionNode(item)
          ? { ...item, answers: item.answers.filter((answer) => answer.id !== answerId) }
          : item,
      ),
      edges: quiz.edges.filter(
        (edge) => !(edge.sourceNodeId === node.id && edge.sourceAnswerId === answerId),
      ),
    })
  }

  function removeRoute(answerId: string) {
    onQuizChange({
      ...quiz,
      edges: quiz.edges.filter(
        (edge) => !(edge.sourceNodeId === node.id && edge.sourceAnswerId === answerId),
      ),
    })
  }

  return (
    <aside className="inspector">
      <InspectorHeader
        icon={<Settings2 size={18} />}
        title="Question"
        subtitle={node.id}
        onDelete={() => deleteNode(node.id)}
      />

      <label className="field">
        <span>ข้อความคำถาม</span>
        <textarea value={node.title} onChange={(event) => updateQuestion({ title: event.currentTarget.value })} />
      </label>

      <label className="field">
        <span>note</span>
        <input
          value={node.note ?? ''}
          onChange={(event) => updateQuestion({ note: event.currentTarget.value })}
        />
      </label>

      <div className="inspector-section">
        <div className="section-heading">
          <span>Answers</span>
          <button className="mini-button" type="button" onClick={addAnswer}>
            <Plus size={15} />
            เพิ่ม
          </button>
        </div>

        {node.answers.map((answer) => {
          const route = quiz.edges.find(
            (edge) => edge.sourceNodeId === node.id && edge.sourceAnswerId === answer.id,
          )
          const targetNode = route ? getNodeById(quiz, route.targetNodeId) : undefined

          return (
            <article className="answer-editor" key={answer.id}>
              <div className="answer-editor-head">
                <input
                  value={answer.label}
                  onChange={(event) =>
                    updateAnswer(answer.id, (item) => ({
                      ...item,
                      label: event.currentTarget.value,
                    }))
                  }
                />
                <button
                  className="icon-button small danger"
                  type="button"
                  onClick={() => removeAnswer(answer.id)}
                  title="ลบคำตอบ"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="route-row">
                <span>route</span>
                <b>{targetNode ? `${targetNode.type}: ${targetNode.type === 'question' ? targetNode.title : targetNode.title}` : 'auto result'}</b>
                {route ? (
                  <button className="icon-button small" type="button" onClick={() => removeRoute(answer.id)} title="ลบเส้นทาง">
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>

              <div className="effect-editor-list">
                {answer.effects.map((effect, index) => (
                  <div className="effect-editor" key={`${effect.dimensionId}-${index}`}>
                    <select
                      value={effect.dimensionId}
                      onChange={(event) =>
                        updateAnswer(answer.id, (item) => ({
                          ...item,
                          effects: item.effects.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, dimensionId: event.currentTarget.value }
                              : entry,
                          ),
                        }))
                      }
                    >
                      {quiz.scoring.dimensions.map((dimension) => (
                        <option key={dimension.id} value={dimension.id}>
                          {dimension.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={effect.operation}
                      onChange={(event) =>
                        updateAnswer(answer.id, (item) => ({
                          ...item,
                          effects: item.effects.map((entry, entryIndex) =>
                            entryIndex === index
                              ? {
                                  ...entry,
                                  operation: event.currentTarget.value as ScoreEffect['operation'],
                                }
                              : entry,
                          ),
                        }))
                      }
                    >
                      <option value="average">average</option>
                      <option value="add">add</option>
                      <option value="set">set</option>
                    </select>
                    <input
                      type="number"
                      value={effect.value}
                      step="0.5"
                      onChange={(event) =>
                        updateAnswer(answer.id, (item) => ({
                          ...item,
                          effects: item.effects.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, value: Number(event.currentTarget.value) }
                              : entry,
                          ),
                        }))
                      }
                    />
                    <button
                      className="icon-button small"
                      type="button"
                      onClick={() =>
                        updateAnswer(answer.id, (item) => ({
                          ...item,
                          effects: item.effects.filter((_, entryIndex) => entryIndex !== index),
                        }))
                      }
                      title="ลบคะแนน"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                className="mini-button full"
                type="button"
                onClick={() =>
                  updateAnswer(answer.id, (item) => ({
                    ...item,
                    effects: [
                      ...item.effects,
                      {
                        dimensionId: quiz.scoring.dimensions[0]?.id ?? 'score',
                        value: 1,
                        operation: 'average',
                      },
                    ],
                  }))
                }
              >
                <Plus size={14} />
                เพิ่มคะแนน
              </button>
            </article>
          )
        })}
      </div>
    </aside>
  )
}

function ResultInspector({
  quiz,
  node,
  replaceNode,
  deleteNode,
  onQuizChange,
}: NodeInspectorProps & { node: ResultNode }) {
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  function updateResult(patch: Partial<ResultNode>) {
    onQuizChange(
      replaceNode(node.id, (item) => (isResultNode(item) ? { ...item, ...patch } : item)),
    )
  }

  async function uploadImage(file: File | undefined) {
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      window.alert('กรุณาเลือกไฟล์รูปภาพ')
      return
    }

    try {
      const imageUrl = await prepareResultImage(file)
      updateResult({ imageUrl })
    } catch {
      window.alert('อัปโหลดรูปไม่สำเร็จ ลองเลือกรูปใหม่อีกครั้ง')
    }
  }

  return (
    <aside className="inspector">
      <InspectorHeader
        icon={<Settings2 size={18} />}
        title="Result"
        subtitle={node.id}
        onDelete={() => deleteNode(node.id)}
      />

      <div className="result-preview" style={{ ['--result-color' as string]: node.color }}>
        <div className="result-preview-media">
          {node.imageUrl ? <img src={node.imageUrl} alt="" /> : <span>{node.emoji}</span>}
        </div>
        <b>{node.title}</b>
      </div>

      <label className="field">
        <span>ชื่อผลลัพธ์</span>
        <input value={node.title} onChange={(event) => updateResult({ title: event.currentTarget.value })} />
      </label>
      <label className="field">
        <span>subtitle</span>
        <input
          value={node.subtitle}
          onChange={(event) => updateResult({ subtitle: event.currentTarget.value })}
        />
      </label>
      <label className="field">
        <span>description</span>
        <textarea
          value={node.description}
          onChange={(event) => updateResult({ description: event.currentTarget.value })}
        />
      </label>

      <div className="field-grid two">
        <label className="field">
          <span>emoji</span>
          <input value={node.emoji} onChange={(event) => updateResult({ emoji: event.currentTarget.value })} />
        </label>
        <label className="field">
          <span>color</span>
          <input
            type="color"
            value={node.color}
            onChange={(event) => updateResult({ color: event.currentTarget.value })}
          />
        </label>
      </div>

      <div className="field image-upload-field">
        <span>result image</span>
        <div className="image-upload-row">
          <button className="tool-button" type="button" onClick={() => imageInputRef.current?.click()}>
            <Upload size={16} />
            อัปโหลดรูป
          </button>
          {node.imageUrl ? (
            <button className="mini-button danger" type="button" onClick={() => updateResult({ imageUrl: '' })}>
              <Trash2 size={14} />
              ลบรูป
            </button>
          ) : null}
        </div>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            void uploadImage(event.currentTarget.files?.[0])
            event.currentTarget.value = ''
          }}
        />
        <input
          value={node.imageUrl ?? ''}
          placeholder="วาง image URL หรืออัปโหลดไฟล์"
          onChange={(event) => updateResult({ imageUrl: event.currentTarget.value })}
        />
        <small>รูปที่อัปโหลดจะถูกย่ออัตโนมัติและบันทึกไว้ใน quiz config</small>
      </div>

      <div className="inspector-section">
        <div className="section-heading">
          <span>Result profile</span>
          <strong>{quiz.scoring.dimensions.length} dims</strong>
        </div>
        {quiz.scoring.dimensions.map((dimension) => {
          const value = node.profile[dimension.id] ?? (dimension.min + dimension.max) / 2
          return (
            <label className="range-field" key={dimension.id}>
              <span>
                {dimension.label}
                <b>{formatNumber(value)}</b>
              </span>
              <div>
                <input
                  type="range"
                  min={dimension.min}
                  max={dimension.max}
                  step="0.5"
                  value={value}
                  onChange={(event) =>
                    updateResult({
                      profile: {
                        ...node.profile,
                        [dimension.id]: Number(event.currentTarget.value),
                      },
                    })
                  }
                />
                <input
                  type="number"
                  min={dimension.min}
                  max={dimension.max}
                  step="0.5"
                  value={value}
                  onChange={(event) =>
                    updateResult({
                      profile: {
                        ...node.profile,
                        [dimension.id]: Number(event.currentTarget.value),
                      },
                    })
                  }
                />
              </div>
            </label>
          )
        })}
      </div>
    </aside>
  )
}

function GlobalInspector({ quiz, onQuizChange }: Pick<InspectorProps, 'quiz' | 'onQuizChange'>) {
  const appearance = getQuizAppearance(quiz)

  function updateAppearance(patch: Partial<QuizAppearanceConfig>) {
    onQuizChange({
      ...quiz,
      appearance: {
        ...appearance,
        ...patch,
      },
    })
  }

  function updateDimension(dimensionId: string, patch: Partial<ScoreDimension>) {
    onQuizChange({
      ...quiz,
      scoring: {
        ...quiz.scoring,
        dimensions: quiz.scoring.dimensions.map((dimension) =>
          dimension.id === dimensionId ? { ...dimension, ...patch } : dimension,
        ),
      },
    })
  }

  function addDimension() {
    const id = uid('dim')
    onQuizChange({
      ...quiz,
      scoring: {
        ...quiz.scoring,
        dimensions: [...quiz.scoring.dimensions, { id, label: 'มิติใหม่', min: 0, max: 3 }],
      },
      nodes: quiz.nodes.map((node) =>
        isResultNode(node)
          ? { ...node, profile: { ...node.profile, [id]: 1.5 } }
          : node,
      ),
    })
  }

  function removeDimension(dimensionId: string) {
    onQuizChange({
      ...quiz,
      scoring: {
        ...quiz.scoring,
        dimensions: quiz.scoring.dimensions.filter((dimension) => dimension.id !== dimensionId),
      },
      nodes: quiz.nodes.map((node) => {
        if (isQuestionNode(node)) {
          return {
            ...node,
            answers: node.answers.map((answer) => ({
              ...answer,
              effects: answer.effects.filter((effect) => effect.dimensionId !== dimensionId),
            })),
          }
        }

        if (isResultNode(node)) {
          const profile = { ...node.profile }
          delete profile[dimensionId]
          return { ...node, profile }
        }

        return node
      }),
    })
  }

  return (
    <aside className="inspector">
      <InspectorHeader icon={<Settings2 size={18} />} title="Quiz settings" subtitle="profile-distance" />

      <label className="field">
        <span>ชื่อ Quiz</span>
        <input
          value={quiz.title}
          onChange={(event) => onQuizChange({ ...quiz, title: event.currentTarget.value })}
        />
      </label>
      <label className="field">
        <span>description</span>
        <textarea
          value={quiz.description}
          onChange={(event) => onQuizChange({ ...quiz, description: event.currentTarget.value })}
        />
      </label>
      <label className="field">
        <span>คำถามเริ่มต้น</span>
        <select
          value={quiz.startNodeId}
          onChange={(event) => onQuizChange({ ...quiz, startNodeId: event.currentTarget.value })}
        >
          {getQuestionNodes(quiz).map((question) => (
            <option key={question.id} value={question.id}>
              {question.title}
            </option>
          ))}
        </select>
      </label>

      <div className="inspector-section">
        <div className="section-heading">
          <span>Typography</span>
          <strong>{Math.round(appearance.fontScale * 100)}%</strong>
        </div>
        <label className="field">
          <span>font</span>
          <select
            value={appearance.fontFamily}
            onChange={(event) =>
              updateAppearance({ fontFamily: event.currentTarget.value as QuizAppearanceConfig['fontFamily'] })
            }
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font.id} value={font.id}>
                {font.label}
              </option>
            ))}
          </select>
        </label>
        <label className="range-field">
          <span>
            ขนาดตัวอักษร
            <b>{Math.round(appearance.fontScale * 100)}%</b>
          </span>
          <div>
            <input
              type="range"
              min="0.85"
              max="1.25"
              step="0.05"
              value={appearance.fontScale}
              onChange={(event) => updateAppearance({ fontScale: Number(event.currentTarget.value) })}
            />
            <input
              type="number"
              min="0.85"
              max="1.25"
              step="0.05"
              value={appearance.fontScale}
              onChange={(event) => updateAppearance({ fontScale: Number(event.currentTarget.value) })}
            />
          </div>
        </label>
        <label className="field">
          <span>ความหนา</span>
          <select
            value={appearance.fontWeight}
            onChange={(event) => updateAppearance({ fontWeight: Number(event.currentTarget.value) })}
          >
            {FONT_WEIGHT_OPTIONS.map((weight) => (
              <option key={weight.value} value={weight.value}>
                {weight.label} ({weight.value})
              </option>
            ))}
          </select>
        </label>
        <div className="font-preview">
          <span>ตัวอย่าง</span>
          <strong>คุณมีสไตล์เหมือนสัตว์แบบไหน</strong>
          <small>ฟอนต์ ขนาด และความหนานี้จะใช้กับหน้าเล่น Quiz ด้วย</small>
        </div>
      </div>

      <div className="inspector-section">
        <div className="section-heading">
          <span>Score dimensions</span>
          <button className="mini-button" type="button" onClick={addDimension}>
            <Plus size={15} />
            เพิ่ม
          </button>
        </div>
        <div className="dimension-list">
          {quiz.scoring.dimensions.map((dimension) => (
            <article className="dimension-editor" key={dimension.id}>
              <input
                value={dimension.label}
                onChange={(event) => updateDimension(dimension.id, { label: event.currentTarget.value })}
              />
              <input
                type="number"
                value={dimension.min}
                onChange={(event) => updateDimension(dimension.id, { min: Number(event.currentTarget.value) })}
              />
              <input
                type="number"
                value={dimension.max}
                onChange={(event) => updateDimension(dimension.id, { max: Number(event.currentTarget.value) })}
              />
              <button
                className="icon-button small danger"
                type="button"
                onClick={() => removeDimension(dimension.id)}
                title="ลบมิติ"
              >
                <Trash2 size={14} />
              </button>
            </article>
          ))}
        </div>
      </div>
    </aside>
  )
}

interface InspectorHeaderProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  onDelete?: () => void
}

function InspectorHeader({ icon, title, subtitle, onDelete }: InspectorHeaderProps) {
  return (
    <div className="inspector-header">
      <div>
        {icon}
        <span>{title}</span>
      </div>
      <small>{subtitle}</small>
      {onDelete ? (
        <button className="icon-button small danger" type="button" onClick={onDelete} title="ลบ node">
          <Trash2 size={15} />
        </button>
      ) : null}
    </div>
  )
}

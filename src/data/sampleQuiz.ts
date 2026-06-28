import type {
  AnswerOption,
  QuestionNode,
  QuizEdge,
  QuizModel,
  ResultNode,
  ScoreDimension,
  ScoreEffect,
} from '../types'

const dimensions: ScoreDimension[] = [
  { id: 'social', label: 'สังคม', min: 0, max: 3 },
  { id: 'energy', label: 'พลังงาน', min: 0, max: 3 },
  { id: 'empathy', label: 'เมตตา', min: 0, max: 3 },
  { id: 'independence', label: 'อิสระ', min: 0, max: 3 },
  { id: 'logic', label: 'เหตุผล', min: 0, max: 3 },
  { id: 'leadership', label: 'นำทีม', min: 0, max: 3 },
  { id: 'adventure', label: 'ผจญภัย', min: 0, max: 3 },
  { id: 'patience', label: 'อดทน', min: 0, max: 3 },
  { id: 'style', label: 'ภาพลักษณ์', min: 0, max: 3 },
]

const effect = (
  dimensionId: string,
  value: number,
  operation: ScoreEffect['operation'] = 'average',
): ScoreEffect => ({
  dimensionId,
  value,
  operation,
})

const answer = (id: string, label: string, effects: ScoreEffect[]): AnswerOption => ({
  id,
  label,
  effects,
})

const question = (
  id: string,
  title: string,
  x: number,
  y: number,
  answers: AnswerOption[],
): QuestionNode => ({
  id,
  type: 'question',
  title,
  position: { x, y },
  answers,
})

const result = (
  id: string,
  title: string,
  emoji: string,
  color: string,
  profile: ResultNode['profile'],
  subtitle: string,
  description: string,
  x: number,
  y: number,
): ResultNode => ({
  id,
  type: 'result',
  title,
  subtitle,
  description,
  emoji,
  color,
  profile,
  position: { x, y },
})

const questions: QuestionNode[] = [
  question('q1', 'เวลาอยู่ในงานที่มีคนเยอะ คุณมักทำอะไรเป็นอันดับแรก', 0, 0, [
    answer('a1', 'เปิดวงคุยและทำให้บรรยากาศคึกคัก', [
      effect('social', 3),
      effect('energy', 3),
      effect('leadership', 2),
    ]),
    answer('a2', 'คุยกับกลุ่มเล็กๆ ที่รู้สึกสบายใจ', [
      effect('social', 2),
      effect('empathy', 2),
      effect('patience', 2),
    ]),
    answer('a3', 'สังเกตภาพรวมก่อนค่อยเข้าไปร่วมวง', [
      effect('social', 0),
      effect('logic', 2),
      effect('independence', 2),
    ]),
  ]),
  question('q2', 'แผนที่วางไว้เปลี่ยนกะทันหัน คุณจะรับมือแบบไหน', 360, 0, [
    answer('a1', 'ปรับแผนเร็วแล้วชวนคนอื่นไปต่อ', [
      effect('energy', 3),
      effect('adventure', 3),
      effect('leadership', 2),
    ]),
    answer('a2', 'ค่อยๆ จัดลำดับใหม่ให้ทุกคนโอเค', [
      effect('logic', 2),
      effect('empathy', 2),
      effect('patience', 3),
    ]),
    answer('a3', 'แยกไปทำตามแผนสำรองของตัวเอง', [
      effect('independence', 3),
      effect('logic', 2),
      effect('social', 0),
    ]),
  ]),
  question('q3', 'ถ้าเพื่อนร่วมทีมทำพลาดจนงานสะดุด คุณจะ', 720, 0, [
    answer('a1', 'ช่วยแก้และให้กำลังใจทันที', [
      effect('empathy', 3),
      effect('social', 2),
      effect('patience', 3),
    ]),
    answer('a2', 'วิเคราะห์สาเหตุแล้วแบ่งงานใหม่', [
      effect('logic', 3),
      effect('leadership', 2),
      effect('patience', 2),
    ]),
    answer('a3', 'พูดตรงๆ ว่าต้องรับผิดชอบให้ชัด', [
      effect('leadership', 3),
      effect('energy', 2),
      effect('empathy', 0),
    ]),
  ]),
  question('q4', 'เวลาตัดสินใจเรื่องสำคัญ คุณเชื่ออะไรมากที่สุด', 1080, 0, [
    answer('a1', 'ข้อมูลและเหตุผลที่ตรวจสอบได้', [
      effect('logic', 3),
      effect('patience', 2),
      effect('style', 0),
    ]),
    answer('a2', 'สัญชาตญาณกับจังหวะของสถานการณ์', [
      effect('adventure', 3),
      effect('independence', 2),
      effect('energy', 2),
    ]),
    answer('a3', 'ผลกระทบต่อคนที่เกี่ยวข้อง', [
      effect('empathy', 3),
      effect('social', 2),
      effect('leadership', 1),
    ]),
  ]),
  question('q5', 'วันหยุดที่ดีที่สุดสำหรับคุณคือ', 1440, 0, [
    answer('a1', 'ออกไปเจอที่ใหม่ๆ แบบไม่ต้องกำหนดแน่น', [
      effect('adventure', 3),
      effect('energy', 3),
      effect('independence', 2),
    ]),
    answer('a2', 'พักเงียบๆ ทำสิ่งที่ชอบตามจังหวะตัวเอง', [
      effect('independence', 3),
      effect('patience', 2),
      effect('social', 0),
    ]),
    answer('a3', 'นัดคนสนิทมากินข้าวหรือทำกิจกรรมร่วมกัน', [
      effect('social', 3),
      effect('empathy', 2),
      effect('style', 2),
    ]),
  ]),
  question('q6', 'เมื่อเจอคนใหม่ คุณมักจะ', 1800, 0, [
    answer('a1', 'เริ่มบทสนทนาได้เองไม่ยาก', [
      effect('social', 3),
      effect('style', 2),
      effect('energy', 2),
    ]),
    answer('a2', 'รอให้มีจังหวะที่เป็นธรรมชาติ', [
      effect('patience', 3),
      effect('empathy', 2),
      effect('social', 1),
    ]),
    answer('a3', 'คุยเฉพาะเรื่องที่จำเป็นก่อน', [
      effect('logic', 3),
      effect('independence', 2),
      effect('social', 0),
    ]),
  ]),
  question('q7', 'เห็นคนแปลกหน้าต้องการความช่วยเหลือ คุณจะ', 0, 340, [
    answer('a1', 'เข้าไปช่วยจนแน่ใจว่าเขาปลอดภัย', [
      effect('empathy', 3),
      effect('patience', 3),
      effect('social', 2),
    ]),
    answer('a2', 'ช่วยเท่าที่ทำได้แล้วส่งต่อให้คนที่เหมาะกว่า', [
      effect('logic', 2),
      effect('empathy', 2),
      effect('leadership', 1),
    ]),
    answer('a3', 'ระวังตัวก่อน ถ้าไม่ชัวร์จะไม่เข้าไปยุ่ง', [
      effect('independence', 3),
      effect('logic', 2),
      effect('empathy', 0),
    ]),
  ]),
  question('q8', 'ต้องร่วมงานกับคนที่คุณไม่ค่อยถูกชะตา คุณจะ', 360, 340, [
    answer('a1', 'วางตัวมืออาชีพและโฟกัสงาน', [
      effect('logic', 3),
      effect('patience', 3),
      effect('empathy', 1),
    ]),
    answer('a2', 'พยายามเปิดใจหาเรื่องที่คุยกันได้', [
      effect('social', 2),
      effect('empathy', 3),
      effect('patience', 2),
    ]),
    answer('a3', 'แบ่งขอบเขตให้ชัดเพื่อลดการปะทะ', [
      effect('independence', 3),
      effect('leadership', 2),
      effect('social', 0),
    ]),
  ]),
  question('q9', 'ถ้าต้องเลือกกิจกรรมกลางคืน คุณชอบแบบไหน', 720, 340, [
    answer('a1', 'เดินเล่นในที่สงบ ได้คิดอะไรเรื่อยๆ', [
      effect('patience', 3),
      effect('logic', 2),
      effect('independence', 2),
    ]),
    answer('a2', 'ไปที่ที่มีดนตรี คนเยอะ และพลังดี', [
      effect('social', 3),
      effect('energy', 3),
      effect('style', 3),
    ]),
    answer('a3', 'ขับรถหรือเดินทางไปจุดใหม่แบบฉับพลัน', [
      effect('adventure', 3),
      effect('independence', 2),
      effect('energy', 2),
    ]),
  ]),
  question('q10', 'ถ้าคุณต้องเลือกคนเข้าทีม คุณให้ค่าน้ำหนักกับอะไร', 1080, 340, [
    answer('a1', 'ความรับผิดชอบและทำงานเข้าระบบ', [
      effect('logic', 3),
      effect('patience', 3),
      effect('leadership', 1),
    ]),
    answer('a2', 'พลัง ความมั่นใจ และการสื่อสาร', [
      effect('energy', 3),
      effect('leadership', 3),
      effect('social', 2),
    ]),
    answer('a3', 'ความคิดสร้างสรรค์และมุมมองไม่เหมือนใคร', [
      effect('adventure', 2),
      effect('independence', 3),
      effect('style', 2),
    ]),
  ]),
  question('q11', 'ถ้าคุณกับเพื่อนอยากได้โอกาสเดียวกัน คุณจะ', 1440, 340, [
    answer('a1', 'แข่งขันเต็มที่แต่รักษาความสัมพันธ์', [
      effect('leadership', 2),
      effect('empathy', 2),
      effect('energy', 2),
    ]),
    answer('a2', 'ถอยให้ถ้าเห็นว่าเพื่อนเหมาะกว่า', [
      effect('empathy', 3),
      effect('patience', 3),
      effect('leadership', 0),
    ]),
    answer('a3', 'ลุยสุดทาง เพราะโอกาสต้องคว้าเอง', [
      effect('leadership', 3),
      effect('independence', 3),
      effect('empathy', 0),
    ]),
  ]),
  question('q12', 'งานอาสาหรือการช่วยส่วนรวมสำหรับคุณคือ', 1800, 340, [
    answer('a1', 'สิ่งที่ทำได้เรื่อยๆ ถ้ามีแรงและเวลา', [
      effect('empathy', 3),
      effect('patience', 2),
      effect('social', 2),
    ]),
    answer('a2', 'ทำเป็นครั้งคราวเมื่อบทบาทชัดเจน', [
      effect('logic', 2),
      effect('empathy', 1),
      effect('patience', 2),
    ]),
    answer('a3', 'ไม่ใช่แนวหลัก ชอบทุ่มให้เป้าหมายส่วนตัวมากกว่า', [
      effect('independence', 3),
      effect('leadership', 2),
      effect('empathy', 0),
    ]),
  ]),
]

const results: ResultNode[] = [
  result(
    'r-dolphin',
    'โลมา',
    '🐬',
    '#188c8c',
    { social: 3, energy: 3, empathy: 3, independence: 1, logic: 1, leadership: 2, adventure: 2, patience: 1, style: 3 },
    'นักเชื่อมผู้คน',
    'คุณรับพลังจากผู้คนรอบตัวและทำให้บรรยากาศเบาขึ้นได้เร็ว จุดแข็งคือความเป็นมิตรและความคล่องตัวทางสังคม',
    2260,
    -40,
  ),
  result(
    'r-fox',
    'จิ้งจอก',
    '🦊',
    '#d36c2f',
    { social: 1, energy: 2, empathy: 1, independence: 3, logic: 3, leadership: 1, adventure: 2, patience: 2, style: 2 },
    'นักวางแผนเงียบ',
    'คุณชอบมองหลายชั้นก่อนลงมือ มีความยืดหยุ่นสูง และมักหาทางออกที่คนอื่นยังไม่เห็น',
    2580,
    -40,
  ),
  result(
    'r-lion',
    'สิงโต',
    '🦁',
    '#c89422',
    { social: 2, energy: 3, empathy: 1, independence: 2, logic: 2, leadership: 3, adventure: 2, patience: 1, style: 3 },
    'ผู้นำที่ชัดเจน',
    'คุณเดินหน้าเร็ว กล้าตัดสินใจ และทำให้คนอื่นรู้ทิศทาง จุดที่ควรดูแลคือการฟังเสียงที่เบากว่าในทีม',
    2260,
    180,
  ),
  result(
    'r-elephant',
    'ช้าง',
    '🐘',
    '#6f7f8f',
    { social: 2, energy: 1, empathy: 3, independence: 1, logic: 3, leadership: 2, adventure: 0, patience: 3, style: 1 },
    'เสาหลักที่ใจเย็น',
    'คุณมั่นคง รอบคอบ และเป็นที่พึ่งได้ดีในวันที่คนอื่นกำลังแกว่ง การตัดสินใจของคุณมักผ่านการชั่งน้ำหนักอย่างจริงจัง',
    2580,
    180,
  ),
  result(
    'r-horse',
    'ม้า',
    '🐎',
    '#a66a3f',
    { social: 2, energy: 3, empathy: 2, independence: 2, logic: 2, leadership: 2, adventure: 3, patience: 1, style: 2 },
    'นักเดินทางใจกล้า',
    'คุณชอบการเคลื่อนไหวและพื้นที่ให้เลือกทางของตัวเอง มีแรงผลักดันสูงเมื่อเป้าหมายชัด',
    2260,
    400,
  ),
  result(
    'r-deer',
    'กวาง',
    '🦌',
    '#8a7a3f',
    { social: 1, energy: 1, empathy: 3, independence: 2, logic: 1, leadership: 0, adventure: 1, patience: 3, style: 2 },
    'ผู้รับรู้อารมณ์ละเอียด',
    'คุณจับสัญญาณของคนรอบตัวเก่งและให้ค่ากับความสงบ ความอ่อนโยนของคุณช่วยให้พื้นที่รอบตัวน่าอยู่ขึ้น',
    2580,
    400,
  ),
  result(
    'r-octopus',
    'หมึก',
    '🐙',
    '#7c4d96',
    { social: 1, energy: 2, empathy: 1, independence: 3, logic: 3, leadership: 1, adventure: 3, patience: 2, style: 2 },
    'นักแก้ปัญหาหลายทาง',
    'คุณคิดเร็วและต่อยอดไอเดียได้หลายทิศ เมื่อเจอข้อจำกัด คุณมักเปลี่ยนมันให้เป็นเกมทดลองใหม่',
    2260,
    620,
  ),
  result(
    'r-eagle',
    'อินทรี',
    '🦅',
    '#3f6fa6',
    { social: 1, energy: 3, empathy: 1, independence: 3, logic: 2, leadership: 3, adventure: 3, patience: 0, style: 2 },
    'ผู้มองไกล',
    'คุณชอบเป้าหมายที่ท้าทายและไม่กลัวการตัดสินใจใหญ่ๆ พลังของคุณอยู่ที่ภาพรวมและความกล้าเริ่ม',
    2580,
    620,
  ),
  result(
    'r-owl',
    'นกฮูก',
    '🦉',
    '#4d6470',
    { social: 0, energy: 0, empathy: 2, independence: 3, logic: 3, leadership: 1, adventure: 1, patience: 3, style: 1 },
    'นักสังเกตลุ่มลึก',
    'คุณไม่รีบตัดสินและมักเห็นรายละเอียดที่คนอื่นข้ามไป ความนิ่งทำให้คุณเป็นคนวิเคราะห์สถานการณ์ได้ดี',
    2260,
    840,
  ),
  result(
    'r-cat',
    'แมว',
    '🐈',
    '#b65b7a',
    { social: 1, energy: 1, empathy: 1, independence: 3, logic: 2, leadership: 0, adventure: 1, patience: 2, style: 3 },
    'ผู้รักจังหวะของตัวเอง',
    'คุณเลือกใช้พลังกับสิ่งที่มีความหมายจริงๆ และมีรสนิยมชัด ความเป็นตัวเองคือเสน่ห์หลักของคุณ',
    2580,
    840,
  ),
]

const makeStepEdges = (from: QuestionNode, to: QuestionNode): QuizEdge[] =>
  from.answers.map((item) => ({
    id: `${from.id}-${item.id}-${to.id}`,
    sourceNodeId: from.id,
    sourceAnswerId: item.id,
    targetNodeId: to.id,
  }))

const edges: QuizEdge[] = questions.flatMap((item, index) => {
  const next = questions[index + 1]
  return next ? makeStepEdges(item, next) : []
})

export const sampleQuiz: QuizModel = {
  id: 'animal-profile-builder',
  title: 'คุณมีสไตล์เหมือนสัตว์แบบไหน',
  description: 'ตอบคำถามสั้นๆ แล้วระบบจะเทียบโปรไฟล์นิสัยของคุณกับผลลัพธ์ที่ใกล้ที่สุด',
  startNodeId: 'q1',
  scoring: {
    mode: 'profile-distance',
    dimensions,
  },
  appearance: {
    fontFamily: 'noto-sans-thai',
    fontScale: 1,
    fontWeight: 500,
  },
  nodes: [...questions, ...results],
  edges,
}

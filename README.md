# Animal Quiz Builder

ระบบทำ quiz แบบ personality profile พร้อมหลังบ้านสำหรับลาก graph เชื่อมเส้นทางคำตอบ

## Run

```bash
npm.cmd install
npm.cmd run dev
```

เปิดที่ `http://127.0.0.1:5173/`

## What Is Included

- โหมดเล่น quiz พร้อมหน้าผลลัพธ์
- โหมดหลังบ้านด้วย React Flow สำหรับลากเส้นจากคำตอบไปยังคำถามหรือผลลัพธ์
- Score effects ต่อคำตอบแบบ `average`, `add`, และ `set`
- Result profile matching ด้วยสูตร `Σ |คะแนนผู้เล่น - โปรไฟล์ผลลัพธ์|`
- Inspector สำหรับแก้คำถาม, คำตอบ, route, score dimensions, result profiles
- Import/export JSON และบันทึกอัตโนมัติใน `localStorage`

## Key Files

- `src/data/sampleQuiz.ts` sample quiz และ result profiles
- `src/lib/quizEngine.ts` scoring, ranking, route lookup
- `src/components/QuizPlayer.tsx` หน้าเล่น quiz
- `src/components/AdminBuilder.tsx` หลังบ้าน graph editor

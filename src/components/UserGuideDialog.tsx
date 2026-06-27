import {
  BookOpen,
  CheckCircle2,
  GitBranch,
  MousePointerClick,
  Play,
  Share2,
  SlidersHorizontal,
  X,
} from 'lucide-react'

interface UserGuideDialogProps {
  open: boolean
  onClose: () => void
}

const workflowSteps = [
  'ตั้งค่า Quiz settings: ชื่อ Quiz, description, คำถามเริ่มต้น และ score dimensions',
  'สร้าง Result nodes: กำหนดชื่อผลลัพธ์ emoji สี คำอธิบาย และ result profile ของแต่ละมิติ',
  'สร้าง Question nodes: ใส่ข้อความคำถาม คำตอบ และคะแนนที่คำตอบนั้นส่งผล',
  'ลากเส้น route: ลากจากจุดด้านขวาของคำตอบ ไปยังคำถามถัดไปหรือผลลัพธ์',
  'กด เล่น Quiz เพื่อทดสอบ flow และดูหน้าผลลัพธ์จริง',
]

export function UserGuideDialog({ open, onClose }: UserGuideDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div className="guide-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="guide-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="guide-header">
          <div>
            <BookOpen size={22} />
            <div>
              <h2 id="guide-title">คู่มือการใช้งาน Animal Quiz Builder</h2>
              <p>วิธีทำ quiz, ตั้งคะแนน, ลาก graph และทดสอบก่อนเผยแพร่</p>
            </div>
          </div>
          <button className="icon-button ghost" type="button" onClick={onClose} title="ปิดคู่มือ">
            <X size={20} />
          </button>
        </header>

        <div className="guide-content">
          <section className="guide-section">
            <h3>
              <GitBranch size={18} />
              โครงหน้าจอหลังบ้าน
            </h3>
            <div className="guide-grid">
              <article>
                <b>Canvas กลาง</b>
                <p>พื้นที่ลาก node และเส้น route ระหว่างคำตอบ คำถาม และผลลัพธ์ ใช้เมาส์ลาก node เพื่อจัดตำแหน่งได้</p>
              </article>
              <article>
                <b>Toolbar ด้านบน</b>
                <p>เพิ่มคำถาม เพิ่มผลลัพธ์ บันทึก Export JSON Import JSON และรีเซ็ตกลับตัวอย่าง</p>
              </article>
              <article>
                <b>Inspector ด้านขวา</b>
                <p>คลิก node เพื่อแก้รายละเอียด ถ้าคลิกพื้นที่ว่างจะกลับไปแก้ Quiz settings และ score dimensions</p>
              </article>
            </div>
          </section>

          <section className="guide-section">
            <h3>
              <CheckCircle2 size={18} />
              ลำดับการทำงานที่แนะนำ
            </h3>
            <ol className="guide-steps">
              {workflowSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="guide-section">
            <h3>
              <SlidersHorizontal size={18} />
              วิธีตั้งคะแนน
            </h3>
            <div className="guide-grid">
              <article>
                <b>average</b>
                <p>ใช้ค่าเฉลี่ยระหว่างคะแนนเดิมกับค่าคำตอบ เหมาะกับ quiz บุคลิกภาพที่ค่อยๆ ปรับโปรไฟล์</p>
              </article>
              <article>
                <b>add</b>
                <p>บวกคะแนนเพิ่มจากค่าปัจจุบัน เหมาะกับระบบสะสมแต้ม</p>
              </article>
              <article>
                <b>set</b>
                <p>ตั้งค่ามิตินั้นเป็นค่าที่กำหนดทันที เหมาะกับคำตอบที่ต้องล็อกค่าสำคัญ</p>
              </article>
            </div>
            <p className="guide-note">ระบบเลือกผลลัพธ์โดยหา Result profile ที่ใกล้คะแนนผู้เล่นที่สุดด้วยสูตร Σ |คะแนนผู้เล่น - โปรไฟล์ผลลัพธ์|</p>
          </section>

          <section className="guide-section">
            <h3>
              <MousePointerClick size={18} />
              การลากเส้น route
            </h3>
            <p>ใน Question node แต่ละคำตอบจะมีจุดเชื่อมทางขวา ให้ลากจากจุดนั้นไปยังด้านซ้ายของ Question หรือ Result ที่ต้องการ ถ้าคำตอบไม่มี route ระบบจะเล่นต่อจนจบแล้วคำนวณผลลัพธ์จากคะแนนอัตโนมัติ</p>
          </section>

          <section className="guide-section">
            <h3>
              <Play size={18} />
              การทดสอบและเผยแพร่
            </h3>
            <p>กด เล่น Quiz เพื่อทดลอง flow เหมือนผู้ใช้จริง หลังแก้ไขระบบจะบันทึกลง localStorage อัตโนมัติ และสามารถ Export JSON เก็บ backup ได้ เมื่อ push ขึ้น GitHub แล้ว GitHub Pages จะ deploy ใหม่ผ่าน workflow อัตโนมัติ</p>
          </section>

          <section className="guide-section">
            <h3>
              <Share2 size={18} />
              การแชร์ผลลัพธ์
            </h3>
            <p>หน้าผลลัพธ์มีปุ่ม IG Story, Facebook Story และดาวน์โหลด ระบบจะสร้างภาพ Story ขนาด 1080x1920 จากผลลัพธ์ ถ้า browser รองรับ Web Share API จะเปิดหน้าแชร์ของมือถือ ถ้าไม่รองรับจะดาวน์โหลดภาพแทน</p>
          </section>
        </div>
      </section>
    </div>
  )
}

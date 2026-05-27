# ReceiptFlow - ระบบจัดการใบเสร็จ + LINE Bot

> แรงบันดาลใจจาก Paypers.ai

## ฟีเจอร์

- Landing Page ครบครัน (Hero, Features, Pricing, FAQ)
- Dashboard จัดการใบเสร็จ (Sidebar, Stats, ตารางรายการ)
- LINE Bot รับข้อความ/รูปใบเสร็จ/ไฟล์ PDF และตอบกลับอัตโนมัติ
- OCR อ่านใบเสร็จด้วย AI (OpenAI GPT-4o Vision)
- Export CSV

## โครงสร้างไฟล์

- index.html - Landing Page
- dashboard.html - Dashboard
- style.css - CSS ทั้งหมด
- app.js - Frontend JavaScript
- server.js - Express + LINE Webhook Server
- linebot.js - Logic หลัก LINE Bot
- package.json - Node.js Dependencies
- .env.example - Environment Variables template

## LINE Bot - คำสั่ง

- พิมพ์ "ค่ากาแฟ 65 บาท" -> บันทึกอัตโนมัติ
- ส่งรูปใบเสร็จ -> AI อ่านข้อมูลให้
- /รายงาน -> สรุปค่าใช้จ่าย
- /รายการ -> ดูรายการล่าสุด
- /ลบล่าสุด -> ลบรายการล่าสุด
- /ช่วยเหลือ -> ดูคำสั่งทั้งหมด

## วิธีติดตั้ง LINE Bot

ขั้นตอนที่ 1 - ติดตั้ง dependencies
npm install

ขั้นตอนที่ 2 - ตั้งค่า .env
cp .env.example .env
แก้ไขใส่ LINE_CHANNEL_SECRET และ LINE_CHANNEL_ACCESS_TOKEN

ขั้นตอนที่ 3 - รัน server
npm run dev

ขั้นตอนที่ 4 - เปิด Webhook ด้วย ngrok
npx ngrok http 3000
นำ URL ที่ได้ไปใส่ใน LINE Developers Console

## วิธีสมัคร LINE Messaging API

1. ไปที่ https://developers.line.biz/
2. สร้าง Provider และ Channel (Messaging API)
3. คัดลอก Channel secret และ Channel access token
4. ใส่ค่าใน .env

## เทคโนโลยี

- Frontend: HTML5, CSS3 (Flexbox/Grid/CSS Variables), JavaScript ES6+
- Backend: Node.js, Express.js, @line/bot-sdk
- AI/OCR: OpenAI GPT-4o Vision API
- LINE: Messaging API, LIFF SDK, Flex Message

## สิ่งที่เรียนรู้จาก Paypers.ai

โครงสร้าง Landing Page: Hero -> Stats -> ปัญหา -> วิธีแก้ -> ฟีเจอร์ -> ราคา -> CTA

LINE Bot Architecture:
- Webhook-based: LINE ส่ง Event มาที่ Server เมื่อมีข้อความ
- Flex Message: การ์ดสวยงาม คลิกได้ใน LINE
- Reply vs Push: replyMessage ใช้ replyToken, pushMessage ใช้ userId
- LIFF: เปิดหน้าเว็บภายใน LINE App

## แนวทางพัฒนาต่อ

- Database (MongoDB Atlas)
- Google Sheets API sync
- Rich Menu ใน LINE
- LIFF Page สำหรับดูรายงาน
- Multi-user / Multi-business
- Deploy บน Railway / Render

## License

MIT License | สร้างโดย nan27011999-tech | แรงบันดาลใจจาก paypers.ai

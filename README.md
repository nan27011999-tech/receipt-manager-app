# ReceiptFlow - ระบบจัดการใบเสร็จอัตโนมัติ

> แรงบันดาลใจจาก Paypers.ai - ระบบจัดการค่าใช้จ่ายและใบเสร็จสำหรับธุรกิจรุ่นใหม่

## ฟีเจอร์หลัก

- Landing Page - หน้าเว็บนำเสนอผลิตภัณฑ์ครบครัน มี Hero, Features, Pricing และ FAQ
- Dashboard - แดชบอร์ดจัดการใบเสร็จ มี Sidebar, Stats Cards และตารางรายการ
- อัปโหลดใบเสร็จ - Modal อัปโหลดไฟล์พร้อม Drag & Drop
- บันทึกด้วยตนเอง - พิมพ์ เช่น "ค่ากาแฟ 65 บาท" แล้วระบบ parse อัตโนมัติ
- Export CSV - ดาวน์โหลดรายการค่าใช้จ่ายเป็นไฟล์ CSV/Excel
- Responsive Design - รองรับทั้ง Desktop และ Mobile

## โครงสร้างไฟล์

- index.html - Landing Page หน้าหลักนำเสนอระบบ
- dashboard.html - Dashboard จัดการใบเสร็จและค่าใช้จ่าย
- style.css - CSS Stylesheet ทั้งหมด
- app.js - JavaScript หลักสำหรับ Logic ต่างๆ

## วิธีรันโปรเจกต์

1. Clone repository
2. เปิดไฟล์ index.html ในเบราว์เซอร์ หรือใช้ VS Code Live Server

## เทคโนโลยีที่ใช้

- HTML5 - โครงสร้างหน้าเว็บ
- CSS3 - Styling, Flexbox, Grid, CSS Variables
- JavaScript ES6+ - Logic, DOM Manipulation, Data Management

## สิ่งที่เรียนรู้จาก Paypers.ai

### โครงสร้าง UI/UX
- Landing Page Pattern: Hero -> Stats -> Problem -> Solution -> Features -> Pricing -> CTA
- Dashboard Layout: Fixed Sidebar + Scrollable Main Content
- Card-based Design: Shadow, Border Radius, Spacing ที่สม่ำเสมอ
- Color System: Primary dark + Accent blue/green/orange

### Component ที่น่าสนใจ
- Stats Cards พร้อม Counter Animation
- Upload Modal พร้อม Drag and Drop
- FAQ Accordion
- Responsive Sidebar Navigation
- Badge Status (จ่ายแล้ว/รอจ่าย)
- Filter Table แบบ Dynamic

## แนวทางพัฒนาต่อ

- เชื่อมต่อ Backend API (Node.js / Python / Go)
- เพิ่ม AI OCR อ่านใบเสร็จอัตโนมัติ (Google Cloud Vision)
- เชื่อมต่อ Google Drive & Sheets API
- ระบบ Login/Register (Authentication)
- Chart แสดงกราฟค่าใช้จ่ายรายเดือน
- Export เป็น PDF
- รองรับหลายบริษัท (Multi-tenant)
- LINE Bot Integration
- Progressive Web App (PWA)

## License

MIT License - ใช้ได้ฟรี แก้ไขและพัฒนาต่อได้

สร้างโดย nan27011999-tech

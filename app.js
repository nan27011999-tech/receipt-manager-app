/**
 * ReceiptFlow App.js - ระบบจัดการใบเสร็จ
 */

const ReceiptApp = {
  receipts: [
    { id: 'RF-001', date: '2026-05-01', type: 'ใบกำกับภาษี', store: 'ร้านสยามวิทยุ', description: 'ค่าสำนักงาน', amount: 1887, status: 'paid', requestedBy: 'ผู้ใช้' },
    { id: 'RF-002', date: '2026-05-01', type: 'ใบกำกับภาษี', store: 'บ. สยามโกลบอล จำกัด', description: 'ค่าอุปกรณ์', amount: 638, status: 'paid', requestedBy: 'ผู้ใช้' }
  ],

  formatCurrency(amount) {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
  },

  formatThaiDate(dateStr) {
    const d = new Date(dateStr);
    const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + (d.getFullYear() + 543);
  },

  getMonthlyTotal() {
    const now = new Date();
    return this.receipts
      .filter(r => { const d = new Date(r.date); return d.getMonth() === now.getMonth(); })
      .reduce((s, r) => s + r.amount, 0);
  },

  addReceipt(data) {
    const r = { id: 'RF-' + String(this.receipts.length + 1).padStart(3,'0'), date: data.date || new Date().toISOString().split('T')[0], ...data, status: 'pending' };
    this.receipts.push(r);
    this.renderTable();
    this.updateStats();
    return r;
  },

  parseText(text) {
    const m = text.match(/\d+(\.\d+)?/);
    return { description: text.replace(/\d+(\.\d+)?(\s*บาท)?/g,'').trim() || text, amount: m ? parseFloat(m[0]) : 0, store: 'พิมพ์เอง', type: 'บันทึกเอง', date: new Date().toISOString().split('T')[0] };
  },

  renderTable() {
    const tbody = document.getElementById('receiptTableBody');
    if (!tbody) return;
    tbody.innerHTML = this.receipts.map(r => `
      <tr>
        <td>${this.formatThaiDate(r.date)}</td>
        <td>${r.type}</td>
        <td>${r.store}</td>
        <td>${r.description}</td>
        <td>${this.formatCurrency(r.amount)}</td>
        <td><span class="badge-status ${r.status==='paid'?'badge-paid':'badge-pending'}">${r.status==='paid'?'จ่ายแล้ว':'รอจ่าย'}</span></td>
      </tr>
    `).join('');
  },

  updateStats() {
    const els = document.querySelectorAll('.stat-card .value');
    const now = new Date();
    const monthReceipts = this.receipts.filter(r => new Date(r.date).getMonth() === now.getMonth());
    if (els[0]) els[0].textContent = monthReceipts.length;
    if (els[1]) els[1].textContent = this.formatCurrency(this.getMonthlyTotal());
    if (els[2]) els[2].textContent = this.formatCurrency(this.receipts.reduce((s,r) => s+r.amount, 0));
  },

  initAnimations() {
    document.querySelectorAll('.stat-number').forEach(el => {
      const target = parseFloat(el.textContent.replace(/[^0-9.]/g,''));
      if (isNaN(target)) return;
      let c = 0, inc = target / 60;
      const t = setInterval(() => {
        c += inc;
        if (c >= target) { c = target; clearInterval(t); }
        el.textContent = Math.floor(c).toLocaleString('th-TH') + '+';
      }, 20);
    });
  },

  init() {
    console.log('ReceiptFlow v1.0 initialized');
    this.renderTable();
    this.updateStats();
    this.initAnimations();
  }
};

// Export to CSV
function exportToCSV() {
  const rows = [['วันที่','ประเภท','ร้านค้า','รายละเอียด','ยอด','สถานะ'],
    ...ReceiptApp.receipts.map(r => [r.date, r.type, r.store, r.description, r.amount, r.status==='paid'?'จ่ายแล้ว':'รอจ่าย'])];
  const csv = rows.map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'}));
  a.download = 'receipts.csv'; a.click();
}

// FAQ toggle
function toggleFaq(btn) {
  const ans = btn.nextElementSibling;
  const open = ans.style.display === 'block';
  document.querySelectorAll('.faq-answer').forEach(a => a.style.display='none');
  document.querySelectorAll('.faq-question span').forEach(s => s && (s.textContent='+'));
  if (!open) { ans.style.display='block'; const s=btn.querySelector('span'); if(s) s.textContent='-'; }
}

document.addEventListener('DOMContentLoaded', () => ReceiptApp.init());

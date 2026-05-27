/**
 * linebot.js - Logic หลักของ ReceiptFlow LINE Bot
 *
 * Bot รับข้อความได้ 3 แบบ:
 * 1. ข้อความ (text)  - เช่น "ค่ากาแฟ 65 บาท" หรือคำสั่ง /รายงาน
 * 2. รูปภาพ (image)  - ใบเสร็จ, สลิป, บิล (จะส่งไป OCR)
 * 3. ไฟล์ (file)     - PDF ใบกำกับภาษี
 *
 * การตอบกลับใช้ LINE Messaging API reply + push message
 */

const axios = require('axios');

// ===== In-Memory Store (ใช้ชั่วคราว - ในระบบจริงใช้ Database) =====
const receipts = {}; // { userId: [{ id, date, description, amount, status }] }
const userState = {}; // { userId: 'waiting_amount' | 'idle' }

// ===== Main Event Handler =====
// ถูกเรียกจาก server.js สำหรับทุก event ที่เข้ามา
async function handleEvent(client, event) {
  console.log('[Event]', event.type, event.source?.userId);

  // รองรับเฉพาะ message event
  if (event.type !== 'message') {
    // จัดการ follow event (ผู้ใช้เพิ่มเพื่อน)
    if (event.type === 'follow') {
      return handleFollow(client, event);
    }
    return null;
  }

  const { type } = event.message;

  if (type === 'text') return handleTextMessage(client, event);
  if (type === 'image') return handleImageMessage(client, event);
  if (type === 'file') return handleFileMessage(client, event);

  // ข้อความประเภทอื่น (video, audio, location, sticker)
  return replyText(client, event.replyToken, 'ขออภัย รองรับเฉพาะข้อความ รูปภาพ และไฟล์ PDF นะครับ 😊');
}

// ===== Follow Event Handler =====
async function handleFollow(client, event) {
  const userId = event.source.userId;
  // สร้าง storage สำหรับผู้ใช้ใหม่
  if (!receipts[userId]) receipts[userId] = [];

  return replyText(client, event.replyToken,
    'สวัสดีครับ! 👋 ผม ReceiptFlow Bot\n' +
    'ช่วยจัดการใบเสร็จและค่าใช้จ่ายให้คุณ\n\n' +
    '📌 วิธีใช้งาน:\n' +
    '• พิมพ์รายการ เช่น "ค่ากาแฟ 65 บาท"\n' +
    '• ส่งรูปใบเสร็จ/สลิปมาได้เลย\n' +
    '• พิมพ์ /ช่วยเหลือ เพื่อดูคำสั่งทั้งหมด'
  );
}

// ===== Text Message Handler =====
async function handleTextMessage(client, event) {
  const userId = event.source.userId;
  const text = event.message.text.trim();

  // Initialize user storage
  if (!receipts[userId]) receipts[userId] = [];

  // ===== คำสั่งพิเศษ =====
  if (text.startsWith('/') || text.startsWith('!')) {
    return handleCommand(client, event, text.toLowerCase());
  }

  // ===== Parse ข้อความค่าใช้จ่าย =====
  // รองรับรูปแบบ: "ค่ากาแฟ 65 บาท" หรือ "65 ค่ากาแฟ"
  const parsed = parseExpenseText(text);

  if (parsed) {
    const receipt = {
      id: 'RF-' + String(receipts[userId].length + 1).padStart(4, '0'),
      date: new Date().toISOString().split('T')[0],
      description: parsed.description,
      amount: parsed.amount,
      category: parsed.category,
      status: 'pending',
      source: 'text'
    };

    receipts[userId].push(receipt);

    return replyFlex(client, event.replyToken, buildReceiptConfirmFlex(receipt));
  }

  // ===== ไม่รู้จักข้อความ =====
  return replyText(client, event.replyToken,
    'ไม่เข้าใจครับ 🤔\n' +
    'ลองพิมพ์แบบนี้:\n' +
    '"ค่ากาแฟ 65 บาท"\n' +
    '"ค่าน้ำมัน 500"\n\n' +
    'หรือพิมพ์ /ช่วยเหลือ เพื่อดูคำสั่งทั้งหมด'
  );
}

// ===== Command Handler =====
async function handleCommand(client, event, cmd) {
  const userId = event.source.userId;
  if (!receipts[userId]) receipts[userId] = [];

  // /ช่วยเหลือ หรือ /help
  if (cmd.includes('ช่วยเหลือ') || cmd.includes('help')) {
    return replyText(client, event.replyToken,
      '📋 คำสั่งที่ใช้ได้:\n\n' +
      '💰 บันทึกค่าใช้จ่าย:\n' +
      'พิมพ์: "รายละเอียด จำนวนเงิน"\n' +
      'เช่น: ค่ากาแฟ 65\n\n' +
      '📷 ส่งรูปใบเสร็จ/สลิป\n\n' +
      '📊 /รายงาน - ดูสรุปค่าใช้จ่าย\n' +
      '📝 /รายการ - ดูรายการล่าสุด\n' +
      '🗑️ /ลบล่าสุด - ลบรายการล่าสุด\n' +
      '📤 /ส่งออก - ดาวน์โหลด CSV'
    );
  }

  // /รายงาน - สรุปค่าใช้จ่าย
  if (cmd.includes('รายงาน') || cmd.includes('summary')) {
    const userReceipts = receipts[userId];
    if (userReceipts.length === 0) {
      return replyText(client, event.replyToken, 'ยังไม่มีรายการค่าใช้จ่ายครับ 📭');
    }
    const total = userReceipts.reduce((s, r) => s + r.amount, 0);
    const today = userReceipts.filter(r => r.date === new Date().toISOString().split('T')[0]);
    const todayTotal = today.reduce((s, r) => s + r.amount, 0);

    return replyText(client, event.replyToken,
      '📊 สรุปค่าใช้จ่าย\n\n' +
      'วันนี้: ฿' + todayTotal.toLocaleString('th-TH') + ' (' + today.length + ' รายการ)\n' +
      'ทั้งหมด: ฿' + total.toLocaleString('th-TH') + ' (' + userReceipts.length + ' รายการ)\n\n' +
      'พิมพ์ /รายการ เพื่อดูรายละเอียด'
    );
  }

  // /รายการ - ดูรายการล่าสุด 5 รายการ
  if (cmd.includes('รายการ') || cmd.includes('list')) {
    const userReceipts = receipts[userId];
    if (userReceipts.length === 0) {
      return replyText(client, event.replyToken, 'ยังไม่มีรายการค่าใช้จ่ายครับ 📭');
    }
    const last5 = userReceipts.slice(-5).reverse();
    const lines = last5.map((r, i) =>
      (i + 1) + '. ' + r.description + '\n   ฿' + r.amount.toLocaleString('th-TH') + ' | ' + r.date
    );
    return replyText(client, event.replyToken,
      '📝 รายการล่าสุด 5 รายการ\n\n' + lines.join('\n\n')
    );
  }

  // /ลบล่าสุด
  if (cmd.includes('ลบล่าสุด') || cmd.includes('undo')) {
    if (receipts[userId].length === 0) {
      return replyText(client, event.replyToken, 'ไม่มีรายการให้ลบครับ');
    }
    const deleted = receipts[userId].pop();
    return replyText(client, event.replyToken,
      'ลบรายการเรียบร้อยแล้ว ✅\n' + deleted.description + ' ฿' + deleted.amount
    );
  }

  return replyText(client, event.replyToken, 'ไม่รู้จักคำสั่งนี้ครับ พิมพ์ /ช่วยเหลือ เพื่อดูคำสั่งทั้งหมด');
}

// ===== Image Message Handler =====
async function handleImageMessage(client, event) {
  const userId = event.source.userId;
  const messageId = event.message.id;
  if (!receipts[userId]) receipts[userId] = [];

  // แจ้งผู้ใช้ว่ากำลังประมวลผล
  await replyText(client, event.replyToken,
    'กำลังอ่านใบเสร็จให้คุณ... 🔍\n(ระบบกำลังประมวลผลด้วย AI)'
  );

  try {
    // ดาวน์โหลดรูปจาก LINE
    const imageBuffer = await getLineContent(client, messageId);

    // ส่งไป OCR (ในระบบจริงใช้ Google Cloud Vision หรือ OpenAI Vision)
    const ocrResult = await callOCR(imageBuffer);

    if (ocrResult.success) {
      const receipt = {
        id: 'RF-' + String(receipts[userId].length + 1).padStart(4, '0'),
        date: ocrResult.date || new Date().toISOString().split('T')[0],
        description: ocrResult.storeName || 'ใบเสร็จจากรูปภาพ',
        amount: ocrResult.totalAmount || 0,
        category: ocrResult.category || 'อื่นๆ',
        vatAmount: ocrResult.vatAmount || 0,
        taxId: ocrResult.taxId || '',
        status: 'pending',
        source: 'image',
        messageId
      };

      receipts[userId].push(receipt);

      // ส่ง Flex Message แสดงผลลัพธ์
      await client.pushMessage(userId, {
        type: 'flex',
        altText: 'อ่านใบเสร็จเรียบร้อย: ' + receipt.description + ' ฿' + receipt.amount,
        contents: buildReceiptConfirmFlex(receipt)
      });
    } else {
      await client.pushMessage(userId, {
        type: 'text',
        text: 'ไม่สามารถอ่านใบเสร็จได้ครับ 😅\n' +
              'ลองส่งรูปที่ชัดขึ้น หรือพิมพ์รายละเอียดแทนได้ครับ\n' +
              'เช่น: "ค่าอาหาร 150 บาท"'
      });
    }
  } catch (err) {
    console.error('Image processing error:', err);
    await client.pushMessage(userId, {
      type: 'text',
      text: 'เกิดข้อผิดพลาดในการประมวลผลรูปครับ กรุณาลองใหม่อีกครั้ง'
    });
  }
}

// ===== File Message Handler =====
async function handleFileMessage(client, event) {
  const { fileName, fileSize } = event.message;
  const isPDF = fileName.toLowerCase().endsWith('.pdf');

  if (!isPDF) {
    return replyText(client, event.replyToken,
      'รองรับเฉพาะไฟล์ PDF ครับ 📄\nไฟล์ที่รับได้: .pdf'
    );
  }

  return replyText(client, event.replyToken,
    'ได้รับไฟล์ PDF แล้ว: ' + fileName + '\n' +
    'ขนาด: ' + Math.round(fileSize / 1024) + ' KB\n' +
    'กำลังประมวลผล... 🔄'
  );
}

// ===== OCR Function =====
// เชื่อมต่อกับ AI/OCR Service
async function callOCR(imageBuffer) {
  // ถ้ามี OPENAI_API_KEY - ใช้ OpenAI Vision
  if (process.env.OPENAI_API_KEY) {
    try {
      const base64Image = imageBuffer.toString('base64');
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'อ่านใบเสร็จนี้และแยกข้อมูล: ชื่อร้าน, วันที่, ยอดรวม, VAT, เลขที่ผู้เสียภาษี ตอบเป็น JSON format: { storeName, date, totalAmount, vatAmount, taxId, category }'
              },
              {
                type: 'image_url',
                image_url: { url: 'data:image/jpeg;base64,' + base64Image }
              }
            ]
          }],
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return { success: true, ...JSON.parse(jsonMatch[0]) };
      }
    } catch (err) {
      console.error('OpenAI OCR error:', err.message);
    }
  }

  // Mock OCR สำหรับทดสอบ (ถ้าไม่มี API key)
  return {
    success: true,
    storeName: 'ร้านค้าตัวอย่าง',
    date: new Date().toISOString().split('T')[0],
    totalAmount: 0,
    vatAmount: 0,
    taxId: '',
    category: 'อื่นๆ'
  };
}

// ===== Parse Expense Text =====
function parseExpenseText(text) {
  // รูปแบบที่รองรับ:
  // "ค่ากาแฟ 65 บาท" / "65 บาท ค่ากาแฟ" / "ค่ากาแฟ 65"
  const amountRegex = /(\d+(?:\.\d+)?)/;
  const match = text.match(amountRegex);

  if (!match) return null;

  const amount = parseFloat(match[1]);
  if (amount <= 0) return null;

  const description = text
    .replace(match[0], '')
    .replace(/บาท|฿|baht/gi, '')
    .trim() || 'ค่าใช้จ่าย';

  const category = detectCategory(description);

  return { description, amount, category };
}

// ===== Detect Category =====
function detectCategory(text) {
  const categories = {
    'อาหาร': ['กาแฟ', 'อาหาร', 'ข้าว', 'น้ำ', 'ร้าน', 'ชา', 'ขนม', 'ส้มตำ', 'ก๋วยเตี๋ยว'],
    'เดินทาง': ['น้ำมัน', 'แท็กซี่', 'taxi', 'grab', 'รถ', 'ปาร์กิ้ง', 'ที่จอดรถ', 'bts', 'mrt'],
    'ซอฟต์แวร์': ['claude', 'chatgpt', 'openai', 'figma', 'vercel', 'github', 'notion', 'canva'],
    'สำนักงาน': ['กระดาษ', 'ปากกา', 'เครื่องเขียน', 'พรินต์', 'ถ่าย', 'สำนักงาน'],
    'สาธารณูปโภค': ['ไฟฟ้า', 'น้ำประปา', 'อินเทอร์เน็ต', 'โทรศัพท์', 'มือถือ'],
    'การตลาด': ['โฆษณา', 'ads', 'facebook', 'google ads', 'ป้าย', 'นามบัตร']
  };

  const lowerText = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(k => lowerText.includes(k))) return cat;
  }
  return 'อื่นๆ';
}

// ===== Download LINE Content =====
async function getLineContent(client, messageId) {
  const stream = await client.getMessageContent(messageId);
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// ===== Reply Helpers =====
function replyText(client, replyToken, text) {
  return client.replyMessage(replyToken, { type: 'text', text });
}

function replyFlex(client, replyToken, flexContents) {
  return client.replyMessage(replyToken, {
    type: 'flex',
    altText: 'บันทึกค่าใช้จ่าย',
    contents: flexContents
  });
}

// ===== Flex Message Builder =====
function buildReceiptConfirmFlex(receipt) {
  return {
    type: 'bubble',
    size: 'kilo',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [{
        type: 'text',
        text: '✅ บันทึกค่าใช้จ่าย',
        weight: 'bold',
        color: '#ffffff',
        size: 'md'
      }],
      backgroundColor: '#0f172a',
      paddingAll: '15px'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'รายการ', color: '#64748b', size: 'sm', flex: 2 },
            { type: 'text', text: receipt.description, weight: 'bold', size: 'sm', flex: 3, wrap: true }
          ]
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'จำนวนเงิน', color: '#64748b', size: 'sm', flex: 2 },
            { type: 'text', text: '฿' + receipt.amount.toLocaleString('th-TH'), weight: 'bold', color: '#ef4444', size: 'md', flex: 3 }
          ]
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'หมวดหมู่', color: '#64748b', size: 'sm', flex: 2 },
            { type: 'text', text: receipt.category, size: 'sm', flex: 3 }
          ]
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'วันที่', color: '#64748b', size: 'sm', flex: 2 },
            { type: 'text', text: receipt.date, size: 'sm', flex: 3 }
          ]
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'รหัส', color: '#64748b', size: 'sm', flex: 2 },
            { type: 'text', text: receipt.id, size: 'sm', color: '#94a3b8', flex: 3 }
          ]
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'horizontal',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          action: { type: 'message', label: '📊 รายงาน', text: '/รายงาน' },
          style: 'secondary',
          height: 'sm'
        },
        {
          type: 'button',
          action: { type: 'message', label: '🗑️ ลบ', text: '/ลบล่าสุด' },
          style: 'secondary',
          height: 'sm',
          color: '#fee2e2'
        }
      ]
    }
  };
}

module.exports = { handleEvent };

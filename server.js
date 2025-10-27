const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

const N8N_WEBHOOK_URL = 'https://your-n8n-domain.com/webhook/ai-chat';
const HISTORY_FILE = path.join(__dirname, 'chat_history.json');

// ฟังก์ชันอ่านประวัติแชท
async function readHistory() {
  try {
    const data = await fs.readFile(HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // ถ้าไม่มีไฟล์ ให้สร้างใหม่
    return { sessions: [] };
  }
}

// ฟังก์ชันบันทึกประวัติแชท
async function saveHistory(data) {
  try {
    await fs.writeFile(HISTORY_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving history:', error);
    return false;
  }
}

// API สำหรับส่งข้อความ
app.post('/ask', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // ส่งข้อความไปยัง N8N
    const response = await axios.post(N8N_WEBHOOK_URL, { message });
    const reply = response.data.reply || 'ไม่ได้รับการตอบกลับจาก AI';

    // บันทึกประวัติ
    const history = await readHistory();
    const timestamp = new Date().toISOString();
    
    let session = history.sessions.find(s => s.id === sessionId);
    
    if (!session) {
      // สร้าง session ใหม่
      session = {
        id: sessionId || Date.now().toString(),
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        createdAt: timestamp,
        updatedAt: timestamp,
        messages: []
      };
      history.sessions.unshift(session);
    } else {
      session.updatedAt = timestamp;
    }

    // เพิ่มข้อความในประวัติ
    session.messages.push(
      { role: 'user', content: message, timestamp },
      { role: 'assistant', content: reply, timestamp }
    );

    await saveHistory(history);

    res.json({ 
      reply, 
      sessionId: session.id,
      timestamp 
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to process message.' });
  }
});

// API ดึงรายการประวัติแชททั้งหมด
app.get('/history', async (req, res) => {
  try {
    const history = await readHistory();
    
    // ส่งเฉพาะข้อมูลพื้นฐานของแต่ละ session
    const sessions = history.sessions.map(session => ({
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: session.messages.length
    }));

    res.json({ 
      success: true, 
      sessions,
      total: sessions.length 
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// API ดึงข้อความในแชทเฉพาะ session
app.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = await readHistory();
    
    const session = history.sessions.find(s => s.id === sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ 
      success: true, 
      session 
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// API ลบแชทเฉพาะ session
app.delete('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = await readHistory();
    
    const index = history.sessions.findIndex(s => s.id === sessionId);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Session not found' });
    }

    history.sessions.splice(index, 1);
    await saveHistory(history);

    res.json({ 
      success: true, 
      message: 'Session deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// API ล้างประวัติทั้งหมด
app.delete('/history', async (req, res) => {
  try {
    await saveHistory({ sessions: [] });
    res.json({ 
      success: true, 
      message: 'All chat history cleared' 
    });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

// API สร้าง session ใหม่
app.post('/session/new', async (req, res) => {
  try {
    const sessionId = Date.now().toString();
    res.json({ 
      success: true, 
      sessionId 
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port http://localhost:${PORT}`);
  console.log(`📁 Chat history will be saved to: ${HISTORY_FILE}`);
});
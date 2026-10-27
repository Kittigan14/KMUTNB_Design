const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for chat sessions (จำกัด 3 sessions)
let chatSessions = {};
let sessionOrder = []; // เก็บลำดับ session
const MAX_SESSIONS = 3;

// Generate unique session ID
function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Create new chat session
app.post('/api/chat/new', (req, res) => {
    const sessionId = generateSessionId();
    
    // ถ้ามี session เกิน 3 ให้ลบ session เก่าสุด
    if (sessionOrder.length >= MAX_SESSIONS) {
        const oldestSession = sessionOrder.shift();
        delete chatSessions[oldestSession];
    }
    
    chatSessions[sessionId] = [];
    sessionOrder.push(sessionId);
    
    res.json({ 
        success: true, 
        sessionId,
        message: 'New chat session created'
    });
});

// API: Get all sessions
app.get('/api/chat/sessions', (req, res) => {
    const sessions = sessionOrder.map(sessionId => ({
        sessionId,
        messageCount: chatSessions[sessionId].length,
        firstMessage: chatSessions[sessionId][0]?.text.substring(0, 50) || 'Empty chat',
        timestamp: sessionId.split('_')[1]
    }));
    
    res.json({ 
        success: true, 
        sessions: sessions.reverse() // แสดงล่าสุดก่อน
    });
});

// API: Get chat history for specific session
app.get('/api/chat/history/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    
    if (!chatSessions[sessionId]) {
        return res.status(404).json({ 
            success: false, 
            message: 'Session not found' 
        });
    }
    
    res.json({ 
        success: true, 
        sessionId,
        history: chatSessions[sessionId] 
    });
});

// API: Add message to session
app.post('/api/chat/message', (req, res) => {
    const { sessionId, text, sender } = req.body;
    
    if (!sessionId || !text || !sender) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields' 
        });
    }
    
    if (!chatSessions[sessionId]) {
        return res.status(404).json({ 
            success: false, 
            message: 'Session not found' 
        });
    }
    
    const message = {
        text,
        sender,
        timestamp: Date.now()
    };
    
    chatSessions[sessionId].push(message);
    
    res.json({ 
        success: true, 
        message: 'Message added',
        sessionId 
    });
});

// API: Clear specific session
app.delete('/api/chat/clear/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    
    if (!chatSessions[sessionId]) {
        return res.status(404).json({ 
            success: false, 
            message: 'Session not found' 
        });
    }
    
    chatSessions[sessionId] = [];
    
    res.json({ 
        success: true, 
        message: 'Session cleared' 
    });
});

// API: Delete specific session
app.delete('/api/chat/delete/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    
    if (!chatSessions[sessionId]) {
        return res.status(404).json({ 
            success: false, 
            message: 'Session not found' 
        });
    }
    
    delete chatSessions[sessionId];
    sessionOrder = sessionOrder.filter(id => id !== sessionId);
    
    res.json({ 
        success: true, 
        message: 'Session deleted' 
    });
});

// API: Clear all sessions
app.delete('/api/chat/clear-all', (req, res) => {
    chatSessions = {};
    sessionOrder = [];
    
    res.json({ 
        success: true, 
        message: 'All sessions cleared' 
    });
});

// API: Mock AI response (สำหรับทดสอบ)
app.post('/api/chat/ai-response', (req, res) => {
    const { sessionId, userMessage } = req.body;
    
    if (!chatSessions[sessionId]) {
        return res.status(404).json({ 
            success: false, 
            message: 'Session not found' 
        });
    }
    
    // Mock AI response
    const aiResponse = {
        text: `ขอบคุณสำหรับคำถาม: "${userMessage}". นี่คือคำตอบจากระบบ AI`,
        sender: 'ai',
        timestamp: Date.now()
    };
    
    chatSessions[sessionId].push(aiResponse);
    
    res.json({ 
        success: true, 
        response: aiResponse 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Max sessions: ${MAX_SESSIONS}`);
});

module.exports = app;
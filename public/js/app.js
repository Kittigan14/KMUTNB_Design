let sessions = {};
let currentSessionId = null;

// โหลด sessions จาก sessionStorage เมื่อเริ่มต้น
function initSessions() {
    const loadedSessions = {};
    let currentId = sessionStorage.getItem('currentSessionId');

    // โหลดทุก session จาก sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('chat_history_session_')) {
            const sessionId = key.replace('chat_history_session_', '');
            try {
                const data = JSON.parse(sessionStorage.getItem(key));
                loadedSessions[sessionId] = data || [];
            } catch (e) {
                console.error('Error loading session:', e);
            }
        }
    }

    // ถ้ามี sessions อยู่แล้ว ใช้ session ล่าสุด
    const sessionIds = Object.keys(loadedSessions);
    if (sessionIds.length > 0) {
        sessions = loadedSessions;
        if (!currentId || !loadedSessions[currentId]) {
            currentId = sessionIds[sessionIds.length - 1];
        }
        currentSessionId = currentId;
        sessionStorage.setItem('currentSessionId', currentId);
        renderMessages();
    } else {
        // ถ้าไม่มี session ให้สร้างใหม่
        createNewSession();
    }

    updateSessionList();
}

// สร้าง session ใหม่
function createNewSession() {
    const newSessionId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    
    // จำกัดจำนวน sessions ไม่เกิน 3
    const sessionIds = Object.keys(sessions).sort();
    if (sessionIds.length >= 3) {
        // ลบ session เก่าที่สุด
        const oldestId = sessionIds[0];
        delete sessions[oldestId];
        sessionStorage.removeItem(`chat_history_session_${oldestId}`);
    }

    sessions[newSessionId] = [];
    currentSessionId = newSessionId;
    sessionStorage.setItem('currentSessionId', newSessionId);
    sessionStorage.setItem(`chat_history_session_${newSessionId}`, JSON.stringify([]));
    
    renderMessages();
    updateSessionList();
    closeHistoryPopup();
}

// บันทึก session
function saveSession(sessionId, messages) {
    sessionStorage.setItem(`chat_history_session_${sessionId}`, JSON.stringify(messages));
}

// ส่งข้อความ
function sendMessage() {
    const input = document.getElementById('messageInput');
    
    if (!input) {
        console.error('messageInput not found');
        return;
    }

    const message = input.value.trim();

    if (!message) {
        console.log('Empty message');
        return;
    }

    if (!currentSessionId) {
        console.error('No current session');
        createNewSession();
        return;
    }

    console.log('Sending message:', message);

    // ซ่อน placeholder
    const placeholder = document.getElementById('chatPlaceholder');
    if (placeholder && placeholder.style.display !== 'none') {
        placeholder.classList.add('fade-out');
        setTimeout(() => {
            placeholder.style.display = 'none';
        }, 300);
    }

    // เพิ่มข้อความของ user
    const userMessage = {
        text: message,
        sender: 'user',
        timestamp: new Date().toISOString()
    };

    if (!sessions[currentSessionId]) {
        sessions[currentSessionId] = [];
    }

    sessions[currentSessionId].push(userMessage);
    saveSession(currentSessionId, sessions[currentSessionId]);
    
    input.value = '';
    input.style.height = 'auto';
    renderMessages();

    // แสดง typing indicator
    showTypingIndicator();

    // จำลอง AI response
    setTimeout(() => {
        const aiMessage = {
            text: `นี่คือคำตอบสำหรับ: "${message}"`,
            sender: 'ai',
            timestamp: new Date().toISOString()
        };

        sessions[currentSessionId].push(aiMessage);
        saveSession(currentSessionId, sessions[currentSessionId]);
        
        hideTypingIndicator();
        renderMessages();
        updateSessionList();
    }, 1500);
}

// แสดงข้อความทั้งหมด
function renderMessages() {
    const chatWindow = document.getElementById('chatWindow');
    const placeholder = document.getElementById('chatPlaceholder');
    
    if (!chatWindow) {
        console.error('chatWindow not found');
        return;
    }

    const messages = sessions[currentSessionId] || [];

    // ลบข้อความเก่าทั้งหมด (เว้น placeholder และ typing indicator)
    const messageElements = chatWindow.querySelectorAll('.message:not(.typing-indicator)');
    messageElements.forEach(el => el.remove());

    if (messages.length === 0) {
        if (placeholder) {
            placeholder.style.display = 'block';
            placeholder.classList.remove('fade-out');
        }
    } else {
        if (placeholder) {
            placeholder.style.display = 'none';
        }

        messages.forEach((msg) => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.sender === 'user' ? 'chat-user' : 'chat-ai'} fade-in`;
            messageDiv.textContent = msg.text;
            chatWindow.appendChild(messageDiv);
        });
    }

    scrollToBottom();
}

// แสดง typing indicator
function showTypingIndicator() {
    const chatWindow = document.getElementById('chatWindow');
    
    // ลบ typing indicator เก่าถ้ามี
    hideTypingIndicator();
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message chat-ai typing-indicator';
    typingDiv.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    chatWindow.appendChild(typingDiv);
    scrollToBottom();
}

// ซ่อน typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Scroll to bottom
function scrollToBottom() {
    const chatWindow = document.getElementById('chatWindow');
    if (chatWindow) {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
}

// อัพเดทรายการ session
function updateSessionList() {
    const sessionList = document.getElementById('sessionList');
    
    if (!sessionList) {
        console.error('sessionList not found');
        return;
    }

    sessionList.innerHTML = '';

    const sessionIds = Object.keys(sessions).sort().reverse(); // เรียงจากใหม่ไปเก่า

    if (sessionIds.length === 0) {
        sessionList.innerHTML = `
            <li class="empty-state">
                <i class="fa-solid fa-message"></i>
                <span>ยังไม่มีประวัติการสนทนา</span>
            </li>
        `;
        return;
    }

    sessionIds.forEach(sessionId => {
        const messages = sessions[sessionId] || [];
        const title = getSessionTitle(messages);
        const preview = getSessionPreview(messages);
        const messageCount = messages.length;
        const lastTime = messages.length > 0 ? formatTime(messages[messages.length - 1].timestamp) : '';

        const li = document.createElement('li');
        li.className = `session-item ${sessionId === currentSessionId ? 'active-session' : ''}`;
        
        const sessionContent = document.createElement('div');
        sessionContent.className = 'session-content';
        sessionContent.innerHTML = `
            <div class="session-icon">
                <i class="fa-solid fa-message"></i>
            </div>
            <div class="session-info">
                <div class="session-title">${title}</div>
                <div class="session-preview">${preview}</div>
                <div class="session-meta">
                    <span><i class="fa-solid fa-message"></i> ${messageCount} ข้อความ</span>
                    ${lastTime ? `<span><i class="fa-solid fa-clock"></i> ${lastTime}</span>` : ''}
                </div>
            </div>
        `;
        
        // เพิ่ม event listener สำหรับการคลิก
        sessionContent.addEventListener('click', () => {
            switchSession(sessionId);
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-session-btn';
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSession(sessionId);
        });
        
        li.appendChild(sessionContent);
        li.appendChild(deleteBtn);
        sessionList.appendChild(li);
    });
}

// สร้าง session title
function getSessionTitle(messages) {
    if (messages.length === 0) return 'แชทใหม่';
    const firstUserMsg = messages.find(m => m.sender === 'user');
    if (!firstUserMsg) return 'แชทใหม่';
    return firstUserMsg.text.substring(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
}

// สร้าง session preview
function getSessionPreview(messages) {
    if (messages.length === 0) return 'ยังไม่มีข้อความ';
    const lastMsg = messages[messages.length - 1];
    return lastMsg.text.substring(0, 50) + (lastMsg.text.length > 50 ? '...' : '');
}

// จัดรูปแบบเวลา
function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

// เปลี่ยน session
function switchSession(sessionId) {
    console.log('Switching to session:', sessionId);
    currentSessionId = sessionId;
    sessionStorage.setItem('currentSessionId', sessionId);
    renderMessages();
    updateSessionList();
    closeHistoryPopup();
}

// ลบ session
function deleteSession(sessionId) {
    if (!confirm('คุณต้องการลบการสนทนานี้หรือไม่?')) return;

    console.log('Deleting session:', sessionId);
    
    delete sessions[sessionId];
    sessionStorage.removeItem(`chat_history_session_${sessionId}`);

    if (currentSessionId === sessionId) {
        const remainingIds = Object.keys(sessions);
        if (remainingIds.length > 0) {
            currentSessionId = remainingIds[remainingIds.length - 1];
            sessionStorage.setItem('currentSessionId', currentSessionId);
            renderMessages();
        } else {
            createNewSession();
            return;
        }
    }

    updateSessionList();
}

// ล้างประวัติทั้งหมด
function clearAllHistory() {
    if (!confirm('คุณต้องการล้างประวัติการสนทนาทั้งหมดหรือไม่?')) return;

    console.log('Clearing all history');

    Object.keys(sessions).forEach(id => {
        sessionStorage.removeItem(`chat_history_session_${id}`);
    });
    sessionStorage.removeItem('currentSessionId');
    
    sessions = {};
    createNewSession();
}

// เปิด/ปิด History Popup
function openHistoryPopup() {
    const popup = document.getElementById('historyPopup');
    const overlay = document.getElementById('overlay');
    
    if (popup && overlay) {
        popup.classList.add('active');
        overlay.classList.add('active');
        updateSessionList();
    }
}

function closeHistoryPopup() {
    const popup = document.getElementById('historyPopup');
    const overlay = document.getElementById('overlay');
    
    if (popup && overlay) {
        popup.classList.remove('active');
        overlay.classList.remove('active');
    }
}

// Auto-resize textarea
function autoResizeTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    initSessions();

    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    const historyBtn = document.getElementById('historyBtn');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');
    const overlay = document.getElementById('overlay');
    const newChatBtn = document.getElementById('newChatBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');

    // ตรวจสอบว่าได้ element หรือไม่
    if (!sendBtn) console.error('sendBtn not found');
    if (!messageInput) console.error('messageInput not found');
    if (!historyBtn) console.error('historyBtn not found');

    // ส่งข้อความ
    if (sendBtn) {
        sendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Send button clicked');
            sendMessage();
        });
    }

    // Enter เพื่อส่งข้อความ
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                console.log('Enter pressed');
                sendMessage();
            }
        });

        // Auto-resize textarea
        messageInput.addEventListener('input', function() {
            autoResizeTextarea(this);
        });
    }

    // เปิด History
    if (historyBtn) {
        historyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('History button clicked');
            openHistoryPopup();
        });
    }

    // ปิด History
    if (closeHistoryBtn) {
        closeHistoryBtn.addEventListener('click', closeHistoryPopup);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeHistoryPopup);
    }

    // สร้างแชทใหม่
    if (newChatBtn) {
        newChatBtn.addEventListener('click', createNewSession);
    }

    // ล้างทั้งหมด
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllHistory);
    }

    console.log('All event listeners attached');
});
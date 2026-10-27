// session.js - Chat Session Management

// Create new chat session
async function createNewChatSession() {
    try {
        const result = await apiRequest(API_CONFIG.ENDPOINTS.NEW_CHAT, 'POST');
        
        if (result.success) {
            currentSessionId = result.sessionId;
            
            // Clear chat window
            const chatWindow = document.getElementById('chatWindow');
            chatWindow.innerHTML = '';
            
            // Show placeholder
            const placeholder = document.getElementById('chatPlaceholder');
            if (placeholder) {
                placeholder.classList.remove('fade-out');
            }
            
            // Refresh session list
            await refreshSessions();
            
            console.log('New chat session created:', currentSessionId);
        }
    } catch (error) {
        console.error('Error creating new chat:', error);
        alert('ไม่สามารถสร้างแชทใหม่ได้ กรุณาลองใหม่อีกครั้ง');
    }
}

// Load chat history for session
async function loadChatHistory(sessionId) {
    try {
        const result = await apiRequest(`${API_CONFIG.ENDPOINTS.GET_HISTORY}/${sessionId}`);
        
        if (result.success) {
            const chatWindow = document.getElementById('chatWindow');
            chatWindow.innerHTML = '';
            
            const history = result.history || [];
            
            if (history.length === 0) {
                // Show placeholder if no messages
                const placeholder = document.getElementById('chatPlaceholder');
                if (placeholder) {
                    placeholder.classList.remove('fade-out');
                }
            } else {
                // Hide placeholder
                const placeholder = document.getElementById('chatPlaceholder');
                if (placeholder) {
                    placeholder.classList.add('fade-out');
                }
                
                // Display messages
                history.forEach(msg => {
                    displayMessage(msg.text, msg.sender === 'user');
                });
            }
            
            currentSessionId = sessionId;
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
        alert('ไม่สามารถโหลดประวัติการสนทนาได้');
    }
}

// Add message to current session
async function addMessageToSession(text, sender) {
    if (!currentSessionId) {
        await createNewChatSession();
    }
    
    try {
        await apiRequest(API_CONFIG.ENDPOINTS.ADD_MESSAGE, 'POST', {
            sessionId: currentSessionId,
            text,
            sender
        });
    } catch (error) {
        console.error('Error adding message:', error);
    }
}

// Clear current chat
async function clearCurrentChat() {
    if (!currentSessionId) {
        alert('ไม่มีแชทที่จะลบ');
        return;
    }
    
    const confirmClear = confirm('คุณต้องการลบข้อความทั้งหมดในแชทนี้ใช่หรือไม่?');
    if (!confirmClear) return;
    
    try {
        const result = await apiRequest(
            `${API_CONFIG.ENDPOINTS.CLEAR_SESSION}/${currentSessionId}`,
            'DELETE'
        );
        
        if (result.success) {
            // Clear chat window
            const chatWindow = document.getElementById('chatWindow');
            chatWindow.innerHTML = '';
            
            // Show placeholder
            const placeholder = document.getElementById('chatPlaceholder');
            if (placeholder) {
                placeholder.classList.remove('fade-out');
            }
            
            await refreshSessions();
            alert('ลบข้อความทั้งหมดแล้ว');
        }
    } catch (error) {
        console.error('Error clearing chat:', error);
        alert('ไม่สามารถลบแชทได้');
    }
}

// Delete session
async function deleteSession(sessionId) {
    const confirmDelete = confirm('คุณต้องการลบประวัติการสนทนานี้ใช่หรือไม่?');
    if (!confirmDelete) return;
    
    try {
        const result = await apiRequest(
            `${API_CONFIG.ENDPOINTS.DELETE_SESSION}/${sessionId}`,
            'DELETE'
        );
        
        if (result.success) {
            // If deleted current session, create new one
            if (sessionId === currentSessionId) {
                await createNewChatSession();
            }
            
            await refreshSessions();
            alert('ลบประวัติการสนทนาแล้ว');
        }
    } catch (error) {
        console.error('Error deleting session:', error);
        alert('ไม่สามารถลบประวัติการสนทนาได้');
    }
}

// Refresh sessions list
async function refreshSessions() {
    try {
        const result = await apiRequest(API_CONFIG.ENDPOINTS.GET_SESSIONS);
        sessions = result.sessions || [];
        updateSessionList();
    } catch (error) {
        console.error('Error refreshing sessions:', error);
    }
}

// Update session list UI
function updateSessionList() {
    const sessionList = document.getElementById('sessionList');
    if (!sessionList) return;
    
    sessionList.innerHTML = '';
    
    if (sessions.length === 0) {
        sessionList.innerHTML = `
            <li class="empty-state">
                <i class="fa-solid fa-inbox"></i>
                <span>ยังไม่มีประวัติการสนทนา</span>
            </li>
        `;
        return;
    }
    
    sessions.forEach((session, index) => {
        const li = document.createElement('li');
        li.className = 'session-item';
        
        const isActive = session.sessionId === currentSessionId;
        if (isActive) {
            li.classList.add('active-session');
        }
        
        // Format date
        const date = new Date(parseInt(session.timestamp));
        const dateStr = date.toLocaleDateString('th-TH', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        li.innerHTML = `
            <div class="session-content" onclick="loadChatHistory('${session.sessionId}')">
                <div class="session-icon">
                    <i class="fa-solid fa-message"></i>
                </div>
                <div class="session-info">
                    <div class="session-title">แชท ${sessions.length - index}</div>
                    <div class="session-preview">${session.firstMessage}</div>
                    <div class="session-meta">
                        <span><i class="fa-solid fa-clock"></i> ${dateStr}</span>
                        <span><i class="fa-solid fa-comment"></i> ${session.messageCount} ข้อความ</span>
                    </div>
                </div>
            </div>
            <button class="delete-session-btn" onclick="deleteSession('${session.sessionId}')" title="ลบแชท">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        
        sessionList.appendChild(li);
    });
}

// Create new chat (button handler)
async function createNewChat() {
    closeHistoryPopup();
    await createNewChatSession();
}
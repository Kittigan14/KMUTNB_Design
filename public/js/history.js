// history.js - จัดการประวัติแชท

const API_URL = 'http://localhost:5500';
let currentSessionId = null;
let deleteTarget = null;

// โหลดประวัติแชทเมื่อเปิด popup
async function loadChatHistory() {
    const historyList = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyState');
    
    // แสดง loading
    historyList.innerHTML = `
        <div class="loading-spinner">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>กำลังโหลดประวัติ...</p>
        </div>
    `;
    emptyState.style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/history`);
        const data = await response.json();

        if (data.success && data.sessions.length > 0) {
            displayHistoryList(data.sessions);
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error loading history:', error);
        historyList.innerHTML = `
            <div class="error-state">
                <i class="fa-solid fa-exclamation-circle"></i>
                <p>เกิดข้อผิดพลาดในการโหลดประวัติ</p>
                <button onclick="loadChatHistory()" class="retry-btn">
                    <i class="fa-solid fa-rotate-right"></i> ลองอีกครั้ง
                </button>
            </div>
        `;
    }
}

// แสดงรายการประวัติ
function displayHistoryList(sessions) {
    const historyList = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyState');
    
    emptyState.style.display = 'none';
    
    historyList.innerHTML = sessions.map(session => {
        const date = new Date(session.updatedAt);
        const timeAgo = getTimeAgo(date);
        
        return `
            <div class="history-item" data-session-id="${session.id}">
                <div class="history-item-content" onclick="loadSession('${session.id}')">
                    <div class="history-item-icon">
                        <i class="fa-solid fa-message"></i>
                    </div>
                    <div class="history-item-text">
                        <div class="history-item-title">${escapeHtml(session.title)}</div>
                        <div class="history-item-meta">
                            <span><i class="fa-solid fa-clock"></i> ${timeAgo}</span>
                            <span><i class="fa-solid fa-comment-dots"></i> ${session.messageCount} ข้อความ</span>
                        </div>
                    </div>
                </div>
                <button class="delete-session-btn" onclick="confirmDeleteSession(event, '${session.id}', '${escapeHtml(session.title)}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
}

// แสดงสถานะว่าง
function showEmptyState() {
    const historyList = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyState');
    
    historyList.innerHTML = '';
    emptyState.style.display = 'flex';
}

// โหลดแชทจากประวัติ
async function loadSession(sessionId) {
    try {
        const response = await fetch(`${API_URL}/history/${sessionId}`);
        const data = await response.json();

        if (data.success && data.session) {
            currentSessionId = sessionId;
            displaySessionMessages(data.session.messages);
            closeHistoryPopup();
        }
    } catch (error) {
        console.error('Error loading session:', error);
        alert('ไม่สามารถโหลดแชทได้ กรุณาลองใหม่อีกครั้ง');
    }
}

// แสดงข้อความในแชท
function displaySessionMessages(messages) {
    const chatWindow = document.getElementById('chatWindow');
    const chatPlaceholder = document.getElementById('chatPlaceholder');
    
    // ซ่อน placeholder
    if (chatPlaceholder) {
        chatPlaceholder.classList.add('fade-out');
        setTimeout(() => chatPlaceholder.style.display = 'none', 300);
    }

    // ล้างแชทเดิม
    const oldMessages = chatWindow.querySelectorAll('.message');
    oldMessages.forEach(msg => msg.remove());

    // แสดงข้อความจากประวัติ
    messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.role === 'user' ? 'chat-user' : 'chat-ai'} fade-in`;
        messageDiv.textContent = msg.content;
        chatWindow.appendChild(messageDiv);
    });

    // เลื่อนลงล่างสุด
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// สร้างแชทใหม่
async function newChat(event) {
    event.preventDefault();
    
    try {
        const response = await fetch(`${API_URL}/session/new`, {
            method: 'POST'
        });
        const data = await response.json();

        if (data.success) {
            currentSessionId = data.sessionId;
            clearChatWindow();
            closeMenu();
            closeHistoryPopup();
        }
    } catch (error) {
        console.error('Error creating new chat:', error);
        // ถ้าเกิดข้อผิดพลาด ให้ใช้ session ID แบบ local
        currentSessionId = Date.now().toString();
        clearChatWindow();
        closeMenu();
        closeHistoryPopup();
    }
}

// ล้างหน้าต่างแชท
function clearChatWindow() {
    const chatWindow = document.getElementById('chatWindow');
    const chatPlaceholder = document.getElementById('chatPlaceholder');
    
    // ลบข้อความทั้งหมด
    const messages = chatWindow.querySelectorAll('.message');
    messages.forEach(msg => msg.remove());
    
    // แสดง placeholder อีกครั้ง
    if (chatPlaceholder) {
        chatPlaceholder.style.display = 'block';
        chatPlaceholder.classList.remove('fade-out');
    }
}

// ยืนยันการลบแชทเดียว
function confirmDeleteSession(event, sessionId, title) {
    event.stopPropagation();
    
    deleteTarget = { type: 'session', id: sessionId };
    document.getElementById('confirmMessage').textContent = 
        `คุณแน่ใจหรือไม่ว่าต้องการลบแชท "${title}"?`;
    openConfirmModal();
}

// ยืนยันการลบทั้งหมด
function confirmClearAll(event) {
    event.preventDefault();
    
    deleteTarget = { type: 'all' };
    document.getElementById('confirmMessage').textContent = 
        'คุณแน่ใจหรือไม่ว่าต้องการลบประวัติแชททั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้';
    openConfirmModal();
}

// ดำเนินการลบ
async function executeDelete() {
    if (!deleteTarget) return;

    try {
        let response;
        
        if (deleteTarget.type === 'session') {
            response = await fetch(`${API_URL}/history/${deleteTarget.id}`, {
                method: 'DELETE'
            });
        } else if (deleteTarget.type === 'all') {
            response = await fetch(`${API_URL}/history`, {
                method: 'DELETE'
            });
        }

        const data = await response.json();

        if (data.success) {
            // ถ้าลบ session ปัจจุบัน ให้สร้างใหม่
            if (deleteTarget.type === 'session' && deleteTarget.id === currentSessionId) {
                newChat({ preventDefault: () => {} });
            } else if (deleteTarget.type === 'all') {
                newChat({ preventDefault: () => {} });
            }

            // โหลดประวัติใหม่
            await loadChatHistory();
            closeConfirmModal();
            
            // แสดงข้อความสำเร็จ
            showToast('ลบสำเร็จ', 'success');
        }
    } catch (error) {
        console.error('Error deleting:', error);
        showToast('เกิดข้อผิดพลาดในการลบ', 'error');
    }
}

// เปิด/ปิด Confirmation Modal
function openConfirmModal() {
    document.getElementById('confirmModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
    if (!document.getElementById('historyPopup').classList.contains('active')) {
        document.getElementById('overlay').classList.remove('active');
    }
    deleteTarget = null;
}

// แสดง Toast Notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fa-solid fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// คำนวณเวลาที่ผ่านมา
function getTimeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // วินาที

    if (diff < 60) return 'เมื่อสักครู่';
    if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} วันที่แล้ว`;
    
    return date.toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Escape HTML เพื่อป้องกัน XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// โหลดประวัติเมื่อเปิด History Popup
document.addEventListener('DOMContentLoaded', function() {
    const historyPopup = document.getElementById('historyPopup');
    
    // ใช้ MutationObserver เพื่อตรวจจับเมื่อ popup เปิด
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                if (historyPopup.classList.contains('active')) {
                    loadChatHistory();
                }
            }
        });
    });
    
    observer.observe(historyPopup, { attributes: true });
});
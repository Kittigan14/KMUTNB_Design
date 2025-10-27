// function sendMessage() {
//     const input = document.getElementById('userInput');
//     const message = input.value.trim();
//     if (message === '') return;

//     const chatWindow = document.getElementById('chatWindow');
//     const placeholder = document.getElementById('chatPlaceholder');

//     if (placeholder && !placeholder.classList.contains('fade-out')) {
//         placeholder.classList.add('fade-out');
//     }

//     const userMessage = document.createElement('div');
//     userMessage.classList.add('message', 'chat-user', 'fade-in');
//     userMessage.textContent = message;
//     chatWindow.appendChild(userMessage);

//     setTimeout(() => {
//         const aiMessage = document.createElement('div');
//         aiMessage.classList.add('message', 'chat-ai', 'fade-in');
//         aiMessage.textContent = 'สวัสดีครับ ต้องการให้ช่วยเรื่องอะไรครับ?';
//         chatWindow.appendChild(aiMessage);
//         chatWindow.scrollTop = chatWindow.scrollHeight;
//     }, 500);

//     input.value = '';
//     chatWindow.scrollTop = chatWindow.scrollHeight;
// }
// message.js - จัดการการส่งและรับข้อความ

const API_URL = 'http://localhost:5500';

if (!currentSessionId) {
    var currentSessionId = Date.now().toString();
}

async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();

    if (!message) return;

    displayMessage(message, 'user');
    userInput.value = '';
    resetTextareaHeight();

    const loadingId = displayLoadingMessage();

    try {
        const response = await fetch(`${API_URL}/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                sessionId: currentSessionId
            })
        });

        const data = await response.json();

        removeLoadingMessage(loadingId);

        if (data.reply) {
            if (data.sessionId) {
                currentSessionId = data.sessionId;
            }

            displayMessage(data.reply, 'ai');
        } else {
            displayMessage('ขออภัย ไม่สามารถรับคำตอบได้ในขณะนี้', 'ai');
        }

    } catch (error) {
        console.error('Error:', error);
        removeLoadingMessage(loadingId);
        displayMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง', 'ai');
    }
}

function displayMessage(text, sender) {
    const chatWindow = document.getElementById('chatWindow');
    const chatPlaceholder = document.getElementById('chatPlaceholder');

    if (chatPlaceholder && chatPlaceholder.style.display !== 'none') {
        chatPlaceholder.classList.add('fade-out');
        setTimeout(() => {
            chatPlaceholder.style.display = 'none';
        }, 300);
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender === 'user' ? 'chat-user' : 'chat-ai'} fade-in`;
    messageDiv.textContent = text;

    chatWindow.appendChild(messageDiv);

    chatWindow.scrollTop = chatWindow.scrollHeight;

    return messageDiv;
}

function displayLoadingMessage() {
    const chatWindow = document.getElementById('chatWindow');
    const loadingId = 'loading-' + Date.now();

    const loadingDiv = document.createElement('div');
    loadingDiv.id = loadingId;
    loadingDiv.className = 'message chat-ai fade-in';
    loadingDiv.innerHTML = `
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;

    chatWindow.appendChild(loadingDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    return loadingId;
}

function removeLoadingMessage(loadingId) {
    const loadingDiv = document.getElementById(loadingId);
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

function resetTextareaHeight() {
    const textarea = document.getElementById('userInput');
    textarea.style.height = 'auto';
}

document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('userInput');

    if (textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 200) + 'px';
        });

        textarea.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        textarea.addEventListener('focus', function() {
            if (window.innerWidth < 768) {
                const viewport = document.querySelector('meta[name=viewport]');
                if (viewport) {
                    viewport.setAttribute('content', 
                        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                }
            }
        });

        textarea.addEventListener('blur', function() {
            if (window.innerWidth < 768) {
                const viewport = document.querySelector('meta[name=viewport]');
                if (viewport) {
                    viewport.setAttribute('content', 
                        'width=device-width, initial-scale=1.0');
                }
            }
        });
    }
});

const style = document.createElement('style');
style.textContent = `
    .typing-indicator {
        display: flex;
        gap: 4px;
        align-items: center;
        padding: 8px 0;
    }

    .typing-indicator span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #D3756B;
        animation: typing 1.4s infinite;
        opacity: 0.4;
    }

    .typing-indicator span:nth-child(1) {
        animation-delay: 0s;
    }

    .typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
    }

    .typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
    }

    @keyframes typing {
        0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
        }
        30% {
            transform: translateY(-10px);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
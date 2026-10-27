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

const textarea = document.getElementById('userInput');
if (textarea) {
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    });

    // Send message on Enter (Shift+Enter for new line)
    textarea.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });
}

// Send message function
async function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    
    if (message === '') return;
    
    // Display user message
    displayMessage(message, true);
    
    // Save user message to session
    await addMessageToSession(message, 'user');
    
    // Clear input
    input.value = '';
    input.style.height = 'auto';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Get AI response
    try {
        const result = await apiRequest(API_CONFIG.ENDPOINTS.AI_RESPONSE, 'POST', {
            sessionId: currentSessionId,
            userMessage: message
        });
        
        if (result.success) {
            // Remove typing indicator
            removeTypingIndicator();
            
            // Display AI response
            displayMessage(result.response.text, false);
            
            // Refresh session list
            await refreshSessions();
        }
    } catch (error) {
        console.error('Error getting AI response:', error);
        removeTypingIndicator();
        displayMessage('ขออภัย เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง', false);
    }
}

// Display message in chat window
function displayMessage(text, isUser) {
    const chatWindow = document.getElementById('chatWindow');
    const placeholder = document.getElementById('chatPlaceholder');
    
    // Hide placeholder on first message
    if (placeholder && !placeholder.classList.contains('fade-out')) {
        placeholder.classList.add('fade-out');
        setTimeout(() => {
            if (placeholder.parentNode) {
                placeholder.parentNode.removeChild(placeholder);
            }
        }, 500);
    }
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'chat-user' : 'chat-ai'} fade-in`;
    messageDiv.textContent = text;
    
    chatWindow.appendChild(messageDiv);
    
    // Scroll to bottom
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const chatWindow = document.getElementById('chatWindow');
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message chat-ai typing-indicator fade-in';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
    `;
    
    chatWindow.appendChild(typingDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}
    
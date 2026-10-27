// config.js - API Configuration

const API_CONFIG = {
    BASE_URL: 'http://localhost:3000/api',
    ENDPOINTS: {
        NEW_CHAT: '/chat/new',
        GET_SESSIONS: '/chat/sessions',
        GET_HISTORY: '/chat/history',
        ADD_MESSAGE: '/chat/message',
        CLEAR_SESSION: '/chat/clear',
        DELETE_SESSION: '/chat/delete',
        CLEAR_ALL: '/chat/clear-all',
        AI_RESPONSE: '/chat/ai-response'
    }
};

// Global state
let currentSessionId = null;
let sessions = [];

// API Helper Functions
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'API request failed');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Initialize app
async function initializeApp() {
    try {
        // Load existing sessions
        const result = await apiRequest(API_CONFIG.ENDPOINTS.GET_SESSIONS);
        sessions = result.sessions || [];

        if (sessions.length === 0) {
            // Create first session if none exists
            await createNewChatSession();
        } else {
            // Load most recent session
            currentSessionId = sessions[0].sessionId;
            await loadChatHistory(currentSessionId);
        }

        updateSessionList();
    } catch (error) {
        console.error('Initialization error:', error);
        // Create new session on error
        await createNewChatSession();
    }
}

// Wait for DOM to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
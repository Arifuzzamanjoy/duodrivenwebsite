/**
 * DUODRIVEN AI Chat Widget
 * Integration with n8n webhook for AI responses
 */

class ChatWidget {
    constructor() {
        this.widget = document.getElementById('chatWidget');
        this.toggleBtn = document.getElementById('chatToggle');
        this.messages = document.getElementById('chatMessages');
        this.input = document.getElementById('chatInput');
        this.form = document.getElementById('chatForm');
        this.sendBtn = document.getElementById('chatSendBtn');
        this.quickActions = document.getElementById('quickActions');
        
        this.isOpen = false;
        this.isLoading = false;
        this.sessionId = this.getSessionId();
        this.chatHistory = this.loadChatHistory();
        
        this.init();
    }
    
    init() {
        if (!this.widget || !this.toggleBtn) return;
        
        // Load existing chat history
        this.renderChatHistory();
        
        // Auto-resize textarea
        if (this.input) {
            this.input.addEventListener('input', () => this.autoResizeInput());
        }
        
        // Check for pending messages
        this.checkPendingWelcome();
    }
    
    getSessionId() {
        let sessionId = localStorage.getItem('duodriven_chat_session');
        if (!sessionId) {
            sessionId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('duodriven_chat_session', sessionId);
        }
        return sessionId;
    }
    
    loadChatHistory() {
        try {
            const history = localStorage.getItem('duodriven_chat_history');
            return history ? JSON.parse(history) : [];
        } catch {
            return [];
        }
    }
    
    saveChatHistory() {
        try {
            // Keep only last 50 messages
            const historyToSave = this.chatHistory.slice(-50);
            localStorage.setItem('duodriven_chat_history', JSON.stringify(historyToSave));
        } catch (e) {
            console.warn('Failed to save chat history:', e);
        }
    }
    
    renderChatHistory() {
        if (this.chatHistory.length === 0) return;
        
        // Clear welcome message if we have history
        const welcome = this.messages.querySelector('.welcome-message');
        if (welcome) welcome.remove();
        
        // Render messages
        this.chatHistory.forEach(msg => {
            this.appendMessage(msg.content, msg.type, msg.time, false);
        });
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    checkPendingWelcome() {
        // Hide quick actions if we have chat history
        if (this.chatHistory.length > 0 && this.quickActions) {
            this.quickActions.style.display = 'none';
        }
    }
    
    toggle() {
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            this.open();
        } else {
            this.close();
        }
    }
    
    open() {
        this.isOpen = true;
        this.widget.classList.add('active');
        this.toggleBtn.classList.add('active');
        
        // Focus input
        setTimeout(() => {
            if (this.input) this.input.focus();
        }, 300);
        
        // Mark notification as read
        const dot = this.toggleBtn.querySelector('.notification-dot');
        if (dot) dot.style.display = 'none';
    }
    
    close() {
        this.isOpen = false;
        this.widget.classList.remove('active');
        this.toggleBtn.classList.remove('active');
    }
    
    minimize() {
        this.widget.classList.toggle('minimized');
    }
    
    autoResizeInput() {
        if (!this.input) return;
        this.input.style.height = 'auto';
        this.input.style.height = Math.min(this.input.scrollHeight, 120) + 'px';
    }
    
    appendMessage(content, type = 'bot', time = null, save = true) {
        // Remove welcome message on first message
        const welcome = this.messages.querySelector('.welcome-message');
        if (welcome) welcome.remove();
        
        // Hide quick actions after first interaction
        if (this.quickActions) {
            this.quickActions.style.display = 'none';
        }
        
        const messageTime = time || this.formatTime(new Date());
        
        const messageHtml = `
            <div class="message ${type}">
                <div class="message-avatar">
                    ${type === 'bot' ? `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42"></path>
                        </svg>
                    ` : `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    `}
                </div>
                <div>
                    <div class="message-content">${this.formatMessage(content)}</div>
                    <div class="message-time">${messageTime}</div>
                </div>
            </div>
        `;
        
        this.messages.insertAdjacentHTML('beforeend', messageHtml);
        this.scrollToBottom();
        
        // Save to history
        if (save) {
            this.chatHistory.push({ content, type, time: messageTime });
            this.saveChatHistory();
        }
    }
    
    appendTypingIndicator() {
        const indicatorHtml = `
            <div class="typing-indicator" id="typingIndicator">
                <div class="message-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42"></path>
                    </svg>
                </div>
                <div class="dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        this.messages.insertAdjacentHTML('beforeend', indicatorHtml);
        this.scrollToBottom();
    }
    
    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    }
    
    formatTime(date) {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);
    }
    
    formatMessage(content) {
        // Escape HTML first
        const escaped = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Simple markdown-like formatting
        return escaped
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }
    
    scrollToBottom() {
        if (this.messages) {
            this.messages.scrollTop = this.messages.scrollHeight;
        }
    }
    
    setLoading(loading) {
        this.isLoading = loading;
        
        if (this.sendBtn) {
            this.sendBtn.disabled = loading;
        }
        
        if (this.input) {
            this.input.disabled = loading;
        }
    }
    
    async sendMessage(message) {
        if (!message.trim() || this.isLoading) return;
        
        // Add user message
        this.appendMessage(message, 'user');
        
        // Clear input
        if (this.input) {
            this.input.value = '';
            this.input.style.height = 'auto';
        }
        
        // Show typing indicator
        this.setLoading(true);
        this.appendTypingIndicator();
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    session_id: this.sessionId,
                    page_url: window.location.href,
                    timestamp: new Date().toISOString(),
                    user_agent: navigator.userAgent
                })
            });
            
            const data = await response.json();
            
            // Remove typing indicator
            this.removeTypingIndicator();
            
            // Add bot response
            const botResponse = data.response || data.reply || data.output || data.message || "I'm sorry, I couldn't process that request. Please try again or email us at hello@duodriven.com";
            this.appendMessage(botResponse, 'bot');
            
        } catch (error) {
            console.error('Chat error:', error);
            this.removeTypingIndicator();
            this.appendMessage("I'm having trouble connecting. Please try again in a moment or email us at hello@duodriven.com", 'bot');
        } finally {
            this.setLoading(false);
        }
    }
    
    clearHistory() {
        this.chatHistory = [];
        localStorage.removeItem('duodriven_chat_history');
        
        // Reset UI
        if (this.messages) {
            this.messages.innerHTML = `
                <div class="welcome-message">
                    <div class="avatar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42"></path>
                        </svg>
                    </div>
                    <h4>Hi! I'm the DUODRIVEN AI Agent.</h4>
                    <p>I can help you understand our services, discuss your growth challenges, or schedule a call with our engineering team. What can I help you with today?</p>
                </div>
            `;
        }
        
        if (this.quickActions) {
            this.quickActions.style.display = 'flex';
        }
    }
}

// ============================================
// GLOBAL FUNCTIONS
// ============================================

let chatWidget;

function toggleChat() {
    if (!chatWidget) {
        chatWidget = new ChatWidget();
    }
    chatWidget.toggle();
}

function minimizeChat() {
    if (chatWidget) {
        chatWidget.minimize();
    }
}

function handleChatSubmit(event) {
    event.preventDefault();
    
    if (!chatWidget) {
        chatWidget = new ChatWidget();
    }
    
    const input = document.getElementById('chatInput');
    if (input && input.value.trim()) {
        chatWidget.sendMessage(input.value.trim());
    }
}

function handleInputKeydown(event) {
    // Submit on Enter (without Shift)
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleChatSubmit(event);
    }
}

function sendQuickMessage(message) {
    if (!chatWidget) {
        chatWidget = new ChatWidget();
    }
    
    // Make sure chat is open
    if (!chatWidget.isOpen) {
        chatWidget.open();
    }
    
    // Send the message
    chatWidget.sendMessage(message);
}

function newChatSession() {
    if (!chatWidget) {
        chatWidget = new ChatWidget();
    }
    
    // Generate new session ID
    const newSessionId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('duodriven_chat_session', newSessionId);
    chatWidget.sessionId = newSessionId;
    
    // Clear chat history
    chatWidget.clearHistory();
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    chatWidget = new ChatWidget();
});

// Export
window.ChatWidget = ChatWidget;
window.toggleChat = toggleChat;
window.minimizeChat = minimizeChat;
window.handleChatSubmit = handleChatSubmit;
window.handleInputKeydown = handleInputKeydown;
window.sendQuickMessage = sendQuickMessage;
window.newChatSession = newChatSession;

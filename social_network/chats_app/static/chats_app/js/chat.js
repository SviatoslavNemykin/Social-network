let chatSocket = null;

const csrfToken = document.querySelector("meta[name='csrf-token']").content;
const currentUserEmail = document.getElementById("currentUserEmail").value;

const chatPlaceholder = document.getElementById("chatPlaceholder");
const chatWindow = document.getElementById("chatWindow");
const chatTitle = document.querySelector("#chat-title");
const chatButtons = document.querySelectorAll(".chat-user-button");
const messagesContainer = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const backToPlaceholderBtn = document.getElementById("backToPlaceholder");

function renderMessage(senderEmail, senderName, text, time, avatarUrl) {
  const isMe = senderEmail === currentUserEmail;
  const bubbleClass = isMe ? "msg-outgoing" : "msg-incoming";
  
  let avatarHtml = '';
  if (!isMe) {
    if (avatarUrl) {
      avatarHtml = `<img src="${avatarUrl}" class="msg-avatar" alt="avatar">`;
    } else {
      avatarHtml = `<div class="msg-avatar-stub">${senderName.charAt(0).toUpperCase()}</div>`;
    }
  }

  return `
    <div class="chat-message-row ${isMe ? 'row-reverse' : ''}">
        ${avatarHtml}
        <div class="chat-message-bubble ${bubbleClass}">
            <div class="msg-body">
                ${!isMe ? `<span class="msg-author">${senderName}</span>` : ''}
                <div class="msg-content"><p class="msg-text">${text}</p>
                <span class="msg-time">${time} ✔</span></div>
            </div>
        </div>
    </div>
  `;
}

async function openChatWithUser(userId, username) {
  const response = await fetch(`/chat/chat_with/${userId}/`, {
    method: "POST",
    headers: { "X-CSRFToken": csrfToken },
  });

  const data = await response.json();

  if (data.success) {
    if (chatPlaceholder) chatPlaceholder.style.display = "none";
    if (chatWindow) chatWindow.style.display = "flex";

    chatTitle.textContent = username;
    messagesContainer.innerHTML = "";

    if (data.history && data.history.length > 0) {
        data.history.forEach(msg => {
            messagesContainer.insertAdjacentHTML(
                'beforeend', 
                renderMessage(msg.sender_email, msg.sender_name, msg.text, msg.time, msg.avatar)
            );
        });
    }
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    connectWebSocket(data.chat_id);
  }
}

function connectWebSocket(chatId) {
  if (chatSocket) {
    chatSocket.close();
  }

  chatSocket = new WebSocket(`ws://${window.location.host}/chat/${chatId}/`);

  chatSocket.onmessage = function (event) {
    let data = JSON.parse(event.data);
    
    if (data.action === "chat_message") {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      messagesContainer.insertAdjacentHTML(
          'beforeend', 
          renderMessage(data.sender_email, data.sender_name, data.message_text, timeStr, data.avatar)
      );
      
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  };
}

chatButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    await openChatWithUser(
      button.dataset.chatUser,
      button.dataset.chatUsername
    );
  });
});

messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const messageText = messageInput.value.trim();

  if (messageText && chatSocket) {
    chatSocket.send(JSON.stringify({ messageText: messageText }));
    messageInput.value = "";
  }
});

// Обработчик для кнопки "Назад"
if (backToPlaceholderBtn) {
  backToPlaceholderBtn.addEventListener("click", () => {
    // 1. Скрываем окно чата и показываем стартовую заглушку
    if (chatWindow) chatWindow.style.display = "none";
    if (chatPlaceholder) chatPlaceholder.style.display = "flex";

    // 2. Закрываем активное WebSocket соединение, если оно есть
    if (chatSocket) {
      chatSocket.close();
      chatSocket = null; // Обнуляем переменную, чтобы избежать багов
    }
    
    // (Опционально) Очищаем заголовок чата
    if (chatTitle) chatTitle.textContent = "Чат";
  });
}
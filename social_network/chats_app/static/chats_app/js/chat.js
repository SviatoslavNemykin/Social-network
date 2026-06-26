// chats_app/static/chats_app/js/chat.js
let chatSocket = null;
const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
const currentUserEmail = document.getElementById("currentUserEmail").value;

// Елементи інтернет-інтерфейсу чату
const chatPlaceholder = document.getElementById("chatPlaceholder");
const chatWindow = document.getElementById("chatWindow");
const chatTitle = document.getElementById("chat-title");
const messagesContainer = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const backToPlaceholder = document.getElementById("backToPlaceholder");

// Елементи модалки групи
const openGroupModalButton = document.querySelector("#open-group-modal");
const groupModal = document.querySelector("#group-modal");
const groupStepUsers = document.querySelector("#group-step-users");
const groupStepName = document.querySelector("#group-step-name");
const closeGroupModalButton = document.querySelector("#close-group-modal");
const closeGroupNameModalButton = document.querySelector("#close-group-name-modal");
const cancelGroupModalButton = document.querySelector("#cancel-group-modal");
const nextGroupStepButton = document.querySelector("#next-group-step");
const backGroupStepButton = document.querySelector("#back-group-step");
const createGroupButton = document.querySelector("#create-group");
const groupNameInput = document.querySelector("#group-name");
const selectedCount = document.querySelector("#selected-count");
const selectedUsersList = document.querySelector("#selected-users-list");
const groupUserCheckboxes = document.querySelectorAll(".group-user-checkbox");
const groupList = document.querySelector("#group-list");

// ==========================================
// ФУНКЦІЇ ДЛЯ РОБОТИ З КОНВЕРТАЦІЄЮ ЧАСУ І ДАТ
// ==========================================
function parseIsoToLocalDateTime(isoString) {
    if (!isoString) return new Date();
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? new Date() : date;
}

function formatTimeToHhMm(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateToDisplayStr(date) {
    return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }).replace(' р.', '');
}

function renderDateSeparator(formattedDate) {
    return `<div class="chat-date-separator">${formattedDate}</div>`;
}

// Повертаємо функцію прокручування вниз, якої не вистачало!
function scrollToBottom() {
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Функція для переключення активного класу чату (з підтримкою списку контактів)
function setActiveChat(clickedElement) {
    document.querySelectorAll(".right-side-contacts-notifications-body-contact").forEach(el => {
        el.classList.remove("right-side-contacts-notifications-body-contact-active");
    });

    const userId = clickedElement.dataset.chatUser;
    const chatId = clickedElement.dataset.chatId;

    if (userId) {
        const sidebarChatElement = document.querySelector(`.right-side-contacts-notifications-body.chat-user-button[data-chat-user="${userId}"]`);
        if (sidebarChatElement) {
            const contactTarget = sidebarChatElement.querySelector(".right-side-contacts-notifications-body-contact");
            if (contactTarget) {
                contactTarget.classList.add("right-side-contacts-notifications-body-contact-active");
            }
        }
    } else if (chatId) {
        const sidebarGroupElement = document.querySelector(`.chat-group-button[data-chat-id="${chatId}"]`);
        if (sidebarGroupElement) {
            const contactTarget = sidebarGroupElement.querySelector(".right-side-contacts-notifications-body-contact");
            if (contactTarget) {
                contactTarget.classList.add("right-side-contacts-notifications-body-contact-active");
            }
        }
    }
}

// ==========================================
// ФУНКЦІЯ РЕНДЕРУ ПОВІДОМЛЕНЬ
// ==========================================
function renderMessage(senderEmail, senderName, text, time, avatarUrl, imageUrls = []) {
    const isMe = senderEmail === currentUserEmail;
    const bubbleClass = isMe ? "msg-outgoing" : "msg-incoming";

    let imagesHtml = "";
    if (imageUrls && imageUrls.length > 0) {
        imagesHtml = '<div class="chat-attached-images" style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px;">';
        imageUrls.forEach((url) => {
            imagesHtml += `<img src="${url}" class="attached-img" style="max-width: 150px; max-height: 150px; border-radius: 8px; object-fit: cover;" alt="img">`;
        });
        imagesHtml += '</div>';
    }

    let avatarHtml = '';
    if (!isMe) {
        if (avatarUrl) {
            avatarHtml = `<img src="${avatarUrl}" class="msg-avatar" alt="avatar">`;
        } else {
            const initial = senderName ? senderName.charAt(0).toUpperCase() : "?";
            avatarHtml = `<div class="msg-avatar-stub">${initial}</div>`;
        }
    }

    return `
        <div class="chat-message-row ${isMe ? 'row-reverse' : ''}">
            ${avatarHtml}
            <div class="chat-message-bubble ${bubbleClass}">
                <div class="msg-body">
                    ${!isMe ? `<span class="msg-author">${senderName}</span>` : ''}
                    <div class="msg-content">
                        ${text ? `<p class="msg-text">${text}</p>` : ''}
                        ${imagesHtml}
                        <span class="msg-time">${time} ✔</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// ЛОГІКА ОНОВЛЕННЯ СТАТУСІВ ТА ВЕБСОКЕТІВ
// ==========================================

// Функція динамічного оновлення єдиного рядка статусу
window.updateOpenChatStatus = function() {
    const statusEl = document.getElementById("chat-status");
    if (!statusEl) return;

    // ЛОГІКА ДЛЯ ГРУП
    if (window.currentChatType === "group") {
        if (!window.currentChatMembers || !window.onlineUsers) return;
        
        let onlineCount = 0;
        window.currentChatMembers.forEach(id => {
            if (window.onlineUsers.has(String(id))) {
                onlineCount++;
            }
        });

        statusEl.innerHTML = `<span id="countPeopleGroup">${window.currentChatMembers.length}</span> учасники, <span id="countPeopleOnline">${onlineCount}</span> в мережі`;
    } 
    // ЛОГІКА ДЛЯ ОСОБИСТИХ ЧАТІВ
    else if (window.currentChatType === "personal") {
        if (!window.currentChatTargetUserId || !window.onlineUsers) return;

        const isOnline = window.onlineUsers.has(String(window.currentChatTargetUserId));
        if (isOnline) {
            statusEl.innerHTML = `в мережі`;
        } else {
            statusEl.innerHTML = `не в мережі`;
        }
    }
};

// Головна функція кімнати чату
function setupChatRoom(chatId, title, chatType, targetUserId = null) {
    window.currentActiveChatId = chatId;
    window.currentChatType = chatType; 
    window.currentChatTargetUserId = targetUserId; 
    
    if (chatSocket) {
        chatSocket.close();
    }
    chatPlaceholder.style.display = "none";
    chatWindow.style.display = "flex";
    chatTitle.textContent = title;
    messagesContainer.innerHTML = "";

    let lastHistoryDateObj = null;
    let globalLastMessageDateObj = null;

    fetch(`/chat/history/${chatId}/`)
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            if (typeof window.updateChatAdminStatus === 'function') {
                window.updateChatAdminStatus(data.is_admin, chatId);
            }
            if (typeof window.updateUnreadData === 'function') {
                window.updateUnreadData();
            }

            // Зберігаємо масив ID учасників для розрахунку групового онлайну
            window.currentChatMembers = data.user_ids ? data.user_ids.map(String) : [];
            
            // Відразу ж рендеримо правильний статус
            window.updateOpenChatStatus();

            data.history.forEach(msg => {
                const currentMsgDate = parseIsoToLocalDateTime(msg.time);
                const timeHhMm = formatTimeToHhMm(currentMsgDate);
                const dateDisplayStr = formatDateToDisplayStr(currentMsgDate);

                if (!lastHistoryDateObj || lastHistoryDateObj.toDateString() !== currentMsgDate.toDateString()) {
                    messagesContainer.insertAdjacentHTML('beforeend', renderDateSeparator(dateDisplayStr));
                    lastHistoryDateObj = currentMsgDate;
                }
                messagesContainer.insertAdjacentHTML(
                    'beforeend',
                    renderMessage(msg.sender_email, msg.sender_name, msg.text, timeHhMm, msg.avatar, msg.images)
                );
            });
            scrollToBottom();
            globalLastMessageDateObj = lastHistoryDateObj;
        }
    });

    const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    chatSocket = new WebSocket(`${wsProtocol}${window.location.host}/chat/${chatId}/`);
    
    chatSocket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        if (data.action === "chat_message" || !data.action) {
            const currentNewMsgDate = data.time ? parseIsoToLocalDateTime(data.time) : new Date();
            const timeHhMm = formatTimeToHhMm(currentNewMsgDate);
            const dateDisplayStr = formatDateToDisplayStr(currentNewMsgDate);

            const messageText = data.message_text || data.message || "";
            const senderName = data.sender_name || (data.sender_email ? data.sender_email.split('@')[0] : "Користувач");
            const senderEmail = data.sender_email || "";
            const avatar = data.avatar || "";
            const images = data.images || [];

            if (!globalLastMessageDateObj || globalLastMessageDateObj.toDateString() !== currentNewMsgDate.toDateString()) {
                messagesContainer.insertAdjacentHTML('beforeend', renderDateSeparator(dateDisplayStr));
                globalLastMessageDateObj = currentNewMsgDate;
            }

            messagesContainer.insertAdjacentHTML(
                'beforeend',
                renderMessage(senderEmail, senderName, messageText, timeHhMm, avatar, images)
            );
            scrollToBottom();
        }
    };
    
    chatSocket.onclose = function() {
        console.log("WebSocket закритий.");
    };
}

// ==========================================
// ДИНАМІЧНЕ ПРИВ'ЯЗУВАННЯ КЛІКІВ SIDEBAR
// ==========================================
function bindChatButtons() {
    // Кліки по людях (Особисті чати)
    document.querySelectorAll(".chat-user-button").forEach(button => {
        button.onclick = async function() {
            setActiveChat(this);
            const userId = this.dataset.chatUser;
            const username = this.dataset.chatUsername;

            const response = await fetch(`/chat/chat_with/${userId}/`, {
                method: "POST",
                headers: { "X-CSRFToken": csrfToken }
            });
            const data = await response.json();
            if (data.chat_id) {
                setupChatRoom(data.chat_id, username, "personal", userId);
            }
        };
    });

    // Кліки по групах
    document.querySelectorAll(".chat-group-button").forEach(button => {
        button.onclick = function() {
            setActiveChat(this);
            const chatId = this.dataset.chatId;
            const chatTitle = this.dataset.chatTitle;
            setupChatRoom(chatId, chatTitle, "group");
        };
    });
}

// ==========================================
// ЛОГІКА МОДАЛЬНОГО ВІКНА ГРУПИ
// ==========================================
function openGroupModal() {
    groupModal.hidden = false;
    groupStepUsers.hidden = false;
    groupStepName.hidden = true;
}

function closeGroupModal() {
    groupModal.hidden = true;
    groupNameInput.value = "";
    selectedUsersList.innerHTML = "";
    document.querySelectorAll(".group-user-checkbox").forEach(cb => cb.checked = false);
    updateSelectedCount();
}

// Обновлення лічильника обраних друзів для групи
function updateSelectedCount() {
    const count = document.querySelectorAll(".group-user-checkbox:checked").length;
    if (selectedCount) selectedCount.textContent = count;
}

function renderSelectedUsers() {
    selectedUsersList.innerHTML = ""; 
    const checkedCheckboxes = document.querySelectorAll(".group-user-checkbox:checked");
    
    checkedCheckboxes.forEach(checkbox => {
        const friendLabel = checkbox.closest(".group-friend");
        const userName = friendLabel ? friendLabel.dataset.name : "Користувач";
        const userId = checkbox.value;

        const userRow = document.createElement("div");
        userRow.className = "selected-user";
        userRow.dataset.userId = userId;
        userRow.innerHTML = `
            <div class="selected-user-info">
                <img class="img-placeholder" src="/static/chats_app/images/Avatar.svg">
                <p class="contacts-name">${userName}</p>
            </div>
            <button class="remove-user-btn" type="button">
                <img src="/static/chats_app/images/Component%205%20(10).svg" alt="Видалити">
            </button>
        `;

        const removeBtn = userRow.querySelector(".remove-user-btn");
        removeBtn.addEventListener("click", () => {
            checkbox.checked = false;
            updateSelectedCount();
            renderSelectedUsers();
        });

        selectedUsersList.appendChild(userRow);
    });
}

function showNameStep() {
    const count = document.querySelectorAll(".group-user-checkbox:checked").length;
    if (count < 2) {
        alert("Для створення групи необхідно вибрати щонайменше 2-х учасників.");
        return;
    }
    renderSelectedUsers();
    groupStepUsers.hidden = true;
    groupStepName.hidden = false;
}

function showUsersStep() {
    groupStepUsers.hidden = false;
    groupStepName.hidden = true;
}

function addGroupButtonToSidebar(chatId, name) {
    const emptyMessage = groupList.querySelector("p");
    if (emptyMessage && emptyMessage.textContent.includes("Чатів поки немає")) {
        emptyMessage.remove();
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const avatarLetters = name ? name.slice(0, 2) : "Гр";

    const div = document.createElement("div");
    div.className = "right-side-contacts-notifications-body chat-group-button";
    div.dataset.chatId = chatId;
    div.dataset.chatTitle = name;
    div.style.cursor = "pointer";

    div.innerHTML = `
        <div class="right-side-contacts-notifications-body-contact">
            <div class="chat-avatar-stub">${avatarLetters}</div>
            <div class="right-side-contacts-notifications-body-contact-main-txt">
                <p class="right-side-contacts-notifications-body-contact-main-txt-name">${name}</p>
                <p class="right-side-contacts-notifications-body-contact-main-txt-message">Натисніть, щоб відкрити чат</p>
            </div>
            <p class="right-side-contacts-notifications-body-contact-time">
                ${timeStr}
            </p>
        </div>
    `;
    groupList.appendChild(div);
}

async function createGroup() {
    const checkedCheckboxes = document.querySelectorAll(".group-user-checkbox:checked");
    if (checkedCheckboxes.length < 2) {
        alert("У групі має бути не менше 2-х учасників. Будь ласка, поверніться та додайте учасників.");
        return;
    }
    if (!groupNameInput.value.trim()) {
        alert("Будь ласка, введіть назву групи.");
        return;
    }

    const formData = new FormData();
    formData.append("name", groupNameInput.value);
    checkedCheckboxes.forEach(checkbox => {
        formData.append("users", checkbox.value);
    });

    const response = await fetch("/chat/create_group/", {
        method: "POST",
        headers: { "X-CSRFToken": csrfToken },
        body: formData
    });
    const data = await response.json();

    if (data.success) {
        addGroupButtonToSidebar(data.chat_id, data.name);
        closeGroupModal();
        bindChatButtons();
        const newGroupBtn = groupList.querySelector(`[data-chat-id="${data.chat_id}"]`);
        if (newGroupBtn) setActiveChat(newGroupBtn);
        setupChatRoom(data.chat_id, data.name, "group");
    } else {
        alert("Помилка створення групи: " + (data.error || "невідома помилка"));
    }
}

// ==========================================
// СЛУХАЧІ ПОДІЙ ТА СТАРТ СТОРІНКИ
// ==========================================
if (openGroupModalButton) openGroupModalButton.addEventListener("click", openGroupModal);
if (closeGroupModalButton) closeGroupModalButton.addEventListener("click", closeGroupModal);
if (closeGroupNameModalButton) closeGroupNameModalButton.addEventListener("click", closeGroupModal);
if (cancelGroupModalButton) cancelGroupModalButton.addEventListener("click", closeGroupModal);
if (nextGroupStepButton) nextGroupStepButton.addEventListener("click", showNameStep);
if (backGroupStepButton) backGroupStepButton.addEventListener("click", showUsersStep);
if (createGroupButton) createGroupButton.addEventListener("click", createGroup);

const friendsListContainer = document.getElementById("friendsList");
if (friendsListContainer) {
    friendsListContainer.addEventListener("change", (e) => {
        if (e.target.classList.contains("group-user-checkbox")) {
            updateSelectedCount();
        }
    });
}

// Відправка форми повідомлення
messageForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    const messageText = messageInput.value.trim();

    if (window.hasSelectedImages && window.hasSelectedImages()) {
        const response = await window.sendMessageWithImages(messageText);
        if (response.success) {
            messageInput.value = "";
            window.clearSelectedImages();
        } else {
            alert("Помилка відправки зображень");
        }
    }
    else if (messageText && chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        chatSocket.send(JSON.stringify({ 'messageText': messageText, 'message': messageText }));
        messageInput.value = "";
    }
});

// Кнопка назад
backToPlaceholder.addEventListener("click", () => {
    if (chatSocket) chatSocket.close();
    chatWindow.style.display = "none";
    chatPlaceholder.style.display = "flex";
    document.querySelectorAll(".right-side-contacts-notifications-body-contact").forEach(el => {
        el.classList.remove("right-side-contacts-notifications-body-contact-active");
    });
});

// Запуск при завантаженні сторінки (Django Context)
document.addEventListener("DOMContentLoaded", () => {
    bindChatButtons();

    const activeChatIdEl = document.getElementById("activeChatId");
    if (activeChatIdEl) {
        const chatId = activeChatIdEl.value;
        const chatTitleText = document.getElementById("activeChatTitle").value;
        const chatType = document.getElementById("activeChatType").value;
        
        let targetUserId = null;
        if (chatType === "personal") {
            const userIdEl = document.getElementById("activeChatUserId");
            if (userIdEl) targetUserId = userIdEl.value;
        }

        // Автоматично відкриваємо з урахуванням типів при старті
        setupChatRoom(chatId, chatTitleText, chatType, targetUserId);

        if (chatType === "group") {
            const groupBtn = document.querySelector(`.chat-group-button[data-chat-id="${chatId}"]`);
            if (groupBtn) setActiveChat(groupBtn);
        } else if (chatType === "personal") {
            if (targetUserId) {
                const userBtn = document.querySelector(`.chat-user-button[data-chat-user="${targetUserId}"]`);
                if (userBtn) setActiveChat(userBtn);
            }
        }
    }
});
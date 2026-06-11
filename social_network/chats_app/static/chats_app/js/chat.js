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
// ФУНКЦІЯ РЕНДЕРУ ПОВІДОМЛЕНЬ (Твої рідні CSS класи)
// ==========================================
function renderMessage(senderEmail, senderName, text, time, avatarUrl) {
  const isMe = senderEmail === currentUserEmail;
  const bubbleClass = isMe ? "msg-outgoing" : "msg-incoming";
  
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
                    <p class="msg-text">${text}</p>
                    <span class="msg-time">${time} ✔</span>
                </div>
            </div>
        </div>
    </div>
  `;
}

// ==========================================
// 1. ЛОГІКА ВЕБСОКЕТІВ ТА ВІД КРИТТЯ ЧАТІВ
// ==========================================

// Функція підключення до WebSocket та завантаження історії
function setupChatRoom(chatId, title) {
    // 1. Закриваємо старий сокет, якщо він був відкритий
    if (chatSocket) {
        chatSocket.close();
    }

    // 2. Показуємо вікно чату
    chatPlaceholder.style.display = "none";
    chatWindow.style.display = "flex";
    chatTitle.textContent = title;
    messagesContainer.innerHTML = ""; // Очищуємо екран

    // 3. Завантажуємо історію повідомлень з нового універсального URL
    fetch(`/chat/history/${chatId}/`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                data.history.forEach(msg => {
                    // Використовуємо стару добру розмітку для історії
                    messagesContainer.insertAdjacentHTML(
                        'beforeend', 
                        renderMessage(msg.sender_email, msg.sender_name, msg.text, msg.time, msg.avatar)
                    );
                });
                scrollToBottom();
            }
        });

    // 4. Відкриваємо нове WebSocket з'єднання через Daphne
    const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    chatSocket = new WebSocket(`${wsProtocol}${window.location.host}/chat/${chatId}/`);

    chatSocket.onmessage = function(e) {
        const data = JSON.parse(e.data);

        // ЯКЩО ЦЕ СИСТЕМНЕ ПІДТВЕРДЖЕННЯ — ПРОСТО ПИШЕМО В КОНСОЛЬ І НЕ ВИВОДИМО В ЧАТ
        if (data.action === 'connection_confirmation') {
            console.log(data.message);
            return; 
        }

        if (data.action === "chat_message" || !data.action) {
            // Формуємо змінні часу та тексту (підтримуємо всі ключі бекенду)
            const timeStr = data.time || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const messageText = data.message_text || data.message || "";
            const senderName = data.sender_name || "Система";

            // Рендеримо нове повідомлення в чат
            messagesContainer.insertAdjacentHTML(
                'beforeend', 
                renderMessage(data.sender_email, data.sender_name, messageText, timeStr, data.avatar)
            );
            scrollToBottom();
        }
    };

    chatSocket.onclose = function() {
        console.log("WebSocket закритий.");
    };
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Відправка повідомлення через форму
messageForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const messageText = messageInput.value.strip ? messageInput.value.strip() : messageInput.value.trim();
    if (messageText && chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        chatSocket.send(JSON.stringify({
            'messageText': messageText, // Передаємо обидва ключі для сумісності з вашим consumers.py
            'message': messageText
        }));
        messageInput.value = "";
    }
});

// Кнопка назад
backToPlaceholder.addEventListener("click", () => {
    if (chatSocket) chatSocket.close();
    chatWindow.style.display = "none";
    chatPlaceholder.style.display = "flex";
});


// ==========================================
// 2. ДИНАМІЧНЕ ПРИВ'ЯЗУВАННЯ КЛІКІВ SIDEBAR
// ==========================================

function bindChatButtons() {
    // Кліки по людях (Особисті чати)
    document.querySelectorAll(".chat-user-button").forEach(button => {
        button.onclick = async function() {
            const userId = this.dataset.chatUser;
            const username = this.dataset.chatUsername;
            
            // Отримуємо або створюємо персональну кімнату чату
            const response = await fetch(`/chat/chat_with/${userId}/`, {
                method: "POST",
                headers: { "X-CSRFToken": csrfToken }
            });
            const data = await response.json();
            if (data.chat_id) {
                setupChatRoom(data.chat_id, username);
            }
        };
    });

    // Кліки по групах
    document.querySelectorAll(".chat-group-button").forEach(button => {
        button.onclick = function() {
            const chatId = this.dataset.chatId;
            const chatTitle = this.dataset.chatTitle;
            setupChatRoom(chatId, chatTitle);
        };
    });
}


// ==========================================
// 3. ЛОГІКА МОДАЛЬНОГО ВІКНА ГРУПИ
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
    // Сбрасываем все чекбоксы динамически
    document.querySelectorAll(".group-user-checkbox").forEach(cb => cb.checked = false);
    updateSelectedCount();
}

function updateSelectedCount() {
    // Считаем только реально выбранные чекбоксы на данный момент
    const count = document.querySelectorAll(".group-user-checkbox:checked").length;
    selectedCount.textContent = count;
}

function renderSelectedUsers() {
    selectedUsersList.innerHTML = ""; // Очищаем список перед рендером
    
    // Находим все выбранные чекбоксы динамически
    const checkedCheckboxes = document.querySelectorAll(".group-user-checkbox:checked");
    
    checkedCheckboxes.forEach(checkbox => {
        // Ищем родительский label, чтобы достать data-name друга
        const friendLabel = checkbox.closest(".group-friend");
        const userName = friendLabel ? friendLabel.dataset.name : "Користувач";
        const userId = checkbox.value;

        // Создаем контейнер для выбранного пользователя (как в вашем HTML)
        const userRow = document.createElement("div");
        userRow.className = "selected-user";
        userRow.dataset.userId = userId;

        // Наполняем версткой из вашего примера
        userRow.innerHTML = `
            <div class="selected-user-info">
                <img class="img-placeholder" src="/static/chats_app/images/Avatar.svg">
                <p class="contacts-name">${userName}</p>
            </div>
            <button class="remove-user-btn" type="button">
                <img src="/static/chats_app/images/Component%205%20(10).svg" alt="Видалити">
            </button>
        `;
        
        // Навешиваем событие клика на кнопку удаления ("хрестик")
        const removeBtn = userRow.querySelector(".remove-user-btn");
        removeBtn.addEventListener("click", () => {
            checkbox.checked = false; // Снимаем галочку с основного списка
            updateSelectedCount();    // Обновляем счетчик "Вибрано: X"
            renderSelectedUsers();    // Перерисовываем этот список (текущий юзер исчезнет)
        });

        selectedUsersList.appendChild(userRow);
    });
}

function showNameStep() {
    // Считаем количество выбранных чекбоксов
    const count = document.querySelectorAll(".group-user-checkbox:checked").length;
    
    // Если выбрано меньше 3 участников, показываем предупреждение и прерываем выполнение
    if (count < 2) {
        alert("Для створення групи необхідно вибрати щонайменше 2-х учасників.");
        return; // Останавливает функцию, не давая переключить шаг
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
    // 1. Проверяем, есть ли заглушка "Чатів поки немає" внутри списка групп, и удаляем её
    const emptyMessage = groupList.querySelector("p");
    if (emptyMessage && emptyMessage.textContent.includes("Чатів поки немає")) {
        emptyMessage.remove();
    }
    
    // 2. Генерируем текущее время (например, "15:30")
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // 3. Делаем срез первых двух букв названия группы для аватара (аналог chat.name|slice:":2")
    const avatarLetters = name ? name.slice(0, 2) : "Гр";
    
    // 4. Создаем главный контейнер кнопки группы
    const div = document.createElement("div");
    div.className = "right-side-contacts-notifications-body chat-group-button";
    div.dataset.chatId = chatId;
    div.dataset.chatTitle = name;
    div.style.cursor = "pointer";
    
    // 5. Вставляем точную копию твоей HTML-структуры с сохранением всех стилей и классов
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
    
    // 6. Добавляем готовую карточку в сайдбар
    groupList.appendChild(div);
}

async function createGroup() {
    // Проверяем количество участников еще раз перед отправкой на сервер
    const checkedCheckboxes = document.querySelectorAll(".group-user-checkbox:checked");
    
    if (checkedCheckboxes.length < 2) {
        alert("У групі має бути не менше 2-х учасників. Будь ласка, поверніться та додайте учасників.");
        return; // Блокирует отправку запроса на бэкенд
    }

    // Дополнительная базовая проверка: введено ли имя группы
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
        setupChatRoom(data.chat_id, data.name); 
    } else {
        alert("Помилка створення групи: " + (data.error || "невідома помилка"));
    }
}

// Слухачі подій модалки
if (openGroupModalButton) openGroupModalButton.addEventListener("click", openGroupModal);
if (closeGroupModalButton) closeGroupModalButton.addEventListener("click", closeGroupModal);
if (closeGroupNameModalButton) closeGroupNameModalButton.addEventListener("click", closeGroupModal);
if (cancelGroupModalButton) cancelGroupModalButton.addEventListener("click", closeGroupModal);
if (nextGroupStepButton) nextGroupStepButton.addEventListener("click", showNameStep);
if (backGroupStepButton) backGroupStepButton.addEventListener("click", showUsersStep);
if (createGroupButton) createGroupButton.addEventListener("click", createGroup);

// Делегирование событий для чекбоксов внутри контейнера друзей
const friendsListContainer = document.getElementById("friendsList");
if (friendsListContainer) {
    friendsListContainer.addEventListener("change", (e) => {
        if (e.target.classList.contains("group-user-checkbox")) {
            updateSelectedCount();
        }
    });
}

// Запуск при завантаженні сторінки
document.addEventListener("DOMContentLoaded", () => {
    bindChatButtons();
});
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
// ФУНКЦИИ ДЛЯ РАБОТЫ С КОНВЕРТАЦИЕЙ ВРЕМЕНИ И ДАТ
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

// Функция для переключения активного класса чата
// Функция для переключения активного класса чата (с поддержкой списка контактов)
function setActiveChat(clickedElement) {
    // 1. Сначала удаляем активный класс у всех чатов в сайдбаре сообщений
    document.querySelectorAll(".right-side-contacts-notifications-body-contact").forEach(el => {
        el.classList.remove("right-side-contacts-notifications-body-contact-active");
    });
    
    // 2. Получаем ID пользователя или группы из дата-атрибутов
    const userId = clickedElement.dataset.chatUser;
    const chatId = clickedElement.dataset.chatId;

    if (userId) {
        // Если есть userId (кликнули в контактах ИЛИ в личных сообщениях)
        // Ищем элемент чата конкретно в сайдбаре сообщений (по классу .right-side-contacts-notifications-body)
        const sidebarChatElement = document.querySelector(`.right-side-contacts-notifications-body.chat-user-button[data-chat-user="${userId}"]`);
        if (sidebarChatElement) {
            const contactTarget = sidebarChatElement.querySelector(".right-side-contacts-notifications-body-contact");
            if (contactTarget) {
                contactTarget.classList.add("right-side-contacts-notifications-body-contact-active");
            }
        }
    } else if (chatId) {
        // Если есть chatId (кликнули по группе)
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
// ФУНКЦІЯ РЕНДЕРУ ПОВІДОМЛЕНЬ (Твої рідні CSS класи)
// ==========================================
// Измени заголовок функции, добавив аргумент imageUrls в конец
function renderMessage(senderEmail, senderName, text, time, avatarUrl, imageUrls = []) {
    const isMe = senderEmail === currentUserEmail;
    const bubbleClass = isMe ? "msg-outgoing" : "msg-incoming";
    
    // Безопасная генерация блока картинок
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
// 1. ЛОГІКА ВЕБСОКЕТІВ ТА ВІД КРИТТЯ ЧАТІВ
// ==========================================

function setupChatRoom(chatId, title) {
    window.currentActiveChatId = chatId;
    if (chatSocket) {
        chatSocket.close();
    }

    chatPlaceholder.style.display = "none";
    chatWindow.style.display = "flex";
    chatTitle.textContent = title;
    messagesContainer.innerHTML = ""; 

    // Завантажуємо історію повідомлень
    // 1. ДОБАВИТЬ ЭТИ ДВЕ СТРОКИ ПЕРЕД FETCH:
    let lastHistoryDateObj = null;
    let globalLastMessageDateObj = null;

    // 3. Завантажуємо історію повідомлень з нового універсального URL
    fetch(`/chat/history/${chatId}/`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (typeof window.updateChatAdminStatus === 'function') {
                    window.updateChatAdminStatus(data.is_admin, chatId); // <-- ИЗМЕНЕНО ТУТ
                }
                if (typeof window.updateUnreadData === 'function') {
                    window.updateUnreadData(); 
                }
                // ЗАМЕНИТЬ СТАРЫЙ data.history.forEach НА ЭТОТ КУСОК:
                data.history.forEach(msg => {
                    const currentMsgDate = parseIsoToLocalDateTime(msg.time);
                    const timeHhMm = formatTimeToHhMm(currentMsgDate);
                    const dateDisplayStr = formatDateToDisplayStr(currentMsgDate);

                    // Проверка смены дня для отображения разделителя
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
                
                // ДОБАВИТЬ ЭТУ СТРОКУ после цикла истории:
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

        // ✅ Получаем данные из объекта `data`, а не из несуществующего `msg`
        const messageText = data.message_text || data.message || "";
        const senderName = data.sender_name || (data.sender_email ? data.sender_email.split('@')[0] : "Користувач");
        const senderEmail = data.sender_email || "";
        const avatar = data.avatar || "";
        const images = data.images || []; // Массив картинок из вебсокета

        // Проверка разделителя даты
        if (!globalLastMessageDateObj || globalLastMessageDateObj.toDateString() !== currentNewMsgDate.toDateString()) {
            messagesContainer.insertAdjacentHTML('beforeend', renderDateSeparator(dateDisplayStr));
            globalLastMessageDateObj = currentNewMsgDate;
        }

        // ⚠️ ПРОВЕРЬ ЭТУ СТРОКУ (Здесь должны быть локальные переменные, без всяких "msg.")
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

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Відправка повідомлення через форму
messageForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    const messageText = messageInput.value.trim();

    // Проверяем: если выбраны картинки, шлем через HTTP (sendImages.js)
    if (window.hasSelectedImages && window.hasSelectedImages()) {
        const response = await window.sendMessageWithImages(messageText);
        if (response.success) {
            messageInput.value = "";
            window.clearSelectedImages(); // Очищаем выбранные файлы
        } else {
            alert("Помилка відправки зображень");
        }
    } 
    // Если картинок нет — отправляем как обычный текст по WebSocket
    else if (messageText && chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        chatSocket.send(JSON.stringify({
            'messageText': messageText, 
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

    document.querySelectorAll(".right-side-contacts-notifications-body-contact").forEach(el => {
        el.classList.remove("right-side-contacts-notifications-body-contact-active");
    });
});


// ==========================================
// 2. ДИНАМІЧНЕ ПРИВ'ЯЗУВАННЯ КЛІКІВ SIDEBAR
// ==========================================

function bindChatButtons() {
    // Кліки по людях (Особисті чати)
    document.querySelectorAll(".chat-user-button").forEach(button => {
        button.onclick = async function() {
            setActiveChat(this);
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
            setActiveChat(this);
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

        const newGroupBtn = groupList.querySelector(`[data-chat-id="${data.chat_id}"]`);
        if (newGroupBtn) setActiveChat(newGroupBtn);

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
    // 1. Привязываем клики к кнопкам сайдбара, как и раньше
    bindChatButtons();

    // 2. Проверяем, передан ли активный чат через Django Context
    const activeChatIdEl = document.getElementById("activeChatId");
    if (activeChatIdEl) {
        const chatId = activeChatIdEl.value;
        const chatTitleText = document.getElementById("activeChatTitle").value;
        const chatType = document.getElementById("activeChatType").value;

        // Автоматически открываем чат (загрузит историю и подключит WebSocket)
        setupChatRoom(chatId, chatTitleText);

        // Визуально выделяем чат в сайдбаре в зависимости от его типа
        if (chatType === "group") {
            const groupBtn = document.querySelector(`.chat-group-button[data-chat-id="${chatId}"]`);
            if (groupBtn) setActiveChat(groupBtn);
        } else if (chatType === "personal") {
            const userIdEl = document.getElementById("activeChatUserId");
            if (userIdEl) {
                const userId = userIdEl.value;
                // Ищем личный чат по data-chat-user, так как у тебя setActiveChat завязан на него
                const userBtn = document.querySelector(`.chat-user-button[data-chat-user="${userId}"]`);
                if (userBtn) setActiveChat(userBtn);
            }
        }
    }
});
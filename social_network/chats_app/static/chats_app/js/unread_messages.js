// chats_app/static/chats_app/js/unread_messages.js

// Глобальный счетчик в навбаре (шапке сайта)
const globalChatBadge = document.querySelector("#globalChatBadge");

// Локальные счетчики на странице чатов
const personalUnreadCount = document.querySelector("#countNotificationsContacts");
const groupUnreadCount = document.querySelector("#countNotificationsGroups");

// Функция-фильтр: если сообщений 0, возвращаем пустую строку, чтобы сработал CSS :empty
function formatCount(count) {
    return (count === 0 || !count) ? "" : count;
}

function showUnreadData(data) {
    // 1. ОБНОВЛЕНИЕ НАВБАРА (работает на всех страницах)
    if (globalChatBadge && typeof data.total !== 'undefined') {
        globalChatBadge.textContent = formatCount(data.total);
    }

    // 2. ОБНОВЛЕНИЕ СТРАНИЦЫ ЧАТОВ (теперь тоже чисто убирает нули)
    if (personalUnreadCount) personalUnreadCount.textContent = formatCount(data.personal_total);
    if (groupUnreadCount) groupUnreadCount.textContent = formatCount(data.group_total);
    
    // 3. Динамическая сортировка плашек чатов по новизне
    if (data.chats) {
        const reversedChats = [...data.chats].reverse();

        reversedChats.forEach((chat) => {
            const chatRow = document.querySelector(`.right-side-contacts-notifications-body[data-chat-id="${chat.id}"]`);
            
            if (chatRow) {
                // Обновляем текст сообщения
                const messageParagraph = chatRow.querySelector(".right-side-contacts-notifications-body-contact-main-txt-message");
                if (messageParagraph && chat.last) {
                    messageParagraph.textContent = chat.last;
                }

                // Обновляем время
                const timeParagraph = chatRow.querySelector(".right-side-contacts-notifications-body-contact-time");
                if (timeParagraph && chat.time) {
                    timeParagraph.textContent = chat.time;
                }

                // Подсветка непрочитанного
                if (chat.unread > 0) {
                    chatRow.classList.add("chat-has-unread");
                } else {
                    chatRow.classList.remove("chat-has-unread");
                }

                // Перебрасываем плашку в самый верх списка
                const parentContainer = chatRow.parentElement;
                if (parentContainer) {
                    parentContainer.prepend(chatRow);
                }
            }
        });
    }
}

// Настройка и запуск WebSocket соединения
const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
const unreadSocket = new WebSocket(`${wsProtocol}${window.location.host}/chat/unread/`);

unreadSocket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    showUnreadData(data);
};

function updateUnreadData() {
    if (unreadSocket.readyState === WebSocket.OPEN) {
        unreadSocket.send(JSON.stringify({ "action": "update" }));
    }
}

window.updateUnreadData = updateUnreadData;
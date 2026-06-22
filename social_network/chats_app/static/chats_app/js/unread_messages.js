// chats_app/static/chats_app/js/unread_messages.js

// Находим твои два глобальных счетчика
const personalUnreadCount = document.querySelector("#countNotificationsContacts");
const groupUnreadCount = document.querySelector("#countNotificationsGroups");

// Функция форматирования текста (если 0 — просто пишем 0 или скрываем, как тебе нравится)
function formatCount(count) {
    return count === 0 ? "0" : count;
}

// Показываем актуальные данные, прилетевшие из вебсокета
function showUnreadData(data) {
    // 1. Обновляем счетчик ВСЕХ личных сообщений (сумма по всем контактам)
    if (personalUnreadCount) {
        personalUnreadCount.textContent = formatCount(data.personal_total);
    }

    // 2. Обновляем счетчик ВСЕХ групповых сообщений (сумма по всем группам)
    if (groupUnreadCount) {
        groupUnreadCount.textContent = formatCount(data.group_total);
    }
}

// Открываем WebSocket для получения обновлений в реальном времени
const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
const unreadSocket = new WebSocket(`${wsProtocol}${window.location.host}/chat/unread/`);

// Ловим сообщения от сервера
unreadSocket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    showUnreadData(data);
};

// Функция принудительного запроса обновлений (вызывается из chat.js при кликах на чаты)
function updateUnreadData() {
    if (unreadSocket.readyState === WebSocket.OPEN) {
        unreadSocket.send(JSON.stringify({ "action": "update" }));
    }
}

// Делаем функцию доступной глобально для chat.js
window.updateUnreadData = updateUnreadData;
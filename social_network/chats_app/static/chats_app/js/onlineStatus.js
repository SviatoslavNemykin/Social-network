// chats_app/static/chats_app/js/onlineStatus.js

const wsOnlineProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
const onlineSocket = new WebSocket(`${wsOnlineProtocol}${window.location.host}/chat/online/`);

const ONLINE_ICON_SRC = "/static/chats_app/images/online.svg";

// Глобальный список ID пользователей, которые сейчас онлайн (приводим к строке для надежности)
window.onlineUsers = window.onlineUsers || new Set();

// Функция, которую мы сможем вызывать из любого скрипта для синхронизации иконок
window.syncOnlineStatuses = function () {
  document.querySelectorAll('[data-chat-user]').forEach(userButton => {
    const userId = userButton.dataset.chatUser;
    const statusIcon = userButton.querySelector('.js-status-dynamic-icon');
    
    if (!statusIcon) return;

    // Если ID пользователя есть в нашем онлайн-списке — ставим онлайн, иначе — офлайн
    if (window.onlineUsers.has(String(userId))) {
      statusIcon.src = ONLINE_ICON_SRC;
      console.log(`[Синхронизация] Пользователь ${userId} установлен как ОНЛАЙН`);
    } else {
      statusIcon.src = statusIcon.dataset.offlineSrc;
    }
  });
};

onlineSocket.onmessage = function (event) {
  const data = JSON.parse(event.data);
  const userId = String(data.user_id); // приводим к строке
  const status = data.status;
  
  console.log(`Получен статус для пользователя ID: ${userId}, Статус: ${status}`);

  // Обновляем наше глобальное хранилище статусов
  if (status === "online") {
    window.onlineUsers.add(userId);
  } else {
    window.onlineUsers.delete(userId);
  }

  // Запускаем обновление всех иконок на странице
  window.syncOnlineStatuses();
};

onlineSocket.onopen = function() {
  console.log("Успешное подключение к вебсокету онлайн-статусов.");
};

onlineSocket.onclose = function() {
  console.log("Онлайн-статус WebSocket закрыт.");
};
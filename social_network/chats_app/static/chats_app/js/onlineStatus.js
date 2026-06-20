// chats_app/static/chats_app/js/onlineStatus.js

const wsOnlineProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
const onlineSocket = new WebSocket(`${wsOnlineProtocol}${window.location.host}/chat/online/`);

// Ссылка на твою картинку "В сети"
const ONLINE_ICON_SRC = "/static/chats_app/images/online.svg";

onlineSocket.onmessage = function (event) {
  const data = JSON.parse(event.data);
  const userId = data.user_id;
  const status = data.status;
  
  console.log(`Получен статус для пользователя ID: ${userId}, Статус: ${status}`);

  // Ищем ВСЕ элементы с этим data-chat-user (так как один и тот же юзер может быть и в "Контактах" слева, и в "Сообщениях" справа!)
  const userButtons = document.querySelectorAll(`[data-chat-user="${userId}"]`);

  if (userButtons.length === 0) {
    console.warn(`На странице не найден элемент с data-chat-user="${userId}"`);
    return;
  }

  userButtons.forEach(userButton => {
    // Находим иконку статуса внутри текущего блока
    const statusIcon = userButton.querySelector('.js-status-dynamic-icon');
    
    // Если в левой панели "Контакты" у тебя нет этой иконки, скрипт просто пропустит её и пойдет искать в правую панель
    if (!statusIcon) return; 

    if (status === "online") {
      statusIcon.src = ONLINE_ICON_SRC;
      console.log(`Картинка пользователя ${userId} изменена на ОНЛАЙН`);
    } else {
      statusIcon.src = statusIcon.dataset.offlineSrc;
      console.log(`Картинка пользователя ${userId} изменена на ОФФЛАЙН`);
    }
  });
};

onlineSocket.onopen = function() {
  console.log("Успешное подключение к вебсокету онлайн-статусов.");
};

onlineSocket.onclose = function() {
  console.log("Онлайн-статус WebSocket закрыт.");
};
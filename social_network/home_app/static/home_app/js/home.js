document.addEventListener("DOMContentLoaded", () => {
    const timeElements = document.querySelectorAll(".home-msg-time");
    const today = new Date().toDateString();

    timeElements.forEach(el => {
        const utcStr = el.dataset.utc;
        if (!utcStr) return;

        // Браузер автоматически переводит ISO-строку в локальную таймзону пользователя
        const localDate = new Date(utcStr);
        
        if (isNaN(localDate.getTime())) return; // Защита от пустых или битых дат

        let formattedTime = "";
        
        // Если даты совпадают — значит сообщение отправлено сегодня
        if (localDate.toDateString() === today) {
            formattedTime = localDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            // Если отправлено раньше — выводим дату в формате ДД.ММ.ГГГГ
            formattedTime = localDate.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
        }

        el.textContent = formattedTime;
    });
});
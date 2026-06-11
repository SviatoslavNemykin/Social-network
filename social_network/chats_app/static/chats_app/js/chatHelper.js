document.addEventListener("DOMContentLoaded", () => {
    const friendsContainer = document.getElementById("friendsList");
    const friends = [...document.querySelectorAll(".group-friend")];
    const searchInput = document.getElementById("group-search-input"); // Находим наш инпут поиска
    
    // Сортировка друзей
    friends.sort((a, b) => {
        let first = a.dataset.name.toLowerCase();
        let second = b.dataset.name.toLowerCase();
        return first.localeCompare(second);
    });

    // Очищаем список
    friendsContainer.innerHTML = "";
    
    let currentLetter = "";
    let currentGroupContainer = null; // Переменная для хранения текущего контейнера группы

    friends.forEach(friend => {
        let name = friend.dataset.name;
        let letter = name[0].toUpperCase();

        // Если начался список друзей на новую букву
        if (letter !== currentLetter) {
            currentLetter = letter;

            // 1. Создаем новый общий контейнер для буквы и её элементов
            currentGroupContainer = document.createElement("div");
            currentGroupContainer.className = "group-user-letters";

            // 2. Создаем заголовок буквы
            let title = document.createElement("div");
            title.className = "friend-letter";
            title.textContent = letter;

            // 3. Добавляем заголовок в контейнер группы
            currentGroupContainer.appendChild(title);

            // 4. Добавляем сам контейнер группы в главный список
            friendsContainer.appendChild(currentGroupContainer);
        }

        // Добавляем карточку друга в текущий активный контейнер группы
        if (currentGroupContainer) {
            currentGroupContainer.appendChild(friend);
        }
    });

    // ==========================================
    // ЛОГІКА МИТТЄВОГО ПОШУКУ
    // ==========================================
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            // Переводим введенный текст в нижний регистр и убираем пробелы по краям
            const query = searchInput.value.toLowerCase().trim();
            
            // Получаем все созданные контейнеры с буквами
            const letterGroups = friendsContainer.querySelectorAll(".group-user-letters");
            
            letterGroups.forEach(group => {
                const groupFriends = group.querySelectorAll(".group-friend");
                let hasVisibleFriends = false;
                
                groupFriends.forEach(friend => {
                    // Берем имя из data-name и переводим в нижний регистр для точного сравнения
                    const name = friend.dataset.name.toLowerCase();
                    
                    // Проверяем, начинается ли имя на то, что ввел пользователь
                    if (name.startsWith(query)) {
                        friend.style.display = ""; // Показываем пользователя
                        hasVisibleFriends = true;  // Отмечаем, что в этой группе есть совпадение
                    } else {
                        friend.style.display = "none"; // Скрываем пользователя
                    }
                });
                
                // Если в группе буквы остался хоть один видимый друг — показываем всю группу целиком.
                // Если совпадений нет — скрываем группу вместе с буквой-заголовком.
                if (hasVisibleFriends) {
                    group.style.display = "";
                } else {
                    group.style.display = "none";
                }
            });
        });
    }
});
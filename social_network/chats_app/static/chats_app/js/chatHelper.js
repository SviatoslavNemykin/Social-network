document.addEventListener("DOMContentLoaded", () => {
    const friendsContainer = document.getElementById("friendsList");
    const friends = [...document.querySelectorAll(".group-friend")];
    
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
});
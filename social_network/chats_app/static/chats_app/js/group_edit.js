// chats_app/static/chats_app/js/group_edit.js

document.addEventListener("DOMContentLoaded", () => {
    let isCurrentUserAdminInActiveChat = false;
    let activeChatId = null; // Храним ID текущего чата

    const modalAdmin = document.getElementById('modal-admin');
    const modalUser = document.getElementById('modal-user');
    const openSettingsBtn = document.querySelector('.chat-window-header-icon');
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    if (!openSettingsBtn || !modalAdmin || !modalUser) return;

    // Функция закрытия всех модалок настроек
    function closeAllSettingsModals() {
        modalAdmin.setAttribute('hidden', true);
        modalUser.setAttribute('hidden', true);
    }

    // Вызывается из chat.js при смене чата
    window.updateChatAdminStatus = function(isAdmin, chatId) {
        isCurrentUserAdminInActiveChat = !!isAdmin;
        activeChatId = chatId; 
        closeAllSettingsModals();
    };

    // Переключение (открыть/закрыть) при клике на иконку в шапке
    openSettingsBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        
        const isCurrentlyOpen = !modalAdmin.hidden || !modalUser.hidden;

        if (isCurrentlyOpen) {
            closeAllSettingsModals();
        } else {
            if (isCurrentUserAdminInActiveChat) {
                modalAdmin.removeAttribute('hidden');
            } else {
                modalUser.removeAttribute('hidden');
            }
        }
    });

    // Закрытие при клике по кнопке "Три точки" внутри самих модалок (если они там есть)
    document.querySelectorAll('.three-dots').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllSettingsModals();
        });
    });

    // Закрытие при клике в любое пустое место экрана
    document.addEventListener('click', (event) => {
        if (!modalAdmin.contains(event.target) && !modalUser.contains(event.target) && !openSettingsBtn.contains(event.target)) {
            closeAllSettingsModals();
        }
    });

    // ==========================================
    // ЛОГИКА ДЛЯ КНОПОК ДЕЙСТВИЙ (БЭКЕНД)
    // ==========================================

    // 1. Редактировать группу (Изменение названия)
    document.querySelectorAll('.js-edit-group-submit').forEach(btn => {
        btn.addEventListener('click', () => {
            const newName = prompt("Введіть нову назву групи:");
            if (!newName || !newName.trim()) return;

            const formData = new FormData();
            formData.append("name", newName.trim());

            fetch(`/chat/${activeChatId}/edit/`, {
                method: "POST",
                headers: { "X-CSRFToken": csrfToken },
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("Назву успішно змінено!");
                    location.reload(); // Перезагружаем для обновления сайдбара и заголовков
                } else {
                    alert("Помилка при зміні назви.");
                }
            });
        });
    });

    // 2. Покинуть группу
    document.querySelectorAll('.js-leave-group-submit').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!confirm("Ви впевнені, що хочете покинути цю групу?")) return;

            fetch(`/chat/${activeChatId}/leave/`, {
                method: "POST",
                headers: { "X-CSRFToken": csrfToken }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("Ви покинули групу.");
                    location.reload(); 
                }
            });
        });
    });

    // 3. Удалить чат (или группу полностью)
    document.querySelectorAll('.js-delete-chat-submit').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!confirm("Ви впевнені, що хочете видалити цей чат безповоротно?")) return;

            fetch(`/chat/${activeChatId}/delete/`, {
                method: "POST",
                headers: { "X-CSRFToken": csrfToken }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("Чат видалено.");
                    location.reload();
                }
            });
        });
    });
});
// chats_app/static/chats_app/js/group_edit.js

document.addEventListener("DOMContentLoaded", () => {
    let isCurrentUserAdminInActiveChat = false;
    let activeChatId = null;
    let localSelectedUserIds = []; // Хранит массив ID выбранных участников

    const menuAdmin = document.getElementById('modal-admin');
    const menuUser = document.getElementById('modal-user');
    const openSettingsBtn = document.querySelector('.chat-window-header-icon');
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    const formModal = document.getElementById('edit-group-form-modal');
    const stepDetails = document.getElementById('edit-group-step-details');
    const stepAddUsers = document.getElementById('edit-group-step-add-users');
    
    const editGroupNameInput = document.getElementById('edit-group-name');
    const currentMembersContainer = document.getElementById('edit-current-members-list');
    const friendsContainer = document.getElementById("editFriendsList");

    function closeAllMenus() {
        if (menuAdmin) menuAdmin.setAttribute('hidden', true);
        if (menuUser) menuUser.setAttribute('hidden', true);
    }

    function closeFormModal() {
        if (formModal) formModal.setAttribute('hidden', true);
        if (stepDetails) stepDetails.hidden = false;
        if (stepAddUsers) stepAddUsers.hidden = true;
    }

    // Вызывается из chat.js при переключении комнат
    window.updateChatAdminStatus = function(isAdmin, chatId) {
        isCurrentUserAdminInActiveChat = !!isAdmin;
        activeChatId = chatId; 
        closeAllMenus();
        closeFormModal();
    };

    if (openSettingsBtn) {
        openSettingsBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            if (!activeChatId) return;

            const isCurrentlyOpen = (menuAdmin && !menuAdmin.hidden) || (menuUser && !menuUser.hidden);
            if (isCurrentlyOpen) {
                closeAllMenus();
            } else {
                if (isCurrentUserAdminInActiveChat && menuAdmin) {
                    menuAdmin.removeAttribute('hidden');
                } else if (menuUser) {
                    menuUser.removeAttribute('hidden');
                }
            }
        });
    }

    // Делегирование клика на "Редагувати групу"
    document.body.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.js-edit-group-submit');
        if (editBtn) {
            e.stopPropagation();
            closeAllMenus(); 
            loadGroupDataAndOpenForm(); 
        }
    });

    // Загрузка данных группы И контактов из бэкенда
    function loadGroupDataAndOpenForm() {
        if (!activeChatId) return;

        fetch(`/chat/${activeChatId}/edit/`)
        .then(res => {
            if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (data.success) {
                if (editGroupNameInput) editGroupNameInput.value = data.name;
                localSelectedUserIds = data.users.map(u => parseInt(u.id));
                
                // 1. Рендерим панель 1 (текущие участники)
                renderCurrentMembers(data.users);
                
                // 2. Рендерим панель 2 (динамически строим список друзей из контактов)
                renderFriendsListFromContacts(data.friends);
                
                if (formModal) formModal.removeAttribute('hidden'); 
            } else {
                alert("Доступ заборонено.");
            }
        })
        .catch(err => {
            console.error("Ошибка при получении данных:", err);
        });
    }

    // Рендер списка участников на Панели 1
    function renderCurrentMembers(users) {
        if (!currentMembersContainer) return;
        currentMembersContainer.innerHTML = "";
        
        const currentEmail = document.getElementById("currentUserEmail")?.value || "";

        users.forEach(user => {
            const row = document.createElement('div');
            row.className = "selected-user";
            row.innerHTML = `
                <div class="selected-user-info">
                    <img class="img-placeholder" src="/static/chats_app/images/Avatar.svg">
                    <p class="contacts-name">${user.username}</p>
                </div>
                <button class="remove-user-btn" type="button" data-id="${user.id}">
                    <img src="/static/chats_app/images/Component%205%20(10).svg" alt="Видалити">
                </button>
            `;
            
            const removeBtn = row.querySelector('.remove-user-btn');
            if (user.username === currentEmail && removeBtn) {
                removeBtn.style.display = "none"; // Себя удалять нельзя
            }

            if (removeBtn) {
                removeBtn.addEventListener('click', function() {
                    const uid = parseInt(this.dataset.id);
                    localSelectedUserIds = localSelectedUserIds.filter(id => id !== uid);
                    row.remove();
                    
                    // Синхронизируем чекбокс на второй панели, если она отрендерена
                    const cb = friendsContainer?.querySelector(`.edit-group-user-checkbox[value="${uid}"]`);
                    if (cb) cb.checked = false;
                    updateEditCheckboxesCount();
                });
            }
            currentMembersContainer.appendChild(row);
        });
    }

    // Динамическая генерация списка друзей (Контактов) по алфавиту на Панели 2
    function renderFriendsListFromContacts(friends) {
        if (!friendsContainer) return;
        friendsContainer.innerHTML = "";

        // Сортируем полученных из get_friends людей по алфавиту
        friends.sort((a, b) => a.first_name.toLowerCase().localeCompare(b.first_name.toLowerCase()));

        let currentLetter = "";
        let currentGroupContainer = null;

        friends.forEach(friend => {
            let name = friend.first_name || "Користувач";
            let letter = name[0] ? name[0].toUpperCase() : "?";

            if (letter !== currentLetter) {
                currentLetter = letter;
                currentGroupContainer = document.createElement("div");
                currentGroupContainer.className = "group-user-letters";

                let title = document.createElement("div");
                title.className = "friend-letter";
                title.textContent = letter;

                currentGroupContainer.appendChild(title);
                friendsContainer.appendChild(currentGroupContainer);
            }

            // Создаем элемент друга
            const label = document.createElement("label");
            label.className = "group-friend";
            label.dataset.name = name;
            label.innerHTML = `
                <div class="group-friend-info">
                    <img class="img-placeholder" src="/static/chats_app/images/Avatar.svg">
                    <p class="contacts-name">${name}</p>
                </div>
                <input class="edit-group-user-checkbox" type="checkbox" value="${friend.id}" ${friend.is_member ? 'checked' : ''}>
            `;

            if (currentGroupContainer) {
                currentGroupContainer.appendChild(label);
            }
        });

        updateEditCheckboxesCount();
    }

    function updateEditCheckboxesCount() {
        const count = document.querySelectorAll(".edit-group-user-checkbox:checked").length;
        const counterEl = document.getElementById('edit-selected-count');
        if (counterEl) counterEl.textContent = count;
    }

    if (friendsContainer) {
        friendsContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('edit-group-user-checkbox')) {
                updateEditCheckboxesCount();
            }
        });
    }

    // Переключение панелей модалки
    const addParticipantTrigger = document.getElementById('edit-add-participant-trigger');
    if (addParticipantTrigger) {
        addParticipantTrigger.addEventListener('click', () => {
            if (stepDetails) stepDetails.hidden = true;
            if (stepAddUsers) stepAddUsers.hidden = false;
            updateEditCheckboxesCount();
        });
    }

    // Подтверждение выбора (Панель 2 -> Панель 1)
    const confirmAddUsersBtn = document.getElementById('edit-confirm-add-users');
    if (confirmAddUsersBtn) {
        confirmAddUsersBtn.addEventListener('click', () => {
            const checkedBoxes = document.querySelectorAll(".edit-group-user-checkbox:checked");
            localSelectedUserIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
            
            if (stepAddUsers) stepAddUsers.hidden = true;
            if (stepDetails) stepDetails.hidden = false;
            
            const updatedUsers = Array.from(checkedBoxes).map(cb => {
                const label = cb.closest('.group-friend');
                return {
                    id: parseInt(cb.value),
                    username: label ? label.dataset.name : "Користувач"
                };
            });
            renderCurrentMembers(updatedUsers);
        });
    }

    const closeAddPanel = () => { 
        if (stepAddUsers) stepAddUsers.hidden = true; 
        if (stepDetails) stepDetails.hidden = false; 
    };
    const cancelAddUsersBtn = document.getElementById('edit-cancel-add-users');
    const cancelAddUsersX = document.getElementById('edit-cancel-add-users-x');
    if (cancelAddUsersBtn) cancelAddUsersBtn.addEventListener('click', closeAddPanel);
    if (cancelAddUsersX) cancelAddUsersX.addEventListener('click', closeAddPanel);

    // Сохранение изменений (POST)
    const saveGroupChangesBtn = document.getElementById('edit-save-group-changes');
    if (saveGroupChangesBtn) {
        saveGroupChangesBtn.addEventListener('click', () => {
            const nameValue = editGroupNameInput ? editGroupNameInput.value.trim() : "";
            if (!nameValue) {
                alert("Назва групи не може бути порожньою!");
                return;
            }

            const formData = new FormData();
            formData.append("name", nameValue);
            localSelectedUserIds.forEach(id => formData.append("users", id));

            fetch(`/chat/${activeChatId}/edit/`, {
                method: "POST",
                headers: { "X-CSRFToken": csrfToken },
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("Зміни успішно збережено!");
                    location.reload();
                } else {
                    alert("Помилка при збереженні.");
                }
            })
            .catch(err => console.error("Ошибка при сохранении:", err));
        });
    }

    document.querySelectorAll('.js-close-edit-form-modal').forEach(btn => {
        btn.addEventListener('click', closeFormModal);
    });

    // Живой поиск
    const searchInput = document.getElementById("edit-group-search-input");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase().trim();
            const letterGroups = document.querySelectorAll("#editFriendsList .group-user-letters");
            
            letterGroups.forEach(group => {
                const groupFriends = group.querySelectorAll(".group-friend");
                let hasVisibleFriends = false;
                
                groupFriends.forEach(friend => {
                    const name = (friend.dataset.name || "").toLowerCase();
                    if (name.startsWith(query)) {
                        friend.style.display = "";
                        hasVisibleFriends = true;
                    } else {
                        friend.style.display = "none";
                    }
                });
                group.style.display = hasVisibleFriends ? "" : "none";
            });
        });
    }

    document.addEventListener('click', (event) => {
        if (menuAdmin && menuUser && openSettingsBtn) {
            if (!menuAdmin.contains(event.target) && !menuUser.contains(event.target) && !openSettingsBtn.contains(event.target)) {
                closeAllMenus();
            }
        }
    });
});
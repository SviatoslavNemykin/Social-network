// const menuItems = document.querySelectorAll('.menu-item');


// menuItems.forEach(item => {
//     item.addEventListener('click', function(){
//         // Используем querySelector (без "All"), чтобы найти один активный элемент
//         const currentActive = document.querySelector('.menu-item.active');
        
//         // Если такой элемент найден, удаляем у него класс
//         if (currentActive) {
//             currentActive.classList.remove('active');
//         }
        
//         // Добавляем класс текущей кнопке
//         this.classList.add('active');
//     });
// });

const buttons = document.querySelectorAll('.menu-item');
const viewAllButtons = document.querySelectorAll('.friends-block-link');

const blocks = {
    main: document.getElementById('mainBlock'),
    requests: document.getElementById('requestsBlock'),
    recomendations: document.getElementById('recomendationsBlock'),
    friends: document.getElementById('friendsBlock'),
};

const map = {
    'menu-item-main': 'main',
    'menu-item-requests': 'requests',
    'menu-item-recomendations': 'recomendations',
    'menu-item-friends': 'friends',
};

function showBlock(key) {
    Object.values(blocks).forEach(block => {
        block.style.display = 'none';
    });

    blocks[key].style.display = 'flex';
}

function setActiveMenu(key) {
    buttons.forEach(btn => btn.classList.remove('active'));

    const activeBtn = document.querySelector(`[data-menu="${key}"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

// обычные кнопки меню
buttons.forEach(button => {
    button.setAttribute('data-menu', map[button.id]);

    button.addEventListener('click', () => {
        const key = map[button.id];
        showBlock(key);

        buttons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    });
});

// кнопки "Дивитись всі"
viewAllButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const key = btn.dataset.target;

        showBlock(key);
        setActiveMenu(key);
    });
});
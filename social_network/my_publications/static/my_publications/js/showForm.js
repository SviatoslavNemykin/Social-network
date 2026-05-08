let styleAdded = false;
let styleTag;

function toggleStyleTag() {
    if (!styleAdded) {
        document.getElementById('create-publication').style.display = 'flex';
        styleTag = document.createElement("style");
        styleTag.innerHTML = `
            body::before {
            content: "";
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5); 
            z-index: 2;
            pointer-events: none; 
            }
        `;
        document.head.appendChild(styleTag);
        styleAdded = true;
    } else {
        document.getElementById('create-publication').style.display = 'none';
        styleTag.remove();
        styleAdded = false;
    }
}

function newTag() {
    document.getElementById('create-publication').style.display = 'none';
    styleAdded = false;
}


const linksDiv = document.getElementById('linksList')

document.getElementById('addLink').addEventListener('click', function () {

    // контейнер
    const wrapper = document.createElement('div')
    wrapper.classList.add('link-item')

    // input
    const input = document.createElement('input')
    input.type = 'url'
    input.name = 'links'
    input.classList.add('form-input')
    input.placeholder = 'Напишіть посилання'

    // кнопка удаления
    const deleteBtn = document.createElement('button')
    deleteBtn.type = 'button'
    deleteBtn.classList.add('delete-btn')
    deleteBtn.style.all = 'unset' 
    deleteBtn.style.marginBottom = '2px'

    // картинка
    const img = document.createElement('img')
    img.src = '/static/my_publications/images/trash.svg' // путь к картинке
    img.alt = 'Удалить'
    img.style.width = '28px'


    deleteBtn.appendChild(img)

    // удаление
    deleteBtn.addEventListener('click', function () {
        wrapper.remove()
    })

    // добавление
    wrapper.appendChild(input)
    wrapper.appendChild(deleteBtn)

    linksDiv.appendChild(wrapper)
})


function newTag() {
    document.getElementById('new-tag-modal').style.display = 'flex'
    document.getElementById('create-publication').style.display = 'none';
    styleAdded = false;
}

function closeTagModal() {
    document.getElementById('new-tag-modal').style.display = 'none'
    toggleStyleTag()
}

function addNewTag() {

    const input = document.getElementById('newTagInput')
    let value = input.value.trim()

    if (value === '') return

    // добавляем #
    if (!value.startsWith('#')) {
        value = '#' + value
    }

    // создаем тег
    const tag = document.createElement('p')

    tag.textContent = value
    tag.classList.add('tag-selected')

    // контейнер тегов
    const tagsContainer = document.querySelector('.form-tags')

    // кнопка +
    const addButton = document.querySelector('.new-tag')

    // вставляем перед кнопкой
    tagsContainer.insertBefore(tag, addButton)

    // очистка
    input.value = ''

    // закрытие модалки
    closeTagModal()
}
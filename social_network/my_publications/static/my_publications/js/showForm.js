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
    // styleAdded = false;
}

function closeTagModal() {
    document.getElementById('new-tag-modal').style.display = 'none'
    // toggleStyleTag()
    document.getElementById('create-publication').style.display = 'flex';
}
const selectedTagsInput = document.getElementById('selectedTags');

const selected = [];

function addNewTag() {

    const input = document.getElementById('newTagInput')
    let value = input.value.trim()

    if (value === '') return

    // добавляем #
    if (!value.startsWith('#')) {
        value = '#' + value
    }
    
    selected.push(value);
    selectedTagsInput.value = JSON.stringify(selected);

    // создаем тег
    const tag = document.createElement('button')

    tag.textContent = value
    tag.classList.add('tag-selected')
    tag.type = 'button'
    tag.dataset.tag = value

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





function updateSelectedTags() {
    document.querySelectorAll('.tag-selected').forEach(tag => {
        selected.push(tag.dataset.tag);
    });

    selectedTagsInput.value = JSON.stringify(selected);
}


// EVENT DELEGATION
document.querySelector('.form-tags').addEventListener('click', function (e) {

    // проверяем что клик был по тегу
    if (e.target.classList.contains('tag') || e.target.classList.contains('tag-selected')) {

        if (e.target.classList.contains('tag-selected')) {
            console.log(e.target.dataset.tag);
            if(selected.indexOf(e.target.dataset.tag) !== -1){
                selected.splice(selected.indexOf(e.target.dataset.tag), 1);
            }
            e.target.classList.remove('tag-selected');
            e.target.classList.add('tag');

        } else {

            e.target.classList.remove('tag');
            e.target.classList.add('tag-selected');

        }

        updateSelectedTags();
    }

});

const fileInput = document.getElementById('file-input');
const preview = document.getElementById('imagePreview');

// храним файлы вручную
let filesArray = [];

fileInput.addEventListener('change', function (e) {

    const newFiles = Array.from(e.target.files);

    newFiles.forEach(file => {
        filesArray.push(file);
    });

    renderImages();

    updateInputFiles();
});

function renderImages() {

    preview.innerHTML = '';

    filesArray.forEach((file, index) => {

        const reader = new FileReader();

        reader.onload = function (e) {

            const div = document.createElement('div');
            div.classList.add('image-item');

            div.innerHTML = `
                <img src="${e.target.result}">
                <button type="button" data-index="${index}" style="margin: 0px;padding: 0px;"><img src="/static/my_publications/images/trash.svg" style="width: 28px;"></button>
            `;

            preview.appendChild(div);
        };

        reader.readAsDataURL(file);
    });
}

// удаление картинки
preview.addEventListener('click', function (e) {

    const button = e.target.closest('button');

    if (!button) return;

    const index = button.dataset.index;

    filesArray.splice(index, 1);

    renderImages();

    updateInputFiles();
});

// обновляем input.files
function updateInputFiles() {

    const dataTransfer = new DataTransfer();

    filesArray.forEach(file => {
        dataTransfer.items.add(file);
    });

    fileInput.files = dataTransfer.files;
}

function getCSRFToken() {
  return document
    .querySelector('meta[name="csrf-token"]')
    .getAttribute("content");
}


document.getElementById('createPostForm').addEventListener("submit", (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  fetch(form.action, {
    method: "POST",
    headers: {
      "X-CSRFToken": getCSRFToken(),
      "X-Requested-With": "XMLHttpRequest",
    },
    body: formData,
  })
    .then(async (response) => {
        const data = await response.json()

        if (!response.ok){
            throw data;
        }
        return data  
    })
    .then((data) => {
    if (data.redirect_url) {
        window.location.href = data.redirect_url;
    }
})
    .catch((data) => {
        if (data.errors){
            console.log(data.errors);
        }
    })
});
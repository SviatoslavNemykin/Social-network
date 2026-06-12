// chats_app/static/chats_app/js/sendImages.js

const messageImagesInput = document.querySelector("#messageImages");
const messageImageButton = document.querySelector("#messageImageButton");
const imagePreviewContainer = document.querySelector("#imagePreviewContainer");

// НАШ МАССИВ-ХРАНИЛИЩЕ: сюда будут складываться ВСЕ выбранные картинки
let selectedImagesArray = [];

function hasSelectedImages() {
    return selectedImagesArray.length > 0;
}

function clearSelectedImages() {
    selectedImagesArray = []; // Очищаем наш массив
    messageImagesInput.value = ""; // Сбрасываем инпут
    imagePreviewContainer.innerHTML = "";
    imagePreviewContainer.style.display = "none";
}

// Рендеринг превью на основе нашего массива selectedImagesArray
function renderPreviews() {
    imagePreviewContainer.innerHTML = ""; // Очищаем старый интерфейс

    if (selectedImagesArray.length > 0) {
        imagePreviewContainer.style.display = "flex";
        
        selectedImagesArray.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewItem = document.createElement("div");
                previewItem.className = "preview-image-item";
                previewItem.style.position = "relative";

                previewItem.innerHTML = `
                    <img src="${e.target.result}" style="width: 65px; height: 65px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd;">
                    <span class="remove-preview-btn" data-index="${index}" style="position: absolute; top: -6px; right: -6px; background: #ff4d4d; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">✕</span>
                `;
                imagePreviewContainer.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    } else {
        imagePreviewContainer.style.display = "none";
    }
}

// Отслеживаем выбор файлов: добавляем новые к уже существующим
messageImagesInput.addEventListener("change", function() {
    const newFiles = Array.from(this.files);
    
    // Плюсуем новые файлы в наше постоянное хранилище
    selectedImagesArray = selectedImagesArray.concat(newFiles);
    
    // Перерисовываем превью
    renderPreviews();
    
    // Сбрасываем сам инпут, чтобы можно было выбрать ту же самую картинку повторно
    this.value = ""; 
});

// Удаление конкретной картинки по клику на крестик
imagePreviewContainer.addEventListener("click", function(e) {
    if (e.target.classList.contains("remove-preview-btn")) {
        const indexToRemove = parseInt(e.target.dataset.index);
        
        // Удаляем элемент из нашего массива по индексу
        selectedImagesArray.splice(indexToRemove, 1);
        
        // Обновляем превью
        renderPreviews();
    }
});

// Отправка на бэкенд
async function sendMessageWithImages(text) {
    const activeChatId = window.currentActiveChatId;
    if (!activeChatId) return { success: false, error: "No active chat" };

    const formData = new FormData();
    formData.append("text", text);
    
    // Передаем файлы из нашего надежного массива selectedImagesArray
    selectedImagesArray.forEach((image) => {
        formData.append("images", image);
    });

    const response = await fetch(`/chat/upload_images/${activeChatId}/`, {
        method: "POST",
        headers: { "X-CSRFToken": csrfToken },
        body: formData,
    });
    return response.json();
}

messageImageButton.addEventListener("click", () => {
    messageImagesInput.click();
});

window.hasSelectedImages = hasSelectedImages;
window.sendMessageWithImages = sendMessageWithImages;
window.clearSelectedImages = clearSelectedImages;
/**
 * home.js - Логика интерактивности главной страницы и обработки переходов
 */

document.addEventListener("DOMContentLoaded", () => {
    console.log("Home JS успешно загружен и инициализирован.");

    const handleTabActivation = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const activeTab = urlParams.get('tab');

        if (activeTab === 'requests') {

            const requestsTabButton = document.getElementById('requests-tab-btn') || document.querySelector('[data-tab="requests"]');
            if (requestsTabButton) {
                requestsTabButton.click();
            }
        }
    };

    handleTabActivation();

    const requestItems = document.querySelectorAll('.requests-list .request-item');
    requestItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const destination = item.getAttribute('href');
            if (destination && destination !== '#') {
                logger(`Переход к профилю пользователя: ${destination}`);
            }
        });
    });
});

/**
 * Логгер для отладки
 */
function logger(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
}
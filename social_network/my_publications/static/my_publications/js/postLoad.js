let currentPage = 1;
let isLoading = false;

const postList = document.querySelector(".posts-list");
const sentinel = document.getElementById("post-load-sentinel");

const observer = new IntersectionObserver(async (entries) => {
  if (entries[0].isIntersecting && isLoading == false) {
    isLoading = true;
    currentPage++;
    const response = await fetch(
      `${window.location.pathname}?page=${currentPage}`,
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    );
    const data = await response.json();

    if (data.html) {
      // 1. Вставляем новые посты в DOM
      postList.insertAdjacentHTML("beforeend", data.html);
      
      // 2. Проверяем, загружен ли скрипт онлайна, и обновляем статусы для новых постов
      if (typeof window.syncOnlineStatuses === 'function') {
        window.syncOnlineStatuses();
      }
    }

    if (!data.has_next) {
      observer.disconnect();
      sentinel.remove();
    }

    isLoading = false;
  }
}, {rootMargin: "200px"});

if (sentinel) {
    observer.observe(sentinel);
}
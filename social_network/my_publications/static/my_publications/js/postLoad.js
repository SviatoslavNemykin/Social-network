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
      postList.insertAdjacentHTML("beforeend", data.html);
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


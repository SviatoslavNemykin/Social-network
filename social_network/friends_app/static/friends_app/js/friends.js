const menuButtons = document.querySelectorAll(".menu-item");

const openSectionButtons = document.querySelectorAll(
    "[data-open-section]"
);


const blocks = {
    main: document.getElementById("mainBlock"),

    requests: document.getElementById("requestsBlock"),

    recommendations: document.getElementById("recommendationsBlock"),

    friends: document.getElementById("friendsBlock"),
};



const state = {
    requests: {
        page: 1,
        loaded: false,
        hasNext: true,
        isLoading: false,
    },

    recommendations: {
        page: 1,
        loaded: false,
        hasNext: true,
        isLoading: false,
    },

    friends: {
        page: 1,
        loaded: false,
        hasNext: true,
        isLoading: false,
    },
};



function showBlock(key) {

    Object.values(blocks).forEach(block => {
        block.style.display = "none";
    });

    blocks[key].style.display = "flex";

    setActiveMenu(key);
}



function setActiveMenu(key) {

    menuButtons.forEach(btn => {
        btn.classList.remove("active");
    });

    const activeBtn = document.querySelector(
        `[data-menu="${key}"]`
    );

    if (activeBtn) {
        activeBtn.classList.add("active");
    }
}



async function loadSection(section) {

    const sectionState = state[section];

    if (sectionState.isLoading) return;

    if (!sectionState.hasNext) return;

    sectionState.isLoading = true;

    const response = await fetch(
        `/friends/${section}/?page=${sectionState.page}`,
        {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        }
    );

    const data = await response.json();

    const list = document.getElementById(
        `${section}List`
    );

    list.insertAdjacentHTML(
        "beforeend",
        data.html
    );

    sectionState.page++;

    sectionState.hasNext = data.has_next_page;

    sectionState.loaded = true;

    sectionState.isLoading = false;
}



async function openSection(section) {

    showBlock(section);

    const sectionState = state[section];

    if (!sectionState.loaded) {
        await loadSection(section);
    }
}



menuButtons.forEach(button => {

    button.addEventListener("click", async () => {

        const key = button.dataset.menu;

        showBlock(key);

        if (key !== "main") {

            const sectionState = state[key];

            if (!sectionState.loaded) {
                await loadSection(key);
            }
        }
    });
});



openSectionButtons.forEach(button => {

    button.addEventListener("click", async () => {

        const section = button.dataset.openSection;

        await openSection(section);
    });
});



const observer = new IntersectionObserver(
    async entries => {

        for (const entry of entries) {

            if (!entry.isIntersecting) continue;

            const section = entry.target.dataset.section;

            const block = blocks[section];

            const isVisible =
                block.style.display !== "none";

            if (!isVisible) continue;

            await loadSection(section);
        }
    },
    {
        rootMargin: "300px",
    }
);



document
    .querySelectorAll(".load-sentinel")
    .forEach(sentinel => {
        observer.observe(sentinel);
    });
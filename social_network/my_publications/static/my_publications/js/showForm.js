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

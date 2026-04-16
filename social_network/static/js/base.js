const currentUrl = window.location.pathname;
const links = document.querySelectorAll('.navbar-url');

links.forEach(link =>{
    if (link.getAttribute('href') === currentUrl){
        link.classList.add('darkened')
    }
})
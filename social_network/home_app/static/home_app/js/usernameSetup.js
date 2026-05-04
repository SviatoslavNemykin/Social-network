// document.getElementsByClassName('username-setup-form')[0].addEventListener("submit", (e) => {
//   e.preventDefault();

//   const form = e.target;
//   const formData = new FormData(form);

//   fetch(form.action, {
//     method: "POST",
//     headers: {
//       "X-CSRFToken": getCSRFToken(),
//       "X-Requested-With": "XMLHttpRequest",
//     },
//     body: formData,
//   })
//     .then(async (response) => {
//         const data = await response.json()

//         if (!response.ok){
//             throw data;
//         }
//         return data  
//     })
//     .then((data) => {
//     if (data.redirect_url) {
//         window.location.href = data.redirect_url;
//     }
// })
//     .catch((data) => {
//         if (data.errors){
//             console.log(data.errors);
//         }
//     })
// });

function showAuth() {
    document.getElementById('auth-block').style.display = 'flex';
    document.getElementById('reg-block').style.display = 'none';
    document.getElementById('email-block').style.display = 'none';
}

function showReg() {
    document.getElementById('auth-block').style.display = 'none';
    document.getElementById('reg-block').style.display = 'flex';
    document.getElementById('email-block').style.display = 'none';
}

function showConfirm() {
    document.getElementById('auth-block').style.display = 'none';
    document.getElementById('reg-block').style.display = 'none';
    document.getElementById('email-block').style.display = 'flex';
}

function showPass(el) {
    const input = el.closest(".input").querySelector("input");

    input.type = input.type === "password" ? "text" : "password";
}


const inputs = document.querySelectorAll('.code-inputs input');

inputs.forEach((input, index) => {
    input.addEventListener('input', () => {
        if (input.value.length === 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
            inputs[index - 1].focus();
        }
    });
});

function getCSRFToken() {
  return document
    .querySelector('meta[name="csrf-token"]')
    .getAttribute("content");
}


document.getElementById('authForm').addEventListener("submit", (e) => {
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

document.getElementById('regForm').addEventListener("submit", (e) => {
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

document.getElementById('confForm').addEventListener("submit", (e) => {
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

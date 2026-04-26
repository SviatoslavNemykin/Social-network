
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

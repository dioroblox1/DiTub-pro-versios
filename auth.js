function applyTheme(t) {
    document.body.className = t;
    localStorage.setItem('diTheme', t);
}

function checkUser() {
    const data = localStorage.getItem('diUser');
    if (data) {
        const user = JSON.parse(data);
        document.getElementById('userArea').innerHTML = `<img src="${user.avatar}" style="width:32px; height:32px; border-radius:50%; border:2px solid red">`;
        document.getElementById('settingsArea').classList.remove('hidden');
        document.getElementById('welcomeMsg').innerText = "Привет, " + user.login;
        document.getElementById('uploadWin').classList.remove('hidden');
        document.getElementById('authorInp').value = user.login;
    }
}

async function auth(type) {
    const login = document.getElementById('log').value;
    const pass = document.getElementById('pas').value;
    if (!login || !pass) return alert("Заполни поля!");

    const res = await fetch('/' + type, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ login, pass })
    });
    if (res.ok) {
        const user = await res.json();
        localStorage.setItem('diUser', JSON.stringify(user));
        location.reload();
    } else alert("Ошибка!");
}

function logout() { localStorage.removeItem('diUser'); location.reload(); }
document.addEventListener('DOMContentLoaded', checkUser);

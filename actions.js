// actions.js — Финальная логика Di Tub ULTIMATE

// 1. Регистрация просмотра
async function registerView(id) {
    await fetch('/view/' + id, { method: 'POST' });
}

// 2. Лайки на ВИДЕО
async function likeVideo(id) {
    const user = JSON.parse(localStorage.getItem('diUser') || '{}');
    if(!user.login) return alert("Войдите в аккаунт!");
    
    await fetch('/like/' + id, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ login: user.login }) 
    });
    loadVideos(); // Обновляем цифры на странице
}

// 3. Лайки на КОММЕНТАРИИ
async function commentLike(vId, cId) {
    const user = JSON.parse(localStorage.getItem('diUser') || '{}');
    if(!user.login) return alert("Войдите в аккаунт!");

    await fetch(`/action/${vId}/${cId}/like`, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ login: user.login })
    });
    loadVideos();
}

// 4. Лайки на ОТВЕТЫ (Replies) — Твоя новая фича!
async function replyLike(vId, cId, rId) {
    const user = JSON.parse(localStorage.getItem('diUser') || '{}');
    if(!user.login) return alert("Войдите в аккаунт!");

    await fetch(`/action/${vId}/${cId}/likeReply`, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ login: user.login, rId: rId })
    });
    loadVideos();
}

// 5. Удаление видео
async function deleteVideo(id, author) {
    const user = JSON.parse(localStorage.getItem('diUser') || '{}');
    if (user.login !== author) return alert('Это не твое видео!');
    
    if (confirm('Удалить видео навсегда?')) {
        const res = await fetch('/delete-video/' + id, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: user.login })
        });
        if (res.ok) loadVideos();
    }
}

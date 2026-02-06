// search.js — Логика поиска для Di Tub SUPREME

function searchVideos() {
    // Получаем поле поиска по его ID
    const input = document.getElementById('di_phantom_search');
    if (!input) return;

    // Очищаем пробелы и переводим в нижний регистр для точности
    const query = input.value.trim().toLowerCase();
    
    // Ищем сразу все типы карточек: и обычные, и шортсы
    const allCards = document.querySelectorAll('.card, .short-card');

    // Если в поиске пусто — показываем вообще всё
    if (query === "") {
        allCards.forEach(card => {
            card.style.display = 'block';
        });
        return;
    }

    // Фильтруем карточки по заголовку
    allCards.forEach(card => {
        const titleElement = card.querySelector('.v-title');
        
        if (titleElement) {
            const title = titleElement.innerText.toLowerCase();
            
            // Если запрос найден в названии — оставляем карточку, иначе скрываем
            if (title.includes(query)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

// Очистка при перезагрузке, чтобы браузер не подставлял старое
window.addEventListener('load', () => {
    const searchField = document.getElementById('di_phantom_search');
    if (searchField) {
        searchField.value = "";
    }
});

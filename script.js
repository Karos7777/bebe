document.addEventListener('DOMContentLoaded', function () {
    console.log("WebApp Отсчет: DOMContentLoaded. Script version 3.2");

    const tg = window.Telegram?.WebApp;

    // DOM элементы для секции создания
    const createCountdownSection = document.getElementById('createCountdownSection');
    const daysInput = document.getElementById('daysInput');
    const notificationTimeInput = document.getElementById('notificationTimeInput');
    const prepareCountdownButton = document.getElementById('prepareCountdownButton');
    const creationMessage = document.getElementById('creationMessage');

    // DOM элементы для секции активного отсчета
    const activeCountdownSection = document.getElementById('activeCountdownSection');
    const daysRemainingEl = document.getElementById('daysRemaining');
    const hoursRemainingEl = document.getElementById('hoursRemaining');
    const minutesRemainingEl = document.getElementById('minutesRemaining');
    const secondsRemainingEl = document.getElementById('secondsRemaining');
    const endDateDisplayEl = document.getElementById('endDateDisplay');
    const notificationTimeDisplayEl = document.getElementById('notificationTimeDisplay');
    const stopCountdownButton = document.getElementById('stopCountdownButton');
    const createNewCountdownButton = document.getElementById('createNewCountdownButton');
    const activeMessage = document.getElementById('activeMessage');

    let countdownInterval; // Для хранения интервала обновления таймера
    let mainButtonClickHandler; // Для хранения текущего обработчика MainButton

    function showSection(sectionName) {
        if (sectionName === 'create') {
            createCountdownSection.style.display = 'block';
            activeCountdownSection.style.display = 'none';
            if (tg?.MainButton) tg.MainButton.hide();
        } else if (sectionName === 'active') {
            createCountdownSection.style.display = 'none';
            activeCountdownSection.style.display = 'block';
            if (tg?.MainButton) tg.MainButton.hide();
        }
    }

    function updateCountdownDisplay(endDateStr) {
        clearInterval(countdownInterval);

        const endDate = new Date(endDateStr);

        function calculateAndDisplay() {
            const now = new Date();
            const timeLeft = endDate - now;

            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                daysRemainingEl.textContent = '00';
                hoursRemainingEl.textContent = '00';
                minutesRemainingEl.textContent = '00';
                secondsRemainingEl.textContent = '00';
                activeMessage.textContent = "Время вышло!";
                return;
            }

            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            daysRemainingEl.textContent = String(days).padStart(2, '0');
            hoursRemainingEl.textContent = String(hours).padStart(2, '0');
            minutesRemainingEl.textContent = String(minutes).padStart(2, '0');
            secondsRemainingEl.textContent = String(seconds).padStart(2, '0');
        }

        calculateAndDisplay();
        countdownInterval = setInterval(calculateAndDisplay, 1000);
    }

    // Функция для удаления предыдущего обработчика и добавления нового
    function setMainButtonHandler(handler) {
        if (tg && tg.MainButton) {
            // Удаляем предыдущий обработчик, если он был
            if (mainButtonClickHandler) {
                tg.MainButton.offClick(mainButtonClickHandler);
            }
            // Сохраняем и устанавливаем новый обработчик
            mainButtonClickHandler = handler;
            tg.MainButton.onClick(mainButtonClickHandler);
        }
    }

    // Функция для обработки сообщений от бота
    function handleBotMessage(messageText) {
        console.log("Получено сообщение от бота:", messageText);
        
        // Ищем JSON в сообщении (может быть обернут в <code> теги)
        let jsonData = null;
        
        // Попытка найти JSON в тегах <code>
        const codeMatch = messageText.match(/<code>(.*?)<\/code>/);
        if (codeMatch) {
            try {
                jsonData = JSON.parse(codeMatch[1]);
            } catch (e) {
                console.log("Не удалось распарсить JSON из code тегов");
            }
        }
        
        // Если не нашли в тегах, попробуем распарсить весь текст
        if (!jsonData) {
            try {
                jsonData = JSON.parse(messageText);
            } catch (e) {
                console.log("Сообщение не содержит валидного JSON");
                return;
            }
        }
        
        console.log("Распарсенные данные от бота:", jsonData);
        
        if (jsonData.action === "countdown_started" && jsonData.endDate) {
            showSection('active');
            updateCountdownDisplay(jsonData.endDate);
            endDateDisplayEl.textContent = `Завершение: ${new Date(jsonData.endDate).toLocaleString('ru-RU')}`;
            notificationTimeDisplayEl.textContent = `Уведомления в: ${jsonData.notificationTime || '10:00'}`;
            if (tg?.MainButton) {
                tg.MainButton.hideProgress();
                tg.MainButton.hide();
            }
        } else if (jsonData.action === "countdown_stopped") {
            showSection('create');
            daysInput.value = '';
            notificationTimeInput.value = '10:00';
            creationMessage.textContent = "Отсчет остановлен. Можете создать новый.";
            if (tg?.MainButton) tg.MainButton.hide();
        }
    }

    // Инициализация Telegram Web App
    if (tg) {
        console.log("Telegram WebApp API доступно.");
        tg.ready();
        tg.expand();
        
        const startParam = tg.initDataUnsafe?.start_param;
        if (startParam) {
            try {
                const initialData = JSON.parse(decodeURIComponent(startParam));
                console.log("Получены данные из start_param:", initialData);
                if (initialData.action === "show_active_countdown" && initialData.endDate) {
                    showSection('active');
                    updateCountdownDisplay(initialData.endDate);

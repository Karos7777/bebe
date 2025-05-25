document.addEventListener('DOMContentLoaded', function () {
    console.log("WebApp Отсчет: DOMContentLoaded. Script version 3.4"); // Версия обновлена

    const tg = window.Telegram?.WebApp;

    const createCountdownSection = document.getElementById('createCountdownSection');
    const daysInput = document.getElementById('daysInput');
    const notificationTimeInput = document.getElementById('notificationTimeInput');
    const prepareCountdownButton = document.getElementById('prepareCountdownButton');
    const creationMessage = document.getElementById('creationMessage');

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

    let countdownInterval;
    // currentMainButtonClickHandler больше не нужен для prepareCountdownButton, 
    // но может понадобиться для других кнопок если они будут использовать MainButton
    // let currentMainButtonClickHandler; 

    function showSection(sectionName) {
        createCountdownSection.style.display = (sectionName === 'create') ? 'block' : 'none';
        activeCountdownSection.style.display = (sectionName === 'active') ? 'block' : 'none';
        if (tg?.MainButton) {
             // Если есть MainButton, лучше ее скрыть при смене секции,
             // чтобы избежать случайных нажатий на старую конфигурацию
            tg.MainButton.hide();
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
                daysRemainingEl.textContent = '00'; hoursRemainingEl.textContent = '00';
                minutesRemainingEl.textContent = '00'; secondsRemainingEl.textContent = '00';
                activeMessage.textContent = "Время вышло!";
                // Можно добавить кнопку "Создать новый", если время вышло
                return;
            }
            const d = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const h = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((timeLeft % (1000 * 60)) / 1000);
            daysRemainingEl.textContent = String(d).padStart(2, '0');
            hoursRemainingEl.textContent = String(h).padStart(2, '0');
            minutesRemainingEl.textContent = String(m).padStart(2, '0');
            secondsRemainingEl.textContent = String(s).padStart(2, '0');
            activeMessage.textContent = ""; // Очищаем сообщение, если таймер идет
        }
        calculateAndDisplay();
        countdownInterval = setInterval(calculateAndDisplay, 1000);
    }
    
    function processBotData(data) {
        console.log("Обработка данных от бота:", data);
        if (data.action === "countdown_started" && data.endDate) {
            showSection('active');
            updateCountdownDisplay(data.endDate); // Используем дату от бота для точности
            endDateDisplayEl.textContent = `Завершение: ${new Date(data.endDate).toLocaleString('ru-RU')}`;
            notificationTimeDisplayEl.textContent = `Уведомления в: ${data.notificationTime || '10:00'}`;
            if (tg?.MainButton) {
                tg.MainButton.hideProgress(); // Если был прогресс
                tg.MainButton.hide();
            }
            activeMessage.textContent = "Отсчет подтвержден ботом!";
            setTimeout(() => { activeMessage.textContent = ""; }, 3000);
        } else if (data.action === "countdown_stopped") {
            showSection('create');
            daysInput.value = '';
            notificationTimeInput.value = '10:00';
            creationMessage.textContent = "Отсчет остановлен ботом. Можете создать новый.";
            if (tg?.MainButton) tg.MainButton.hide();
        } else if (data.action === "show_active_countdown" && data.endDate) { // Добавлено для start_param
            showSection('active');
            updateCountdownDisplay(data.endDate);
            endDateDisplayEl.textContent = `Завершение: ${new Date(data.endDate).toLocaleString('ru-RU')}`;
            notificationTimeDisplayEl.textContent = `Уведомления в: ${data.notificationTime || '10:00'}`;
        }
    }

    if (tg) {
        console.log("Telegram WebApp API доступно.");
        tg.ready();
        tg.expand();
        tg.BackButton.hide(); // Скрываем системную кнопку "назад" если она не нужна

        tg.onEvent('web_app_data_received', function(eventData){
            console.log('Получены данные через web_app_data_received:', eventData.data);
            try {
                const parsedData = JSON.parse(eventData.data);
                processBotData(parsedData);
            } catch (e) {
                console.error('Ошибка парсинга данных из web_app_data_received:', e);
            }
        });
        
        const startParam = tg.initDataUnsafe?.start_param;
        if (startParam) {
            try {
                const initialData = JSON.parse(decodeURIComponent(startParam));
                console.log("Получены данные из start_param:", initialData);
                processBotData(initialData); 
            } catch (e) {
                console.error("Ошибка парсинга start_param:", e);
                showSection('create'); // Если ошибка, показываем создание
            }
        } else {
            showSection('create'); // По умолчанию, если нет start_param
        }

        // ========= НОВЫЙ ОБРАБОТЧИК для prepareCountdownButton =========
        prepareCountdownButton.addEventListener('click', function () {
            console.log("Кнопка 'Подготовить к запуску' (новая логика) нажата.");
            const days = parseInt(daysInput.value);
            const notificationTime = notificationTimeInput.value;
        
            if (isNaN(days) || days <= 0) {
                creationMessage.textContent = "Введите корректное количество дней!";
                creationMessage.style.color = "red";
                return;
            }
            if (!/^\d{2}:\d{2}$/.test(notificationTime)) {
                creationMessage.textContent = 'Пожалуйста, введите корректное время (ЧЧ:ММ).';
                creationMessage.style.color = "red";
                return;
            }
            creationMessage.style.color = ""; // Сброс цвета ошибки
        
            // Рассчитываем дату окончания локально для немедленного отображения
            const now = new Date();
            // Важно: дни из input могут быть строкой, убедимся, что это число
            const endDate = new Date(now.getTime() + Number(days) * 24 * 60 * 60 * 1000);
        
            // Отправляем данные боту
            const dataToSend = {
                action: "start_countdown",
                days: days,
                notification_time: notificationTime
            };
            
            try {
                tg.sendData(JSON.stringify(dataToSend));
                console.log("Данные отправлены боту:", dataToSend);
                
                // Показываем сообщение об отправке
                creationMessage.textContent = "Запрос отправлен боту...";
            
                // Оптимистично переключаемся на активную секцию и запускаем таймер
                showSection('active');
                updateCountdownDisplay(endDate.toISOString());
                endDateDisplayEl.textContent = `Завершение (локально): ${endDate.toLocaleString('ru-RU')}`;
                notificationTimeDisplayEl.textContent = `Уведомления в: ${notificationTime}`;
                activeMessage.textContent = "Ожидание подтверждения от бота...";

            } catch (error) {
                 console.error("Ошибка при вызове tg.sendData:", error);
                 creationMessage.textContent = "Не удалось отправить данные. Проверьте интернет и попробуйте снова.";
                 creationMessage.style.color = "red";
            }
        });
        // ========= КОНЕЦ НОВОГО ОБРАБОТЧИКА =========

    } else { 
        console.warn("Telegram WebApp API не найдено. Работа в режиме отладки.");
        showSection('create');
        prepareCountdownButton.addEventListener('click', () => {
            alert("Отладка: Нажата кнопка 'Подготовить к запуску'.");
            // Локальная симуляция для отладки без Telegram
            const days = parseInt(daysInput.value);
            if (isNaN(days) || days <= 0) {
                creationMessage.textContent = "Введите дни!"; return;
            }
            const now = new Date();
            const endDate = new Date(now.getTime() + Number(days) * 24 * 60 * 60 * 1000);
            showSection('active');
            updateCountdownDisplay(endDate.toISOString());
            endDateDisplayEl.textContent = `Завершение (отладка): ${endDate.toLocaleString('ru-RU')}`;
            notificationTimeDisplayEl.textContent = `Уведомления в: ${notificationTimeInput.value}`;
        });
    }

    // Кнопки в активной секции (stopCountdownButton, createNewCountdownButton)
    // остаются без изменений относительно v3.3, если их логика тебя устраивает.
    // Они могут использовать tg.sendData() для соответствующих действий.

    stopCountdownButton.addEventListener('click', function() {
        if (tg) {
            tg.showConfirm("Вы уверены, что хотите остановить текущий отсчет?", function(confirmed) {
                if (confirmed) {
                    console.log("Отправка команды на остановку отсчета...");
                    tg.sendData(JSON.stringify({ action: "stop_countdown_from_webapp" }));
                    // Ожидаем, что бот пришлет данные через web_app_data_received или start_param при след. открытии
                    // Можно оптимистично обновить UI или показать сообщение
                    creationMessage.textContent = "Запрос на остановку отправлен.";
                    // showSection('create'); // Можно сразу переключить
                }
            });
        } else { alert("Остановка доступна только в Telegram."); }
    });

    createNewCountdownButton.addEventListener('click', function(){
        if (tg) {
            tg.showConfirm("Создание нового отсчета остановит текущий. Продолжить?", function(confirmed) {
                if (confirmed) {
                    clearInterval(countdownInterval);
                    showSection('create');
                    daysInput.value = '';
                    notificationTimeInput.value = '10:00';
                    creationMessage.textContent = "Введите данные для нового отсчета.";
                }
            });
        } else {
            showSection('create'); // Для отладки в браузере
            alert("Создание нового (режим отладки)");
        }
    });
});

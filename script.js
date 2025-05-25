document.addEventListener('DOMContentLoaded', function () {
    console.log("WebApp Отсчет: DOMContentLoaded. Script version 3.3"); // Версия обновлена

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
    let currentMainButtonClickHandler; // Храним текущий обработчик MainButton

    function showSection(sectionName) {
        createCountdownSection.style.display = (sectionName === 'create') ? 'block' : 'none';
        activeCountdownSection.style.display = (sectionName === 'active') ? 'block' : 'none';
        if (tg?.MainButton) tg.MainButton.hide();
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
        }
        calculateAndDisplay();
        countdownInterval = setInterval(calculateAndDisplay, 1000);
    }
    
    function setMainButtonOnClick(handler) {
        if (tg && tg.MainButton) {
            if (currentMainButtonClickHandler) {
                tg.MainButton.offClick(currentMainButtonClickHandler);
            }
            currentMainButtonClickHandler = handler;
            tg.MainButton.onClick(currentMainButtonClickHandler);
        }
    }

    // Функция для обработки данных, полученных от бота (например, через tg.onEvent('web_app_data_received', ...))
    // или если бот ответит сообщением, содержащим JSON в <code> тегах.
    function processBotData(data) {
        console.log("Обработка данных от бота:", data);
        if (data.action === "countdown_started" && data.endDate) {
            showSection('active');
            updateCountdownDisplay(data.endDate);
            endDateDisplayEl.textContent = `Завершение: ${new Date(data.endDate).toLocaleString('ru-RU')}`;
            notificationTimeDisplayEl.textContent = `Уведомления в: ${data.notificationTime || '10:00'}`;
            if (tg?.MainButton) {
                tg.MainButton.hideProgress();
                tg.MainButton.hide();
            }
        } else if (data.action === "countdown_stopped") {
            showSection('create');
            daysInput.value = '';
            notificationTimeInput.value = '10:00';
            creationMessage.textContent = "Отсчет остановлен. Можете создать новый.";
            if (tg?.MainButton) tg.MainButton.hide();
        }
    }

    if (tg) {
        console.log("Telegram WebApp API доступно.");
        tg.ready();
        tg.expand();

        // Слушаем событие получения данных от платформы (если бот использует answerWebAppQuery)
        // Это более надежно, чем парсить сообщения чата.
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
                processBotData(initialData); // Используем общую функцию обработки
            } catch (e) {
                console.error("Ошибка парсинга start_param:", e);
                showSection('create');
            }
        } else {
            showSection('create');
        }

        // Настройка кнопки "Подготовить к запуску"
        prepareCountdownButton.addEventListener('click', function() {
            console.log("Кнопка 'Подготовить к запуску' нажата.");
            const days = parseInt(daysInput.value, 10);
            const notificationTime = notificationTimeInput.value;

            if (daysInput.value.trim() === "" || isNaN(days) || days <= 0) {
                creationMessage.textContent = 'Пожалуйста, введите корректное число дней.';
                if (tg.MainButton) tg.MainButton.hide(); return;
            }
            if (!/^\d{2}:\d{2}$/.test(notificationTime)) {
                 creationMessage.textContent = 'Пожалуйста, введите корректное время (ЧЧ:ММ).';
                 if (tg.MainButton) tg.MainButton.hide(); return;
            }
            creationMessage.textContent = `Готовы? Нажмите кнопку Telegram внизу.`;
            
            tg.MainButton.setText(`Запустить на ${days} дн. в ${notificationTime}`);
            tg.MainButton.show();
            tg.MainButton.enable();

            setMainButtonOnClick(function mainButtonStartHandler() {
                console.log("MainButton для запуска отсчета нажата.");
                tg.MainButton.showProgress(false); // Показать индикатор загрузки

                const dataToSend = {
                    action: "start_countdown",
                    days: days,
                    notification_time: notificationTime
                };
                console.log("Отправка данных боту:", dataToSend);

                try {
                    tg.sendData(JSON.stringify(dataToSend));
                    // Не скрываем кнопку сразу, ждем ответа от бота или таймаута.
                    // Если бот ответит через answerWebAppQuery, событие web_app_data_received обработает UI.
                    // Если нет, то через некоторое время можно скрыть кнопку или показать сообщение.
                    // tg.showAlert("Запрос отправлен. Ожидайте подтверждения."); // Можно использовать это
                    setTimeout(() => { // Если долго нет ответа от web_app_data_received
                        if (activeCountdownSection.style.display !== 'block') { // Если UI не обновился
                             tg.MainButton.hideProgress();
                             // tg.MainButton.hide(); // Можно и скрыть
                             creationMessage.textContent = "Запрос отправлен. Если ничего не произошло, проверьте чат с ботом.";
                        }
                    }, 5000); // 5 секунд таймаут для ожидания ответа, который обновит UI

                } catch (error) {
                    console.error("Ошибка при вызове tg.sendData:", error);
                    tg.showAlert("Не удалось отправить данные. Попробуйте еще раз.");
                    tg.MainButton.hideProgress();
                    tg.MainButton.enable(); // Оставляем кнопку для повторной попытки
                }
            });
        });

    } else { // Если tg API не доступно (например, открыто в обычном браузере)
        console.warn("Telegram WebApp API не найдено. Работа в режиме отладки.");
        showSection('create');
        prepareCountdownButton.addEventListener('click', () => {
            alert("Кнопка 'Подготовить к запуску' (режим отладки)");
        });
    }

    // Кнопки в активной секции
    stopCountdownButton.addEventListener('click', function() {
        if (tg) {
            tg.showConfirm("Вы уверены, что хотите остановить текущий отсчет?", function(confirmed) {
                if (confirmed) {
                    console.log("Отправка команды на остановку отсчета...");
                    tg.sendData(JSON.stringify({ action: "stop_countdown_from_webapp" }));
                    // Ожидаем, что бот пришлет данные через web_app_data_received для обновления UI
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
            showSection('create');
            alert("Создание нового (режим отладки)");
        }
    });
});

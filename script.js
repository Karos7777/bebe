document.addEventListener('DOMContentLoaded', function () {
    console.log("WebApp Отсчет: DOMContentLoaded. Script version 3.1");

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
                    endDateDisplayEl.textContent = `Завершение: ${new Date(initialData.endDate).toLocaleString('ru-RU')}`;
                    notificationTimeDisplayEl.textContent = `Уведомления в: ${initialData.notificationTime || '10:00'}`;
                } else {
                    showSection('create');
                }
            } catch (e) {
                console.error("Ошибка парсинга start_param:", e);
                showSection('create');
            }
        } else {
            console.log("start_param не найден, показываем форму создания.");
            showSection('create');
        }

        // Настройка MainButton
        tg.MainButton.setText("Запустить отсчет");
        tg.MainButton.hide();

    } else {
        console.warn("Telegram WebApp API не найдено. Работа в режиме отладки.");
        showSection('create');
    }

    // Обработчик для кнопки "Подготовить к запуску"
    prepareCountdownButton.addEventListener('click', function() {
        console.log("Кнопка 'Подготовить к запуску' нажата.");
        const days = parseInt(daysInput.value, 10);
        const notificationTime = notificationTimeInput.value;

        if (daysInput.value.trim() === "") {
            creationMessage.textContent = 'Пожалуйста, введите количество дней.';
            if (tg?.MainButton) tg.MainButton.hide();
            return;
        }
        if (isNaN(days) || days <= 0) {
            creationMessage.textContent = 'Введите корректное положительное число дней.';
            if (tg?.MainButton) tg.MainButton.hide();
            return;
        }
        if (!/^\d{2}:\d{2}$/.test(notificationTime)) {
             creationMessage.textContent = 'Введите корректное время (ЧЧ:ММ).';
             if (tg?.MainButton) tg.MainButton.hide();
             return;
        }

        creationMessage.textContent = `Готовы запустить отсчет на ${days} дней, уведомления в ${notificationTime}. Нажмите кнопку Telegram внизу.`;
        
        if (tg && tg.MainButton) {
            tg.MainButton.setText(`Запустить на ${days} дн. в ${notificationTime}`);
            
            // Устанавливаем новый обработчик для MainButton
            setMainButtonHandler(function() {
                console.log("tg.MainButton нажата для запуска отсчета.");
                
                // Получаем актуальные значения из полей
                const currentDays = parseInt(daysInput.value, 10);
                const currentNotificationTime = notificationTimeInput.value;

                if (isNaN(currentDays) || currentDays <= 0) {
                    tg.showAlert('Пожалуйста, введите корректное количество дней.');
                    return;
                }
                if (!/^\d{2}:\d{2}$/.test(currentNotificationTime)) {
                    tg.showAlert('Пожалуйста, введите корректное время для уведомлений (ЧЧ:ММ).');
                    return;
                }

                const dataToSend = {
                    action: "start_countdown",
                    days: currentDays,
                    notification_time: currentNotificationTime
                };
                
                console.log("Отправка данных боту:", dataToSend);
                
                // Показываем индикатор загрузки
                tg.MainButton.showProgress();
                
                try {
                    tg.sendData(JSON.stringify(dataToSend));
                    console.log("Данные успешно отправлены боту");
                } catch (error) {
                    console.error("Ошибка при отправке данных:", error);
                    tg.MainButton.hideProgress();
                    tg.showAlert('Ошибка при отправке данных. Попробуйте снова.');
                }
            });
            
            tg.MainButton.show();
            tg.MainButton.enable();
        }
    });

    // Обработчик для кнопки "Остановить отсчет"
    stopCountdownButton.addEventListener('click', function() {
        console.log("Кнопка 'Остановить отсчет' нажата.");
        if (tg) {
            tg.showConfirm("Вы уверены, что хотите остановить текущий отсчет?", function(confirmed) {
                if (confirmed) {
                    const dataToSend = { action: "stop_countdown_from_webapp" };
                    console.log("Отправка команды на остановку:", dataToSend);
                    tg.sendData(JSON.stringify(dataToSend));
                    
                    clearInterval(countdownInterval);
                    showSection('create');
                    daysInput.value = '';
                    notificationTimeInput.value = '10:00';
                    creationMessage.textContent = "Отсчет остановлен. Можете создать новый.";
                    if(tg.MainButton) tg.MainButton.hide();
                }
            });
        } else {
            alert("Функция остановки доступна только в Telegram.");
        }
    });

    // Обработчик для кнопки "Создать новый"
    createNewCountdownButton.addEventListener('click', function(){
        console.log("Кнопка 'Создать новый отсчет' (из активной секции) нажата.");
         if (tg) {
            tg.showConfirm("Создание нового отсчета остановит текущий. Продолжить?", function(confirmed) {
                if (confirmed) {
                    clearInterval(countdownInterval);
                    showSection('create');
                    daysInput.value = '';
                    notificationTimeInput.value = '10:00';
                    creationMessage.textContent = "Введите данные для нового отсчета.";
                    if(tg.MainButton) tg.MainButton.hide();
                }
            });
        } else {
            alert("Эта функция доступна только в Telegram.");
            showSection('create');
        }
    });
    
    // Слушаем данные от бота
    if (tg) {
        tg.onEvent('web_app_data_received', function(eventData){
            console.log('Получены данные от бота через web_app_data_received:', eventData.data);
            try {
                const data = JSON.parse(eventData.data);
                if (data.action === "countdown_started" && data.endDate) {
                    showSection('active');
                    updateCountdownDisplay(data.endDate);
                    endDateDisplayEl.textContent = `Завершение: ${new Date(data.endDate).toLocaleString('ru-RU')}`;
                    notificationTimeDisplayEl.textContent = `Уведомления в: ${data.notificationTime || '10:00'}`;
                    if(tg.MainButton) {
                        tg.MainButton.hideProgress();
                        tg.MainButton.hide();
                    }
                } else if (data.action === "countdown_stopped") {
                    showSection('create');
                    daysInput.value = '';
                    notificationTimeInput.value = '10:00';
                    creationMessage.textContent = "Отсчет остановлен. Можете создать новый.";
                    if(tg.MainButton) tg.MainButton.hide();
                }
            } catch (e) {
                console.error('Ошибка парсинга данных от бота:', e);
                if(tg.MainButton) tg.MainButton.hideProgress();
            }
        });
    }

});

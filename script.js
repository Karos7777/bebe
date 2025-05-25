
document.addEventListener('DOMContentLoaded', function () {
    console.log("Версия скрипта: 1.1. DOMContentLoaded сработал.");

    // Попытка получить объект Telegram WebApp
    // window.Telegram может быть undefined, если открыто не в Telegram
    const tg = window.Telegram?.WebApp;

    if (tg) {
        console.log("Telegram WebApp API доступно. tg:", tg);
        try {
            tg.ready(); // Сообщаем Telegram, что Web App готово
            tg.expand();  // Растягиваем Web App на весь экран (если возможно)
            console.log("tg.ready() и tg.expand() вызваны.");
        } catch (e) {
            console.error("Ошибка при вызове tg.ready() или tg.expand():", e);
        }
    } else {
        console.warn("Telegram WebApp API (window.Telegram.WebApp) не найдено. Приложение работает в режиме отладки (браузер?) или API не загрузилось.");
    }

    const yearsInput = document.getElementById('yearsInput');
    const calculateButton = document.getElementById('calculateButton');
    const messageDiv = document.getElementById('message');

    // Проверка, найдены ли элементы
    if (!yearsInput) {
        console.error("ОШИБКА: Элемент с ID 'yearsInput' не найден!");
        if (messageDiv) messageDiv.textContent = "Ошибка: поле ввода не найдено.";
        return; // Прекращаем работу, если нет основного поля
    }
    if (!calculateButton) {
        console.error("ОШИБКА: Элемент с ID 'calculateButton' не найден!");
        if (messageDiv) messageDiv.textContent = "Ошибка: кнопка расчета не найдена.";
        return; // Прекращаем работу, если нет кнопки
    }
    if (!messageDiv) {
        console.error("ОШИБКА: Элемент с ID 'messageDiv' не найден!");
        // Продолжаем, но без вывода сообщений
    }

    console.log("DOM элементы найдены:", { yearsInput, calculateButton, messageDiv });

    // Настройка MainButton (главной кнопки Telegram), если tg и MainButton доступны
    if (tg && tg.MainButton) {
        console.log("Настройка tg.MainButton...");
        tg.MainButton.setText("Отправить результат боту");
        tg.MainButton.hide(); // Сначала скрываем

        tg.MainButton.onClick(function() {
            console.log("tg.MainButton нажата.");
            // Убедимся, что yearsInput.value доступно
            if (!yearsInput || typeof yearsInput.value === 'undefined') {
                console.error("Ошибка: yearsInput.value недоступно при клике на MainButton.");
                tg.showAlert('Ошибка: не удалось прочитать значение лет.');
                return;
            }

            const years = parseFloat(yearsInput.value);
            if (isNaN(years) || years <= 0) {
                console.log("MainButton: Некорректный ввод лет:", yearsInput.value);
                tg.showAlert('Пожалуйста, введите корректное количество лет в поле на странице.');
                return;
            }
            const days = Math.round(years * 365);

            const dataToSend = {
                action: "calculate_days",
                years: years,
                days: days
            };
            console.log("Отправка данных боту:", dataToSend);
            tg.sendData(JSON.stringify(dataToSend));
            // tg.close(); // Можно раскомментировать, если нужно закрывать WebApp после отправки
        });
        console.log("Обработчик для tg.MainButton установлен.");
    } else {
        console.warn("tg.MainButton не доступна. Функциональность главной кнопки Telegram будет отключена.");
    }


    calculateButton.addEventListener('click', function() {
        console.log("Кнопка 'Рассчитать' нажата!");

        const yearsString = yearsInput.value;
        console.log("Значение из поля 'yearsInput':", `"${yearsString}"` , "(тип:", typeof yearsString + ")");

        // Проверка, что значение не пустое
        if (yearsString.trim() === "") {
            console.log("Поле ввода пустое.");
            if (messageDiv) {
                messageDiv.textContent = 'Пожалуйста, введите количество лет.';
                messageDiv.style.color = 'var(--tg-theme-destructive-text-color, red)';
            }
            if (tg && tg.MainButton) tg.MainButton.hide();
            return;
        }

        const years = parseFloat(yearsString);
        console.log("Значение после parseFloat:", years, "(тип:", typeof years + ")");

        if (isNaN(years) || years <= 0) {
            console.log("Некорректный ввод: NaN или <= 0.");
            if (messageDiv) {
                messageDiv.textContent = 'Пожалуйста, введите корректное положительное число лет.';
                messageDiv.style.color = 'var(--tg-theme-destructive-text-color, red)';
            }
            if (tg && tg.MainButton) tg.MainButton.hide(); // Скрываем кнопку Telegram, если ввод неверный
            return;
        }

        console.log("Ввод корректный. Расчет дней...");
        const days = Math.round(years * 365);
        if (messageDiv) {
            messageDiv.textContent = `Это примерно ${days} дней.`;
            messageDiv.style.color = 'var(--tg-theme-text-color, #000000)'; // Стандартный цвет текста
        }

        // Показываем и активируем главную кнопку Telegram, если tg доступно
        if (tg && tg.MainButton) {
            console.log("Обновление и показ tg.MainButton.");
            const buttonText = `Отправить ${days} дней боту`;
            const buttonColor = tg.themeParams?.button_color || '#007bff';
            const buttonTextColor = tg.themeParams?.button_text_color || '#ffffff';
            
            tg.MainButton.setParams({
                text: buttonText,
                color: buttonColor,
                text_color: buttonTextColor,
                is_active: true,
                is_visible: true
            });
            // tg.MainButton.show(); // setParams с is_visible: true должен сработать
            // tg.MainButton.enable(); // setParams с is_active: true должен сработать
            console.log(`MainButton настроена: text="${buttonText}", color="${buttonColor}", textColor="${buttonTextColor}"`);
        } else {
            console.log(`Расчет завершен: ${days} дней. (tg.MainButton не доступна для отображения)`);
            // Если отлаживаем в браузере, можно вывести alert
            // alert(`Результат: ${days} дней. (Кнопка Telegram не активна)`);
        }
    });
    console.log("Обработчик для кнопки 'Рассчитать' установлен.");

    // Дополнительная информация для отладки
    if (tg) {
        console.log("Параметры темы Telegram (tg.themeParams):", tg.themeParams);
        console.log("Данные инициализации (tg.initDataUnsafe):", tg.initDataUnsafe);
        if (!tg.initDataUnsafe?.user) {
            console.warn("Данные пользователя (tg.initDataUnsafe.user) отсутствуют.");
        }
    }
});


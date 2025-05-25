--- START OF FILE script.js ---
document.addEventListener('DOMContentLoaded', function () {
    const tg = window.Telegram.WebApp;
    tg.ready(); // Сообщаем Telegram, что Web App готово
    tg.expand();  // Растягиваем Web App на весь экран

    const yearsInput = document.getElementById('yearsInput');
    const calculateButton = document.getElementById('calculateButton');
    const messageDiv = document.getElementById('message');

    // Настраиваем главную кнопку Telegram (внизу экрана)
    // Изначально она будет скрыта, покажем после расчета
    tg.MainButton.setText("Отправить результат боту");
    tg.MainButton.hide();
    tg.MainButton.onClick(function() {
        const years = parseFloat(yearsInput.value);
        if (isNaN(years) || years <= 0) {
            tg.showAlert('Пожалуйста, введите корректное количество лет.');
            return;
        }
        const days = Math.round(years * 365); // Округляем на всякий случай
        
        // Отправляем данные боту
        const dataToSend = {
            action: "calculate_days",
            years: years,
            days: days
        };
        tg.sendData(JSON.stringify(dataToSend));
        // После отправки данных можно закрыть Web App, если нужно
        // tg.close(); 
        // Или показать сообщение об успехе от бота
    });


    calculateButton.addEventListener('click', function() {
        const years = parseFloat(yearsInput.value);

        if (isNaN(years) || years <= 0) {
            messageDiv.textContent = 'Пожалуйста, введите корректное количество лет.';
            messageDiv.style.color = 'var(--tg-theme-destructive-text-color, red)'; // Используем цвет ошибки из темы
            tg.MainButton.hide(); // Скрываем кнопку, если ввод некорректный
            return;
        }

        const days = Math.round(years * 365); // Используем Math.round для целого числа дней
        messageDiv.textContent = `Это примерно ${days} дней.`;
        messageDiv.style.color = 'var(--tg-theme-text-color, #000000)';

        // Показываем и активируем главную кнопку Telegram для отправки данных
        tg.MainButton.setParams({
            text: `Отправить ${days} дней боту`,
            color: tg.themeParams.button_color || '#007bff', // Используем цвет кнопки из темы
            text_color: tg.themeParams.button_text_color || '#ffffff' // Используем цвет текста кнопки из темы
        });
        tg.MainButton.show();
        tg.MainButton.enable();
    });

    // Для отладки в браузере, если tg не определен
    if (!tg.initDataUnsafe || !tg.initDataUnsafe.user) {
        console.log("Telegram WebApp API не доступно. Работа в тестовом режиме.");
        // Можно добавить моки для tg.MainButton и tg.sendData для отладки в браузере
    }
});
--- END OF FILE script.js ---

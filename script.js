// API ключ (замените на свой с OpenWeatherMap)
const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Элементы DOM
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherCard = document.getElementById('weather-card');
const errorMessage = document.getElementById('error-message');

// Элементы для отображения данных
const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const temp = document.getElementById('temp');
const weatherImg = document.getElementById('weather-img');
const weatherDesc = document.getElementById('weather-desc');
const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const pressure = document.getElementById('pressure');

// Установка текущей даты
function setCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    currentDate.textContent = now.toLocaleDateString('ru-RU', options);
}

// Получение погоды
async function getWeather(city) {
    try {
        const response = await fetch(`${BASE_URL}?q=${city}&appid=${API_KEY}&units=metric&lang=ru`);
        
        if (!response.ok) {
            throw new Error('Город не найден');
        }
        
        const data = await response.json();
        displayWeather(data);
        
    } catch (error) {
        showError(error.message);
    }
}

// Отображение погоды
function displayWeather(data) {
    // Основные данные
    cityName.textContent = data.name + ', ' + data.sys.country;
    temp.textContent = Math.round(data.main.temp);
    weatherDesc.textContent = data.weather[0].description;
    
    // Иконка погоды
    const iconCode = data.weather[0].icon;
    weatherImg.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherImg.alt = data.weather[0].description;
    
    // Детали
    feelsLike.textContent = Math.round(data.main.feels_like) + '°C';
    humidity.textContent = data.main.humidity + '%';
    wind.textContent = data.wind.speed + ' м/с';
    pressure.textContent = data.main.pressure + ' hPa';
    
    // Показать карточку и скрыть ошибку
    weatherCard.classList.add('active');
    errorMessage.classList.remove('active');
}

// Показать ошибку
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('active');
    weatherCard.classList.remove('active');
}

// Поиск по нажатию кнопки
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeather(city);
    }
});

// Поиск по нажатию Enter
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeather(city);
        }
    }
});

// Автозагрузка погоды для Москвы при загрузке страницы
window.addEventListener('load', () => {
    setCurrentDate();
    getWeather('Moscow');
});

// Обработчик для автоматического скрытия ошибки при вводе
cityInput.addEventListener('input', () => {
    if (errorMessage.classList.contains('active')) {
        errorMessage.classList.remove('active');
    }
});

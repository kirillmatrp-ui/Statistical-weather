// API ключ (замените на свой с OpenWeatherMap)
const API_KEY = '1ba82a70f63414b7883e30d128107fb3';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Элементы DOM
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherCard = document.getElementById('weather-card');
const errorMessage = document.getElementById('error-message');
const searchHistory = document.getElementById('search-history');
const darkModeToggle = document.getElementById('dark-mode');
const autoLocationToggle = document.getElementById('auto-location');
const unitButtons = document.querySelectorAll('.unit-btn');

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

// Переменные состояния
let currentUnit = 'metric';
let searchHistoryList = JSON.parse(localStorage.getItem('searchHistory')) || [];

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
async function getWeather(city, unit = currentUnit) {
    try {
        const response = await fetch(`${BASE_URL}?q=${city}&appid=${API_KEY}&units=${unit}&lang=ru`);
        
        if (!response.ok) {
            throw new Error('Город не найден');
        }
        
        const data = await response.json();
        displayWeather(data);
        addToHistory(city);
        
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
    feelsLike.textContent = Math.round(data.main.feels_like) + getUnitSymbol();
    humidity.textContent = data.main.humidity + '%';
    wind.textContent = data.wind.speed + ' м/с';
    pressure.textContent = data.main.pressure + ' hPa';
    
    // Показать карточку и скрыть ошибку
    weatherCard.classList.add('active');
    errorMessage.classList.remove('active');
}

// Получение символа единицы измерения
function getUnitSymbol() {
    switch(currentUnit) {
        case 'metric': return '°C';
        case 'imperial': return '°F';
        case 'kelvin': return 'K';
        default: return '°C';
    }
}

// Добавление в историю
function addToHistory(city) {
    if (!searchHistoryList.includes(city)) {
        searchHistoryList.unshift(city);
        if (searchHistoryList.length > 5) {
            searchHistoryList.pop();
        }
        localStorage.setItem('searchHistory', JSON.stringify(searchHistoryList));
        updateHistoryDisplay();
    }
}

// Обновление отображения истории
function updateHistoryDisplay() {
    searchHistory.innerHTML = '';
    
    if (searchHistoryList.length === 0) {
        searchHistory.innerHTML = '<div style="color: #636e72; text-align: center;">История пуста</div>';
        return;
    }
    
    searchHistoryList.forEach(city => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <span>${city}</span>
            <small>${new Date().toLocaleTimeString('ru-RU')}</small>
        `;
        historyItem.addEventListener('click', () => {
            cityInput.value = city;
            getWeather(city);
        });
        searchHistory.appendChild(historyItem);
    });
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'clear-history';
    clearBtn.textContent = 'Очистить историю';
    clearBtn.addEventListener('click', clearHistory);
    searchHistory.appendChild(clearBtn);
}

// Очистка истории
function clearHistory() {
    searchHistoryList = [];
    localStorage.setItem('searchHistory', JSON.stringify(searchHistoryList));
    updateHistoryDisplay();
}

// Показать ошибку
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('active');
    weatherCard.classList.remove('active');
}

// Обработчики событий для кнопок городов
document.querySelectorAll('.city-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const city = btn.getAttribute('data-city');
        cityInput.value = city;
        getWeather(city);
    });
});

// Обработчики для переключения единиц измерения
unitButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const unit = btn.getAttribute('data-unit');
        currentUnit = unit;
        
        // Обновить активную кнопку
        unitButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Обновить погоду для текущего города
        const currentCity = cityName.textContent.split(',')[0];
        if (currentCity && currentCity !== 'Выберите город') {
            getWeather(currentCity, unit);
        }
    });
});

// Темная тема
darkModeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode', darkModeToggle.checked);
    localStorage.setItem('darkMode', darkModeToggle.checked);
});

// Авто-локация
autoLocationToggle.addEventListener('change', () => {
    if (autoLocationToggle.checked) {
        getAutoLocation();
    }
});

// Автоматическое определение местоположения
function getAutoLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                getWeatherByCoords(latitude, longitude);
            },
            error => {
                showError('Не удалось определить местоположение');
                autoLocationToggle.checked = false;
            }
        );
    } else {
        showError('Геолокация не поддерживается вашим браузером');
        autoLocationToggle.checked = false;
    }
}

// Получение погоды по координатам
async function getWeatherByCoords(lat, lon) {
    try {
        const response = await fetch(`${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}&lang=ru`);
        const data = await response.json();
        displayWeather(data);
        addToHistory(data.name);
    } catch (error) {
        showError('Ошибка получения погоды');
    }
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

// Обработчик для автоматического скрытия ошибки при вводе
cityInput.addEventListener('input', () => {
    if (errorMessage.classList.contains('active')) {
        errorMessage.classList.remove('active');
    }
});

// Инициализация при загрузке страницы
window.addEventListener('load', () => {
    setCurrentDate();
    getWeather('Moscow');
    updateHistoryDisplay();
    
    // Восстановить настройки темы
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    darkModeToggle.checked = savedDarkMode;
    document.body.classList.toggle('dark-mode', savedDarkMode);
});

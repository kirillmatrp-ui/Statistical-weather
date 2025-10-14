// API ключ (замените на свой с OpenWeatherMap)
const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const HISTORICAL_URL = 'https://api.openweathermap.org/data/2.5/onecall/timemachine';

// Элементы DOM
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherCard = document.getElementById('weather-card');
const errorMessage = document.getElementById('error-message');
const searchHistory = document.getElementById('search-history');
const darkModeToggle = document.getElementById('dark-mode');
const autoLocationToggle = document.getElementById('auto-location');
const unitButtons = document.querySelectorAll('.unit-btn');
const statsContainer = document.querySelector('.stats-container');
const statsTabs = document.querySelectorAll('.stats-tab');
const statsPeriods = document.querySelectorAll('.stats-period');

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

// Элементы статистики
const dayMaxTemp = document.getElementById('day-max-temp');
const dayMinTemp = document.getElementById('day-min-temp');
const dayAvgTemp = document.getElementById('day-avg-temp');
const dayWindMax = document.getElementById('day-wind-max');
const hourlyList = document.getElementById('hourly-list');

const weekMaxTemp = document.getElementById('week-max-temp');
const weekMinTemp = document.getElementById('week-min-temp');
const weekAvgTemp = document.getElementById('week-avg-temp');
const weekRainDays = document.getElementById('week-rain-days');

const monthMaxTemp = document.getElementById('month-max-temp');
const monthMinTemp = document.getElementById('month-min-temp');
const monthAvgTemp = document.getElementById('month-avg-temp');
const monthSunnyDays = document.getElementById('month-sunny-days');
const monthColdDays = document.getElementById('month-cold-days');
const monthCoolDays = document.getElementById('month-cool-days');
const monthWarmDays = document.getElementById('month-warm-days');
const monthHotDays = document.getElementById('month-hot-days');

// Переменные состояния
let currentUnit = 'metric';
let searchHistoryList = JSON.parse(localStorage.getItem('searchHistory')) || [];
let currentCity = '';
let currentCoords = null;
let weekChart = null;

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
        const response = await fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=${unit}&lang=ru`);
        
        if (!response.ok) {
            throw new Error('Город не найден');
        }
        
        const data = await response.json();
        currentCity = city;
        currentCoords = data.coord;
        displayWeather(data);
        addToHistory(city);
        
        // Загружаем статистику
        await loadWeatherStats(data.coord, unit);
        
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

// Загрузка статистики погоды
async function loadWeatherStats(coords, unit) {
    try {
        // Показываем контейнер статистики
        statsContainer.classList.add('active');
        
        // Загружаем прогноз на 5 дней для получения почасовых данных
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=${unit}&lang=ru`
        );
        const forecastData = await forecastResponse.json();
        
        // Обновляем статистику за день
        updateDayStats(forecastData);
        
        // Обновляем статистику за неделю (симулируем данные)
        updateWeekStats(forecastData);
        
        // Обновляем статистику за месяц (симулируем данные)
        updateMonthStats(forecastData);
        
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// Обновление статистики за день
function updateDayStats(forecastData) {
    const hourlyData = forecastData.list.slice(0, 8); // Берем первые 8 периодов (24 часа)
    
    // Рассчитываем статистику
    const temps = hourlyData.map(item => Math.round(item.main.temp));
    const winds = hourlyData.map(item => item.wind.speed);
    
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    const avgTemp = Math.round(temps.reduce((a, b) => a + b) / temps.length);
    const maxWind = Math.max(...winds).toFixed(1);
    
    // Обновляем DOM
    dayMaxTemp.textContent = maxTemp + getUnitSymbol();
    dayMinTemp.textContent = minTemp + getUnitSymbol();
    dayAvgTemp.textContent = avgTemp + getUnitSymbol();
    dayWindMax.textContent = maxWind + ' м/с';
    
    // Обновляем почасовой прогноз
    updateHourlyForecast(hourlyData);
}

// Обновление почасового прогноза
function updateHourlyForecast(hourlyData) {
    hourlyList.innerHTML = '';
    
    hourlyData.forEach(item => {
        const date = new Date(item.dt * 1000);
        const time = date.getHours().toString().padStart(2, '0') + ':00';
        const temp = Math.round(item.main.temp);
        const icon = item.weather[0].icon;
        const desc = item.weather[0].description;
        
        const hourlyItem = document.createElement('div');
        hourlyItem.className = 'hourly-item';
        hourlyItem.innerHTML = `
            <div class="hourly-time">${time}</div>
            <img class="hourly-icon" src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}">
            <div class="hourly-temp">${temp}°</div>
            <div class="hourly-desc">${desc}</div>
        `;
        
        hourlyList.appendChild(hourlyItem);
    });
}

// Обновление статистики за неделю
function updateWeekStats(forecastData) {
    // Симулируем данные за неделю на основе текущего прогноза
    const dailyData = [];
    for (let i = 0; i < 7; i++) {
        // Создаем реалистичные данные на основе текущей погоды
        const baseTemp = Math.round(forecastData.list[0].main.temp);
        const variation = (Math.random() - 0.5) * 10; // ±5 градусов
        const dayTemp = Math.round(baseTemp + variation);
        
        dailyData.push({
            temp: dayTemp,
            rain: Math.random() > 0.7 // 30% chance of rain
        });
    }
    
    const temps = dailyData.map(day => day.temp);
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    const avgTemp = Math.round(temps.reduce((a, b) => a + b) / temps.length);
    const rainDays = dailyData.filter(day => day.rain).length;
    
    // Обновляем DOM
    weekMaxTemp.textContent = maxTemp + getUnitSymbol();
    weekMinTemp.textContent = minTemp + getUnitSymbol();
    weekAvgTemp.textContent = avgTemp + getUnitSymbol();
    weekRainDays.textContent = rainDays;
    
    // Создаем график
    createWeekChart(temps);
}

// Создание графика за неделю
function createWeekChart(temps) {
    const ctx = document.getElementById('week-chart').getContext('2d');
    
    // Уничтожаем предыдущий график если есть
    if (weekChart) {
        weekChart.destroy();
    }
    
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    weekChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Температура (°C)',
                data: temps,
                borderColor: '#74b9ff',
                backgroundColor: 'rgba(116, 185, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Обновление статистики за месяц
function updateMonthStats(forecastData) {
    // Симулируем данные за месяц
    const baseTemp = Math.round(forecastData.list[0].main.temp);
    const monthData = [];
    
    for (let i = 0; i < 30; i++) {
        const variation = (Math.random() - 0.5) * 20; // ±10 градусов
        monthData.push(Math.round(baseTemp + variation));
    }
    
    const maxTemp = Math.max(...monthData);
    const minTemp = Math.min(...monthData);
    const avgTemp = Math.round(monthData.reduce((a, b) => a + b) / monthData.length);
    
    // Распределение по температурным диапазонам
    const coldDays = monthData.filter(temp => temp < 0).length;
    const coolDays = monthData.filter(temp => temp >= 0 && temp < 10).length;
    const warmDays = monthData.filter(temp => temp >= 10 && temp < 20).length;
    const hotDays = monthData.filter(temp => temp >= 20).length;
    
    // Солнечные дни (условно)
    const sunnyDays = Math.floor(monthData.length * 0.6); // 60% солнечных дней
    
    // Обновляем DOM
    monthMaxTemp.textContent = maxTemp + getUnitSymbol();
    monthMinTemp.textContent = minTemp + getUnitSymbol();
    monthAvgTemp.textContent = avgTemp + getUnitSymbol();
    monthSunnyDays.textContent = sunnyDays;
    monthColdDays.textContent = coldDays;
    monthCoolDays.textContent = coolDays;
    monthWarmDays.textContent = warmDays;
    monthHotDays.textContent = hotDays;
}

// Переключение вкладок статистики
statsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const period = tab.getAttribute('data-period');
        
        // Обновляем активную вкладку
        statsTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Показываем соответствующий контент
        statsPeriods.forEach(p => p.classList.remove('active'));
        document.getElementById(`stats-${period}`).classList.add('active');
    });
});

// Остальной код остается таким же как в предыдущей версии...
// (getUnitSymbol, addToHistory, updateHistoryDisplay, clearHistory, showError, 
// обработчики событий для кнопок городов, единиц измерения, и т.д.)

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
    statsContainer.classList.remove('active');
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
        if (currentCity) {
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
        const response = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}&lang=ru`);
        const data = await response.json();
        displayWeather(data);
        addToHistory(data.name);
        await loadWeatherStats({ lat, lon }, currentUnit);
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

const API_KEY = "4d1a895d56882241bc9e8fa41e84ae70";

const searchBtn = document.getElementById("search-btn");
const cityInput = document.getElementById("city-input");
const currentSection = document.getElementById("current-weather");
const forecastSection = document.getElementById("forecast");
const loader = document.getElementById("loader");
const errorMessage = document.getElementById("error-message");
const historyList = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history");

const rainCanvas = document.querySelector(".rain");
const rainCtx = rainCanvas.getContext("2d");
let raindrops = [];
let raining = false;

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) {
    fetchWeather(city);
  } else {
    showError("Please enter a city name.");
  }
});

historyList.addEventListener("click", (e) => {
  if (e.target.tagName === "LI") {
    fetchWeather(e.target.textContent);
  }
});

clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem("weatherHistory");
  loadHistory();
});

function fetchWeather(city) {
  hideSections();
  showLoader(true);

  const urlCurrent = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
  const urlForecast = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;

  fetch(urlCurrent)
    .then(res => {
      if (!res.ok) throw new Error("City not found!");
      return res.json();
    })
    .then(currentData => {
      displayCurrent(currentData);
      return fetch(urlForecast);
    })
    .then(forecastRes => {
      if (!forecastRes.ok) throw new Error("Forecast not available!");
      return forecastRes.json();
    })
    .then(forecastData => {
      displayForecast(forecastData);
      saveHistory(city);
      loadHistory();
    })
    .catch(err => {
      showError(err.message);
    })
    .finally(() => {
      showLoader(false);
    });
}

function displayCurrent(data) {
  document.getElementById("city-name").textContent = `${data.name}, ${data.sys.country}`;
  document.getElementById("temp").textContent = `Temperature: ${Math.round(data.main.temp)}°C`;
  document.getElementById("desc").textContent = data.weather[0].description;
  document.getElementById("wind").textContent = `Wind: ${data.wind.speed} m/s`;
  document.getElementById("humidity").textContent = `Humidity: ${data.main.humidity}%`;
  document.getElementById("icon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  updateBackground(data.weather[0].main.toLowerCase());

  currentSection.classList.remove("hidden");
}

function displayForecast(data) {
  const forecastCards = document.getElementById("forecast-cards");
  forecastCards.innerHTML = "";

  const daily = {};
  data.list.forEach(item => {
    const [date, time] = item.dt_txt.split(" ");
    if (time === "12:00:00" && !daily[date]) {
      daily[date] = item;
    }
  });

  Object.keys(daily).slice(0, 5).forEach(date => {
    const item = daily[date];
    const card = document.createElement("div");
    card.className = "forecast-card";
    const day = new Date(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    card.innerHTML = `
      <p>${day}</p>
      <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" />
      <p>${Math.round(item.main.temp)}°C</p>
      <p>${item.weather[0].main}</p>
    `;
    forecastCards.appendChild(card);
  });

  forecastSection.classList.remove("hidden");
}

function updateBackground(condition) {
  const body = document.body;
  body.classList.remove("weather-sunny", "weather-cloudy", "weather-rainy");

  if (condition.includes("clear")) {
    body.classList.add("weather-sunny");
    stopRain();
  } else if (condition.includes("rain") || condition.includes("drizzle")) {
    body.classList.add("weather-rainy");
    startRain();
  } else if (condition.includes("cloud")) {
    body.classList.add("weather-cloudy");
    stopRain();
  } else {
    body.classList.add("weather-sunny");
    stopRain();
  }
}

function startRain() {
  rainCanvas.classList.remove("hidden");
  raining = true;
  createRaindrops(300);
  drawRain();
}

function stopRain() {
  rainCanvas.classList.add("hidden");
  raining = false;
}

function createRaindrops(count) {
  raindrops = [];
  for (let i = 0; i < count; i++) {
    raindrops.push({
      x: Math.random() * rainCanvas.width,
      y: Math.random() * rainCanvas.height,
      length: Math.random() * 20 + 10,
      speed: Math.random() * 4 + 2,
      opacity: Math.random() * 0.3 + 0.1,
    });
  }
}

function drawRain() {
  if (!raining) return;

  rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
  rainCtx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  rainCtx.lineWidth = 1;

  for (let drop of raindrops) {
    rainCtx.beginPath();
    rainCtx.moveTo(drop.x, drop.y);
    rainCtx.lineTo(drop.x, drop.y + drop.length);
    rainCtx.stroke();

    drop.y += drop.speed;
    if (drop.y > rainCanvas.height) {
      drop.y = -drop.length;
      drop.x = Math.random() * rainCanvas.width;
    }
  }
  requestAnimationFrame(drawRain);
}

function hideSections() {
  currentSection.classList.add("hidden");
  forecastSection.classList.add("hidden");
  errorMessage.classList.add("hidden");
}

function showLoader(show) {
  loader.classList.toggle("hidden", !show);
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}

function saveHistory(city) {
  let history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  if (!history.includes(city)) {
    history.push(city);
    localStorage.setItem("weatherHistory", JSON.stringify(history));
  }
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  historyList.innerHTML = "";
  history.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    historyList.appendChild(li);
  });
}

loadHistory();

/* CLOUD ANIMATION */
const cloudContainer = document.querySelector(".weather-bg");
const totalClouds = 20;
const clouds = [];

for (let i = 0; i < totalClouds; i++) {
  const cloud = document.createElement("div");
  cloud.className = "cloud";
  cloudContainer.appendChild(cloud);

  const size = Math.random() * 0.5 + 0.5;
  const opacity = Math.random() * 0.3 + 0.2;
  const speed = (Math.random() * 0.3 + 0.1) * (Math.random() < 0.5 ? 1 : -1);

  clouds.push({
    el: cloud,
    x: Math.random() * window.innerWidth,
    y: 30 + Math.random() * (window.innerHeight / 2 - 60),
    speed,
    size,
    opacity,
  });
}

function animateClouds() {
  clouds.forEach(cloud => {
    cloud.x += cloud.speed;

    if (cloud.speed > 0 && cloud.x > window.innerWidth) {
      cloud.x = -300;
    }
    if (cloud.speed < 0 && cloud.x < -300) {
      cloud.x = window.innerWidth + 300;
    }

    cloud.el.style.transform = `translate(${cloud.x}px, ${cloud.y}px) scale(${cloud.size})`;
    cloud.el.style.opacity = cloud.opacity;
  });

  requestAnimationFrame(animateClouds);
}
animateClouds();

window.addEventListener("resize", () => {
  rainCanvas.width = window.innerWidth;
  rainCanvas.height = window.innerHeight;
});
rainCanvas.width = window.innerWidth;
rainCanvas.height = window.innerHeight;

const apiKey = "32f03f38250bc620a8e5524554c846fa"; // Replace with your OpenWeatherMap API key
let currentCity = "";

const unitToggle = document.getElementById("unitToggle");

unitToggle.addEventListener("change", () => {
  getWeather(currentCity);
});

function getUnits() {
  return unitToggle.checked ? "imperial" : "metric";
}

function getEmoji(desc) {
  const lower = desc.toLowerCase();
  if (lower.includes("cloud")) return "☁️";
  if (lower.includes("clear")) return "☀️";
  if (lower.includes("rain")) return "🌧️";
  if (lower.includes("thunder")) return "⛈️";
  if (lower.includes("snow")) return "❄️";
  if (lower.includes("mist") || lower.includes("fog")) return "🌫️";
  return "🌡️";
}

function updateSearchHistory(city) {
  let history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  if (!history.includes(city)) {
    history.unshift(city);
    if (history.length > 5) history.pop();
    localStorage.setItem("weatherHistory", JSON.stringify(history));
  }
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById("searchHistory");
  const history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  list.innerHTML = "";
  history.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.onclick = () => getWeather(city);
    list.appendChild(li);
  });
}

function clearHistory() {
  localStorage.removeItem("weatherHistory");
  renderHistory();
}

function getWeather(inputCity = null) {
  const city = inputCity || document.getElementById("cityInput").value;
  currentCity = city;
  const weatherDiv = document.getElementById("weatherInfo");
  const forecastDiv = document.getElementById("forecastInfo");

  if (!city) {
    weatherDiv.innerHTML = "<p>Please enter a city name.</p>";
    return;
  }

  weatherDiv.innerHTML = `<p>Loading...</p>`;
  forecastDiv.innerHTML = "";
  weatherDiv.classList.remove("visible");
  forecastDiv.classList.remove("visible");

  const units = getUnits();
  const lang = "en"; // fixed language (English only)

  const currentURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}&lang=${lang}`;
  const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${units}&lang=${lang}`;

  fetch(currentURL)
    .then(res => {
      if (!res.ok) throw new Error("City not found");
      return res.json();
    })
    .then(data => {
      const temp = data.main.temp;
      const desc = data.weather[0].description;
      const icon = data.weather[0].icon;
      const emoji = getEmoji(desc);
      const cityName = data.name;
      const unitSymbol = units === "imperial" ? "°F" : "°C";

      updateSearchHistory(cityName);

      weatherDiv.innerHTML = `
        <div class="weather-info">
          <h2>${cityName}</h2>
          <p>${temp}${unitSymbol}</p>
          <p>${emoji} ${desc.charAt(0).toUpperCase() + desc.slice(1)}</p>
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}" />
        </div>
      `;
      weatherDiv.classList.add("visible");
    });

  fetch(forecastURL)
    .then(res => res.json())
    .then(data => {
      const forecastList = data.list.filter(item => item.dt_txt.includes("12:00:00"));
      const unitSymbol = units === "imperial" ? "°F" : "°C";

      let forecastHTML = `<h3>5-Day Forecast</h3><div class="forecast-cards">`;

      forecastList.forEach((item, index) => {
        const date = new Date(item.dt_txt).toDateString().slice(0, 10);
        const icon = item.weather[0].icon;
        const temp = Math.round(item.main.temp);
        const desc = item.weather[0].main;
        const emoji = getEmoji(desc);

        forecastHTML += `
          <div class="forecast-card">
            <p>${date}</p>
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}" />
            <p>${emoji} ${temp}${unitSymbol}</p>
          </div>
        `;
      });

      forecastHTML += `</div>`;
      forecastDiv.innerHTML = forecastHTML;
      forecastDiv.classList.add("visible");
    });
}

function getLocationWeather() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    const units = getUnits();
    const lang = "en";
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=${units}&lang=${lang}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const city = data.name;
        getWeather(city);
      })
      .catch(() => {
        alert("Unable to fetch location weather.");
      });
  });
}

// Load history on page load
renderHistory();

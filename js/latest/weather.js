"use strict"

// Weather API (js/v1/weather.js)
const api = "557b466129cf7d7427b03e5b7886a4bb";
export function weatherAPI(lat, lon) {
    const base =
        `https://api.openweathermap.org/data/2.5/weather` +
        `?lat=${lat}&lon=${lon}&appid=${api}&lang=ja`;

    // Current weather data
    const kelvin = 273.15;
    let icon0,
        weather0,
        temp_current,
        temp_max,
        temp_min,
        clouds,
        wind,
        sunrise,
        sunset;

    fetch(base)
        .then((response) => {
            if (!response.ok) {
                // HTTPエラー（APIキー不正・リクエスト超過など）を明示的に検知
                throw new Error(`weatherAPI: HTTP ${response.status}`);
            };
            return response.json();
        })
        .then((data) => {
            // 期待する形のレスポンスかどうかを確認してから使う
            if (!data || !data.weather || !data.weather[0] || !data.main || !data.sys) {
                throw new Error("weatherAPI: unexpected response shape");
            };

            icon0 = "https://openweathermap.org/img/wn/" + data.weather[0].icon + "@2x.png";
            weather0 = data.weather[0].description + ", " + data.weather[0].main;
            temp_current = Math.floor(data.main.temp - kelvin) + "°C";
            temp_max = Math.floor(data.main.temp_max - kelvin) + "°C";
            temp_min = Math.floor(data.main.temp_min - kelvin) + "°C";
            clouds = data.clouds ? data.clouds.all : 0;
            wind = data.wind ? data.wind.speed : 0;
            sunrise = data.sys.sunrise;
            sunset = data.sys.sunset;

            const weather = document.querySelector("#weather");
            if (!weather) return;

            weather.hidden = false;
            weather.innerHTML = `
            <p>
            <u>現在の天気</u>
            <strong>${weather0}</strong>
            </p>
            <img src="${icon0}" alt="${weather0}">
            <marquee>
            <strong>
            <small>日の出 Sunrise</small>
            ${new Date(sunrise * 1000).toLocaleTimeString()}
            </strong>
            | 
            <strong>
            <small>日の入 Sunset</small>
            ${new Date(sunset * 1000).toLocaleTimeString()}
            </strong>
            | 
            <small>気温 ${temp_current} | 最高気温 ${temp_max} | 最低気温 ${temp_min} | 雲量 ${clouds}% | 風速 ${wind}m/s</small>
            </marquee>
            `;
        })
        .catch((error) => {
            // 失敗時にコンソールへ記録し、天気欄は非表示のまま維持
            console.error("weatherAPI failed:", error);
            const weather = document.querySelector("#weather");
            if (weather) weather.hidden = true;
        });
};
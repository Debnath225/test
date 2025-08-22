import { WEATHER_API_KEY, GEMINI_API_KEY } from './config.js';
let currentWeather = '';
let currentCity = '';
let currentTemp = '';
let currentHumidity = '';
let currentWind = '';

function toggleChat() {
  document.getElementById('chatDrawer').classList.toggle('open');
}

function getWeatherEmoji(weather) {
  const main = weather.toLowerCase();
  if (main.includes("cloud")) return "☁";
  if (main.includes("clear")) return "☀";
  if (main.includes("rain")) return "🌧";
  if (main.includes("thunder")) return "⛈";
  if (main.includes("snow")) return "❄";
  if (main.includes("mist") || main.includes("fog")) return "🌫";
  return "🌍";
}

function fetchWeather(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`)
    .then(res => res.json())
    .then(data => {
      currentWeather = data.weather[0].description;
      currentTemp = Math.round(data.main.temp);
      currentCity = data.name;
      currentHumidity = data.main.humidity;
      currentWind = data.wind.speed;
      document.getElementById("city").textContent = currentCity;
      document.getElementById("temperature").textContent = currentTemp + "°C";
      document.getElementById("description").textContent = currentWeather;
      document.getElementById("humidity").textContent = currentHumidity + "%";
      document.getElementById("wind").textContent = (currentWind * 3.6).toFixed(1) + " km/h";
      document.getElementById("icon").textContent = getWeatherEmoji(data.weather[0].main);
    })
    .catch(() => {
      document.getElementById("city").textContent = "Could not fetch weather data.";
    });
}

function requestLocation() {
  if (!navigator.geolocation) {
    document.getElementById("city").textContent = "Geolocation not supported";
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
    err => {
      document.getElementById("city").textContent = "Location access denied.";
      console.error("Geolocation error:", err);
    }
  );
}

requestLocation();

async function sendMessage() {
  const input = document.getElementById('userInput');
  const message = input.value.trim();
  if (!message) return;

  // Add the user's message to the chat
  addMessage('user', message);
  input.value = '';

  // Check for greetings and respond immediately
  if (message.toLowerCase() === 'hi' || message.toLowerCase() === 'hello') {
    addMessage('bot', 'Hello');
    return; // Exit the function to prevent further processing
  }

  // Show typing indicator for other queries
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'message bot typing-indicator';
  typingIndicator.textContent = '...';
  document.getElementById('chat').appendChild(typingIndicator);
  document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;

  try {
    const aiResponse = await generateReply(message);
    document.getElementById('chat').removeChild(typingIndicator);
    addMessage('bot', aiResponse);
  } catch (error) {
    document.getElementById('chat').removeChild(typingIndicator);
    addMessage('bot', 'Sorry, I couldn\'t get a response. Please try again later.');
    console.error('API call failed:', error);
  }
}
function addMessage(sender, text) {
  const chat = document.getElementById('chat');
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message ' + sender;
  msgDiv.textContent = text;
  chat.appendChild(msgDiv);
  chat.scrollTop = chat.scrollHeight;
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function generateReply(message) {
  // Construct a more detailed and constrained prompt for the AI
  const geminiPrompt = `You are a very concise and brief weather chatbot for ${currentCity}. Respond to the user's query about the weather in less than 50 words.
  
  Current weather in ${currentCity}:
  Temperature: ${currentTemp}°C
  Weather: ${currentWeather}
  Humidity: ${currentHumidity}%
  Wind Speed: ${(currentWind * 3.6).toFixed(1)} km/h
  
  User query: "${message}"`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: geminiPrompt }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`API call failed with status: ${response.status}`);
  }

  const data = await response.json();
  // Ensure the response has a valid structure before trying to access it
  if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts.length > 0) {
    return data.candidates[0].content.parts[0].text;
  } else {
    return "I couldn't generate a response for that.";
  }
}
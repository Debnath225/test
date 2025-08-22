
const { WEATHER_API_KEY, GEMINI_API_KEY } = require('./config.js');
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3000;

app.use(express.json());

app.post("/chat", async (req, res) => {
  const { city, message } = req.body;
  if (!city || !message) {
    return res.status(400).json({ error: "City and message required" });
  }

  try {
    // Fetch weather data for the city
    const weatherRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
    );
    const weatherData = weatherRes.data;

    // Build the prompt
    const geminiPrompt = `You are a very concise and brief weather chatbot for ${weatherData.name}. Respond to the user's query about the weather in less than 50 words.

Current weather in ${weatherData.name}:
Temperature: ${Math.round(weatherData.main.temp)}°C
Weather: ${weatherData.weather[0].description}
Humidity: ${weatherData.main.humidity}%
Wind Speed: ${(weatherData.wind.speed * 3.6).toFixed(1)} km/h

User query: "${message}"`;

    // Call Gemini API
    const aiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: geminiPrompt }]
        }]
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const candidates = aiRes.data.candidates;
    let reply = "I couldn't generate a response for that.";
    if (
      candidates &&
      candidates.length > 0 &&
      candidates[0].content &&
      candidates[0].content.parts.length > 0
    ) {
      reply = candidates[0].content.parts[0].text;
    }

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: "Failed to get AI response." });
  }
});

app.listen(PORT, () => {
  console.log(`🌦️ Weather app running at http://localhost:${PORT}`);
});

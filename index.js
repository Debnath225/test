const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3000;


app.get("/", async (req, res) => {
  const city = "kolkata";

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    );

    const weatherData = response.data;
    res.json({
      city: weatherData.name,
      temperature: weatherData.main.temp,
      description: weatherData.weather[0].description,
      humidity: weatherData.main.humidity,
      wind: weatherData.wind.speed,
    });
  } catch (error) {
    res.status(404).json({ error: "City not found!" });
  }
});

app.listen(PORT, () => {
  console.log(`🌦️ Weather app running at http://localhost:${PORT}`);
});

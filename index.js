const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static("public")); // for your HTML/CSS/JS files
app.use(bodyParser.json());

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Weather endpoint
app.get("/weather", async (req, res) => {
  // <-- FIXED
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: "Missing latitude or longitude" });
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
    );
    res.json(response.data);
  } catch (err) {
    console.error("Weather API error:", err.message);
    res.status(500).json({ error: "Failed to fetch weather" });
  }
});

// Chat endpoint (dummy bot for now)
app.post("/chat", async(req, res) => {
  const { city, message } = req.body;
  if (!city || !message) {
    return res.status(400).json({ error: "Missing city or message" });
  }
  try {
    const geminiresponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: `The current city is ${city}. The user says: ${message}. Respond appropriately.` }
              ]
            }
          ]
        })
      }
    );

    const data = await geminiresponse.json();
    return res.json({ reply: data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated." });
  //   console.log("Gemini reply",data.candidates?.[0]?.content?.parts?.[0]?.text);
  // return res = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    
    // // Safely extract text
    // const reply =
    //   data.candidates?.[0]?.content?.parts?.[0]?.text ||
    //   "No response generated.";

    // console.log("Gemini reply:", reply);
    // return reply;

  } catch (err) {
    console.error("Gemini API error:", err);
    return "Failed to fetch response from Gemini API";
  }

});

// Start server
app.listen(PORT, () => {
  console.log(`🌦 Weather app running at http://localhost:${PORT}`);
});

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.post('/api/food-analysis-text', async (req, res) => {
  const { text } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not set in .env' });
  }
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Ты эксперт по питанию и анализу еды. Твоя задача - анализировать текстовое описание приёма пищи и определять его питательную ценность.'
          },
          {
            role: 'user',
            content: `Проанализируй этот приём пищи: ${text}. Определи примерное количество калорий, белков (г), жиров (г), углеводов (г) и дай оценку качества питания от 0 до 100, где 100 - самое здоровое. Верни только JSON без пояснений: {\"name\": \"Название блюда/приёма\", \"calories\": число, \"protein\": число, \"fats\": число, \"carbs\": число, \"healthScore\": число, \"commentary\": \"краткий комментарий о полезности еды\"}`
          }
        ],
        max_tokens: 1000
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Ошибка запроса к OpenAI' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
}); 
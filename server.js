const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

const N8N_WEBHOOK_URL = 'https://your-n8n-domain.com/webhook/ai-chat';

app.post('/ask', async (req, res) => {
  try {
    const { message } = req.body;

    const response = await axios.post(N8N_WEBHOOK_URL, { message });
    res.json({ reply: response.data.reply || 'No response from AI.' });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to process message.' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port http://localhost:${PORT}`);
});

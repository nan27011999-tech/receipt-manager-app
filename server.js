require('dotenv').config();
const express = require('express');
const { middleware, Client } = require('@line/bot-sdk');
const { handleEvent } = require('./linebot');

const app = express();
const PORT = process.env.PORT || 3000;

// LINE SDK Config
const lineConfig = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
};

const client = new Client(lineConfig);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'ReceiptFlow LINE Bot is running!', version: '1.0.0' });
});

// LINE Webhook endpoint
app.post('/webhook', middleware(lineConfig), async (req, res) => {
  const events = req.body.events;
  res.status(200).json({ status: 'ok' });
  try {
    await Promise.all(events.map(event => handleEvent(client, event)));
  } catch (err) {
    console.error('Error handling events:', err);
  }
});

// Error handler
app.use((err, req, res, next) => {
  if (err.name === 'SignatureValidationFailed') {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log('ReceiptFlow LINE Bot v1.0 - port:', PORT);
  if (!process.env.LINE_CHANNEL_SECRET || !process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn('[WARNING] LINE credentials not found! Copy .env.example to .env');
  }
});

module.exports = app;

require('dotenv').config(); // Add this at the top

const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

app.use(cors({
  origin: ['https://unitedlearning.in', 'https://www.unitedlearning.in']
}));

app.use(express.json());

// 🔐 Use environment variables for Razorpay keys
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ✅ Root route returns a simple message
app.get('/', (req, res) => {
  res.send('Backend is running.');
});

// 🔁 Razorpay capture route
app.post('/server_capture_payment', async (req, res) => {
  const { paymentId, amount } = req.body;

  try {
    const response = await razorpayInstance.payments.capture(paymentId, amount);
    console.log('Payment captured:', response);
    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error('Capture failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🚀 Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

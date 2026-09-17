require('dotenv').config(); // Add this at the top

const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

app.use(cors({
  origin: [
    'https://pollenstore.in',
    'https://www.pollenstore.in',
    'https://3-d-perfume.vercel.app',
    'http://localhost:3000',
    'https://threed-perfume-server.onrender.com'
  ]
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

// Create a Razorpay order without exposing the secret key to the browser.
app.post('/server_create_order', async (req, res) => {
  const { amount, receipt } = req.body;

  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ success: false, error: 'A valid amount is required.' });
  }

  try {
    const order = await razorpayInstance.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      receipt: String(receipt || `receipt_${Date.now()}`).slice(0, 40)
    });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Order creation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔁 Razorpay capture route
app.post('/server_capture_payment', async (req, res) => {
  const { paymentId, amount } = req.body;

  if (!paymentId || !Number.isInteger(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ success: false, error: 'A valid paymentId and amount in paise are required.' });
  }

  try {
    const payment = await razorpayInstance.payments.fetch(paymentId);
    if (payment.status === 'captured') {
      return res.status(200).json({ success: true, data: payment });
    }
    if (payment.status !== 'authorized') {
      return res.status(409).json({ success: false, error: `Payment cannot be captured from status: ${payment.status}.` });
    }
    if (Number(payment.amount) !== Number(amount)) {
      return res.status(400).json({ success: false, error: 'Payment amount does not match the order amount.' });
    }

    const response = await razorpayInstance.payments.capture(paymentId, Number(amount));
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

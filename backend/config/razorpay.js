const Razorpay = require('razorpay');

let razorpay;
try {
    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_id';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
    razorpay = new Razorpay({ key_id, key_secret });
} catch (err) {
    console.warn('⚠️ Razorpay initialization warning (mock fallback active):', err.message);
    razorpay = {
        orders: {
            create: async () => ({ id: 'order_mock_' + Date.now(), amount: 1000, currency: 'INR' })
        }
    };
}

module.exports = razorpay;

const mongoose = require('mongoose');

let connectionPromise = null;

function connectDB() {
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('✅  MongoDB connected');

    const Coupon = require('./models/Coupon');
    const exists = await Coupon.findOne({ code: 'DEZIRE10' });
    if (!exists) {
      await Coupon.create({ code: 'DEZIRE10', type: 'percent', value: 10 });
      console.log('✅  Seeded DEZIRE10 coupon (10% off)');
    }
  });

  return connectionPromise;
}

module.exports = { connectDB };

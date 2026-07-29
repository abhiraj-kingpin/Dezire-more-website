const mongoose = require('mongoose');

// Memoized connection promise — on Render/local this only ever runs once at
// boot anyway, but on Firebase Functions a warm container reuses the same
// module scope across invocations, so this avoids reconnecting (and
// re-seeding the coupon) on every request.
let connectionPromise = null;

function connectDB() {
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('✅  MongoDB connected');

    // The chatbot has always advertised "DEZIRE10" as a working 10% discount
    // code, but nothing backed it until the coupon system existed — seed it
    // once so that promise is actually true.
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

const mongoose = require('mongoose');

const connectDB = (uri) => {
  return mongoose.connect(uri)
    .then(() => console.log(`MongoDB connected successfully at`, new Date().toISOString()))
    .catch((err) => console.error(`MongoDB connection error:`, err));
};

module.exports = connectDB;
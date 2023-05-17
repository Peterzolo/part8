const mongoose = require("mongoose");
require("dotenv").config();

exports.databaseConnection = async () => {
  const mongoDB = await mongoose.connect(process.env.MONGODB_URI);
  try {
    if (mongoDB) {
      console.log("connected to MongoDB");
    }
  } catch (error) {
    console.log("error connection to MongoDB:", error.message);
  }
};

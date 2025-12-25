// scripts/addAnalysisPreferences.js
const mongoose = require('mongoose');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
require('dotenv').config();

const migrate = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const result = await User.updateMany(
    { analysisPreferences: { $exists: false } }, // only profiles missing it
    {
      $set: {
        analysisPreferences: {
          codeDuplication: true,
          expressMiddleware: true,
          reactHooks: true,
          propDrilling: true,
        }
      }
    }
  );

  console.log(`Updated ${result.modifiedCount} profiles`);
  await mongoose.disconnect();
};

migrate().catch(console.error);
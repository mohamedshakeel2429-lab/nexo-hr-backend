require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const TalentProfile = require('./models/TalentProfile.model');
const Application = require('./models/Application.model');

(async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ loaded' : '❌ not found');
    
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not set in environment');
    }
    
    await mongoose.connect(process.env.MONGO_URI, { 
      serverSelectionTimeoutMS: 5000 
    });
    
    // Fix TalentProfile URLs
    console.log('🔄 Fixing TalentProfile URLs...');
    const talentProfiles = await TalentProfile.find({ 'resume.url': { $regex: 'localhost' } });
    let talentUpdated = 0;
    
    for (const profile of talentProfiles) {
      if (profile.resume?.url) {
        profile.resume.url = profile.resume.url.replace('http://localhost:5000', 'https://nexohrsolutions.com/api');
        await profile.save();
        talentUpdated++;
      }
    }
    
    // Fix Application URLs
    console.log('🔄 Fixing Application URLs...');
    const applications = await Application.find({ 'resume.url': { $regex: 'localhost' } });
    let appUpdated = 0;
    
    for (const app of applications) {
      if (app.resume?.url) {
        app.resume.url = app.resume.url.replace('http://localhost:5000', 'https://nexohrsolutions.com/api');
        await app.save();
        appUpdated++;
      }
    }
    
    console.log('✅ Updated TalentProfile URLs:', talentUpdated);
    console.log('✅ Updated Application URLs:', appUpdated);
    
    await mongoose.disconnect();
    console.log('✅ Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();

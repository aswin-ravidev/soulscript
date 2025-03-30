// Simple script to test MongoDB connection
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/soulscript';

async function testConnection() {
  console.log('Testing MongoDB connection to:', MONGODB_URI);
  
  try {
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      family: 4,
    });
    
    console.log('✅ MongoDB connected successfully!');
    
    // Create a simple test model
    const TestModel = mongoose.model('TestModel', new mongoose.Schema({
      name: String,
      timestamp: { type: Date, default: Date.now }
    }));
    
    // Create a test document
    const testDoc = await TestModel.create({ name: 'test-connection' });
    console.log('✅ Created test document:', testDoc._id.toString());
    
    // Retrieve the document
    const found = await TestModel.findById(testDoc._id);
    console.log('✅ Retrieved document:', found.name);
    
    // Delete the test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Deleted test document');
    
    console.log('✅ All MongoDB operations successful');
  } catch (error) {
    console.error('❌ MongoDB connection or operation failed:', error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
}

testConnection(); 
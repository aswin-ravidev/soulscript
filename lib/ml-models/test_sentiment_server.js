/**
 * Test script for the sentiment server
 * Run with: node lib/ml-models/test_sentiment_server.js
 */

const { startSentimentServer } = require('./start_anaconda_server');
const http = require('http');
const readline = require('readline');

// Sample texts for testing
const sampleTexts = [
  {
    category: "Anxiety",
    text: "I can't stop worrying about everything. My heart races constantly and I feel like something terrible is about to happen. I keep checking things over and over."
  },
  {
    category: "Depression",
    text: "I feel so empty and hopeless. Nothing brings me joy anymore, and I'm always tired. I don't see any point in trying."
  },
  {
    category: "Normal",
    text: "Today was a good day. I went for a walk in the park and enjoyed the sunshine. I met with friends for coffee and we had a great conversation."
  }
];

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Start the sentiment server
console.log("Starting sentiment server...");
const sentimentServer = startSentimentServer();

// Wait for server to start
setTimeout(() => {
  console.log("\nTesting sentiment server (http://localhost:5000)\n");
  showMenu();
}, 5000);

// Function to analyze text
function analyzeText(text) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/analyze',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    req.write(JSON.stringify({ text }));
    req.end();
  });
}

// Show menu options
function showMenu() {
  console.log("\nTest Options:");
  console.log("1. Test with sample texts");
  console.log("2. Enter custom text for analysis");
  console.log("3. Exit");
  
  rl.question("\nSelect an option (1-3): ", async (answer) => {
    switch (answer) {
      case '1':
        await testSampleTexts();
        showMenu();
        break;
      case '2':
        await testCustomText();
        break;
      case '3':
        cleanup();
        break;
      default:
        console.log("Invalid option, please try again.");
        showMenu();
    }
  });
}

// Test with sample texts
async function testSampleTexts() {
  console.log("\nTesting with sample texts...");
  
  for (const sample of sampleTexts) {
    console.log(`\n== Expected category: ${sample.category} ==`);
    console.log(`Text: "${sample.text.substring(0, 100)}${sample.text.length > 100 ? '...' : ''}"`);
    
    try {
      const result = await analyzeText(sample.text);
      console.log("Result:", result);
      console.log(`Predicted: ${result.sentiment} (confidence: ${result.confidence?.toFixed(4) || 'N/A'})`);
    } catch (error) {
      console.error("Error analyzing text:", error);
    }
  }
  
  console.log("\nSample tests completed.");
}

// Test with custom text
async function testCustomText() {
  rl.question("\nEnter text to analyze: ", async (text) => {
    if (text.trim() === '') {
      console.log("Text cannot be empty. Please try again.");
      await testCustomText();
      return;
    }
    
    try {
      console.log("Analyzing text...");
      const result = await analyzeText(text);
      console.log("Result:", result);
      console.log(`Predicted: ${result.sentiment} (confidence: ${result.confidence?.toFixed(4) || 'N/A'})`);
    } catch (error) {
      console.error("Error analyzing text:", error);
    }
    
    showMenu();
  });
}

// Cleanup and exit
function cleanup() {
  console.log("\nCleaning up and exiting...");
  if (sentimentServer) {
    sentimentServer.kill();
  }
  rl.close();
  process.exit(0);
}

// Handle Ctrl+C
process.on('SIGINT', cleanup); 
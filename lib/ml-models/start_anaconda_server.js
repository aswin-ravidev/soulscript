/**
 * Script to start the sentiment analysis server using a specific Anaconda environment
 */

const { spawn } = require('child_process');
const path = require('path');

// Specific Anaconda path and environment
const condaPath = 'C:\\Users\\aswin\\anaconda3\\Scripts\\conda.exe';
const condaEnv = 'torch_env';

// Function to start the sentiment server
function startSentimentServer() {
    console.log('Starting Sentiment Analysis Server with Anaconda...');
    
    // Get the directory of this script
    const scriptDir = path.dirname(__dirname);
    const mlModelsDir = path.join(scriptDir, 'ml-models');
    
    // Path to the sentiment server Python script
    const sentimentServerPath = path.join(mlModelsDir, 'sentiment_server.py');
    
    console.log(`Using conda at: ${condaPath}`);
    console.log(`Using conda environment: ${condaEnv}`);
    console.log(`Running script: ${sentimentServerPath}`);
    
    // Spawn the sentiment server process using the specific Anaconda environment
    const sentimentServer = spawn(condaPath, ['run', '-n', 'torch_env', 'python', 'lib/ml-models/sentiment_server.py'], {
        stdio: 'pipe',
        shell: true
    });
    
    // Handle sentiment server output
    sentimentServer.stdout.on('data', (data) => {
        console.log(`Sentiment Server: ${data}`);
    });
    
    sentimentServer.stderr.on('data', (data) => {
        console.error(`Sentiment Server Error: ${data}`);
    });
    
    sentimentServer.on('close', (code) => {
        console.log(`Sentiment Server exited with code ${code}`);
    });
    
    // Handle application shutdown
    process.on('SIGINT', () => {
        sentimentServer.kill();
        process.exit();
    });
    
    return sentimentServer;
}

// Start the server if this file is run directly
if (require.main === module) {
    startSentimentServer();
}

module.exports = { startSentimentServer }; 
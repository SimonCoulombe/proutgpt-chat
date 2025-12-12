// Simple script to test Ollama models endpoint
// This would be run on your Oracle VM to verify the Ollama API is working

const API_URL = 'http://localhost:11434'; // Default Ollama API URL

async function testOllamaModels() {
    try {
        console.log(`Testing Ollama models endpoint at ${API_URL}/api/tags`);

        const response = await fetch(`${API_URL}/api/tags`);

        if (response.ok) {
            const data = await response.json();
            console.log('Available Ollama models:');
            console.log(JSON.stringify(data.models, null, 2));
        } else {
            console.error('Failed to fetch Ollama models');
            console.error('Status:', response.status);
        }
    } catch (error) {
        console.error('Error testing Ollama models:', error);
    }
}

// Uncomment to run the test
// testOllamaModels();
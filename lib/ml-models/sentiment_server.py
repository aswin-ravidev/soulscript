from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn as nn
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
import joblib

app = Flask(__name__)
CORS(app)

# Define sentiment categories in the same order as training
sentiment_categories = [
    "Anxiety",
    "Bipolar",
    "Depression",
    "Normal",
    "Personality disorder",
    "Stress",
    "Suicidal"
]

# Define the same model architecture as training
class SimpleNN(nn.Module):
    def __init__(self, input_size, num_classes):
        super(SimpleNN, self).__init__()
        self.fc1 = nn.Linear(input_size, 256)
        self.relu = nn.ReLU()
        self.dropout1 = nn.Dropout(0.3)
        self.fc2 = nn.Linear(256, 128)
        self.relu2 = nn.ReLU()
        self.dropout2 = nn.Dropout(0.3)
        self.fc3 = nn.Linear(128, num_classes)

    def forward(self, x):
        x = self.dropout1(self.relu(self.fc1(x)))
        x = self.dropout2(self.relu2(self.fc2(x)))
        x = self.fc3(x)
        return x

# Load the fitted TF-IDF vectorizer
try:
    tfidf = joblib.load('lib/ml-models/tfidf_vectorizer.pkl')
except FileNotFoundError:
    print("Error: TF-IDF vectorizer not found. Please ensure you have saved it from your training.")
    exit(1)

# Initialize and load the model
input_size = 10000  # max_features from TfidfVectorizer
num_classes = len(sentiment_categories)
model = SimpleNN(input_size=input_size, num_classes=num_classes)
model.load_state_dict(torch.load('lib/ml-models/best_model.pth'))
model.eval()

@app.route('/analyze', methods=['POST'])
def analyze_sentiment():
    try:
        data = request.json
        text = data.get('text', '')
        
        # Preprocess text with TF-IDF
        text_features = tfidf.transform([text]).toarray()
        text_tensor = torch.tensor(text_features, dtype=torch.float32)
        
        # Get predictions
        with torch.no_grad():
            outputs = model(text_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            predicted_prob, predicted_idx = torch.max(probabilities, 1)
            
            # Get the predicted category
            predicted_label = sentiment_categories[predicted_idx.item()]
            confidence = predicted_prob.item()
        
        return jsonify({
            'sentiment': predicted_label,
            'confidence': confidence
        })
    
    except Exception as e:
        print(f"Error in sentiment analysis: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000) 
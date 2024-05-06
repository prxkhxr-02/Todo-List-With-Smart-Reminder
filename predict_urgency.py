import joblib
from sklearn.feature_extraction.text import TfidfVectorizer

# Load the trained model and TF-IDF vectorizer
svm_model = joblib.load('C:/Users/mailm/OneDrive/Documents/Todo/Todo/svm_model.pkl')
tfidf_vectorizer = joblib.load('C:/Users/mailm/OneDrive/Documents/Todo/Todo/tfidf_vectorizer.pkl')

def predict_urgency(task_description):
    # Convert task description to TF-IDF features using the loaded vectorizer
    task_features = tfidf_vectorizer.transform([task_description])
    
    # Predict urgency using the loaded model
    predicted_urgency = svm_model.predict(task_features)[0]
    return predicted_urgency

if __name__ == "__main__":
    import sys
    task_description = sys.argv[1]
    urgency = predict_urgency(task_description)
    print(urgency)

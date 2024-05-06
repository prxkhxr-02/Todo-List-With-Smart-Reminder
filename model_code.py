from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC
import joblib
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split

# Define your dataset (task descriptions and their corresponding urgency labels)
task_descriptions = [
    "Send report to manager ASAP",
    "Review document by end of week",
    "Buy groceries",
    "Emergency meeting at 10:00 AM",
    "Schedule dentist appointment",
    "Prepare presentation slides for client meeting",
    "Call customer regarding project status",
    "Attend training session on new software",
    "Submit quarterly report by deadline",
    "Follow up with sales team on pending deals",
    "Resolve urgent customer complaint",
    "Arrange travel plans for upcoming conference",
    "Coordinate logistics for product launch event",
    "Attend project kickoff meeting",
    "Complete online training modules by end of month",
    "Respond to urgent email from CEO",
    "Organize team building activity for department",
    "Schedule performance review with manager",
    "Attend networking event with industry professionals",
    "Book hotel for business trip next week"
]

urgency_labels = ['urgent', 'not urgent', 'not urgent', 'urgent', 'not urgent',
                  'urgent', 'urgent', 'not urgent', 'urgent', 'urgent',
                  'urgent', 'urgent', 'urgent', 'urgent', 'not urgent',
                  'urgent', 'not urgent', 'urgent', 'not urgent', 'not urgent']

# Split dataset into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(task_descriptions, urgency_labels, test_size=0.2, random_state=42)

# Initialize TF-IDF vectorizer
tfidf_vectorizer = TfidfVectorizer()

# Convert task descriptions to TF-IDF features
X_train_tfidf = tfidf_vectorizer.fit_transform(X_train)
X_test_tfidf = tfidf_vectorizer.transform(X_test)

# Initialize SVM classifier
svm_classifier = SVC(kernel='linear')

# Train the classifier
svm_classifier.fit(X_train_tfidf, y_train)

# Save the trained model and TF-IDF vectorizer to files
joblib.dump(svm_classifier, 'svm_model.pkl')
joblib.dump(tfidf_vectorizer, 'tfidf_vectorizer.pkl')

# Evaluate the classifier
y_pred = svm_classifier.predict(X_test_tfidf)
print("Classification Report:\n", classification_report(y_test, y_pred))
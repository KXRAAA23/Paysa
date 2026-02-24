import json
import os
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
MODEL_DIR = os.path.join(BASE_DIR, "models")

CATEGORY_DATA_PATH = os.path.join(DATA_DIR, "category_dataset.json")
FOOD_SUBTYPE_DATA_PATH = os.path.join(DATA_DIR, "food_subtype_dataset.json")

os.makedirs(MODEL_DIR, exist_ok=True)


def build_category_model():
    return make_pipeline(
        TfidfVectorizer(
            analyzer='word',
            ngram_range=(1, 2),
            lowercase=True
        ),
        LogisticRegression(max_iter=2000, class_weight='balanced')
    )


def build_subtype_model():
    return make_pipeline(
        TfidfVectorizer(
            analyzer='char_wb',
            ngram_range=(2, 5)
        ),
        LogisticRegression(max_iter=2000, class_weight='balanced')
    )


def train_category_model():
    if not os.path.exists(CATEGORY_DATA_PATH):
        print("Category dataset not found.")
        return

    with open(CATEGORY_DATA_PATH, "r") as f:
        data = json.load(f)

    texts = [d["name"] for d in data]
    labels = [d["category"] for d in data]

    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42
    )

    model = build_category_model()
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    print("\n=== Category Model Report ===")
    print(classification_report(y_test, predictions))

    with open(os.path.join(MODEL_DIR, "category_model.pkl"), "wb") as f:
        pickle.dump(model, f)

    print("category_model.pkl saved.")


def train_food_subtype_model():
    if not os.path.exists(FOOD_SUBTYPE_DATA_PATH):
        print("Food subtype dataset not found.")
        return

    with open(FOOD_SUBTYPE_DATA_PATH, "r") as f:
        data = json.load(f)

    texts = [d["name"] for d in data]
    labels = [d["type"] for d in data]

    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42
    )

    model = build_subtype_model()
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    print("\n=== Food Subtype Model Report ===")
    print(classification_report(y_test, predictions))

    with open(os.path.join(MODEL_DIR, "food_subtype_model.pkl"), "wb") as f:
        pickle.dump(model, f)

    print("food_subtype_model.pkl saved.")


if __name__ == "__main__":
    print("Training Category Model...")
    train_category_model()

    print("\nTraining Food Subtype Model...")
    train_food_subtype_model()

    print("\n Training complete.")
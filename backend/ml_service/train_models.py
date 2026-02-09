import json
import os
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline

DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'dataset.json')
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')

def train():
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)

    if not os.path.exists(DATA_PATH):
        print(f"Dataset not found at {DATA_PATH}")
        return

    with open(DATA_PATH, 'r') as f:
        data = json.load(f)

    # 1. Train Category Classifier
    texts = [d['text'] for d in data]
    categories = [d['category'] for d in data]

    if texts:
        cat_pipeline = make_pipeline(
            TfidfVectorizer(stop_words='english'),
            LogisticRegression()
        )
        cat_pipeline.fit(texts, categories)

        with open(os.path.join(MODEL_DIR, 'category_model.pkl'), 'wb') as f:
            pickle.dump(cat_pipeline, f)
        print("Category model trained.")
    else:
        print("No training data found.")

    # 2. Train Item Type Classifier
    item_texts = []
    item_types = []

    for d in data:
        if d.get('items'):
            for item in d['items']:
                item_texts.append(item['name'])
                item_types.append(item['type'])

    if item_texts:
        type_pipeline = make_pipeline(
            TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 5)), # Use char n-grams for short item names
            LogisticRegression()
        )
        type_pipeline.fit(item_texts, item_types)

        with open(os.path.join(MODEL_DIR, 'item_model.pkl'), 'wb') as f:
            pickle.dump(type_pipeline, f)
        
        print(f"Item type model trained on {len(item_texts)} items.")

if __name__ == "__main__":
    train()

import json
import os
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline

BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, 'data', 'dataset.json')
MODEL_DIR = os.path.join(BASE_DIR, 'models')

MIN_ITEMS = 40

def train():
    if not os.path.exists(DATA_PATH):
        print("No dataset found.")
        return

    with open(DATA_PATH, 'r') as f:
        data = json.load(f)

    os.makedirs(MODEL_DIR, exist_ok=True)

    item_texts, item_types = [], []
    for d in data:
        for item in d.get("items", []):
            item_texts.append(item["name"])
            item_types.append(item["type"])

    if len(item_texts) < MIN_ITEMS:
        print(f"Not enough data ({len(item_texts)}). Need {MIN_ITEMS}.")
        return

    item_model = make_pipeline(
        TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 5)),
        LogisticRegression(max_iter=1000, class_weight='balanced')
    )

    item_model.fit(item_texts, item_types)

    with open(os.path.join(MODEL_DIR, "item_model.pkl"), "wb") as f:
        pickle.dump(item_model, f)

    print("Item model trained successfully.")

if __name__ == "__main__":
    train()

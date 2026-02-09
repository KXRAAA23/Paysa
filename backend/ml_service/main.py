import sys
import json
import os
import pickle
import re

try:
    import pytesseract
    from PIL import Image
except ImportError as e:
    print(json.dumps({"error": f"Missing dependencies: {e}"}))
    sys.exit(1)

# Tesseract path
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
CAT_MODEL_PATH = os.path.join(MODEL_DIR, 'category_model.pkl')
ITEM_MODEL_PATH = os.path.join(MODEL_DIR, 'item_model.pkl')


# ================= OCR (MINIMAL, SAFE) =================
def run_ocr(image_path):
    img = Image.open(image_path)

    custom_config = (
        "--oem 3 "
        "--psm 4 "
        "-c preserve_interword_spaces=1 "
        "-c tessedit_do_invert=0"
    )

    text = pytesseract.image_to_string(img, config=custom_config)
    return normalize_ocr_text(text)


def normalize_ocr_text(text):
    lines = []
    for line in text.split("\n"):
        if not line.strip():
            continue
        line = line.replace("|", "1").replace("₹", "Rs")
        lines.append(line.rstrip())
    return "\n".join(lines)


# ================= MODELS =================
def load_models():
    cat_model = None
    item_model = None

    if os.path.exists(CAT_MODEL_PATH):
        with open(CAT_MODEL_PATH, 'rb') as f:
            cat_model = pickle.load(f)

    if os.path.exists(ITEM_MODEL_PATH):
        with open(ITEM_MODEL_PATH, 'rb') as f:
            item_model = pickle.load(f)

    return cat_model, item_model


# ================= ITEM NAME CLEAN =================
def clean_item_name(name):
    name = re.sub(r'^[^a-zA-Z0-9\(]+', '', name)
    name = re.sub(r'[^a-zA-Z0-9\)]+$', '', name)
    name = re.sub(r'\s+', ' ', name)
    return name.strip().title()


# ================= SPELLING AUTOCORRECT =================
COMMON_FOOD_WORDS = {
    "roti": ["rotl", "roti", "r0ti"],
    "naan": ["nann", "naan", "naon", "nan"],
    "butter": ["buttr", "buter"],
    "tandoori": ["tandoott", "tandoorl", "tandoori"],
    "chapati": ["chapatl", "chapati"],
    "paneer": ["paner", "paneor", "paneer"]
}

def autocorrect_item_name(name):
    lower = name.lower()
    for correct, variants in COMMON_FOOD_WORDS.items():
        for v in variants:
            if v in lower:
                lower = lower.replace(v, correct)
    return lower.title()


# ================= ITEM EXTRACTION (IMPROVED) =================
def extract_items_from_text(text):
    lines = text.split('\n')
    items = []

    ignore_keywords = {
        'total', 'subtotal', 'cgst', 'sgst', 'gst',
        'tax', 'vat', 'discount', 'service charge',
        'round off', 'net payable'
    }

    address_signals = {
        'road', 'street', 'nagar', 'layout',
        'ph:', 'phone', 'gstin', 'date:', 'bill no'
    }

    last_seen_price = None  # ⭐ KEY FIX

    for line in lines:
        line = line.strip()
        if not line:
            continue

        lower_line = line.lower()

        if any(k in lower_line for k in ignore_keywords):
            continue
        if any(sig in lower_line for sig in address_signals):
            continue

        raw_tokens = line.split()
        nums, words = [], []

        for t in raw_tokens:
            cleaned = re.sub(r'[^\d.]', '', t.replace('o', '0').replace('l', '1'))
            if cleaned:
                try:
                    nums.append(float(cleaned))
                except:
                    words.append(t)
            else:
                words.append(t)

        # Case 1: normal line with price
        if len(nums) >= 1:
            amount = nums[-1]
            if 5 < amount < 50000:
                last_seen_price = amount
                name = clean_item_name(" ".join(words))
                if len(name) > 2:
                    items.append({
                        "name": name,
                        "amount": amount,
                        "quantity": 1
                    })
                continue

        # Case 2: name-only line (Roti / Naan)
        if last_seen_price and words:
            name = clean_item_name(" ".join(words))
            if 2 < len(name) <= 12:
                items.append({
                    "name": name,
                    "amount": last_seen_price,
                    "quantity": 1
                })
                last_seen_price = None

    return items


# ================= ITEM TYPE =================
def classify_item_type(name):
    name = name.lower()
    if any(k in name for k in ['tax', 'gst', 'vat', 'service']):
        return "TAX_IGNORE"
    if any(k in name for k in ['beer', 'whisky', 'vodka', 'rum', 'wine']):
        return "Alcohol"
    if any(k in name for k in ['tea', 'coffee', 'coke', 'pepsi', 'water']):
        return "Drinks"
    if any(k in name for k in ['chicken', 'mutton', 'fish', 'prawn', 'egg']):
        return "Non-Veg"
    return "Food"


# ================= MAIN =================
def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(json.dumps({"error": "File not found"}))
        sys.exit(1)

    text = run_ocr(image_path)
    cat_model, item_model = load_models()

    extracted_items = extract_items_from_text(text)

    processed_items = []
    for item in extracted_items:
        item_type = classify_item_type(item["name"])
        if item_type == "TAX_IGNORE":
            continue

        processed_items.append({
            "name": autocorrect_item_name(item["name"]),  # ⭐ frontend-safe
            "amount": item["amount"],
            "quantity": item["quantity"],
            "type": item_type
        })

    total_amount = sum(i["amount"] for i in processed_items)

    result = {
        "merchant": "Unknown Merchant",
        "category": "Food",
        "items": processed_items,
        "totalAmount": total_amount,
        "confidence": 0.85 if processed_items else 0.6,
        "requiresConfirmation": not bool(processed_items),
        "text": text
    }

    print(json.dumps(result))


if __name__ == "__main__":
    main()

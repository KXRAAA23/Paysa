import sys
import json
import os
import pickle
import re
from collections import Counter
from PIL import Image, ImageEnhance

try:
    import pytesseract
except ImportError as e:
    print(json.dumps({"error": f"Missing dependencies: {e}"}))
    sys.exit(1)

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

BASE_DIR = os.path.dirname(__file__)
MODEL_DIR = os.path.join(BASE_DIR, "models")

CATEGORY_MODEL_PATH = os.path.join(MODEL_DIR, "category_model.pkl")
SUBTYPE_MODEL_PATH = os.path.join(MODEL_DIR, "food_subtype_model.pkl")


# ================= OCR =================
def run_ocr(image_path):
    img = Image.open(image_path)
    img = img.resize((img.width * 2, img.height * 2))
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2)

    config = "--oem 3 --psm 4 -c preserve_interword_spaces=1"
    text = pytesseract.image_to_string(img, config=config)
    return normalize_ocr_text(text)


def normalize_ocr_text(text):
    lines = []
    for line in text.split("\n"):
        if not line.strip():
            continue
        line = line.replace("|", "1").replace("₹", "Rs")
        lines.append(line.rstrip())
    return "\n".join(lines)


# ================= LOAD MODELS =================
def load_models():
    category_model = None
    subtype_model = None

    if os.path.exists(CATEGORY_MODEL_PATH):
        with open(CATEGORY_MODEL_PATH, "rb") as f:
            category_model = pickle.load(f)

    if os.path.exists(SUBTYPE_MODEL_PATH):
        with open(SUBTYPE_MODEL_PATH, "rb") as f:
            subtype_model = pickle.load(f)

    return category_model, subtype_model


# ================= MERCHANT EXTRACTION =================
def extract_merchant(text):
    lines = text.split("\n")
    for line in lines[:6]:
        clean = line.strip()
        if clean and not re.search(r'\d', clean):
            if len(clean) > 4:
                return clean.title()
    return "Unknown Merchant"


# ================= ITEM CLEANING =================
def clean_item_name(name):
    name = re.sub(r'^[^a-zA-Z0-9\(]+', '', name)
    name = re.sub(r'[^a-zA-Z0-9\)]+$', '', name)
    name = re.sub(r'\s+', ' ', name)
    name = name.strip().title()

    parts = name.split()
    if parts and len(parts[-1]) <= 2:
        name = " ".join(parts[:-1])

    return name


# ================= ITEM EXTRACTION =================
def extract_items_from_text(text):
    lines = text.split('\n')
    items = []

    ignore_keywords = {
        'total', 'subtotal', 'cgst', 'sgst', 'gst',
        'tax', 'vat', 'discount',
        'service charge', 'service', 'charge',
        'round off', 'net payable',
        'invoice', 'date', 'time', 'name', 'table',
        'receipt', 'bill no', 'mode', 'cash',
        'thank', 'visit', 'highway', 'restaurant',
        'order no', 'phone', 'gstn'
    }

    for line in lines:
        lower = line.lower()

        if any(k in lower for k in ignore_keywords):
            continue

        line = line.replace('%', '')
        line = line.replace('@', '')
        line = line.replace('*', '')
        line = line.replace(':', ' ')

        if not re.search(r'\d', line):
            continue

        if not re.search(r'[A-Za-z]', line):
            continue

        nums = re.findall(r'\d+(?:\.\d{1,2})?', line)
        nums = [float(n) for n in nums]

        if len(nums) < 2:
            continue

        nums_sorted = sorted(nums)

        if len(nums_sorted) >= 3:
            quantity = nums_sorted[-2] if nums_sorted[-2] < 20 else 1
            amount = nums_sorted[-1]
        else:
            quantity = nums_sorted[0] if nums_sorted[0] < 20 else 1
            amount = nums_sorted[-1]

        if 1900 <= amount <= 2100:
            continue

        if amount < 20 or amount > 20000:
            continue

        name = clean_item_name(line)

        if sum(c.isalpha() for c in name) < 3:
            continue

        items.append({
            "name": name,
            "amount": amount,
            "quantity": int(quantity)
        })

    return items


# ================= TOTAL EXTRACTION =================
def extract_total_from_text(text, extracted_items):
    lines = text.split("\n")
    highest_item = max([item["amount"] for item in extracted_items], default=0)

    for line in reversed(lines):
        lower = line.lower().strip()
        if lower.startswith("total"):
            nums = re.findall(r'\d+(?:\.\d{1,2})?', line)
            nums = [float(n) for n in nums]
            if nums:
                candidate = max(nums)
                if candidate >= highest_item:
                    return candidate

    for line in reversed(lines):
        lower = line.lower()
        if "total" in lower and "sub" not in lower:
            nums = re.findall(r'\d+(?:\.\d{1,2})?', line)
            nums = [float(n) for n in nums]
            if nums:
                candidate = max(nums)
                if candidate >= highest_item:
                    return candidate

    return None


# ================= CATEGORY OVERRIDE =================
TRAVEL_KEYWORDS = ["uber", "ola", "petrol", "diesel", "flight", "train", "metro", "bus"]
RENT_KEYWORDS = ["rent", "lease"]
UTILITY_KEYWORDS = ["electricity", "water bill", "internet", "gas", "broadband"]


def override_category(name):
    lower = name.lower()

    if any(k in lower for k in ["whisky", "beer", "vodka", "rum", "wine"]):
        return "Alcohol"

    if any(k in lower for k in TRAVEL_KEYWORDS):
        return "Travel"

    if any(k in lower for k in RENT_KEYWORDS):
        return "Rent"

    if any(k in lower for k in UTILITY_KEYWORDS):
        return "Utilities"

    return None


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
    merchant = extract_merchant(text)

    category_model, subtype_model = load_models()
    extracted_items = extract_items_from_text(text)

    processed_items = []
    item_categories = []

    for item in extracted_items:
        name = item["name"]

        overridden = override_category(name)

        if overridden:
            predicted_category = overridden
        elif category_model:
            predicted_category = category_model.predict([name])[0]
        else:
            predicted_category = "Food"

        subtype = None
        if predicted_category == "Food" and subtype_model:
            subtype = subtype_model.predict([name])[0]

        processed_items.append({
            "name": name,
            "amount": item["amount"],
            "quantity": item["quantity"],
            "category": predicted_category,
            "subtype": subtype
        })

        item_categories.append(predicted_category)

    final_category = Counter(item_categories).most_common(1)[0][0] if item_categories else "Unknown"

    extracted_total = extract_total_from_text(text, extracted_items)
    calculated_sum = sum(i["amount"] for i in processed_items)

    if extracted_total and extracted_total >= calculated_sum:
        total_amount = extracted_total
    else:
        total_amount = calculated_sum

    confidence = 0.9 if len(processed_items) >= 2 else 0.75 if processed_items else 0.6

    result = {
        "merchant": merchant,
        "category": final_category,
        "items": processed_items,
        "totalAmount": total_amount,
        "confidence": confidence,
        "requiresConfirmation": not bool(processed_items),
        "text": text
    }

    print(json.dumps(result))


if __name__ == "__main__":
    main()
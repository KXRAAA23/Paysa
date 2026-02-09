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

# ✅ HARD-SET TESSERACT PATH (WINDOWS SAFE)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
CAT_MODEL_PATH = os.path.join(MODEL_DIR, 'category_model.pkl')
ITEM_MODEL_PATH = os.path.join(MODEL_DIR, 'item_model.pkl')

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

def clean_item_name(name):
    # 1. Remove leading/trailing non-alphanumeric characters (keep brackets, parens)
    # e.g. "‘Mutton" -> "Mutton", "-Chicken" -> "Chicken"
    name = re.sub(r'^[^a-zA-Z0-9\(]+', '', name)
    name = re.sub(r'[^a-zA-Z0-9\)]+$', '', name)
    
    # 2. Collapse multiple spaces
    name = re.sub(r'\s+', ' ', name)
    
    # 3. Remove short stray 1-2 char noise if it looks like garbage (optional, risky)
    # Keeping it safe: just Title Case
    return name.strip().title()

def extract_items_from_text(text):
    lines = text.split('\n')
    items = []
    
    # 1. Keywords to IGNORE
    ignore_keywords = {'total', 'subtotal', 'cgst', 'sgst', 'gst', 'tax', 'vat', 'discount', 'service charge', 'round off', 'net payable', 's.g.s.t', 'c.g.s.t', 'service', 'cost'}
    address_signals = {'road', 'cross', 'main', 'street', 'ave', 'layout', 'nagar', 'halli', 'ooru', 'bengaluru', 'bangalore', 'ph:', 'phone', 'gstin', 'date:', 'bill no'}
    header_signals = {'qty', 'quantity', 'rate', 'price', 'amount', 'total', 'particulars', 'description', 'item', 'product', 'mrp'}

    table_started = False

    
    # 4. Noisy Token Fallback (for bad OCR like "Tandoott Roti m0 5 x50")
    # Strategy: Tokenize -> Find last token that looks like a number (Total)
    
    # NEW: Table Detection Logic
    table_started = False
    header_signals = {'qty', 'quantity', 'rate', 'price', 'amount', 'total', 'particulars', 'description', 'item', 'product', 'mrp'}
    address_signals = {'road', 'cross', 'main', 'street', 'ave', 'layout', 'nagar', 'halli', 'ooru', 'bengaluru', 'bangalore', 'ph:', 'phone', 'gstin', 'date:', 'bill no'}

    for line in lines:
        line = line.strip()
        if not line: continue
        lower_line = line.lower()
        
        # 1. STRICT FILTERING
        if '%' in line or any(k in lower_line for k in ignore_keywords): continue
        if re.search(r'\b\d{6}\b', line): continue # PIN codes
        if any(sig in lower_line for sig in address_signals): continue
        if re.search(r'\b(table|date|bill)\b\s*(no|num|dt|#)?', lower_line): continue

        # 2. HEADER DETECTION
        if not table_started:
            tokens = set(lower_line.split())
            if len(tokens.intersection(header_signals)) >= 2:
                table_started = True
                continue

        # 3. MATH TRIPLET SEARCH (The Core Logic)
        raw_tokens = line.split()
        nums = []
        words = []
        
        for t in raw_tokens:
            clean_t = re.sub(r'[^\d.]', '', t.replace('o','0').replace('l','1').lower())
            if not clean_t:
                words.append(t)
                continue
            try:
                if clean_t == '.': continue
                val = float(clean_t)
                if val > 100000: continue 
                nums.append(val)
            except:
                words.append(t)

        match_found = False
        qty = 1
        price = 0.0
        total = 0.0
        
        if len(nums) >= 2:
            candidate_total = nums[-1]
            matched_pair = False
            for i in range(len(nums)-1):
                n1 = nums[i]
                if abs(n1 - candidate_total) < 2.0 and candidate_total > 5.0:
                     price = n1
                     qty = 1
                     total = candidate_total
                     match_found = True
                
                for j in range(i+1, len(nums)-1):
                    n2 = nums[j]
                    if abs(n1 * n2 - candidate_total) < 5.0 and candidate_total > 5.0:
                        if n1 < n2 and n1 < 50 and float(n1).is_integer():
                            qty = int(n1)
                            price = n2
                        elif n2 < n1 and n2 < 50 and float(n2).is_integer():
                            qty = int(n2)
                            price = n1
                        else:
                            qty = int(n1) if n1 < n2 else int(n2)
                            price = n2 if n1 < n2 else n1
                            
                        total = candidate_total
                        match_found = True
                        matched_pair = True
                        break
                
                # NEW: Implicit Unit Price Check (Qty ... Total)
                # If we have [3, 150] and 150/3 = 50.0 (Clean)
                if not matched_pair and n1 < 50 and n1 > 0 and float(n1).is_integer():
                     implicit_unit = candidate_total / n1
                     if implicit_unit > 5.0 and implicit_unit.is_integer():
                         # High confidence this is Qty
                         qty = int(n1)
                         total = candidate_total
                         match_found = True
                         matched_pair = True
                         break

                if matched_pair: break
            
        if match_found:
            table_started = True
            name = " ".join(words)
            name = clean_item_name(name)
            if len(name) > 2:
                 items.append({"name": name, "amount": total, "quantity": qty})
                 continue # SUCCESS: Skip fallbacks

        # 4. Fallback A: Single Valid Price at end (e.g. "Misal Pav 170.00")
        # Only if we are inside table
        if table_started and len(nums) >= 1:
            candidate_price = nums[-1]
            # Valid price range check
            if candidate_price > 5.0 and candidate_price < 50000:
                name = " ".join(words)
                name = clean_item_name(name)
                if len(name) > 2:
                    items.append({"name": name, "amount": candidate_price, "quantity": 1})
                    continue # SUCCESS: Skip further fallbacks

        # 5. Fallback B: Noisy Token Parsing (Last Resort for bad OCR)
        # e.g. "Roti m0 5 x50" -> Extract 50
        tokens = line.split()
        if len(tokens) < 2: continue
            
        last_token = tokens[-1]
        
        def clean_noisy_number(tok):
            tok = tok.lower().replace('o', '0').replace('l', '1').replace('s', '5').replace('z', '2')
            import re
            nums = re.findall(r'\d+(?:\.\d+)?', tok)
            if nums: return float(max(nums, key=len))
            return None

        amount = clean_noisy_number(last_token)
        
        if amount and amount > 0 and amount < 50000: # Cap large nums
            name_tokens = tokens[:-1]
            raw_name = " ".join(name_tokens)
            name = clean_item_name(raw_name)
            if len(name) > 2:
                 items.append({"name": name, "amount": amount, "quantity": 1})

    return items

def classify_item_type(name):
    name_lower = name.lower()
    
    # Safety Net: Detect Tax/Service items that slipped through OCR filters
    ignore_signals = {'tax', 'gst', 'vat', 'cess', 'service', 'chg', 'round', 'total', 'subtotal', 'payable'}
    if any(sig in name_lower for sig in ignore_signals):
        return "TAX_IGNORE"

    alcohol_keywords = {'beer', 'whisky', 'vodka', 'rum', 'gin', 'cocktail', 'wine', 'pint', 'scotch', 'tequila', 'bottle', 'draught'}
    drink_keywords = {'coke', 'pepsi', 'sprite', 'water', 'soda', 'beverage', 'juice', 'shake', 'coffee', 'tea', 'latte', 'cappuccino'}
    
    if any(k in name_lower for k in alcohol_keywords):
        return "Alcohol"
    if any(k in name_lower for k in drink_keywords):
        return "Drinks"
    if "veg" in name_lower and "non" not in name_lower:
        return "Veg"
    if "chicken" in name_lower or "mutton" in name_lower or "fish" in name_lower or "prawn" in name_lower or "egg" in name_lower:
        return "Non-Veg"
        
    return "Food" # Default common food

def extract_subtotal(text):
    lines = text.split('\n')
    subtotal_labels = {'subtotal', 'sub-total', 'sub total', 'total amount before tax', 'taxable value'}
    
    for line in lines:
        lower_line = line.lower()
        if any(label in lower_line for label in subtotal_labels):
            # Extract number
            match = re.search(r'(\d+(?:[.,]\d{1,2})?)\s*$', line)
            if match:
                try:
                    return float(match.group(1).replace(',', '.'))
                except:
                    pass
    return 0.0

def extract_taxes(text):
    lines = text.split('\n')
    tax_amount = 0.0
    
    # Keywords indicating a specific tax add-on
    # Exclude "cost" and "service" (often service charge or cost price noise)
    tax_keywords = {'cgst', 'sgst', 'gst', 'vat', 'sst', 'tax', 'cess'}
    
    for line in lines:
        lower_line = line.lower()
        
        # 1. Skip invalid lines
        # Ignore GSTIN lines ("GST-27...") - CRITICAL FIX
        if 'gstin' in lower_line or re.search(r'[a-z0-9]{10,}', lower_line):
           continue
        
        if any(k in lower_line for k in tax_keywords):
            # Check if it's a "Total" line (we don't want the total amount, just the tax amount)
            # "Total Tax" is fine, but "Total Amount" is not.
            if 'total' in lower_line or 'sub' in lower_line or 'net' in lower_line or 'payable' in lower_line:
                continue
                
            match = re.search(r'(\d+(?:[.,]\d{1,2})?)\s*$', line)
            if match:
                try:
                    val = float(match.group(1).replace(',', '.'))
                    # Sanity: Tax shouldn't be > 2000? 
                    if val < 5000: 
                        tax_amount += val
                except:
                    pass
    return tax_amount

def validate_bill_logic(result, text):
    # 1. Ensure no item contains tax-related keywords
    tax_keywords = {'tax', 'gst', 'vat', 'cess', 'service charge', 'subtotal'}
    for item in result['items']:
        for k in tax_keywords:
            if k in item['name'].lower():
                return False, f"Tax keyword '{k}' found in item '{item['name']}'"

    # 2. Ensure quantity >= 1
    for item in result['items']:
        if item.get('quantity', 1) < 1:
            return False, f"Invalid quantity {item.get('quantity')} for item '{item['name']}'"

    # 3. Ensure totalAmount >= sum(items)
    # We must be careful about discounts. If text contains 'discount', we relax this.
    items_sum = sum(i['amount'] for i in result['items'])
    if result['totalAmount'] < (items_sum - 2.0): # 2.0 tolerance for float rounding
        if 'discount' not in text.lower():
            return False, f"Total mismatch: {result['totalAmount']} < {items_sum}"
            
    return True, "OK"

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(json.dumps({"error": f"File not found: {image_path}"}))
        sys.exit(1)

    # 1️⃣ OCR
    try:
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)
    except Exception as e:
        print(json.dumps({"error": f"OCR Failed: {str(e)}"}))
        sys.exit(1)

    # 2️⃣ Load models
    cat_model, item_model = load_models()

    category = "General"
    if cat_model:
        try:
            category = cat_model.predict([text])[0]
        except:
            pass

    # 2.1 Rule-based Override for Food
    if category == "General":
        food_keywords = {
            'restaurant', 'cafe', 'kitchen', 'hotel', 'dining', 'bistro', 'bar', 'food',
            'chicken', 'mutton', 'paneer', 'biryani', 'pizza', 'burger', 'roti', 'naan',
            'pasta', 'noodles', 'rice', 'dal', 'thali', 'coffee', 'tea', 'beverage',
            'breakfast', 'lunch', 'dinner'
        }
        
        lower_text = text.lower()
        hits = sum(1 for kw in food_keywords if kw in lower_text)
        
        if 'restaurant' in lower_text or 'cafe' in lower_text or hits >= 2:
            category = "Food"

    extracted_items = extract_items_from_text(text)
    total_from_items = sum(i['amount'] for i in extracted_items)
    
    # Extract Taxes & Subtotal (for fallback calculation)
    total_tax = extract_taxes(text)
    subtotal_val = extract_subtotal(text)



    # ... rest of merchant extraction ...

    lines = [L.strip() for L in text.split('\n') if L.strip()]
    
    # Robust Merchant Extraction
    # 1. Look at top 5 lines
    # 2. Ignore generic terms like "Tax Invoice", "Welcome", "Bill"
    # 3. Clean symbols
    merchant_candidates = lines[:5]
    merchant_name = "Unknown Merchant"
    
    ignore_merchant_keys = {'tax invoice', 'bill of supply', 'cash memo', 'welcome', 'table', 'date', 'gstin', 'ph:', 'phone'}
    
    for line in merchant_candidates:
        clean_line = re.sub(r'[^\w\s&]', '', line).strip() # Remove special chars except &
        if len(clean_line) < 3:
            continue
            
        lower_line = clean_line.lower()
        if any(key in lower_line for key in ignore_merchant_keys):
            continue
            
        # If we pass filters, this is likely the merchant
        merchant_name = clean_line
        break

    # Robust Total Amount Extraction (Bottom-Up Strategy)
    # We search from the bottom of the receipt to find the "Final" Total.
    total_amount = 0.0
    found_total = False
    
    # Candidates for total labels
    total_labels = ['total', 'grand total', 'net payable', 'net amount', 'payable', 'balance due']
    # Explicit exclusions
    non_final_labels = ['sub', 'tax', 'cgst', 'sgst', 'vat', 'discount']

    lines = [L.strip() for L in text.split('\n') if L.strip()]
    
    # Reverse iteration to find the *last* (usually bottom-most) Total
    for line in reversed(lines):
        lower_line = line.lower()
        
        # 1. Check if line contains a Total keyword
        if any(label in lower_line for label in total_labels):
            # 2. Ensure it does NOT contain invalid keywords (Subtotal, etc.)
            if any(bad in lower_line for bad in non_final_labels):
                continue

            # NEW: Strict Exclusion of GSTIN lines
            # "GST-27AABCUD..." should NEVER be parsed as total
            # NEW: Strict Exclusion of GSTIN lines
            # "GST-27AABCUD..." should NEVER be parsed as total
            # User Rule: Alphanumeric > 8 digits = ID/GSTIN
            if 'gstin' in lower_line or re.search(r'[a-z0-9]{10,}', lower_line):
                continue
                
            # 3. Extract Number from this line
            # Looks for number at the end or explicitly after label
            # Matches: "Total 1500", "Total: 1500", "1500.00" (if just a number line after total?)
            # Let's start with searching a number in the line
            amount_match = re.search(r'(\d+(?:[.,]\d{1,2})?)\s*$', line)
            if amount_match:
                try:
                    val = float(amount_match.group(1).replace(',', '.'))
                    # Basic sanity check: Total shouldn't be > 200,000 for a restaurant?
                    # Unless it's a huge banquet. But 60 lakhs is definitely wrong.
                    if val > 500000: continue 
                    
                    total_amount = val
                    found_total = True
                    break # Found the bottom-most total
                except:
                    continue

    if not found_total:
        if subtotal_val > 0:
            total_amount = subtotal_val + total_tax
        else:
            total_amount = total_from_items + total_tax

    # 3️⃣ Item Classification & Split Logic
    processed_items = []
    type_totals = {}

    if category == "Food" and extracted_items:
        for item in extracted_items:
            # Predict with ML if available
            item_type = "Food" 
            if item_model:
                try:
                    pred = item_model.predict([item['name']])[0]
                    if pred: item_type = pred
                except:
                    pass
            
            # Fallback to Rule-based if Common or Food (or no model)
            if item_type in ["Common", "Food"]:
                item_type = classify_item_type(item['name'])

            if item_type == "TAX_IGNORE":
                continue

            processed_items.append({
                "name": item["name"],
                "amount": item["amount"],
                "quantity": item.get("quantity", 1),
                "type": item_type
            })
            
            # Accumulate totals
            type_totals[item_type] = type_totals.get(item_type, 0) + item["amount"]
            
    else:
        # Generic items
        for item in extracted_items:
             # Safety check even for generic
             if classify_item_type(item['name']) == "TAX_IGNORE":
                 continue
                 
             processed_items.append({
                "name": item["name"],
                "amount": item["amount"],
                "quantity": item.get("quantity", 1),
                "type": "Common"
            })
             type_totals["Common"] = type_totals.get("Common", 0) + item["amount"]

    # Validation Logic
    requires_confirmation = False
    diff = abs(total_amount - total_from_items)
    
    # Require confirmation if:
    # 1. Mismatch in total
    # 2. No items found
    # 3. Unknown merchant
    # 4. Multiple significant categories found (e.g. Alcohol exists) -> Suggest Split
    if diff > 10.0 or not processed_items or merchant_name == "Unknown Merchant":
        requires_confirmation = True
        
    if "Alcohol" in type_totals:
        requires_confirmation = True
        
    result = {
        "merchant": merchant_name,
        "category": category,
        "items": processed_items,
        "totalAmount": total_amount,
        "confidence": 0.85 if not requires_confirmation else 0.60,
        "requiresConfirmation": requires_confirmation,
        "suggestedSplits": type_totals,
        "text": text
    }

    # ✅ OUTPUT ONLY JSON
    valid, reason = validate_bill_logic(result, text)
    if not valid:
        # Return error as requested
        print(json.dumps({ "error": "Bill parsing failed", "reason": reason, "rawText": text }))
    else:
        print(json.dumps(result))

if __name__ == "__main__":
    main() 


import csv
import json

# Read the TSV file with proper encoding
vendors = []
with open('vcf_vendors.txt', 'r', encoding='cp1252') as f:
    reader = csv.DictReader(f, delimiter='\t')
    for row in reader:
        vendors.append(row)

# Function to map booth to x,y (placeholder, assign sequential)
def get_coords(booth, index):
    # Placeholder: assign based on index
    x = (index % 20) * 64
    y = (index // 20) * 32
    return x, y

# Convert to JSON format
json_vendors = []
for i, vendor in enumerate(vendors):
    x, y = get_coords(vendor['LOC'], i)
    vendor_obj = {
        "id": vendor['ID'],
        "name": vendor['NAME'],
        "booth": vendor['LOC'],
        "url": vendor['URL'] if vendor['URL'] != 'None' else '',
        "description": vendor['TITLE'],
        "x": x,
        "y": y,
        "items": [
            {
                "id": f"item_{i}_1",
                "name": f"Sample Item 1 from {vendor['NAME']}",
                "description": "A sample item for demonstration",
                "value": 50
            },
            {
                "id": f"item_{i}_2",
                "name": f"Sample Item 2 from {vendor['NAME']}",
                "description": "Another sample item",
                "value": 75
            },
            {
                "id": f"item_{i}_3",
                "name": f"Sample Item 3 from {vendor['NAME']}",
                "description": "Third sample item",
                "value": 100
            }
        ],
        "dialog": {
            "greeting": f"Welcome to {vendor['NAME']}! {vendor['TITLE']}",
            "responses": [
                {"text": "Show me your inventory", "action": "show_items"},
                {"text": "Tell me about your booth", "action": "booth_info"},
                {"text": "Share some tech facts", "action": "tech_facts"},
                {"text": "Thanks, I'll check other vendors", "action": "end"}
            ]
        },
        "facts": [
            f"{vendor['NAME']} is a vendor at VCF Midwest.",
            f"They are located at booth {vendor['LOC']}.",
            f"Their focus is: {vendor['TITLE']}."
        ],
        "puzzle_items": [],
        "puzzle_dialog": {}
    }
    json_vendors.append(vendor_obj)

# Write to JSON file
with open('vcf_vendors_converted.json', 'w', encoding='utf-8') as f:
    json.dump(json_vendors, f, indent=2)

print("Conversion complete!")
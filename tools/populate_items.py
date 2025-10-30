import json

# Load the vendors JSON
with open('vendors.json', 'r', encoding='utf-8') as f:
    vendors = json.load(f)

# Define item templates based on keywords
item_templates = {
    'computer': [
        {'name': 'Vintage Desktop PC', 'description': 'Classic personal computer from the 90s', 'value': 150},
        {'name': 'Retro Laptop', 'description': 'Portable computer with period-appropriate specs', 'value': 200},
        {'name': 'Old Motherboard', 'description': 'Circuit board for building custom systems', 'value': 80}
    ],
    'phone': [
        {'name': 'Vintage Cell Phone', 'description': 'Early mobile phone with basic features', 'value': 100},
        {'name': 'Cordless Phone', 'description': 'Wireless home phone system', 'value': 50},
        {'name': 'Phone Accessories', 'description': 'Chargers and cases for mobile devices', 'value': 30}
    ],
    'game': [
        {'name': 'Retro Video Game Console', 'description': 'Classic gaming system from the 80s/90s', 'value': 120},
        {'name': 'Vintage Video Games', 'description': 'Collection of classic game cartridges', 'value': 60},
        {'name': 'Gaming Controller', 'description': 'Original controller for retro consoles', 'value': 40}
    ],
    'software': [
        {'name': 'Vintage Software', 'description': 'Old operating systems and applications', 'value': 70},
        {'name': 'Programming Tools', 'description': 'Development software from past eras', 'value': 90},
        {'name': 'Educational Software', 'description': 'Learning programs for computers', 'value': 50}
    ],
    'hardware': [
        {'name': 'PC Components', 'description': 'Motherboards, CPUs, and expansion cards', 'value': 100},
        {'name': 'Storage Devices', 'description': 'Hard drives and floppy disks', 'value': 40},
        {'name': 'Input Devices', 'description': 'Keyboards, mice, and peripherals', 'value': 35}
    ],
    'apple': [
        {'name': 'Classic Macintosh', 'description': 'Iconic Apple computer from the 80s/90s', 'value': 250},
        {'name': 'Apple Peripherals', 'description': 'Monitors and accessories for Mac systems', 'value': 80},
        {'name': 'Mac Software', 'description': 'Applications designed for Macintosh', 'value': 60}
    ],
    'commodore': [
        {'name': 'Commodore 64', 'description': 'Legendary 8-bit home computer', 'value': 180},
        {'name': 'Commodore Accessories', 'description': 'Disk drives and peripherals', 'value': 70},
        {'name': 'C64 Software', 'description': 'Games and programs for the C64', 'value': 40}
    ],
    'amiga': [
        {'name': 'Amiga Computer', 'description': 'Powerful multimedia computer from the 80s/90s', 'value': 220},
        {'name': 'Amiga Hardware', 'description': 'Expansion cards and peripherals', 'value': 90},
        {'name': 'Amiga Games', 'description': 'Classic games for the Amiga platform', 'value': 50}
    ],
    'atari': [
        {'name': 'Atari 8-bit Computer', 'description': 'Early home computer with gaming focus', 'value': 160},
        {'name': 'Atari Consoles', 'description': 'Classic gaming consoles', 'value': 100},
        {'name': 'Atari Software', 'description': 'Games and applications for Atari systems', 'value': 45}
    ],
    'books': [
        {'name': 'Computer Manuals', 'description': 'Technical documentation and user guides', 'value': 25},
        {'name': 'Programming Books', 'description': 'Books on coding and computer science', 'value': 30},
        {'name': 'Tech Magazines', 'description': 'Periodicals about computing technology', 'value': 20}
    ],
    'default': [
        {'name': 'Vintage Electronics', 'description': 'Assorted retro electronic items', 'value': 75},
        {'name': 'Tech Gadgets', 'description': 'Miscellaneous technological devices', 'value': 55},
        {'name': 'Computer Parts', 'description': 'Components for building or repairing systems', 'value': 65}
    ]
}

def get_items_for_vendor(name, description):
    text = (name + ' ' + description).lower()
    items = []

    # Check for specific keywords and assign categories
    if 'apple' in text or 'mac' in text or 'macintosh' in text:
        items = item_templates['apple']
    elif 'commodore' in text or 'c64' in text or 'plus/4' in text:
        items = item_templates['commodore']
    elif 'amiga' in text:
        items = item_templates['amiga']
    elif 'atari' in text:
        items = item_templates['atari']
    elif 'game' in text or 'gaming' in text or 'console' in text:
        items = item_templates['game']
    elif 'software' in text or 'program' in text or 'os' in text:
        items = item_templates['software']
    elif 'computer' in text or 'pc' in text or 'desktop' in text:
        items = item_templates['computer']
    elif 'phone' in text or 'mobile' in text:
        items = item_templates['phone']
    elif 'hardware' in text or 'motherboard' in text or 'card' in text:
        items = item_templates['hardware']
    elif 'book' in text or 'manual' in text or 'magazine' in text:
        items = item_templates['books']
    else:
        items = item_templates['default']

    # Return 3 items
    return items[:3]

# Update each vendor's items
for i, vendor in enumerate(vendors):
    vendor['items'] = []
    items = get_items_for_vendor(vendor['name'], vendor['description'])
    for j, item in enumerate(items):
        vendor['items'].append({
            'id': f'item_{i}_{j+1}',
            'name': item['name'],
            'description': item['description'],
            'value': item['value']
        })

# Save the updated JSON
with open('vendors.json', 'w', encoding='utf-8') as f:
    json.dump(vendors, f, indent=2)

print("Vendor inventories updated!")
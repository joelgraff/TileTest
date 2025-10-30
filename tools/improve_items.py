import json

# Load the vendors JSON
with open('vendors.json', 'r', encoding='utf-8') as f:
    vendors = json.load(f)

# Define specific items for vendors based on their domain
vendor_specific_items = {
    # Commodore vendors
    'commodore': [
        {'name': 'Pinball Construction Set', 'description': 'Iconic game creation tool for the C64', 'value': 45},
        {'name': 'Epyx Fast Load Cartridge', 'description': 'Speeds up disk loading on Commodore computers', 'value': 35},
        {'name': '1541 Disk Drive', 'description': 'Original floppy disk drive for C64', 'value': 120},
        {'name': 'C64 User\'s Guide', 'description': 'Official Commodore 64 manual', 'value': 25},
        {'name': 'Competition Pro Joystick', 'description': 'High-quality joystick for Commodore games', 'value': 40}
    ],
    'amiga': [
        {'name': 'Deluxe Paint II', 'description': 'Professional graphics software for Amiga', 'value': 60},
        {'name': 'Amiga 500 Computer', 'description': 'Popular 16-bit home computer', 'value': 200},
        {'name': 'Workbench 1.3', 'description': 'Operating system for Amiga computers', 'value': 80},
        {'name': 'A500 Keyboard', 'description': 'Original keyboard for Amiga 500', 'value': 50},
        {'name': 'Amiga Mouse', 'description': 'Optical mouse for Amiga systems', 'value': 30}
    ],
    'atari': [
        {'name': 'Atari 800XL Computer', 'description': 'Advanced 8-bit home computer', 'value': 150},
        {'name': 'Atari 1050 Disk Drive', 'description': 'Floppy disk drive for Atari 8-bit systems', 'value': 100},
        {'name': 'AtariWriter Cartridge', 'description': 'Word processing software cartridge', 'value': 20},
        {'name': 'Trak-Ball Controller', 'description': 'Unique trackball controller for Atari', 'value': 55},
        {'name': 'Atari BASIC Cartridge', 'description': 'Programming language cartridge', 'value': 25}
    ],
    'apple': [
        {'name': 'Macintosh Plus', 'description': 'Classic Macintosh computer with 1MB RAM', 'value': 300},
        {'name': 'HyperCard Stack', 'description': 'Interactive multimedia authoring tool', 'value': 40},
        {'name': 'Apple ImageWriter II', 'description': 'Dot matrix printer for Macintosh', 'value': 150},
        {'name': 'MacPaint Software', 'description': 'Bitmap graphics editor', 'value': 35},
        {'name': 'Apple Extended Keyboard', 'description': 'Full-size keyboard for Macintosh', 'value': 70}
    ],
    'pc': [
        {'name': 'IBM PC XT', 'description': 'Early IBM personal computer', 'value': 250},
        {'name': 'MS-DOS 3.1', 'description': 'Operating system for IBM PCs', 'value': 50},
        {'name': 'Lotus 1-2-3', 'description': 'Popular spreadsheet software', 'value': 30},
        {'name': 'EGA Graphics Card', 'description': 'Enhanced graphics adapter', 'value': 80},
        {'name': 'PC Speaker', 'description': 'Internal speaker for IBM PCs', 'value': 20}
    ],
    'game': [
        {'name': 'Nintendo Entertainment System', 'description': 'Popular 8-bit gaming console', 'value': 100},
        {'name': 'Super Mario Bros.', 'description': 'Classic platformer game cartridge', 'value': 25},
        {'name': 'NES Zapper', 'description': 'Light gun peripheral for NES', 'value': 35},
        {'name': 'Game Boy', 'description': 'Handheld gaming system', 'value': 80},
        {'name': 'Tetris Cartridge', 'description': 'Puzzle game for various systems', 'value': 20}
    ],
    'software': [
        {'name': 'WordPerfect 5.1', 'description': 'Popular word processing software', 'value': 40},
        {'name': 'dBase III Plus', 'description': 'Database management system', 'value': 60},
        {'name': 'Turbo Pascal 3.0', 'description': 'Programming development environment', 'value': 45},
        {'name': 'Norton Utilities', 'description': 'System maintenance tools', 'value': 35},
        {'name': 'Flight Simulator II', 'description': 'Aviation simulation game', 'value': 30}
    ],
    'hardware': [
        {'name': 'MFM Hard Drive', 'description': '5.25" hard disk drive', 'value': 120},
        {'name': 'Multi I/O Card', 'description': 'Serial and parallel ports expansion', 'value': 70},
        {'name': 'RAM Expansion Module', 'description': 'Memory upgrade for computers', 'value': 90},
        {'name': 'Floppy Disk Controller', 'description': 'Controller for floppy drives', 'value': 50},
        {'name': 'SCSI Host Adapter', 'description': 'Small Computer System Interface card', 'value': 85}
    ],
    'books': [
        {'name': 'The C Programming Language', 'description': 'Classic programming textbook by Kernighan and Ritchie', 'value': 35},
        {'name': 'Computer Lib/Dream Machines', 'description': 'Influential book by Ted Nelson', 'value': 45},
        {'name': 'Hackers: Heroes of the Computer Revolution', 'description': 'History of early computer culture', 'value': 30},
        {'name': 'The Art of Computer Programming', 'description': 'Comprehensive algorithms reference by Knuth', 'value': 80},
        {'name': 'BYTE Magazine Collection', 'description': 'Vintage computer magazine issues', 'value': 25}
    ],
    'default': [
        {'name': 'Vintage Electronics', 'description': 'Assorted retro electronic items', 'value': 75},
        {'name': 'Tech Gadgets', 'description': 'Miscellaneous technological devices', 'value': 55},
        {'name': 'Computer Parts', 'description': 'Components for building or repairing systems', 'value': 65},
        {'name': 'Retro Accessories', 'description': 'Various vintage computer accessories', 'value': 40},
        {'name': 'Obsolete Technology', 'description': 'Outdated but interesting tech items', 'value': 50}
    ]
}

def get_specific_items_for_vendor(name, description):
    text = (name + ' ' + description).lower()
    items = []

    # Check for specific vendor types
    if 'commodore' in text or 'c64' in text or 'plus/4' in text:
        items = vendor_specific_items['commodore']
    elif 'amiga' in text:
        items = vendor_specific_items['amiga']
    elif 'atari' in text:
        items = vendor_specific_items['atari']
    elif 'apple' in text or 'mac' in text or 'macintosh' in text:
        items = vendor_specific_items['apple']
    elif 'pc' in text or 'ibm' in text or 'xt' in text or 'at' in text:
        items = vendor_specific_items['pc']
    elif 'game' in text or 'gaming' in text or 'console' in text or 'nintendo' in text:
        items = vendor_specific_items['game']
    elif 'software' in text or 'program' in text or 'os' in text:
        items = vendor_specific_items['software']
    elif 'hardware' in text or 'motherboard' in text or 'card' in text:
        items = vendor_specific_items['hardware']
    elif 'book' in text or 'manual' in text or 'magazine' in text:
        items = vendor_specific_items['books']
    else:
        items = vendor_specific_items['default']

    # Return 3-5 random items from the category
    import random
    num_items = random.randint(3, 5)
    selected_items = random.sample(items, min(num_items, len(items)))
    return selected_items

# Update each vendor's items
for i, vendor in enumerate(vendors):
    vendor['items'] = []
    items = get_specific_items_for_vendor(vendor['name'], vendor['description'])
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

print("Vendor inventories updated with specific items!")
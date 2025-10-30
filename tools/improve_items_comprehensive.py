import json
import random

def improve_vendor_inventories():
    # Load the vendors data
    with open('vendors.json', 'r') as f:
        vendors = json.load(f)

    # Define more comprehensive item categories with specific items
    item_categories = {
        'commodore': [
            {"name": "C64 User's Guide", "description": "Official Commodore 64 manual", "value": 25},
            {"name": "1541 Disk Drive", "description": "Original floppy disk drive for C64", "value": 120},
            {"name": "Competition Pro Joystick", "description": "High-quality joystick for Commodore games", "value": 40},
            {"name": "Epyx Fast Load Cartridge", "description": "Speeds up disk loading on Commodore computers", "value": 35},
            {"name": "Pinball Construction Set", "description": "Iconic game creation tool for the C64", "value": 45},
            {"name": "GEOS Operating System", "description": "Graphical operating system for C64", "value": 50},
            {"name": "Simon's Basic Cartridge", "description": "Extended BASIC programming cartridge", "value": 30},
            {"name": "Commodore Datasette", "description": "Cassette tape drive for data storage", "value": 45},
            {"name": "C128 Computer", "description": "Advanced Commodore 128 computer", "value": 180},
            {"name": "VIC-20 Computer", "description": "Early Commodore home computer", "value": 80}
        ],
        'amiga': [
            {"name": "Amiga 500 Computer", "description": "Popular 16-bit home computer", "value": 200},
            {"name": "Deluxe Paint II", "description": "Professional graphics software for Amiga", "value": 60},
            {"name": "Workbench 1.3", "description": "Operating system for Amiga computers", "value": 80},
            {"name": "Amiga Mouse", "description": "Optical mouse for Amiga systems", "value": 30},
            {"name": "A500 Keyboard", "description": "Original keyboard for Amiga 500", "value": 50},
            {"name": "Kickstart ROM", "description": "Boot ROM for Amiga systems", "value": 40},
            {"name": "AmigaDOS Manual", "description": "Official Amiga operating system guide", "value": 35},
            {"name": "OctaMED Music Software", "description": "Professional music composition software", "value": 70},
            {"name": "Amiga 1200 Computer", "description": "Advanced Amiga 1200 system", "value": 250},
            {"name": "AGA Graphics Card", "description": "Advanced graphics adapter for Amiga", "value": 120}
        ],
        'atari': [
            {"name": "Atari 1050 Disk Drive", "description": "Floppy disk drive for Atari 8-bit systems", "value": 100},
            {"name": "Trak-Ball Controller", "description": "Unique trackball controller for Atari", "value": 55},
            {"name": "AtariWriter Cartridge", "description": "Word processing software cartridge", "value": 20},
            {"name": "Atari 800 Computer", "description": "Classic Atari 8-bit computer", "value": 150},
            {"name": "Atari 5200 Console", "description": "Atari's game console system", "value": 120},
            {"name": "Atari BASIC Cartridge", "description": "Programming cartridge for Atari", "value": 25},
            {"name": "Star Raiders Cartridge", "description": "Classic space combat game", "value": 30},
            {"name": "Missile Command Cartridge", "description": "Iconic defense game", "value": 35},
            {"name": "Atari 2600 Console", "description": "Popular home gaming console", "value": 100},
            {"name": "Pong Console", "description": "Original home Pong game system", "value": 80}
        ],
        'apple': [
            {"name": "Macintosh Plus", "description": "Classic Macintosh computer with 1MB RAM", "value": 300},
            {"name": "MacPaint Software", "description": "Bitmap graphics editor", "value": 35},
            {"name": "HyperCard Stack", "description": "Interactive multimedia authoring tool", "value": 40},
            {"name": "Apple ImageWriter II", "description": "Dot matrix printer for Macintosh", "value": 150},
            {"name": "Apple Extended Keyboard", "description": "Full-size keyboard for Macintosh", "value": 70},
            {"name": "MacWrite Software", "description": "Word processing for Macintosh", "value": 30},
            {"name": "System 6 Software", "description": "Classic Mac OS system software", "value": 45},
            {"name": "Apple IIe Computer", "description": "Popular Apple II series computer", "value": 200},
            {"name": "Apple IIgs Computer", "description": "Advanced Apple IIgs with graphics", "value": 250},
            {"name": "Lisa Computer", "description": "Apple's early GUI computer", "value": 400}
        ],
        'ibm_pc': [
            {"name": "IBM PC XT", "description": "Early IBM personal computer", "value": 250},
            {"name": "EGA Graphics Card", "description": "Enhanced graphics adapter", "value": 80},
            {"name": "PC Speaker", "description": "Internal speaker for IBM PCs", "value": 20},
            {"name": "MS-DOS 3.1", "description": "Operating system for IBM PCs", "value": 50},
            {"name": "Lotus 1-2-3", "description": "Popular spreadsheet software", "value": 30},
            {"name": "WordPerfect 5.1", "description": "Popular word processing software", "value": 40},
            {"name": "Turbo Pascal 3.0", "description": "Programming development environment", "value": 45},
            {"name": "Norton Utilities", "description": "System maintenance tools", "value": 35},
            {"name": "dBase III Plus", "description": "Database management system", "value": 60},
            {"name": "Flight Simulator II", "description": "Aviation simulation game", "value": 30}
        ],
        'nintendo': [
            {"name": "Super Mario Bros.", "description": "Classic platformer game cartridge", "value": 25},
            {"name": "Tetris Cartridge", "description": "Puzzle game for various systems", "value": 20},
            {"name": "NES Zapper", "description": "Light gun peripheral for NES", "value": 35},
            {"name": "Donkey Kong Cartridge", "description": "Arcade classic port", "value": 30},
            {"name": "Legend of Zelda", "description": "Action-adventure game cartridge", "value": 40},
            {"name": "Super Mario Bros. 3", "description": "Advanced Mario platformer", "value": 35},
            {"name": "Duck Hunt Cartridge", "description": "Light gun game with NES Zapper", "value": 25},
            {"name": "Excitebike Cartridge", "description": "Racing game cartridge", "value": 20},
            {"name": "Ice Climber Cartridge", "description": "Climbing adventure game", "value": 25},
            {"name": "Nintendo Entertainment System", "description": "Original NES console", "value": 150}
        ],
        'gaming': [
            {"name": "Competition Pro Joystick", "description": "High-quality joystick for games", "value": 40},
            {"name": "Trak-Ball Controller", "description": "Trackball controller for games", "value": 55},
            {"name": "NES Zapper", "description": "Light gun peripheral", "value": 35},
            {"name": "Atari Joystick", "description": "Classic Atari controller", "value": 25},
            {"name": "Sega Genesis Controller", "description": "Six-button controller for Genesis", "value": 30},
            {"name": "TurboGrafx-16 Console", "description": "NEC's 16-bit gaming console", "value": 120},
            {"name": "Game Boy Console", "description": "Original handheld gaming system", "value": 80},
            {"name": "Arcade Cabinet", "description": "Classic arcade gaming machine", "value": 500},
            {"name": "Vectrex Console", "description": "Vector graphics home console", "value": 150},
            {"name": "ColecoVision Console", "description": "Advanced 1980s gaming console", "value": 100}
        ],
        'japanese': [
            {"name": "Famicom Console", "description": "Japanese Nintendo Entertainment System", "value": 140},
            {"name": "PC Engine Console", "description": "TurboGrafx-16 system", "value": 120},
            {"name": "MSX Computer", "description": "Japanese home computer standard", "value": 100},
            {"name": "Sharp X68000", "description": "Powerful Japanese home computer", "value": 300},
            {"name": "NEC PC-8801", "description": "Popular Japanese computer", "value": 150},
            {"name": "Bandai Wonderswan", "description": "Japanese handheld gaming system", "value": 60},
            {"name": "Sega Master System", "description": "8-bit gaming console", "value": 80},
            {"name": "Game Gear Handheld", "description": "Sega's portable gaming system", "value": 70},
            {"name": "Neo Geo AES", "description": "Arcade-quality home console", "value": 400},
            {"name": "PC-FX Console", "description": "NEC's multimedia console", "value": 200}
        ],
        'calculator': [
            {"name": "HP-41C Calculator", "description": "Programmable scientific calculator", "value": 80},
            {"name": "TI-99/4A Computer", "description": "Texas Instruments home computer", "value": 100},
            {"name": "HP-9100A Calculator", "description": "Early programmable calculator", "value": 150},
            {"name": "Casio FX-700P", "description": "Programmable scientific calculator", "value": 60},
            {"name": "Sharp EL-5100", "description": "Graphing scientific calculator", "value": 70},
            {"name": "Hewlett-Packard 9825", "description": "Desktop programmable calculator", "value": 200},
            {"name": "Texas Instruments SR-50", "description": "Early scientific calculator", "value": 50},
            {"name": "Commodore Calculator", "description": "Commodore programmable calculator", "value": 40},
            {"name": "Sinclair Cambridge Calculator", "description": "Compact scientific calculator", "value": 30},
            {"name": "Atari Portfolio", "description": "Palm-sized DOS computer", "value": 90}
        ],
        'homebrew': [
            {"name": "Arduino Uno", "description": "Microcontroller development board", "value": 25},
            {"name": "Raspberry Pi 3", "description": "Single-board computer", "value": 35},
            {"name": "6502 Microprocessor", "description": "Classic 8-bit CPU chip", "value": 15},
            {"name": "Z80 Microprocessor", "description": "Popular 8-bit CPU", "value": 12},
            {"name": "EPROM Programmer", "description": "Device for programming memory chips", "value": 50},
            {"name": "Logic Analyzer", "description": "Digital signal analysis tool", "value": 80},
            {"name": "Oscilloscope Probe", "description": "Measurement probe for oscilloscopes", "value": 30},
            {"name": "Breadboard", "description": "Prototyping circuit board", "value": 10},
            {"name": "Multimeter", "description": "Electronic measurement instrument", "value": 40},
            {"name": "Soldering Station", "description": "Professional soldering tool", "value": 60}
        ],
        'networking': [
            {"name": "Token Ring Card", "description": "IBM Token Ring network adapter", "value": 45},
            {"name": "Ethernet Card", "description": "10Base-T network interface card", "value": 35},
            {"name": "Modem 56K", "description": "Dial-up internet modem", "value": 25},
            {"name": "Novell NetWare", "description": "Network operating system software", "value": 50},
            {"name": "Banyan VINES", "description": "Network operating system", "value": 40},
            {"name": "ARCnet Card", "description": "Alternative networking technology", "value": 30},
            {"name": "Coaxial Cable", "description": "Network cabling for Ethernet", "value": 15},
            {"name": "Hub 8-Port", "description": "Ethernet network hub", "value": 40},
            {"name": "Network Bridge", "description": "Device for connecting networks", "value": 60},
            {"name": "Terminal Server", "description": "Multi-user terminal access device", "value": 100}
        ],
        'general': [
            {"name": "TRS-80 Model I", "description": "Early personal computer from Radio Shack", "value": 150},
            {"name": "Kaypro II", "description": "Popular portable computer from the 1980s", "value": 200},
            {"name": "Osborne 1", "description": "One of the first portable computers", "value": 180},
            {"name": "TI-99/4A", "description": "Texas Instruments home computer", "value": 100},
            {"name": "Acorn BBC Micro", "description": "British educational computer", "value": 120},
            {"name": "ZX Spectrum", "description": "Popular British home computer", "value": 80},
            {"name": "Commodore PET", "description": "Early Commodore business computer", "value": 250},
            {"name": "Atari 400", "description": "Atari's entry-level home computer", "value": 90},
            {"name": "Apple II Plus", "description": "Popular Apple II series computer", "value": 220},
            {"name": "Franklin Ace 1000", "description": "Apple II clone computer", "value": 180}
        ]
    }

    def get_vendor_category(name, description):
        """Determine the category of a vendor based on name and description"""
        text = (name + ' ' + description).lower()

        # Check for specific keywords in order of specificity
        if any(keyword in text for keyword in ['commodore', 'c64', 'c128', 'vic-20', 'amiga']):
            if 'amiga' in text:
                return 'amiga'
            else:
                return 'commodore'
        elif 'atari' in text:
            return 'atari'
        elif any(keyword in text for keyword in ['apple', 'macintosh', 'mac ', 'lisa']):
            return 'apple'
        elif any(keyword in text for keyword in ['ibm', 'pc ', 'dos', 'windows', 'microsoft']):
            return 'ibm_pc'
        elif any(keyword in text for keyword in ['nintendo', 'nes', 'snes', 'gameboy', 'zelda', 'mario']):
            return 'nintendo'
        elif any(keyword in text for keyword in ['game', 'gaming', 'arcade', 'console', 'joystick']):
            return 'gaming'
        elif any(keyword in text for keyword in ['japan', 'japanese', 'famicom', 'pc engine', 'msx', 'sharp x68000']):
            return 'japanese'
        elif any(keyword in text for keyword in ['calculator', 'hp-', 'ti-', 'casio', 'sharp', 'timex', 'sinclair']):
            return 'calculator'
        elif any(keyword in text for keyword in ['homebrew', 'cpu', 'microprocessor', 'arduino', 'raspberry', '6502', 'z80', 'core64', 'neon pixels', 'magic-1']):
            return 'homebrew'
        elif any(keyword in text for keyword in ['network', 'ethernet', 'modem', 'token ring']):
            return 'networking'
        elif any(keyword in text for keyword in ['eniac', 'computer history', 'vintage computer', 'retro computing']):
            return 'ibm_pc'  # ENIAC and computer history fits IBM/PC category
        elif any(keyword in text for keyword in ['laptop', 'portable computer']):
            return 'ibm_pc'  # Laptops fit PC category
        elif any(keyword in text for keyword in ['club', 'society', 'group']):
            return 'general'  # Clubs get general items
        else:
            # For vendors that don't match specific categories, try to infer from context
            if 'basement' in text or 'digital' in text:
                return 'general'  # YouTube channels and general tech
            elif 'class' in text or 'school' in text:
                return 'general'  # Educational or class-related
            elif 'normal' in text or 'cheese' in text or 'nova' in text:
                return 'general'  # Unclear descriptions
            else:
                return 'general'

    # Update vendor inventories
    for vendor in vendors:
        if vendor.get('items') and len(vendor['items']) > 0:
            # Check if vendor still has generic items
            has_generic = any(item['name'] in ['Vintage Electronics', 'Tech Gadgets', 'Computer Parts', 'Retro Accessories', 'Obsolete Technology']
                            for item in vendor['items'])

            if has_generic:
                category = get_vendor_category(vendor['name'], vendor['description'])
                category_items = item_categories[category]

                # Select 3-5 random items from the category
                num_items = random.randint(3, 5)
                selected_items = random.sample(category_items, num_items)

                # Update the vendor's items
                vendor['items'] = []
                for i, item in enumerate(selected_items, 1):
                    vendor['items'].append({
                        "id": f"item_{vendor['id']}_{i}",
                        "name": item["name"],
                        "description": item["description"],
                        "value": item["value"]
                    })

    # Save the updated vendors data
    with open('vendors.json', 'w') as f:
        json.dump(vendors, f, indent=2)

    print("Vendor inventories updated with specific items for all vendors!")

if __name__ == "__main__":
    improve_vendor_inventories()
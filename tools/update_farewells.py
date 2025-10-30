import json
import random

def categorize_vendor(description, items, name):
    """Categorize vendor based on description and items"""
    desc_lower = description.lower()
    name_lower = name.lower()
    item_names = [item['name'].lower() for item in items]

    # Commodore/Amiga
    if any(word in desc_lower for word in ['commodore', 'amiga', 'c64', 'vic-20', 'plus/4', 'cdtv']):
        return 'commodore'
    if any(word in item_names for word in ['commodore', 'amiga', 'c64', 'vic-20', 'plus/4', 'cdtv']):
        return 'commodore'

    # Apple/Macintosh
    if any(word in desc_lower for word in ['apple', 'mac', 'macintosh', 'hypercard', 'macpaint']):
        return 'apple'
    if any(word in item_names for word in ['apple', 'mac', 'macintosh', 'hypercard', 'macpaint']):
        return 'apple'

    # Atari
    if any(word in desc_lower for word in ['atari', 'atariwriter', 'trak-ball']):
        return 'atari'
    if any(word in item_names for word in ['atari', 'atariwriter', 'trak-ball']):
        return 'atari'

    # IBM PC/Microsoft
    if any(word in desc_lower for word in ['ibm', 'pc', 'dos', 'microsoft', 'lotus', 'wordperfect']):
        return 'ibm'
    if any(word in item_names for word in ['ibm', 'pc', 'dos', 'microsoft', 'lotus', 'wordperfect']):
        return 'ibm'

    # Gaming
    if any(word in desc_lower for word in ['game', 'gaming', 'arcade', 'nes', 'nintendo', 'tetris', 'mario']):
        return 'gaming'
    if any(word in item_names for word in ['nes', 'nintendo', 'tetris', 'mario', 'pac-man', 'space invaders']):
        return 'gaming'

    # Calculators
    if any(word in desc_lower for word in ['calculator', 'hp-', 'ti-', 'casio']):
        return 'calculator'
    if any(word in item_names for word in ['calculator', 'hp-', 'ti-', 'casio']):
        return 'calculator'

    # Electronics/Hardware
    if any(word in desc_lower for word in ['hardware', 'electronics', 'circuit', 'soldering', 'eprom']):
        return 'electronics'
    if any(word in item_names for word in ['controller', 'card', 'drive', 'chip', 'programmer']):
        return 'electronics'

    # Japanese computing
    if any(word in desc_lower for word in ['japanese', 'nec', 'sharp', 'pc-88', 'x68000']):
        return 'japanese'
    if any(word in item_names for word in ['nec', 'sharp', 'pc-88', 'x68000']):
        return 'japanese'

    # Portable/Laptop
    if any(word in desc_lower for word in ['portable', 'laptop', 'osborne', 'kaypro']):
        return 'portable'
    if any(word in item_names for word in ['osborne', 'kaypro', 'compaq portable']):
        return 'portable'

    # Robotics/AI
    if any(word in desc_lower for word in ['robot', 'asimo', 'bigdog']):
        return 'robotics'

    # Historical computing
    if any(word in desc_lower for word in ['eniac', 'colossus', 'historical']):
        return 'historical'

    # Computer clubs
    if any(word in desc_lower for word in ['club', 'computer club']):
        return 'club'

    # Default
    return 'general'

def get_farewell_messages(category):
    """Get farewell messages for a category"""
    messages = {
        'commodore': [
            "Happy computing! Don't forget to SAVE often.",
            "May your sprites be crisp and your SID tunes melodic!",
            "See you on the other side of the bitstream!",
            "Keep those joysticks calibrated and your disks formatted!",
            "Until next LOAD\"*\", 64!",
            "May your BASIC programs always RUN without errors!",
            "Don't let the C64 rest - keep computing!",
            "SYS 64738 for more Commodore adventures!"
        ],
        'apple': [
            "Think Different on your next adventure!",
            "May your mouse always find the right icon!",
            "Keep those floppy drives spinning!",
            "Until we meet again in the Garden of Eden!",
            "Don't stop believing in the power of Macintosh!",
            "May your HyperCard stacks never crash!",
            "Keep painting with MacPaint!",
            "1984 called - they want their interface back!"
        ],
        'atari': [
            "Game over? Never! Keep playing!",
            "May your joysticks never stick!",
            "Until the next high score!",
            "Keep those cartridges loaded!",
            "Don't stop at 2600 - there's more gaming ahead!",
            "May your Trak-Balls always roll true!",
            "Atari forever in your heart!",
            "2600 ways to enjoy retro gaming!"
        ],
        'ibm': [
            "Keep those spreadsheets calculating!",
            "May your hard drives never crash!",
            "Until the next DOS prompt!",
            "Keep computing in the IBM way!",
            "Don't forget to defrag regularly!",
            "May your Lotus 1-2-3 skills grow!",
            "PC power to the people!",
            "Keep those floppies formatted and ready!"
        ],
        'gaming': [
            "Game on! Keep the pixels flowing!",
            "May your high scores keep climbing!",
            "Until the next level!",
            "Don't stop gaming - keep playing!",
            "May your cartridges never wear out!",
            "Keep those power-ups coming!",
            "Game over is never the end!",
            "Level up your retro gaming experience!"
        ],
        'calculator': [
            "Keep calculating those possibilities!",
            "May your batteries never die!",
            "Until the next complex equation!",
            "Don't stop computing - keep calculating!",
            "May your functions always work!",
            "Keep those calculators powered up!",
            "Math is forever - keep solving!",
            "From TI to eternity!"
        ],
        'electronics': [
            "Keep those circuits buzzing!",
            "May your solder joints never fail!",
            "Until the next EPROM burn!",
            "Don't stop tinkering - keep building!",
            "May your oscilloscopes always show clean signals!",
            "Keep those multimeters measuring!",
            "Electronics forever in your circuits!",
            "From bits to atoms - keep creating!"
        ],
        'japanese': [
            "Sayonara! Keep the Japanese computing spirit alive!",
            "May your kanji display perfectly!",
            "Until the next PC-88 adventure!",
            "Don't stop computing - keep gaming Japanese style!",
            "May your X68000 graphics inspire!",
            "Keep those Japanese computers running!",
            "From NEC to eternity!",
            "Japanese computing excellence awaits!"
        ],
        'portable': [
            "Keep computing on the go!",
            "May your batteries last forever!",
            "Until the next portable adventure!",
            "Don't stop moving - keep computing!",
            "May your screens never dim!",
            "Keep those portables powered up!",
            "From Osborne to infinity!",
            "Portable computing forever!"
        ],
        'robotics': [
            "Keep those robots dancing!",
            "May your servos never stall!",
            "Until the next robotic revolution!",
            "Don't stop innovating - keep building!",
            "May your BigDog always run!",
            "Keep those ASIMO dreams alive!",
            "Robotics forever in motion!",
            "From circuits to consciousness!"
        ],
        'historical': [
            "Keep preserving computing history!",
            "May your ENIAC tubes never burn out!",
            "Until the next historical discovery!",
            "Don't stop learning - keep exploring!",
            "May your Colossus codes stay secret!",
            "Keep those historical computers running!",
            "From vacuum tubes to transistors!",
            "Computing history lives on!"
        ],
        'club': [
            "Keep the club spirit alive!",
            "May your user groups thrive!",
            "Until the next club meeting!",
            "Don't stop sharing - keep learning!",
            "May your newsletters keep coming!",
            "Keep those club gatherings going!",
            "Computer clubs forever!",
            "From members to legends!"
        ],
        'general': [
            "Keep the retro spirit alive!",
            "May your vintage finds be plentiful!",
            "Until the next great discovery!",
            "Don't stop collecting - keep exploring!",
            "May your retro adventures continue!",
            "Keep those old computers humming!",
            "Retro computing forever!",
            "From past to future - keep computing!"
        ]
    }
    return messages.get(category, messages['general'])

def update_vendor_farewells():
    """Update all vendors with personalized farewell messages"""

    # Load vendors data
    with open('vendors.json', 'r', encoding='utf-8') as f:
        vendors = json.load(f)

    print(f"Updating farewell messages for {len(vendors)} vendors...")

    for vendor in vendors:
        category = categorize_vendor(vendor['description'], vendor['items'], vendor['name'])
        farewell_messages = get_farewell_messages(category)

        # Pick a random farewell message for this vendor
        farewell_text = random.choice(farewell_messages)

        # Update the last response (should be the "end" action)
        responses = vendor['dialog']['responses']
        if responses and responses[-1]['action'] == 'end':
            responses[-1]['text'] = farewell_text

        print(f"Updated {vendor['name']} ({category}): {farewell_text}")

    # Save updated data
    with open('vendors.json', 'w', encoding='utf-8') as f:
        json.dump(vendors, f, indent=2, ensure_ascii=False)

    print("All vendor farewell messages updated!")

if __name__ == "__main__":
    update_vendor_farewells()
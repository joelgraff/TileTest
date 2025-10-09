import json
import random

def categorize_vendor(description, name):
    """Categorize a vendor based on their description and name"""
    desc_lower = description.lower()
    name_lower = name.lower()

    # Commodore vendors
    if any(keyword in desc_lower or keyword in name_lower for keyword in [
        'commodore', 'c64', 'c128', 'vic-20', 'amiga', 'jim_64', 'commodorez',
        'bitbinders', 'monster', 'commodore 8-bits', 'commodore accessories'
    ]):
        return 'commodore'

    # Amiga specific
    if any(keyword in desc_lower for keyword in ['amiga', 'deluxe paint', 'workbench']):
        return 'amiga'

    # Atari vendors
    if any(keyword in desc_lower or keyword in name_lower for keyword in [
        'atari', 'ataribbs', 'action retro', 'trak-ball'
    ]):
        return 'atari'

    # Apple/Mac vendors
    if any(keyword in desc_lower for keyword in [
        'apple', 'mac', 'macintosh', 'hypercard', 'macpaint', 'imagewriter'
    ]):
        return 'apple'

    # IBM PC/Microsoft vendors
    if any(keyword in desc_lower for keyword in [
        'ibm pc', 'pc bits', 'ms-dos', 'lotus', 'wordperfect', 'dBase',
        'ega graphics', 'pc speaker', 'ibm ps/2', 'windows 95'
    ]):
        return 'ibm_pc'

    # Gaming vendors
    if any(keyword in desc_lower or keyword in name_lower for keyword in [
        'game', 'nintendo', 'nes', 'super mario', 'tetris', 'game boy',
        'chicago gamespace', '2tailedfox', 'nintendo 64'
    ]):
        return 'gaming'

    # Calculator vendors
    if any(keyword in desc_lower for keyword in [
        'calculator', 'hp calculator', 'scientific calculator', 'casio', 'sinclair'
    ]):
        return 'calculator'

    # Homebrew/electronics vendors
    if any(keyword in desc_lower for keyword in [
        'homebrew', 'cpu', 'microprocessor', 'arduino', 'raspberry pi',
        'eprom', 'logic analyzer', '6502', 'z80', 'core64'
    ]):
        return 'homebrew'

    # Japanese vendors
    if any(keyword in desc_lower for keyword in [
        'japanese', 'japan', 'auramarket'
    ]):
        return 'japanese'

    # Networking vendors
    if any(keyword in desc_lower for keyword in [
        'network', 'obsolete networking', 'network server'
    ]):
        return 'networking'

    # Laptop/portable vendors
    if any(keyword in desc_lower for keyword in [
        'laptop', 'portable', 'osborne', 'kaypro'
    ]):
        return 'portable'

    # ENIAC/historical vendors
    if any(keyword in desc_lower for keyword in [
        'eniac', 'historical', 'museum'
    ]):
        return 'historical'

    # Robot/AI vendors
    if any(keyword in desc_lower for keyword in [
        'robot', 'avatar', 'huey'
    ]):
        return 'robotics'

    # Club/organization vendors
    if any(keyword in desc_lower or keyword in name_lower for keyword in [
        'club', 'vintage computer club', 'semichigan'
    ]):
        return 'club'

    # General electronics/misc vendors
    if any(keyword in desc_lower for keyword in [
        'electronics', 'hardware', 'black bag', 'surplus', 'repairs',
        'soldering', 'esd safe', 'tools'
    ]):
        return 'electronics'

    # Default fallback
    return 'general'

def get_tech_facts_for_category(category):
    """Get a pool of technology trivia facts for a category"""
    facts_by_category = {
        'commodore': [
            "The Commodore 64 was released in 1982 and became the best-selling single computer model of all time with over 17 million units sold.",
            "Commodore founder Jack Tramiel was a Holocaust survivor who worked in a calculator factory before starting Commodore.",
            "The C64's SID chip was so advanced that musicians still use emulators of it in modern music production.",
            "Commodore's Amiga was the first computer to ship with a multitasking operating system in 1985.",
            "The Commodore PET was the first personal computer to sell for under $800 in 1977.",
            "Commodore's VIC-20 was the first computer to sell over 1 million units, paving the way for the C64.",
            "The C64's BASIC interpreter was written by Microsoft co-founder Bill Gates.",
            "Commodore's Plus/4 computer was named for its four built-in applications: word processor, spreadsheet, database, and graphing.",
            "The Amiga's graphics capabilities were so advanced that it was used in early CGI for films like Jurassic Park.",
            "Commodore's CDTV was the first attempt at a CD-ROM based game console in 1991."
        ],
        'amiga': [
            "The Amiga was developed by a team that left Atari and was led by Jay Miner, who also designed the Atari 2600.",
            "Amiga's Workbench operating system was the first to feature a graphical user interface with color icons.",
            "The Amiga 1000 was the first computer to come bundled with a mouse in 1985.",
            "Deluxe Paint, the Amiga's signature graphics program, was written by Dan Silva and became industry standard.",
            "The Amiga's custom chips (Agnus, Denise, Paula) provided graphics and sound capabilities unmatched until the 1990s.",
            "AmigaOS was the first operating system to support preemptive multitasking on personal computers.",
            "The Amiga was used to create the graphics for Disney's The Little Mermaid in 1989.",
            "Amiga's HAM (Hold-And-Modify) mode allowed for 4096 colors on screen simultaneously.",
            "The Amiga 500 sold over 6 million units and was the best-selling Amiga model.",
            "Amiga's sound chip could play 4 channels of 8-bit audio simultaneously, revolutionary for its time."
        ],
        'atari': [
            "Atari was founded by Nolan Bushnell and Ted Dabney, who also created Pong, the first arcade video game.",
            "The Atari 2600 was originally called the 'Stella' project and was designed to play Combat.",
            "Atari's 8-bit computers used the same 6502 processor as the Apple II and Commodore PET.",
            "The Atari 400 was released in 1979 with a membrane keyboard to keep costs down.",
            "Atari's Tramiel family bought Commodore in 1984, creating an interesting corporate history.",
            "The Atari 5200 was designed to be backward compatible with 2600 games but failed due to poor controllers.",
            "Atari's Jaguar console was the last system designed by the original Atari team in 1993.",
            "The Atari Portfolio was the first palmtop computer running MS-DOS in 1989.",
            "Atari's ST computers popularized MIDI sequencing and were widely used by musicians.",
            "The Atari 800 had better graphics than the Apple II with 128 colors and sprite capabilities."
        ],
        'apple': [
            "Apple's Macintosh was the first successful computer with a mouse and graphical user interface in 1984.",
            "The Apple I was sold as a kit for $666.66 and only 200 were ever made.",
            "Steve Jobs and Steve Wozniak started Apple in Jobs' garage in 1976.",
            "The Macintosh's '1984' Super Bowl commercial cost $1.5 million but only aired once.",
            "Apple's HyperCard was created by Bill Atkinson and inspired the World Wide Web.",
            "The Apple II Plus was the first computer to ship with VisiCalc, the first spreadsheet program.",
            "MacPaint was the first bitmap graphics program that let users draw with a mouse.",
            "The Macintosh SE was the first Mac with an internal hard drive standard.",
            "Apple's Newton MessagePad was the first PDA but failed due to high price and poor handwriting recognition.",
            "The Apple ImageWriter was the first consumer dot-matrix printer with near-letter-quality printing."
        ],
        'ibm_pc': [
            "IBM's PC was designed to be 'open architecture' with off-the-shelf components, unlike proprietary designs.",
            "The IBM PC used an Intel 8088 processor running at 4.77 MHz.",
            "MS-DOS was purchased by IBM from Microsoft for $75,000 and became the standard PC operating system.",
            "Lotus 1-2-3 was the killer app that made the IBM PC successful in business.",
            "The IBM PC XT added a hard drive and became the standard for business computing.",
            "EGA (Enhanced Graphics Adapter) provided 16 colors at 640x350 resolution.",
            "WordPerfect was the dominant word processor before Microsoft Word.",
            "dBase was the first database program for microcomputers and spawned many clones.",
            "The IBM PS/2 introduced the 3.5-inch floppy disk and VGA graphics.",
            "Windows 95 unified MS-DOS and Windows into a single operating system."
        ],
        'gaming': [
            "Nintendo's Famicom (NES) sold over 60 million units worldwide.",
            "Super Mario Bros. was designed by Shigeru Miyamoto and introduced Mario to the world.",
            "The Game Boy was the first handheld system with interchangeable cartridges.",
            "Tetris was created by Alexey Pajitnov and became the best-selling video game of all time.",
            "The NES Zapper light gun used infrared sensors to detect on-screen targets.",
            "Nintendo 64 was the first console with 3D graphics and analog stick control.",
            "The original Pac-Man arcade game contained a hidden 'split-screen' feature.",
            "Space Invaders was created by Tomohiro Nishikado and started the shoot-em-up genre.",
            "Donkey Kong was Mario's first appearance and was originally called 'Jumpman'.",
            "The Atari 2600's Combat was the pack-in game and featured tank battles."
        ],
        'calculator': [
            "The HP-9100A was Hewlett-Packard's first programmable calculator in 1968.",
            "Texas Instruments invented the integrated circuit and the first calculator chip.",
            "The Sinclair Cambridge was one of the smallest calculators ever made.",
            "Casio's FX-700P was one of the first graphing calculators in the early 1980s.",
            "The HP-12C financial calculator is still in production after 40+ years.",
            "The first electronic calculator was the ANITA Mk VII in 1961, weighing 33 pounds.",
            "Sharp's EL-8 was the first calculator to use LED display technology.",
            "The Curta mechanical calculator was called the 'pepper mill' due to its shape.",
            "The first pocket calculator was the Busicom LE-120A 'Handy' in 1971.",
            "The TI-30 was Texas Instruments' first scientific calculator in 1976."
        ],
        'homebrew': [
            "The 6502 microprocessor was designed by Chuck Peddle and used in the Apple II, Commodore PET, and Atari computers.",
            "The Z80 was created by Federico Faggin and was pin-compatible with the Intel 8080.",
            "Arduino was created in 2005 as an educational tool for designers and artists.",
            "The Raspberry Pi was created by the Raspberry Pi Foundation to teach computer science.",
            "EPROM chips could be erased with ultraviolet light through a quartz window.",
            "The first homebrew computer was the Altair 8800 in 1975, starting the microcomputer revolution.",
            "Logic analyzers can capture and display digital signals in real-time.",
            "The 68000 microprocessor powered the Macintosh and Amiga computers.",
            "Oscilloscopes were originally called 'cathode ray oscillographs' when invented in 1897.",
            "The first microcontroller was the TMS 1000 by Texas Instruments in 1974."
        ],
        'japanese': [
            "NEC's PC-98 series was the dominant computer platform in Japan during the 1990s.",
            "Fujitsu's FM Towns was one of the first computers with CD-ROM drives standard.",
            "Sharp's X68000 was known for its powerful graphics and was popular with game developers.",
            "Sony's MSX computers were designed to be a worldwide standard but only succeeded in Japan.",
            "The Famicom (Japanese NES) had a built-in keyboard adapter for programming.",
            "Bandai's RX-78 was a robot kit that could be programmed like a computer.",
            "Casio's PV-1000 was Japan's first game console but failed due to poor graphics.",
            "The PC Engine (TurboGrafx-16) had better graphics than the NES but poor marketing.",
            "The Mega Drive (Genesis) was more successful in Japan than the Famicom.",
            "The WonderSwan was Bandai's attempt to compete with the Game Boy."
        ],
        'networking': [
            "Ethernet was invented by Robert Metcalfe at Xerox PARC in 1973.",
            "The first commercial modem was the Bell 103 in 1962, transmitting at 300 baud.",
            "Token Ring was IBM's answer to Ethernet and used a token-passing protocol.",
            "ARCnet was one of the first local area network technologies in the 1970s.",
            "The IBM PC Network used a star topology with a file server in the center.",
            "Novell NetWare was the dominant network operating system in the 1980s.",
            "The first network interface card (NIC) for PCs was for the IBM PC in 1982.",
            "Thin Ethernet (10BASE2) used coaxial cable and BNC connectors.",
            "Thick Ethernet (10BASE5) required specialized transceivers called 'vampire taps'.",
            "The PS/2's Micro Channel Architecture included built-in networking support."
        ],
        'portable': [
            "The Osborne 1 was the first portable computer, weighing 24 pounds with a 5-inch screen.",
            "The Kaypro II was one of the most popular portable computers of the early 1980s.",
            "The Compaq Portable was the first IBM PC compatible laptop in 1983.",
            "The GRiD Compass was the first laptop computer, used by NASA on the Space Shuttle.",
            "The Atari Portfolio was the first palmtop computer with MS-DOS compatibility.",
            "The Epson HX-20 was one of the first laptop computers with a built-in printer.",
            "The Dulmont Magnum was a portable Apple II compatible computer.",
            "The Tandy Model 100 was a popular portable computer with built-in modem.",
            "The Sharp PC-5000 was one of the first clamshell design laptops.",
            "The Gavilan SC was the first laptop with a pointing device (touchpad)."
        ],
        'historical': [
            "ENIAC was the first electronic general-purpose computer, completed in 1945.",
            "ENIAC weighed 30 tons, occupied 1,800 square feet, and consumed 150 kW of power.",
            "ENIAC's programmers were six women: Kathleen McNulty, Betty Jennings, Betty Snyder, Marlyn Wescoff, Fran Bilas, and Ruth Lichterman.",
            "The Harvard Mark I was the first programmable digital computer in the US.",
            "The Colossus computer was used by British intelligence to break German codes in WWII.",
            "The Atanasoff-Berry Computer was the first electronic digital computer, invented in 1937.",
            "The Zuse Z3 was the world's first working programmable, fully automatic digital computer.",
            "The Manchester Baby was the first stored-program computer to run a program.",
            "The EDSAC was the first practical stored-program computer in the world.",
            "The UNIVAC I was the first commercial computer and predicted the 1952 election."
        ],
        'robotics': [
            "The first industrial robot was Unimate, installed in 1961 at a General Motors plant.",
            "The Roomba was the first mass-market robot vacuum cleaner in 2002.",
            "ASIMO was Honda's humanoid robot that could walk and climb stairs.",
            "The Mars rovers Spirit and Opportunity were controlled from Earth with 20-minute delays.",
            "Boston Dynamics' BigDog was a quadruped robot that could carry heavy loads.",
            "The first robot was created by George Devol and called the 'Unimate'.",
            "Industrial robots increased productivity but also caused job displacement concerns.",
            "The Da Vinci surgical robot allows surgeons to perform minimally invasive procedures.",
            "Robot arms typically have 6 degrees of freedom to mimic human movement.",
            "The first robot toys appeared in the 1980s with simple programmable functions."
        ],
        'club': [
            "The Homebrew Computer Club was founded in 1975 and included Steve Jobs and Steve Wozniak.",
            "The Vintage Computer Festival started in 1997 and is the largest computer show of its kind.",
            "Computer clubs of the 1970s and 1980s shared software and hardware knowledge.",
            "The People's Computer Company published newsletters that inspired many early programmers.",
            "BYTE magazine was the primary publication for computer enthusiasts in the 1970s-80s.",
            "Computer fairs and swap meets were crucial for sharing information before the internet.",
            "User groups formed around specific computer brands like Apple and Commodore.",
            "The first computer store was The Byte Shop, opened by Paul Terrell in 1975.",
            "Computer clubs often met in schools, libraries, or members' homes.",
            "Many famous programmers got their start in local computer clubs and user groups."
        ],
        'electronics': [
            "The first transistor was invented by Bell Labs in 1947 by John Bardeen, Walter Brattain, and William Shockley.",
            "Integrated circuits were invented by Jack Kilby at Texas Instruments and Robert Noyce at Fairchild.",
            "Surface-mount technology allowed components to be mounted directly on PCB surfaces.",
            "ESD (electrostatic discharge) can damage electronic components and requires special handling.",
            "Soldering irons heat solder to 350-400°F to create electrical connections.",
            "Multimeters can measure voltage, current, and resistance in electronic circuits.",
            "Oscilloscopes display voltage waveforms over time for signal analysis.",
            "Logic probes help troubleshoot digital circuits by indicating high/low states.",
            "Antistatic wrist straps prevent ESD damage when working with electronics.",
            "Component testers verify the functionality of resistors, capacitors, and semiconductors."
        ],
        'general': [
            "The first computer mouse was invented by Douglas Engelbart in 1964.",
            "The term 'bit' comes from 'binary digit' and was coined by John Tukey in 1946.",
            "The first computer bug was an actual bug - a moth stuck in a relay in 1947.",
            "The @ symbol was used in commerce for centuries before becoming the email symbol.",
            "QWERTY keyboard layout was designed to slow down typists and prevent jamming.",
            "The first computer game was Spacewar!, created in 1962 at MIT.",
            "ASCII was developed in the 1960s and became the standard character encoding.",
            "The first hard drive was the IBM 350, weighing over a ton and storing 5MB.",
            "Floppy disks were invented by IBM and originally stored data on 8-inch disks.",
            "The first computer virus was created in 1983 as an experiment, not malice."
        ]
    }

    return facts_by_category.get(category, facts_by_category['general'])

def update_vendor_facts(vendor):
    """Update a vendor's facts with technology trivia"""
    category = categorize_vendor(vendor['description'], vendor['name'])
    facts_pool = get_tech_facts_for_category(category)

    # Select 2-3 random facts
    num_facts = random.randint(2, 3)
    selected_facts = random.sample(facts_pool, num_facts)

    vendor['facts'] = selected_facts
    return vendor

def main():
    # Load the vendors JSON file
    with open('vendors.json', 'r', encoding='utf-8') as f:
        vendors = json.load(f)

    # Update facts for each vendor
    updated_vendors = []
    for vendor in vendors:
        updated_vendor = update_vendor_facts(vendor)
        updated_vendors.append(updated_vendor)

    # Save the updated vendors back to the file
    with open('vendors.json', 'w', encoding='utf-8') as f:
        json.dump(updated_vendors, f, indent=2, ensure_ascii=False)

    print("Vendor facts updated with technology trivia for all vendors!")

if __name__ == "__main__":
    main()
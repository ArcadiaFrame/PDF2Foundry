# PDF Extractor for Foundry VTT (System Agnostic)

This module provides a tool for extracting content from RPG PDFs and converting it to Foundry VTT format. While it works exceptionally well with DnD 5e compatible books, it is designed to be system agnostic and can be used with various RPG systems. It allows you to easily import monsters, spells, items, backgrounds, adventures, and glossaries from official or third-party PDFs directly into your Foundry VTT game.

## Features

- Extract monsters/NPCs and save them in the correct format and directory structure
- Extract spells and categorize them by level
- Extract items (weapons, armor, magic items, etc.) and categorize them by type
- Extract character backgrounds
- Extract adventure/campaign content into compendiums with chapters, locations, and encounters
- Extract glossaries and indexes for easy reference
- Extract images for tokens and maps when available
- Organize all content according to Foundry VTT system's structure
- Web-based user interface for easy uploading and processing

## Installation

### Method 1: Install via Foundry VTT

1. In the Foundry VTT setup screen, go to the "Add-on Modules" tab
2. Click "Install Module"
3. In the "Manifest URL" field, paste: `https://raw.githubusercontent.com/ArcadiaFrame/PDF2Foundry/main/module.json`
4. Click "Install"

### Method 2: Manual Installation

1. Download the latest release from the [Releases page](https://github.com/ArcadiaFrame/PDF2Foundry/archive/refs/heads/main.zip)
2. Extract the zip file
3. Place the extracted folder in your Foundry VTT's `Data/modules/` directory
4. Restart Foundry VTT if it's already running

## Requirements

This module requires:
- Foundry VTT v12.0 or higher
- DnD 5e System v4.0 or higher

Note: The module now uses CDN-hosted PDF.js library, so no additional installation steps are required.


## Usage

1. Enable the module in your world's module settings
2. Access the PDF Extractor from the sidebar or module settings
3. Upload a PDF file using the drag-and-drop interface
4. Select the content types you want to extract (monsters, spells, items, backgrounds)
5. Optionally specify a page range for targeted extraction
6. Click "Process PDF"
7. Once processing is complete, the extracted content will be available in your compendiums

## License

This module is provided under the same license as the Foundry VTT DnD 5e system.

## Credits

- PDF extraction powered by PyMuPDF/pdfminer.six/PyPDF2
- Web interface built with Flask and Bootstrap
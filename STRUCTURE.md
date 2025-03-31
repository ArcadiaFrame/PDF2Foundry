# PDF Extractor Plus - File Structure Organization

## Overview

This document outlines the file structure organization for the PDF Extractor Plus module for Foundry VTT 12.331. The module combines the generic extraction capabilities of PDF Extractor with the specialized importers from PDFtoFoundry.

## Directory Structure

```
pdf-extractor-plus/
├── module.json           # Main module manifest file
├── README.md            # Module documentation
├── LICENSE.txt          # License information
├── STRUCTURE.md         # This file structure document
├── integration-plan.md  # Integration strategy document
├── scripts/             # JavaScript modules for the core functionality
│   ├── pdf-extractor.js         # Main entry point for the module
│   ├── pdf-extractor-ui.js      # UI components for the generic extractor
│   ├── pdf-extractor-core.js    # Core extraction functionality
│   ├── server-api.js            # Server-side API endpoints
│   ├── system-configs.js        # Game system configurations
│   ├── system-selector.js       # System selection UI
│   ├── content-extractors.js    # Content type extractors
│   ├── adventure-extractor.js   # Adventure-specific extraction
│   ├── ocr-handler.js           # OCR functionality for scanned books
│   ├── pdf-utils.js             # PDF utility functions
│   └── unified-processor.js     # Unified processing pipeline
├── styles/              # CSS stylesheets
│   └── pdf-extractor.css        # Main stylesheet
├── templates/           # HTML templates
│   └── pdf-extractor.html       # Main dialog template
├── lib/                 # Library dependencies
│   └── README.md               # Library documentation
├── pdftofoundry/        # PDFtoFoundry submodule
│   ├── module.json             # PDFtoFoundry manifest
│   ├── pdftofoundry.mjs        # Main PDFtoFoundry entry point
│   ├── FoundryGui.mjs          # PDFtoFoundry GUI
│   ├── importer.mjs            # PDFtoFoundry importer
│   ├── vendor.mjs              # Vendor dependencies
│   ├── pdftofoundry.css        # PDFtoFoundry stylesheet
│   ├── import-window.html      # Import dialog template
│   ├── assets/                 # PDFtoFoundry assets
│   └── [adventure folders]/    # Adventure-specific importers
├── pdf_extractor.py     # Python extraction engine
└── adventure_extractor.py # Python adventure extraction
```

## Component Responsibilities

### Core Module Files

- **module.json**: Main module manifest that defines dependencies, entry points, and compatibility.
- **README.md**: User documentation and installation instructions.
- **LICENSE.txt**: License information.
- **STRUCTURE.md**: This file structure documentation.
- **integration-plan.md**: Strategy for integrating PDF Extractor and PDFtoFoundry.

### JavaScript Modules

- **pdf-extractor.js**: Main entry point that initializes both systems and adds UI elements.
- **pdf-extractor-ui.js**: UI components for the generic PDF extractor.
- **pdf-extractor-core.js**: Core extraction functionality for generic PDFs.
- **server-api.js**: Server-side API endpoints for Python-based extraction.
- **system-configs.js**: Game system configurations for different RPG systems.
- **system-selector.js**: UI for selecting the target game system.
- **content-extractors.js**: Specialized extractors for different content types.
- **adventure-extractor.js**: Adventure-specific extraction functionality.
- **ocr-handler.js**: OCR functionality for scanned physical books.
- **pdf-utils.js**: Utility functions for PDF processing.
- **unified-processor.js**: Unified processing pipeline for both systems.

### Styles and Templates

- **styles/pdf-extractor.css**: Main stylesheet for the PDF Extractor UI.
- **templates/pdf-extractor.html**: HTML template for the main dialog.

### PDFtoFoundry Integration

- **pdftofoundry/**: Submodule containing PDFtoFoundry functionality.
- **pdftofoundry/module.json**: PDFtoFoundry manifest file.
- **pdftofoundry/pdftofoundry.mjs**: Main entry point for PDFtoFoundry.
- **pdftofoundry/FoundryGui.mjs**: PDFtoFoundry GUI implementation.
- **pdftofoundry/importer.mjs**: PDFtoFoundry importer functionality.

### Python Backend

- **pdf_extractor.py**: Python extraction engine for generic PDFs.
- **adventure_extractor.py**: Python extraction for adventures.

## Integration Points

1. **pdf-extractor.js**: Initializes both systems and provides a unified entry point.
2. **server-api.js**: Bridges JavaScript frontend with Python backend.
3. **unified-processor.js**: Provides a common processing pipeline for both systems.

## Future Improvements

1. Better separation of concerns between UI and core functionality.
2. More modular architecture for easier extension with new content types.
3. Improved error handling and user feedback.
4. Enhanced documentation for developers.
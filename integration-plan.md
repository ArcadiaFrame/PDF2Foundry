# PDF Extractor and PDFtoFoundry Integration Plan

## Current State Analysis

### PDF Extractor
- **Purpose**: System-agnostic module for extracting content from RPG PDFs and converting to Foundry VTT journals/actors/items
- **Backend**: Python-based extraction engine (pdf_extractor.py, adventure_extractor.py)
- **Frontend**: Simple Foundry VTT interface that currently just initializes the PDFtoFoundry GUI
- **Features**: Extracts monsters, spells, items, backgrounds, adventures, glossaries

### PDFtoFoundry
- **Purpose**: PDF to Foundry Importer specifically designed for Paizo content
- **Implementation**: JavaScript-based module with specialized importers for specific content types
- **UI**: Custom import dialog with PDF upload functionality
- **Features**: Imports maps, scenes, journal entries, and actors from specific supported PDFs

## Integration Strategy

### 1. Unified Module Structure

- Keep PDFtoFoundry as a submodule within PDF Extractor
- Maintain PDFtoFoundry's specialized importers for Paizo content
- Extend PDF Extractor's generic extraction capabilities

### 2. Combined User Interface

- Create a unified UI that offers both:
  - Generic PDF extraction (PDF Extractor)
  - Specialized Paizo content import (PDFtoFoundry)
- Add a tabbed interface to switch between generic and specialized import modes

### 3. Shared Functionality

- Use PDFtoFoundry's UI framework and dialog system
- Leverage PDF Extractor's content parsing and categorization
- Create a common API for both systems to use

### 4. Technical Implementation

#### Frontend (JavaScript)

1. Create a new main module entry point that initializes both systems
2. Extend the import dialog to include PDF Extractor functionality
3. Add content type selection for generic PDF extraction

#### Backend Integration

1. Create a bridge between JavaScript frontend and Python backend
2. Implement server-side API endpoints for PDF extraction
3. Add client-side handlers for extraction results

## Implementation Plan

### Phase 1: Basic Integration

1. Update module.json to properly include both modules
2. Create a unified entry point that initializes both systems
3. Extend the UI to provide access to both functionalities

### Phase 2: Enhanced Extraction

1. Implement server-side API for Python-based extraction
2. Create client-side handlers for extraction results
3. Add content type selection and configuration

### Phase 3: Unified Experience

1. Create a seamless UI that intelligently selects the appropriate extractor
2. Implement shared data storage for extracted content
3. Add batch processing capabilities

## File Changes Required

1. **pdf-extractor.js**: Extend to properly initialize both systems
2. **server-api.js**: Add endpoints for Python-based extraction
3. **New UI Components**: Create unified interface
4. **module.json**: Update dependencies and module structure

## Conclusion

By combining PDFtoFoundry's specialized Paizo content importing with PDF Extractor's generic extraction capabilities, we can create a comprehensive solution for importing content from various RPG PDFs into Foundry VTT. This integration will provide users with both specialized tools for supported PDFs and generic extraction for unsupported content.
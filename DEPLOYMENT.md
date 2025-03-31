# PDF Extractor Plus - Deployment Guide for Foundry VTT 12.331

## Overview

This document provides instructions for deploying the PDF Extractor Plus module to Foundry VTT 12.331. It covers the necessary steps to ensure compatibility and proper functionality.

## Pre-Deployment Checklist

1. **Compatibility Verification**
   - Ensure module.json has correct compatibility settings:
     - `minimum`: "12.0"
     - `verified`: "12.331"
     - `maximum`: "12"
   - Verify PDFtoFoundry submodule compatibility settings match

2. **File Structure Verification**
   - Confirm all files are organized according to STRUCTURE.md
   - Ensure all JavaScript modules are properly referenced in module.json
   - Check that all dependencies are correctly listed

3. **Module Dependencies**
   - Verify PDF.js library dependency is correctly configured
   - Ensure PDFtoFoundry integration is properly set up

## Deployment Steps

### 1. Package the Module

```bash
# Navigate to the module directory
cd path/to/pdf-extractor-plus

# Create a zip file for distribution
zip -r pdf-extractor-plus.zip . -x "*.git*" "*.DS_Store" "*.zip"
```

### 2. Upload to Foundry VTT

#### Method 1: Install via Manifest URL

1. In Foundry VTT setup, go to "Add-on Modules" tab
2. Click "Install Module"
3. Enter the manifest URL: `https://raw.githubusercontent.com/ArcadiaFrame/PDF2Foundry/main/module.json`
4. Click "Install"

#### Method 2: Manual Installation

1. Copy the zip file to your Foundry VTT's `Data/modules/` directory
2. Extract the zip file
3. Restart Foundry VTT if it's already running

### 3. Verify Installation

1. Launch Foundry VTT
2. Create or select a world
3. Go to "Manage Modules"
4. Ensure "PDF Extractor Plus" is listed and enabled
5. Launch the world and verify the module is working correctly:
   - Check for the PDF Extractor button in the sidebar
   - Test basic functionality by importing a sample PDF

## Troubleshooting

### Common Issues

1. **Module Not Found**
   - Verify the module is correctly installed in the modules directory
   - Check that the module.json file is properly formatted

2. **Compatibility Errors**
   - Ensure Foundry VTT version is 12.331 or compatible
   - Check for any error messages in the console (F12)

3. **PDFtoFoundry Integration Issues**
   - Verify the PDFtoFoundry submodule is correctly included
   - Check that all dependencies are properly loaded

4. **Python Backend Connection Issues**
   - Ensure the Python backend is properly configured
   - Verify the server API endpoints are correctly set up

## Version History

- **1.0.0**: Initial release for Foundry VTT 12.331

## Support

For issues or questions, please open an issue on the [GitHub repository](https://github.com/ArcadiaFrame/PDF2Foundry/issues).
# PDF.js Library Files

This directory should contain the PDF.js library files required by the PDF Extractor module.

## Required Files

- `pdf.js` - The main PDF.js library file
- `pdf.worker.js` - The PDF.js worker file

## Installation

You can download these files from the [PDF.js releases page](https://github.com/mozilla/pdf.js/releases) or use npm to install them:

```
npm install pdfjs-dist
```

Then copy the files from the `node_modules/pdfjs-dist/build/` directory to this directory.

Alternatively, you can use CDN versions of these files by updating the references in the code.
/**
 * OCR Handler for PDF Extractor
 * This module provides OCR functionality for scanned physical books
 */

/**
 * Class for handling OCR operations on scanned PDFs
 */
export class OCRHandler {
  /**
   * Initialize the OCR handler
   */
  constructor() {
    this.ocrEnabled = game.settings.get('pdf-extractor-plus', 'enableOCR') || false;
    this.ocrWorker = null;
    this.ocrProgress = 0;
  }
  
  /**
   * Check if OCR is enabled
   * @returns {boolean} - Whether OCR is enabled
   */
  isOCREnabled() {
    return this.ocrEnabled;
  }
  
  /**
   * Initialize OCR worker if needed
   * @returns {Promise<void>}
   */
  async initOCRWorker() {
    if (!this.ocrWorker && this.ocrEnabled) {
      // We'll use Tesseract.js for OCR
      // This would normally be loaded as a dependency
      try {
        // Check if Tesseract is already available
        if (typeof Tesseract === 'undefined') {
          // Load Tesseract.js from CDN if not available
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        
        // Initialize worker
        this.ocrWorker = await Tesseract.createWorker({
          logger: progress => {
            this.ocrProgress = progress.progress;
            // Emit progress event
            Hooks.call('pdfExtractor.ocrProgress', this.ocrProgress);
          }
        });
        
        // Load language data - English by default
        await this.ocrWorker.loadLanguage('eng');
        await this.ocrWorker.initialize('eng');
        
        console.log('PDF Extractor | OCR worker initialized');
      } catch (error) {
        console.error('PDF Extractor | Failed to initialize OCR worker:', error);
        ui.notifications.error('Failed to initialize OCR. Some features may not work properly.');
      }
    }
  }
  
  /**
   * Process a PDF page with OCR
   * @param {Object} pdfPage - The PDF.js page object
   * @returns {Promise<string>} - Extracted text from the page
   */
  async processPage(pdfPage) {
    if (!this.ocrEnabled || !this.ocrWorker) {
      throw new Error('OCR is not enabled or worker not initialized');
    }
    
    try {
      // Render the page to a canvas
      const viewport = pdfPage.getViewport({ scale: 2.0 }); // Higher scale for better OCR
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await pdfPage.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Process the canvas with OCR
      const result = await this.ocrWorker.recognize(canvas);
      return result.data.text;
    } catch (error) {
      console.error('PDF Extractor | OCR processing error:', error);
      throw error;
    }
  }
  
  /**
   * Process multiple PDF pages with OCR
   * @param {Array} pdfPages - Array of PDF.js page objects
   * @returns {Promise<string>} - Combined extracted text from all pages
   */
  async processPages(pdfPages) {
    if (!this.ocrEnabled) {
      throw new Error('OCR is not enabled');
    }
    
    // Initialize worker if needed
    await this.initOCRWorker();
    
    let combinedText = '';
    
    // Process each page
    for (let i = 0; i < pdfPages.length; i++) {
      const pageText = await this.processPage(pdfPages[i]);
      combinedText += pageText + '\n\n';
      
      // Update progress
      const progress = (i + 1) / pdfPages.length;
      Hooks.call('pdfExtractor.pageProgress', progress);
    }
    
    return combinedText;
  }
  
  /**
   * Terminate the OCR worker
   * @returns {Promise<void>}
   */
  async terminate() {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
    }
  }
}
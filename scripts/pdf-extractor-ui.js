/**
 * PDF Extractor UI Component
 * Provides the user interface for the generic PDF extraction functionality
 */

export class PDFExtractorUI {
  /**
   * Initialize the UI
   */
  init() {
    console.log('PDF Extractor UI | Initializing');
    
    // Register any necessary hooks or event listeners
    this._registerEventListeners();
  }
  
  /**
   * Register event listeners
   * @private
   */
  _registerEventListeners() {
    // Listen for extraction results
    game.socket.on('module.pdf-extractor-plus', (data) => {
      if (data.action === 'extractionResults') {
        this._handleExtractionResults(data.data);
      }
    });
  }
  
  /**
   * Open the PDF Extractor dialog
   */
  openDialog() {
    new Dialog({
      title: 'Generic PDF Extractor',
      content: `
        <form>
          <div class="form-group">
            <label>PDF File</label>
            <input type="file" name="pdf" accept=".pdf" required />
          </div>
          <div class="form-group">
            <label>Content Type</label>
            <select name="contentType">
              <option value="all">All Content</option>
              <option value="monsters">Monsters/NPCs</option>
              <option value="spells">Spells</option>
              <option value="items">Items</option>
              <option value="adventure">Adventure</option>
              <option value="glossary">Glossary</option>
            </select>
          </div>
          <div class="form-group">
            <label>Page Range (Optional)</label>
            <div class="form-fields">
              <input type="number" name="startPage" placeholder="Start" min="1" />
              <input type="number" name="endPage" placeholder="End" min="1" />
            </div>
            <p class="notes">Leave blank to process the entire PDF</p>
          </div>
          <div class="form-group">
            <label>Output Format</label>
            <select name="outputFormat">
              <option value="compendium">Compendium</option>
              <option value="world">World</option>
            </select>
          </div>
        </form>
      `,
      buttons: {
        extract: {
          icon: '<i class="fas fa-file-import"></i>',
          label: 'Extract Content',
          callback: (html) => this._handleExtractButtonClick(html)
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel'
        }
      },
      default: 'extract',
      render: (html) => {
        // Any rendering logic here
      }
    }, {
      width: 400,
      height: 'auto'
    }).render(true);
  }
  
  /**
   * Handle the extract button click
   * @param {jQuery} html - The dialog HTML
   * @private
   */
  async _handleExtractButtonClick(html) {
    const form = html.find('form')[0];
    const formData = new FormData(form);
    
    const file = formData.get('pdf');
    if (!file) {
      ui.notifications.error("Please select a PDF file to extract content from.");
      return;
    }
    
    const contentType = formData.get('contentType');
    const startPage = formData.get('startPage') ? parseInt(formData.get('startPage')) : null;
    const endPage = formData.get('endPage') ? parseInt(formData.get('endPage')) : null;
    const outputFormat = formData.get('outputFormat');
    
    // Validate page range
    if (startPage && endPage && startPage > endPage) {
      ui.notifications.error("Start page must be less than or equal to end page.");
      return;
    }
    
    // Show processing notification
    ui.notifications.info("Processing PDF. This may take a few moments...");
    
    try {
      // Use the socket API to send the file to the server
      await game.socket.emit('module.pdf-extractor-plus', {
        action: 'extractPDF',
        data: {
          file: await this._readFileAsArrayBuffer(file),
          filename: file.name,
          contentType,
          startPage,
          endPage,
          outputFormat
        }
      });
    } catch (error) {
      ui.notifications.error(`Error processing PDF: ${error.message}`);
      console.error(error);
    }
  }
  
  /**
   * Handle extraction results
   * @param {Object} results - The extraction results
   * @private
   */
  _handleExtractionResults(results) {
    if (results.success) {
      ui.notifications.info(`PDF extraction complete: ${results.message}`);
      
      // Display the results in a dialog
      this._showResultsDialog(results);
    } else {
      ui.notifications.error(`PDF extraction failed: ${results.error}`);
    }
  }
  
  /**
   * Display extraction results
   * @param {Object} results - Extraction results
   * @param {Application} app - The application object
   */
  _showResultsDialog(results) {
    const { extractedItems } = results.result;
    
    // Group items by type
    const groupedItems = {};
    for (const item of extractedItems) {
      if (!groupedItems[item.type]) {
        groupedItems[item.type] = [];
      }
      groupedItems[item.type].push(item);
    }
    
    // Create content HTML
    let content = '<h2>Extraction Results</h2>';
    
    for (const [type, items] of Object.entries(groupedItems)) {
      content += `<h3>${type.charAt(0).toUpperCase() + type.slice(1)}s (${items.length})</h3>`;
      content += '<ul>';
      for (const item of items) {
        content += `<li>${item.name}</li>`;
      }
      content += '</ul>';
    }
    
    // Show the dialog
    new Dialog({
      title: 'PDF Extraction Results',
      content,
      buttons: {
        close: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Close'
        }
      },
      default: 'close'
    }, {
      width: 400,
      height: 'auto'
    }).render(true);
  }
  
  /**
   * Read a file as an ArrayBuffer
   * @param {File} file - The file to read
   * @returns {Promise<ArrayBuffer>} - The file contents as an ArrayBuffer
   * @private
   */
  async _readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
}
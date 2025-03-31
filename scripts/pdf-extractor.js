import { FoundryGui } from '../pdftofoundry/FoundryGui.mjs';
import { getAvailableSystemConfigs, getDefaultSystemConfig } from './system-configs.js';
import { initializeSystemSelector } from './system-selector.js';

// Register the module
Hooks.once('init', () => {
  console.log('PDF Extractor | Initializing');
  
  // Register module settings
  game.settings.register('pdf-extractor-plus', 'defaultMode', {
    name: 'Default Import Mode',
    hint: 'Select which import mode to show by default',
    scope: 'world',
    config: true,
    type: String,
    choices: {
      'generic': 'Generic PDF Extractor',
      'paizo': 'Paizo Content (PDFtoFoundry)'
    },
    default: 'generic'
  });
  
  // Register default system setting
  game.settings.register('pdf-extractor-plus', 'defaultSystem', {
    name: 'Default Game System',
    hint: 'Select which game system to use by default for extraction',
    scope: 'world',
    config: true,
    type: String,
    choices: Object.fromEntries(
      getAvailableSystemConfigs().map(config => [config.id, config.name])
    ),
    default: 'dnd5e'
  });
  
  // Register OCR settings for physical book scans
  game.settings.register('pdf-extractor-plus', 'enableOCR', {
    name: 'Enable OCR for Scanned Books',
    hint: 'Use Optical Character Recognition to extract text from scanned physical books',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });
});

// Initialize the module when Foundry is ready
Hooks.once('ready', () => {
  // Initialize PDFtoFoundry GUI
  const pdftofoundryGui = new FoundryGui();
  pdftofoundryGui.init();
  
  // Store references in the game module for API access
  game.modules.get('pdf-extractor-plus').api = {
    pdftofoundry: pdftofoundryGui
  };
  
  // Add a button to the sidebar
  if (game.user.isGM) {
    addPDFExtractorButton();
  }
  
  console.log('PDF Extractor | Initialization complete');
});

/**
 * Add a PDF Extractor button to the sidebar
 */
function addPDFExtractorButton() {
  const button = $(`
    <div class="control-icon pdf-extractor" title="PDF Extractor Plus">
      <i class="fas fa-file-pdf"></i>
    </div>
  `);
  
  button.click(ev => {
    ev.preventDefault();
    showPDFExtractorDialog();
  });
  
  $('#sidebar-tabs').after(button);
}

/**
 * Show the PDF Extractor dialog
 */
function showPDFExtractorDialog() {
  const defaultMode = game.settings.get('pdf-extractor-plus', 'defaultMode');
  
  // Determine which tab to show by default
  const initialTab = defaultMode === 'paizo' ? 'paizo' : 'generic';
  
  new Dialog({
    title: 'PDF Extractor',
    content: `
      <nav class="tabs" data-group="tabs">
        <a class="item" data-tab="generic"><i class="fas fa-file-pdf"></i> Generic PDF Extractor</a>
        <a class="item" data-tab="paizo"><i class="fas fa-dragon"></i> Paizo Content</a>
      </nav>
      
      <section class="content">
        <div class="tab" data-tab="generic" data-group="tabs">
          <p>Extract content from any RPG PDF into Foundry VTT format.</p>
          <form>
            <div class="form-group">
              <label>PDF File</label>
              <input type="file" name="pdf" accept=".pdf" />
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
            <button type="submit"><i class="fas fa-file-import"></i> Extract Content</button>
          </form>
        </div>
        
        <div class="tab" data-tab="paizo" data-group="tabs">
          <p>Import Paizo PDFs with specialized support for adventures, bestiaries, and more.</p>
          <button class="pdf-extractor-open-paizo"><i class="fas fa-file-import"></i> Open Paizo Importer</button>
        </div>
      </section>
    `,
    buttons: {
      close: {
        icon: '<i class="fas fa-times"></i>',
        label: 'Close'
      }
    },
    default: 'close',
    render: html => {
      // Set the initial tab
      const tabs = new Tabs({
        navSelector: '.tabs',
        contentSelector: '.content',
        initial: initialTab
      });
      tabs.bind(html[0]);
      
      // Add button handlers
      html.find('.pdf-extractor-open-paizo').click(() => {
        game.modules.get('pdf-extractor-plus').api.pdftofoundry.importFromPDFDialog();
      });
      
      // Handle generic extractor form submission
      html.find('form').submit(async (event) => {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const file = formData.get('pdf');
        const contentType = formData.get('contentType');
        
        if (!file) {
          ui.notifications.error("Please select a PDF file to extract content from.");
          return;
        }
        
        // Call the server-side API to process the PDF
        ui.notifications.info("Processing PDF. This may take a few moments...");
        
        try {
          // Use the socket API to send the file to the server
          await game.socket.emit('module.pdf-extractor-plus', {
            action: 'extractPDF',
            data: {
              file: await readFileAsArrayBuffer(file),
              filename: file.name,
              contentType: contentType
            }
          });
        } catch (error) {
          ui.notifications.error(`Error processing PDF: ${error.message}`);
          console.error(error);
        }
      });
    }
  }, {
    width: 500,
    height: 'auto'
  }).render(true);
}

/**
 * Read a file as an ArrayBuffer
 * @param {File} file - The file to read
 * @returns {Promise<ArrayBuffer>} - The file contents as an ArrayBuffer
 */
async function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
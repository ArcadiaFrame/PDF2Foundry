import { FoundryGui } from './modified-foundry-gui.mjs';
import { getAvailableSystemConfigs, getDefaultSystemConfig } from './system-configs.js';
import { initializeSystemSelector } from './system-selector.js';

// Create a single instance of FoundryGui to be used throughout the application
const foundryGui = new FoundryGui();

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
  foundryGui.init();
  
  // Store references in the game module for API access
  game.modules.get('pdf-extractor-plus').api = {
    pdftofoundry: foundryGui
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
  // Use the unified PDFtoFoundry dialog directly
  foundryGui.importFromPDFDialog();
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
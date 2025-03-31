/**
 * Modified FoundryGui class that removes PF2e system dependency
 * This is a system-agnostic version of the original FoundryGui.mjs
 * Integrated with PDF Extractor functionality
 */

import { getAvailableSystemConfigs, getDefaultSystemConfig } from './system-configs.js';
import { initializeSystemSelector } from './system-selector.js';

export class FoundryGui {
  constructor() {
    this.tokenArtDb = null;
    this.systemConfig = getDefaultSystemConfig();
  }

  /**
   * Initialize the GUI
   */
  init() {
    console.log('PDFtoFoundry | Initializing GUI');
    this.hookImportButton();
  }

  /**
   * Hook the import button to the settings tab
   * This is system-agnostic and works with both PDFtoFoundry and PDF Extractor
   */
  hookImportButton() {
    Hooks.on('renderSettings', (app, html, data) => {
      console.log('PDF Extractor Plus | Adding pdf import button to settings tab');
      
      const importButton = $('<div><button class="pdf-extractor-btn"><i class="fas fa-file-pdf"></i> PDF Extractor Plus</button></div>');
      
      if (game.user.isGM) {
        html.find('ul#game-details').after(importButton);
      }
      
      importButton.click(ev => {
        ev.preventDefault();
        // System-agnostic import dialog
        this.importFromPDFDialog();
      });
    });
  }

  /**
   * Show the unified import dialog that combines PDFtoFoundry and PDF Extractor functionality
   */
  async importFromPDFDialog() {
    // Get the default mode from settings
    const defaultMode = game.settings.get('pdf-extractor-plus', 'defaultMode');
    const initialTab = defaultMode === 'paizo' ? 'summary' : 'generic';
    
    // Create a unified dialog that combines both functionalities
    new Dialog({
      title: 'PDF Extractor Plus',
      content: await renderTemplate('modules/pdftofoundry/import-window.html', {
        systems: getAvailableSystemConfigs(),
        defaultSystem: this.systemConfig.id
      }),
      buttons: {
        import: {
          icon: '<i class="fas fa-file-import"></i>',
          label: 'Import PDF',
          callback: async html => {
            if (html instanceof HTMLElement) return;
            const form = html.find('form')[0];
            if (!form.data.files.length) {
              return ui.notifications.error('You did not upload a data file!');
            }
            
            // Get the active tab to determine which processor to use
            const activeTab = html.find('nav a.active').data('tab');
            
            if (activeTab === 'generic') {
              // Use the PDF Extractor processor
              const contentType = html.find('select[name="contentType"]').val();
              const systemId = html.find('select[name="system"]').val();
              
              // Process with PDF Extractor
              ui.notifications.info("Processing PDF with generic extractor. This may take a few moments...");
              
              try {
                // Use the socket API to send the file to the server
                await game.socket.emit('module.pdf-extractor-plus', {
                  action: 'extractPDF',
                  data: {
                    file: await this._readFileAsArrayBuffer(form.data.files[0]),
                    filename: form.data.files[0].name,
                    contentType: contentType,
                    systemId: systemId
                  }
                });
              } catch (error) {
                ui.notifications.error(`Error processing PDF: ${error.message}`);
                console.error(error);
              }
            } else {
              // Use the PDFtoFoundry processor for Paizo content
              try {
                (await import('../pdftofoundry/importer.mjs')).generateData(form.data.files[0]);
              } catch (error) {
                ui.notifications.error(`Error processing PDF: ${error.message}`);
                console.error(error);
              }
            }
          }
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel'
        }
      },
      default: 'import',
      render: html => {
        // Add the generic extractor tab
        const navElement = html.find('nav');
        navElement.append('<a data-tab="generic"><i class="fas fa-file-pdf"></i> Generic Extractor</a>');
        
        // Add the generic extractor content
        const contentSection = html.find('section.pdftofoundry-content');
        const genericContent = $(`
          <div class="tab browser" data-group="primary" data-tab="generic">
            <p>Extract content from any RPG PDF into Foundry VTT format.</p>
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
            <div class="form-group system-selector-container">
              <label for="system-select">Game System:</label>
              <select id="system-select" name="system">
                <!-- System options will be populated by system-selector.js -->
              </select>
              <p class="hint">Select the RPG system this PDF is from to improve extraction accuracy</p>
            </div>
          </div>
        `);
        contentSection.append(genericContent);
        
        // Initialize the system selector in the generic tab
        initializeSystemSelector(genericContent);
        
        // Set up tabs
        const tabs = new Tabs({
          navSelector: 'nav',
          contentSelector: 'section.pdftofoundry-content',
          initial: initialTab
        });
        tabs.bind(html[0]);
      }
    }, {
      id: 'pdf-extractor-importdialog',
      width: 600,
      height: 'auto',
      resizable: true,
      tabs: [{
        navSelector: 'nav',
        contentSelector: 'section.pdftofoundry-content',
        initial: initialTab
      }]
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
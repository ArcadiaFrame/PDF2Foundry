/**
 * PDF Extractor for Foundry VTT
 * A module for extracting content from DnD 5e PDFs and converting it to Foundry VTT format.
 */

// Import our extractor classes
import { PDFExtractor, MonsterExtractor, SpellExtractor } from './pdf-extractor-core.js';
import { AdventureExtractor, GlossaryExtractor } from './adventure-extractor.js';
import { RaceExtractor, TraitExtractor, FeatExtractor, RollTableExtractor } from './content-extractors.js';
import { loadPDFLibrary, parsePageRange, generateUUID, createCompendiumPack, importToCompendium } from './pdf-utils.js';

// Register the module with Foundry VTT
Hooks.once('init', async function() {
  console.log('PDF Extractor | Initializing PDF Extractor for DnD 5e');
  
  // Register module settings
  game.settings.register('pdf-extractor', 'extractionOptions', {
    name: 'Default Extraction Options',
    hint: 'Default content types to extract',
    scope: 'world',
    config: true,
    type: Object,
    default: {
      monsters: true,
      spells: true,
      items: true,
      backgrounds: false,
      adventures: false,
      glossary: false,
      races: false,
      traits: false,
      feats: false,
      rolltables: false
    }
  });
  
  // Load PDF.js library
  try {
    await loadPDFLibrary();
    console.log('PDF Extractor | PDF.js library loaded successfully');
  } catch (error) {
    console.error('PDF Extractor | Failed to load PDF.js library:', error);
  }
});}

// Add the PDF Extractor button to the sidebar
Hooks.once('ready', async function() {
  if (game.user.isGM) {
    // Create the button in the sidebar
    const button = $(`<div class="pdf-extractor-button flexrow">
                        <i class="fas fa-file-pdf"></i>
                        <span>PDF Extractor</span>
                      </div>`);
    
    // Add the button to the sidebar
    const sidebar = $('#sidebar');
    sidebar.append(button);
    
    // Add click handler to open the PDF Extractor interface
    button.click(ev => {
      ev.preventDefault();
      new PDFExtractorApp().render(true);
    });
  }
});

/**
 * The main application for the PDF Extractor
 */
class PDFExtractorApp extends Application {
  constructor(options = {}) {
    super(options);
    this.file = null;
    this.extractors = {};
    this.results = {};
  }
  
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: 'pdf-extractor',
      title: 'PDF Extractor for DnD 5e',
      template: 'modules/pdf-extractor/templates/pdf-extractor.html',
      width: 600,
      height: 'auto',
      classes: ['dnd5e', 'pdf-extractor'],
      resizable: true,
      closeOnSubmit: false
    });
  }
  
  getData() {
    const data = super.getData();
    data.extractionOptions = game.settings.get('pdf-extractor', 'extractionOptions');
    return data;
  }
  
  activateListeners(html) {
    super.activateListeners(html);
    
    // Store the html element for later use
    this.html = html;
    
    // Handle file upload
    html.find('.pdf-upload').change(this._onFileUpload.bind(this));
    
    // Handle PDF source selection
    html.find('input[name="pdf_source"]').change(this._onSourceChange.bind(this));
    
    // Handle server browse button
    html.find('#browse-server').click(this._onBrowseServer.bind(this));
    
    // Handle server file selection
    html.find('#server-files').change(this._onServerFileSelect.bind(this));
    
    // Handle form submission
    html.find('form').submit(this._onSubmit.bind(this));
    
    // Initialize the source selection
    this._onSourceChange({ target: html.find('input[name="pdf_source"]:checked')[0] });
  }
  
  /**
   * Handle PDF source change (upload or server)
   * @param {Event} event - The change event
   * @private
   */
  _onSourceChange(event) {
    const source = event.target.value;
    
    if (source === 'upload') {
      this.html.find('#upload-section').removeClass('hidden');
      this.html.find('#server-section').addClass('hidden');
    } else if (source === 'server') {
      this.html.find('#upload-section').addClass('hidden');
      this.html.find('#server-section').removeClass('hidden');
      
      // Load server files if not already loaded
      if (this.html.find('#server-files option').length <= 1) {
        this._loadServerFiles();
      }
    }
  }
  
  /**
   * Handle file upload
   * @param {Event} event - The change event
   * @private
   */
  async _onFileUpload(event) {
    const input = event.target;
    this.file = input.files[0];
    if (this.file) {
      const filename = this.file.name;
      this.html.find('.file-name').text(filename);
    }
  }
  
  /**
   * Handle server browse button click
   * @param {Event} event - The click event
   * @private
   */
  async _onBrowseServer(event) {
    event.preventDefault();
    
    const path = this.html.find('#server-path').val();
    await this._loadServerFiles(path);
  }
  
  /**
   * Load files from server directory
   * @param {string} path - The directory path
   * @private
   */
  async _loadServerFiles(path = null) {
    if (!path) {
      path = this.html.find('#server-path').val();
    }
    
    try {
      // Request file list from server
      const response = await fetch(`/modules/pdf-extractor/api/browse?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      
      if (!data.success) {
        ui.notifications.error(data.error || 'Failed to load server files');
        return;
      }
      
      // Update file list
      const select = this.html.find('#server-files');
      select.empty();
      select.append('<option value="" disabled selected>Select a PDF file...</option>');
      
      for (const file of data.files) {
        if (file.toLowerCase().endsWith('.pdf')) {
          const fullPath = `${path}/${file}`;
          select.append(`<option value="${fullPath}">${file}</option>`);
        }
      }
    } catch (error) {
      console.error('Error loading server files:', error);
      ui.notifications.error('Failed to load server files');
    }
  }
  
  /**
   * Handle server file selection
   * @param {Event} event - The change event
   * @private
   */
  async _onServerFileSelect(event) {
    const filePath = event.target.value;
    if (filePath) {
      this.serverFilePath = filePath;
    }
  }
  
  async _onSubmit(event) {
    event.preventDefault();
    
    // Determine PDF source
    const source = this.html.find('input[name="pdf_source"]:checked').val();
    
    if (source === 'upload' && !this.file) {
      ui.notifications.error('Please select a PDF file to upload.');
      return;
    } else if (source === 'server' && !this.serverFilePath) {
      ui.notifications.error('Please select a PDF file from the server.');
      return;
    }
    
    // Get selected content types
    const contentTypes = this.html.find('input[name="content_types[]"]:checked')
      .map((i, el) => el.value)
      .get();
    
    if (contentTypes.length === 0) {
      ui.notifications.error('Please select at least one content type to extract.');
      return;
    }
    
    // Get page range
    const pageRangeStr = this.html.find('#page-range').val();
    const pageRange = parsePageRange(pageRangeStr);
    
    // Display processing message
    this.html.find('.processing-message').removeClass('hidden');
    this.html.find('.success-message').addClass('hidden');
    
    try {
      // If using server file, fetch it first
      if (source === 'server') {
        await this._fetchServerFile(this.serverFilePath);
      }
      
      // Initialize extractors
      await this._initializeExtractors();
      
      // Process the PDF
      await this._processPDF(contentTypes, pageRange);
      
      // Show success message
      ui.notifications.info('PDF processed successfully!');
      this.html.find('.processing-message').addClass('hidden');
      this.html.find('.success-message').removeClass('hidden');
    } catch (error) {
      console.error('Error processing PDF:', error);
      ui.notifications.error(`Error processing PDF: ${error.message}`);
      this.html.find('.processing-message').addClass('hidden');
    }
  }
  
  /**
   * Fetch a PDF file from the server
   * @param {string} filePath - The file path on the server
   * @private
   */
  async _fetchServerFile(filePath) {
    try {
      // Request the file from the server
      const response = await fetch(`/modules/pdf-extractor/api/fetch?path=${encodeURIComponent(filePath)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      // Get the file as a blob
      const blob = await response.blob();
      
      // Create a File object from the blob
      const filename = filePath.split('/').pop();
      this.file = new File([blob], filename, { type: 'application/pdf' });
      
      return this.file;
    } catch (error) {
      console.error('Error fetching server file:', error);
      throw error;
    }
  }
  
  /**
   * Initialize the extractors
   * @private
   */
  async _initializeExtractors() {
    // Create extractors for each content type
    this.extractors = {
      monsters: new MonsterExtractor(this.file),
      spells: new SpellExtractor(this.file),
      adventures: new AdventureExtractor(this.file),
      glossary: new GlossaryExtractor(this.file),
      races: new RaceExtractor(this.file),
      traits: new TraitExtractor(this.file),
      feats: new FeatExtractor(this.file),
      rolltables: new RollTableExtractor(this.file)
    };
    
    // Load the PDF document
    await this.extractors.monsters.loadPDF();
    
    // Share the PDF document between extractors
    const pdfDoc = this.extractors.monsters.pdfDoc;
    for (const key in this.extractors) {
      if (key !== 'monsters') {
        this.extractors[key].pdfDoc = pdfDoc;
      }
    }
  }
  
  /**
   * Process the PDF with selected content types
   * @param {Array<string>} contentTypes - Selected content types
   * @param {Object} pageRange - Page range to process
   * @private
   */
  async _processPDF(contentTypes, pageRange) {
    const extractionPromises = [];
    
    // Extract monsters
    if (contentTypes.includes('monsters')) {
      extractionPromises.push(
        this._extractMonsters(pageRange).then(result => {
          this.results.monsters = result;
        })
      );
    }
    
    // Extract spells
    if (contentTypes.includes('spells')) {
      extractionPromises.push(
        this._extractSpells(pageRange).then(result => {
          this.results.spells = result;
        })
      );
    }
    
    // Extract adventures
    if (contentTypes.includes('adventures')) {
      extractionPromises.push(
        this._extractAdventures(pageRange).then(result => {
          this.results.adventures = result;
        })
      );
    }
    
    // Extract glossary
    if (contentTypes.includes('glossary')) {
      extractionPromises.push(
        this._extractGlossary(pageRange).then(result => {
          this.results.glossary = result;
        })
      );
    }
    
    // Extract races/species
    if (contentTypes.includes('races')) {
      extractionPromises.push(
        this._extractRaces(pageRange).then(result => {
          this.results.races = result;
        })
      );
    }
    
    // Extract traits
    if (contentTypes.includes('traits')) {
      extractionPromises.push(
        this._extractTraits(pageRange).then(result => {
          this.results.traits = result;
        })
      );
    }
    
    // Extract feats
    if (contentTypes.includes('feats')) {
      extractionPromises.push(
        this._extractFeats(pageRange).then(result => {
          this.results.feats = result;
        })
      );
    }
    
    // Extract roll tables
    if (contentTypes.includes('rolltables')) {
      extractionPromises.push(
        this._extractRollTables(pageRange).then(result => {
          this.results.rolltables = result;
        })
      );
    }
    
    // Wait for all extractions to complete
    await Promise.all(extractionPromises);
    
    // Create compendium packs and import entities
    await this._createCompendiums();
  }
  
  /**
   * Extract monsters from the PDF
   * @param {Object} pageRange - Page range to process
   * @returns {Promise<Array>} - Extracted monster data
   * @private
   */
  async _extractMonsters(pageRange) {
    console.log('Extracting monsters...');
    return await this.extractors.monsters.extractMonsters(pageRange);
  }
  
  /**
   * Extract spells from the PDF
   * @param {Object} pageRange - Page range to process
   * @returns {Promise<Array>} - Extracted spell data
   * @private
   */
  async _extractSpells(pageRange) {
    console.log('Extracting spells...');
    return await this.extractors.spells.extractSpells(pageRange);
  }
  
  /**
   * Extract adventures from the PDF
   * @param {Object} pageRange - Page range to process
   * @returns {Promise<Object>} - Extracted adventure data
   * @private
   */
  async _extractAdventures(pageRange) {
    console.log('Extracting adventures...');
    return await this.extractors.adventures.extractAdventure(pageRange);
  }
  
  /**
   * Extract glossary from the PDF
   * @param {Object} pageRange - Page range to process
   * @returns {Promise<Object>} - Extracted glossary data
   * @private
   */
  async _extractGlossary(pageRange) {
    console.log('Extracting glossary...');
    return await this.extractors.glossary.extractGlossary(pageRange);
  }
  
  /**
   * Extract races/species from the PDF
   * @param {Object} pageRange - Page range to process
   * @returns {Promise<Array>} - Extracted race data
   * @private
   */
  async _extractRaces(pageRange) {
    console.log('Extracting races/species...');
    return await this.extractors.races.extractRaces(pageRange);
  }
  
  /**
   * Extract character traits from the PDF
   * @param {Object} pageRange - Page range to process
   * @returns {Promise<Array>} - Extracted trait data
   * @private
   */
  async _extractTraits(pageRange) {
    console.log('Extracting traits...');
    return await this.extractors.traits.extractTraits(pageRange);
  }
  
  /**
   * Extract character feats from the PDF
   * @param {Object} pageRange - Page range to process
   * @returns {Promise<Array>} - Extracted feat data
   * @private
   */
  async _extractFeats(pageRange) {
    console.log('Extracting feats...');
    return await this.extractors.feats.extractFeats(pageRange);
  }
  
  /**
   * Extract roll tables from the PDF
   * @param {Object} pageRange - Page range to process
   * @returns {Promise<Array>} - Extracted roll table data
   * @private
   */
  async _extractRollTables(pageRange) {
    console.log('Extracting roll tables...');
    return await this.extractors.rolltables.extractRollTables(pageRange);
  }
  
  /**
   * Create a folder in Foundry VTT
   * @param {string} name - The folder name
   * @param {Object} parent - Optional parent folder
   * @returns {Promise<Object>} - The created folder
   * @private
   */
  async _createFolder(name, parent = null) {
    const folderData = {
      name: name,
      type: parent ? parent.type : 'Folder',
      parent: parent ? parent.id : null,
      sorting: 'm'
    };
    
    // Check if folder already exists
    const existingFolder = game.folders.find(f => 
      f.name === name && f.parent === (parent ? parent.id : null)
    );
    
    if (existingFolder) {
      return existingFolder;
    }
    
    return await Folder.create(folderData);
  }
  
  /**
   * Create journal entries from extracted data
   * @param {Array} entries - The extracted entries
   * @param {Object} folder - The parent folder
   * @returns {Promise<Array>} - The created journal entries
   * @private
   */
  async _createJournalEntries(entries, folder) {
    const journalEntries = [];
    
    for (const entry of entries) {
      const journalData = {
        name: entry.name,
        folder: folder.id,
        content: entry.description || entry.content || ''
      };
      
      const journalEntry = await JournalEntry.create(journalData);
      journalEntries.push(journalEntry);
    }
    
    return journalEntries;
  }
  
  /**
   * Create actor entries from extracted monster data
   * @param {Array} monsters - The extracted monster data
   * @param {Object} folder - The parent folder
   * @returns {Promise<Array>} - The created actor entries
   * @private
   */
  async _createActorEntries(monsters, folder) {
    const actors = [];
    
    for (const monster of monsters) {
      // Convert monster data to Foundry VTT actor data format
      const actorData = {
        name: monster.name,
        type: 'npc',
        folder: folder.id,
        data: monster.data || {}
      };
      
      // Create the actor
      const actor = await Actor.create(actorData);
      actors.push(actor);
      
      // Create token if image is available
      if (monster.img) {
        const tokenData = {
          name: monster.name,
          img: monster.img,
          actorId: actor.id
        };
        
        // In a real implementation, we'd create a token here
        console.log(`Creating token for ${monster.name}`);
      }
    }
    
    return actors;
  }
  
  /**
   * Create item entries from extracted data
   * @param {Array} items - The extracted item data
   * @param {Object} folder - The parent folder
   * @param {string} type - The item type (e.g., 'weapon', 'spell')
   * @returns {Promise<Array>} - The created item entries
   * @private
   */
  async _createItemEntries(items, folder, type) {
    const itemEntries = [];
    
    for (const item of items) {
      // Convert item data to Foundry VTT item data format
      const itemData = {
        name: item.name,
        type: item.type || type,
        folder: folder.id,
        data: item.data || {}
      };
      
      // Create the item
      const itemEntry = await Item.create(itemData);
      itemEntries.push(itemEntry);
    }
    
    return itemEntries;
  }
  
  /**
   * Create adventure entries from extracted data
   * @param {Object} adventure - The extracted adventure data
   * @param {Object} folder - The parent folder
   * @returns {Promise<Object>} - The created adventure entries
   * @private
   */
  async _createAdventureEntries(adventure, folder) {
    // Create journal entries for adventure sections
    const journalEntries = [];
    
    // Create main adventure journal
    const mainJournalData = {
      name: adventure.title || 'Adventure',
      folder: folder.id,
      content: adventure.description || ''
    };
    
    const mainJournal = await JournalEntry.create(mainJournalData);
    journalEntries.push(mainJournal);
    
    // Create scene entries if available
    if (adventure.scenes && adventure.scenes.length > 0) {
      const scenesFolder = await this._createFolder('Scenes', folder);
      
      for (const scene of adventure.scenes) {
        const sceneData = {
          name: scene.name,
          folder: scenesFolder.id,
          // Add other scene data as needed
        };
        
        // In a real implementation, we'd create a scene here
        console.log(`Creating scene: ${scene.name}`);
      }
    }
    
    // Create NPC entries if available
    if (adventure.npcs && adventure.npcs.length > 0) {
      const npcsFolder = await this._createFolder('NPCs', folder);
      await this._createActorEntries(adventure.npcs, npcsFolder);
    }
    
    return {
      journals: journalEntries,
      // Add other adventure components as needed
    };
  }
  
  /**
   * Create roll table entries from extracted data
   * @param {Array} tables - The extracted roll table data
   * @param {Object} folder - The parent folder
   * @returns {Promise<Array>} - The created roll table entries
   * @private
   */
  async _createRollTableEntries(tables, folder) {
    const rollTables = [];
    
    for (const table of tables) {
      // Convert table data to Foundry VTT roll table format
      const tableData = {
        name: table.name,
        folder: folder.id,
        // Add other roll table data as needed
      };
      
      // In a real implementation, we'd create a roll table here
      console.log(`Creating roll table: ${table.name}`);
      rollTables.push(tableData);
    }
    
    return rollTables;
  }
  
  /**
   * Create compendium packs from folders
   * @param {Object} folders - The folders containing entities
   * @param {string} pdfName - The name of the PDF for naming compendiums
   * @returns {Promise<void>}
   * @private
   */
  async _createCompendiumsFromFolders(folders, pdfName) {
    // Create compendium for actors
    if (folders.actors) {
      const actorPack = await this._createCompendiumPack('Actor', `${pdfName}-actors`);
      if (actorPack) {
        // Get all actors in the folder and its subfolders
        const actors = game.actors.filter(a => a.folder === folders.actors.id);
        
        // Import actors to compendium
        for (const actor of actors) {
          await this._importToCompendium(actorPack, actor);
        }
      }
    }
    
    // Create compendium for items
    if (folders.items || folders.spells || folders.feats) {
      const itemPack = await this._createCompendiumPack('Item', `${pdfName}-items`);
      if (itemPack) {
        // Get all items in the folders and their subfolders
        const items = game.items.filter(i => {
          return i.folder === (folders.items?.id || folders.spells?.id || folders.feats?.id);
        });
        
        // Import items to compendium
        for (const item of items) {
          await this._importToCompendium(itemPack, item);
        }
      }
    }
    
    // Create compendium for journal entries
    if (folders.races || folders.traits || folders.glossary || folders.adventures) {
      const journalPack = await this._createCompendiumPack('JournalEntry', `${pdfName}-journals`);
      if (journalPack) {
        // Get all journal entries in the folders and their subfolders
        const journals = game.journal.filter(j => {
          return j.folder === (folders.races?.id || folders.traits?.id || 
                              folders.glossary?.id || folders.adventures?.id);
        });
        
        // Import journal entries to compendium
        for (const journal of journals) {
          await this._importToCompendium(journalPack, journal);
        }
      }
    }
    
    // Create compendium for roll tables
    if (folders.rolltables) {
      const tablePack = await this._createCompendiumPack('RollTable', `${pdfName}-tables`);
      if (tablePack) {
        // Get all roll tables in the folder and its subfolders
        const tables = game.tables.filter(t => t.folder === folders.rolltables.id);
        
        // Import roll tables to compendium
        for (const table of tables) {
          await this._importToCompendium(tablePack, table);
        }
      }
    }
  }
  
  /**
   * Create a compendium pack
   * @param {string} type - The entity type (e.g., 'Actor', 'Item')
   * @param {string} name - The pack name
   * @returns {Promise<Object>} - The created pack
   * @private
   */
  async _createCompendiumPack(type, name) {
    // Check if the compendium already exists
    const existingPack = game.packs.find(p => p.collection === `world.${name}`);
    if (existingPack) {
      return existingPack;
    }
    
    // Create the compendium pack
    try {
      const pack = await CompendiumCollection.create({
        name: name,
        label: name,
        entity: type,
        package: 'world'
      });
      
      return pack;
    } catch (error) {
      console.error(`Error creating compendium pack: ${error}`);
      return null;
    }
  }
  
  /**
   * Import an entity into a compendium pack
   * @param {Object} pack - The compendium pack
   * @param {Object} entity - The entity to import
   * @returns {Promise<Object>} - The imported entity
   * @private
   */
  async _importToCompendium(pack, entity) {
    try {
      return await pack.importEntity(entity);
    } catch (error) {
      console.error(`Error importing entity to compendium: ${error}`);
      return null;
    }
  }
  
  /**
   * Create compendium packs and import entities
   * @private
   */
  async _createCompendiums() {
    console.log('Creating compendiums and importing entities...');
    
    // Get the PDF filename without extension to use as a base folder name
    const pdfName = this.file.name.replace(/\.pdf$/i, '');
    
    // Create the main folder for this PDF
    const mainFolder = await this._createFolder(pdfName);
    
    // Create subfolders for each content type
    const folders = {};
    
    // Process monsters/NPCs
    if (this.results.monsters && this.results.monsters.length > 0) {
      folders.actors = await this._createFolder('Actors', mainFolder);
      await this._createActorEntries(this.results.monsters, folders.actors);
    }
    
    // Process spells
    if (this.results.spells && this.results.spells.length > 0) {
      folders.spells = await this._createFolder('Spells', mainFolder);
      await this._createItemEntries(this.results.spells, folders.spells, 'spell');
    }
    
    // Process items
    if (this.results.items && this.results.items.length > 0) {
      folders.items = await this._createFolder('Items', mainFolder);
      await this._createItemEntries(this.results.items, folders.items, 'item');
    }
    
    // Process races/species
    if (this.results.races && this.results.races.length > 0) {
      folders.races = await this._createFolder('Races', mainFolder);
      await this._createJournalEntries(this.results.races, folders.races);
    }
    
    // Process traits
    if (this.results.traits && this.results.traits.length > 0) {
      folders.traits = await this._createFolder('Traits', mainFolder);
      await this._createJournalEntries(this.results.traits, folders.traits);
    }
    
    // Process feats
    if (this.results.feats && this.results.feats.length > 0) {
      folders.feats = await this._createFolder('Feats', mainFolder);
      await this._createItemEntries(this.results.feats, folders.feats, 'feat');
    }
    
    // Process adventures
    if (this.results.adventures) {
      folders.adventures = await this._createFolder('Adventures', mainFolder);
      await this._createAdventureEntries(this.results.adventures, folders.adventures);
    }
    
    // Process glossary
    if (this.results.glossary) {
      folders.glossary = await this._createFolder('Glossary', mainFolder);
      await this._createJournalEntries(this.results.glossary.entries, folders.glossary);
    }
    
    // Process roll tables
    if (this.results.rolltables && this.results.rolltables.length > 0) {
      folders.rolltables = await this._createFolder('Roll Tables', mainFolder);
      await this._createRollTableEntries(this.results.rolltables, folders.rolltables);
    }
    
    // Create compendium packs from the folders
    await this._createCompendiumsFromFolders(folders, pdfName);
  }
}
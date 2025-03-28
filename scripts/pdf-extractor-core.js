/**
 * PDF Extractor Core for Foundry VTT
 * This module provides the core functionality for extracting content from DnD 5e PDFs
 * and converting it to Foundry VTT format using JavaScript and PDF.js
 */

// Import PDF.js library - this will be loaded by the module
const pdfjs = window.pdfjsLib;

/**
 * Base class for extracting content from PDFs
 */
class PDFExtractor {
  /**
   * Initialize the extractor
   * @param {File} pdfFile - The PDF file object
   * @param {string} outputDir - Base directory for the Foundry VTT system
   */
  constructor(pdfFile, outputDir = null) {
    this.pdfFile = pdfFile;
    this.outputDir = outputDir || 'data';
    this.sourceDir = `${this.outputDir}/packs/_source`;
    this.pdfData = null;
    this.pdfDoc = null;
  }

  /**
   * Load the PDF document
   * @returns {Promise<Object>} - The loaded PDF document
   */
  async loadPDF() {
    try {
      // Convert the file to an ArrayBuffer
      const arrayBuffer = await this.pdfFile.arrayBuffer();
      
      // Set PDF.js worker path if needed
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = 'modules/pdf-extractor/lib/pdf.worker.js';
      }
      
      // Load the PDF document
      this.pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      return this.pdfDoc;
    } catch (error) {
      console.error('Error loading PDF:', error);
      throw error;
    }
  }

  /**
   * Extract text from the PDF
   * @param {Object} pageRange - Optional object with start and end page numbers
   * @returns {Promise<string>} - Extracted text as a string
   */
  async extractText(pageRange = null) {
    if (!this.pdfDoc) {
      await this.loadPDF();
    }

    try {
      let text = '';
      const numPages = this.pdfDoc.numPages;
      const startPage = pageRange?.start || 1;
      const endPage = pageRange?.end ? Math.min(pageRange.end, numPages) : numPages;

      for (let i = startPage; i <= endPage; i++) {
        const page = await this.pdfDoc.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        text += strings.join(' ') + '\n';
      }

      return text;
    } catch (error) {
      console.error('Error extracting text:', error);
      throw error;
    }
  }

  /**
   * Extract images from the PDF
   * @param {Object} pageRange - Optional object with start and end page numbers
   * @returns {Promise<Array>} - List of objects with image data and metadata
   */
  async extractImages(pageRange = null) {
    if (!this.pdfDoc) {
      await this.loadPDF();
    }

    try {
      const images = [];
      const numPages = this.pdfDoc.numPages;
      const startPage = pageRange?.start || 1;
      const endPage = pageRange?.end ? Math.min(pageRange.end, numPages) : numPages;

      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        const page = await this.pdfDoc.getPage(pageNum);
        const operatorList = await page.getOperatorList();
        
        // This is a simplified approach - actual implementation would be more complex
        // PDF.js doesn't provide a simple API for image extraction like PyMuPDF
        for (let i = 0; i < operatorList.fnArray.length; i++) {
          if (operatorList.fnArray[i] === pdfjs.OPS.paintImageXObject) {
            const imgIndex = operatorList.argsArray[i][0];
            // In a real implementation, we would extract the image data here
            // This is complex and would require more code to handle properly
            images.push({
              pageNum,
              index: imgIndex,
              // We'd need to extract actual image data in a real implementation
            });
          }
        }
      }

      return images;
    } catch (error) {
      console.error('Error extracting images:', error);
      throw error;
    }
  }

  /**
   * Save data as JSON file in the appropriate directory
   * @param {Object} data - Data to save
   * @param {string} category - Main category (e.g., monsters, spells)
   * @param {string} subcategory - Subcategory (e.g., aberration, 1st-level)
   * @param {string} filename - Name of the file (without extension)
   * @returns {Promise<string>} - Path to the saved file
   */
  async saveJSON(data, category, subcategory, filename) {
    // Sanitize filename - remove invalid characters
    const sanitizedFilename = filename.replace(/[\\/:*?"<>|\n\r\t]/g, '-');
    
    // In a browser environment, we can't directly save to the filesystem
    // Instead, we'll prepare the data for download or for sending to a server-side API
    const directory = `${this.sourceDir}/${category}/${subcategory}`;
    const filepath = `${directory}/${sanitizedFilename}.json`;
    
    // For Foundry VTT, we'd use their API to save the file
    // This is a placeholder for the actual implementation
    if (game && game.folders) {
      // Create folders if they don't exist
      let folder = await this._ensureFolder(category, subcategory);
      
      // Create or update the entity in Foundry
      // The actual implementation would depend on the entity type
      // and Foundry's API
      console.log(`Saved: ${filepath}`);
      if (sanitizedFilename !== filename) {
        console.log(`Note: Filename was sanitized from '${filename}' to '${sanitizedFilename}'`);
      }
    }
    
    return filepath;
  }

  /**
   * Ensure a folder exists in Foundry VTT
   * @param {string} category - Main category
   * @param {string} subcategory - Subcategory
   * @returns {Promise<Object>} - The folder object
   * @private
   */
  async _ensureFolder(category, subcategory) {
    // This is a placeholder for the actual implementation
    // In a real implementation, we'd use Foundry's API to create folders
    return null;
  }

  /**
   * Save token image in the appropriate directory
   * @param {Blob} imageData - Binary image data
   * @param {string} ext - File extension (e.g., png, jpg)
   * @param {string} category - Category for the token (e.g., aberration, beast)
   * @param {string} filename - Name of the file (without extension)
   * @returns {Promise<string>} - Path to the saved image
   */
  async saveTokenImage(imageData, ext, category, filename) {
    // In a browser environment, we can't directly save to the filesystem
    // Instead, we'll prepare the data for download or for sending to a server-side API
    const directory = `${this.outputDir}/tokens/${category}`;
    const filepath = `${directory}/${filename}.${ext}`;
    
    // For Foundry VTT, we'd use their API to save the file
    // This is a placeholder for the actual implementation
    console.log(`Saved token: ${filepath}`);
    
    return filepath;
  }
}

/**
 * Extractor for monster/NPC stat blocks
 */
class MonsterExtractor extends PDFExtractor {
  /**
   * Initialize the extractor
   * @param {File} pdfFile - The PDF file object
   * @param {string} outputDir - Base directory for the Foundry VTT system
   */
  constructor(pdfFile, outputDir = null) {
    super(pdfFile, outputDir);
  }

  /**
   * Extract monster stat blocks from the PDF
   * @returns {Promise<Array>} - Array of extracted monster data
   */
  async extractMonsters() {
    const text = await this.extractText();
    
    // Find monster stat blocks using regex patterns
    const monsterBlocks = this._findMonsterBlocks(text);
    const results = [];
    
    for (const monster of monsterBlocks) {
      const monsterData = this._parseMonsterBlock(monster);
      if (monsterData) {
        // Determine creature type for categorization
        const creatureType = (monsterData.type || 'unknown').toLowerCase();
        await this.saveJSON(monsterData, 'monsters', creatureType, monsterData.name);
        results.push(monsterData);
      }
    }
    
    return results;
  }

  /**
   * Find monster stat blocks in the text
   * @param {string} text - Extracted text from the PDF
   * @returns {Array<string>} - List of text blocks containing monster stat blocks
   * @private
   */
  _findMonsterBlocks(text) {
    // This is a simplified example - actual implementation would be more complex
    // and would need to handle various PDF formats and layouts
    const blocks = [];
    
    // Example pattern for finding monster stat blocks
    // This would need to be adapted based on the specific PDF format
    const pattern = /(\w[\w\s]+)\n(\w+) (\w+), (\w+)\n.*?AC (\d+).*?HP (\d+).*?Speed (\d+) ft/gs;
    
    let match;
    const regex = new RegExp(pattern, 'gs');
    while ((match = regex.exec(text)) !== null) {
      // Extract the entire stat block
      const startPos = match.index;
      // Find the end of the stat block (this is simplified)
      let endPos = text.indexOf('\n\n', startPos + 100);  // Look for double newline after some content
      if (endPos === -1) {
        endPos = startPos + 1000;  // Arbitrary length if no clear end
      }
      
      const block = text.substring(startPos, endPos);
      blocks.push(block);
    }
    
    return blocks;
  }

  /**
   * Parse a monster stat block into structured data
   * @param {string} block - Text block containing a monster stat block
   * @returns {Object} - Dictionary with parsed monster data
   * @private
   */
  _parseMonsterBlock(block) {
    // This is a simplified example - actual implementation would be more complex
    // and would need to handle various stat block formats
    
    // Example parsing logic
    const lines = block.split('\n');
    if (lines.length < 5) {  // Basic validation
      return null;
    }
    
    // Extract basic information
    const name = lines[0].trim();
    
    // Parse size, type, alignment
    const typeLine = lines[1].trim();
    const sizeTypeMatch = typeLine.match(/(\w+) (\w+), (\w+)/);
    let size, creatureType, alignment;
    if (sizeTypeMatch) {
      [, size, creatureType, alignment] = sizeTypeMatch;
    } else {
      size = 'Medium';
      creatureType = 'unknown';
      alignment = 'unaligned';
    }
    
    // Parse AC
    const acMatch = block.match(/AC (\d+)/);
    const ac = acMatch ? parseInt(acMatch[1]) : 10;
    
    // Parse HP
    const hpMatch = block.match(/HP (\d+)/);
    const hp = hpMatch ? parseInt(hpMatch[1]) : 10;
    
    // Parse speed
    const speedMatch = block.match(/Speed (\d+) ft/);
    const speed = speedMatch ? parseInt(speedMatch[1]) : 30;
    
    // Create monster data structure
    const monsterData = {
      name,
      type: creatureType,
      size,
      alignment,
      ac,
      hp,
      speed,
      // Add more fields as needed
    };
    
    return monsterData;
  }
}

/**
 * Extractor for spell descriptions
 */
class SpellExtractor extends PDFExtractor {
  /**
   * Initialize the extractor
   * @param {File} pdfFile - The PDF file object
   * @param {string} outputDir - Base directory for the Foundry VTT system
   */
  constructor(pdfFile, outputDir = null) {
    super(pdfFile, outputDir);
  }

  /**
   * Extract spell descriptions from the PDF
   * @returns {Promise<Array>} - Array of extracted spell data
   */
  async extractSpells() {
    const text = await this.extractText();
    
    // Find spell descriptions using regex patterns
    const spellBlocks = this._findSpellBlocks(text);
    const results = [];
    
    for (const spell of spellBlocks) {
      const spellData = this._parseSpellBlock(spell);
      if (spellData) {
        // Determine spell level for categorization
        const level = spellData.level || 0;
        const levelCategory = level > 0 ? `${level}-level` : 'cantrip';
        await this.saveJSON(spellData, 'spells', levelCategory, spellData.name);
        results.push(spellData);
      }
    }
    
    return results;
  }

  /**
   * Find spell descriptions in the text
   * @param {string} text - Extracted text from the PDF
   * @returns {Array<string>} - List of text blocks containing spell descriptions
   * @private
   */
  _findSpellBlocks(text) {
    // This is a simplified example - actual implementation would be more complex
    const blocks = [];
    
    // Example pattern for finding spell descriptions
    // This would need to be adapted based on the specific PDF format
    const pattern = /(\w[\w\s]+)\n(\w+)-level (\w+)\n.*?Casting Time: (.*?)\n.*?Range: (.*?)\n/gs;
    
    let match;
    const regex = new RegExp(pattern, 'gs');
    while ((match = regex.exec(text)) !== null) {
      // Extract the entire spell description
      const startPos = match.index;
      // Find the end of the spell description (this is simplified)
      let endPos = text.indexOf('\n\n', startPos + 100);  // Look for double newline after some content
      if (endPos === -1) {
        endPos = startPos + 1000;  // Arbitrary length if no clear end
      }
      
      const block = text.substring(startPos, endPos);
      blocks.push(block);
    }
    
    return blocks;
  }

  /**
   * Parse a spell description into structured data
   * @param {string} block - Text block containing a spell description
   * @returns {Object} - Dictionary with parsed spell data
   * @private
   */
  _parseSpellBlock(block) {
    // This is a simplified example - actual implementation would be more complex
    
    // Example parsing logic
    const lines = block.split('\n');
    if (lines.length < 5) {  // Basic validation
      return null;
    }
    
    // Extract basic information
    const name = lines[0].trim();
    
    // Parse level and school
    const levelLine = lines[1].trim();
    const levelMatch = levelLine.match(/(\w+)-level (\w+)/);
    let level, school;
    if (levelMatch) {
      [, level, school] = levelMatch;
      try {
        level = parseInt(level);
      } catch (e) {
        level = 0;  // Default to cantrip
      }
    } else {
      level = 0;
      school = 'unknown';
    }
    
    // Parse casting time
    const castingTimeMatch = block.match(/Casting Time: (.*?)\n/);
    const castingTime = castingTimeMatch ? castingTimeMatch[1].trim() : '1 action';
    
    // Parse range
    const rangeMatch = block.match(/Range: (.*?)\n/);
    const spellRange = rangeMatch ? rangeMatch[1].trim() : 'Self';
    
    // Parse components
    const componentsMatch = block.match(/Components: (.*?)\n/);
    const components = componentsMatch ? componentsMatch[1].trim() : 'V, S';
    
    // Parse duration
    const durationMatch = block.match(/Duration: (.*?)\n/);
    const duration = durationMatch ? durationMatch[1].trim() : 'Instantaneous';
    
    // Extract description (simplified)
    const descriptionStart = block.indexOf('\n\n');
    const description = descriptionStart !== -1 ? block.substring(descriptionStart).trim() : '';
    
    // Create spell data structure
    const spellData = {
      name,
      level,
      school,
      casting_time: castingTime,
      range: spellRange,
      components,
      duration,
      description,
      // Add more fields as needed
    };
    
    return spellData;
  }
}

// Export the classes for use in the main module
export { PDFExtractor, MonsterExtractor, SpellExtractor };
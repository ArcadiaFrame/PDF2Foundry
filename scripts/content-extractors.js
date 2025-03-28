/**
 * Content Extractors for PDF Extractor
 * This module provides specialized extractors for races, traits, feats, and roll tables
 */

import { PDFExtractor } from './pdf-extractor-core.js';
import { generateUUID } from './pdf-utils.js';

/**
 * Extractor for species/races
 */
class RaceExtractor extends PDFExtractor {
  /**
   * Initialize the extractor
   * @param {File} pdfFile - The PDF file object
   * @param {string} outputDir - Base directory for the Foundry VTT system
   */
  constructor(pdfFile, outputDir = null) {
    super(pdfFile, outputDir);
  }

  /**
   * Extract races from the PDF
   * @param {Object} pageRange - Optional page range to process
   * @returns {Promise<Array>} - Extracted race data
   */
  async extractRaces(pageRange = null) {
    const text = await this.extractText(pageRange);
    
    // Find race blocks using regex patterns
    const raceBlocks = this._findRaceBlocks(text);
    const results = [];
    
    for (const race of raceBlocks) {
      const raceData = this._parseRaceBlock(race);
      if (raceData) {
        // Save race data to appropriate location
        await this.saveJSON(raceData, 'races', 'species', raceData.name);
        results.push(raceData);
      }
    }
    
    return results;
  }

  /**
   * Find race blocks in the text
   * @param {string} text - Extracted text from the PDF
   * @returns {Array<string>} - List of text blocks containing race descriptions
   * @private
   */
  _findRaceBlocks(text) {
    // This is a simplified implementation - would need to be adapted for specific PDFs
    const blocks = [];
    
    // Example pattern for finding race blocks
    // This would need to be adapted based on the specific PDF format
    const pattern = /(\w[\w\s]+)\nRacial Traits/g;
    
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Extract the entire race block
      const startPos = match.index;
      // Find the end of the race block (this is simplified)
      let endPos = text.indexOf('\n\n\n', startPos + 100);  // Look for triple newline after some content
      if (endPos === -1) {
        endPos = startPos + 2000;  // Arbitrary length if no clear end
      }
      
      const block = text.substring(startPos, endPos);
      blocks.push(block);
    }
    
    return blocks;
  }

  /**
   * Parse a race block into structured data
   * @param {string} block - Text block containing a race description
   * @returns {Object} - Dictionary with parsed race data
   * @private
   */
  _parseRaceBlock(block) {
    // This is a simplified example - actual implementation would be more complex
    // and would need to handle various formats
    
    // Example parsing logic
    const lines = block.split('\n');
    if (lines.length < 3) {  // Basic validation
      return null;
    }
    
    // Extract basic information
    const name = lines[0].trim();
    
    // Create race data object for Foundry VTT
    const raceData = {
      name: name,
      type: 'race',
      img: 'icons/svg/mystery-man.svg',  // Default icon
      system: {
        description: {
          value: block,  // Store the full text as description for now
          chat: '',
          unidentified: ''
        },
        source: this.pdfFile.name,
        identifier: generateUUID()
      }
    };
    
    return raceData;
  }
}

/**
 * Extractor for character traits
 */
class TraitExtractor extends PDFExtractor {
  /**
   * Initialize the extractor
   * @param {File} pdfFile - The PDF file object
   * @param {string} outputDir - Base directory for the Foundry VTT system
   */
  constructor(pdfFile, outputDir = null) {
    super(pdfFile, outputDir);
  }

  /**
   * Extract traits from the PDF
   * @param {Object} pageRange - Optional page range to process
   * @returns {Promise<Array>} - Extracted trait data
   */
  async extractTraits(pageRange = null) {
    const text = await this.extractText(pageRange);
    
    // Find trait blocks using regex patterns
    const traitBlocks = this._findTraitBlocks(text);
    const results = [];
    
    for (const trait of traitBlocks) {
      const traitData = this._parseTraitBlock(trait);
      if (traitData) {
        // Save trait data to appropriate location
        await this.saveJSON(traitData, 'traits', 'character', traitData.name);
        results.push(traitData);
      }
    }
    
    return results;
  }

  /**
   * Find trait blocks in the text
   * @param {string} text - Extracted text from the PDF
   * @returns {Array<string>} - List of text blocks containing trait descriptions
   * @private
   */
  _findTraitBlocks(text) {
    // This is a simplified implementation - would need to be adapted for specific PDFs
    const blocks = [];
    
    // Example pattern for finding trait blocks
    // This would need to be adapted based on the specific PDF format
    const pattern = /Trait: ([\w\s]+)\n/g;
    
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Extract the entire trait block
      const startPos = match.index;
      // Find the end of the trait block (this is simplified)
      let endPos = text.indexOf('\n\n', startPos + 50);  // Look for double newline after some content
      if (endPos === -1) {
        endPos = startPos + 500;  // Arbitrary length if no clear end
      }
      
      const block = text.substring(startPos, endPos);
      blocks.push(block);
    }
    
    return blocks;
  }

  /**
   * Parse a trait block into structured data
   * @param {string} block - Text block containing a trait description
   * @returns {Object} - Dictionary with parsed trait data
   * @private
   */
  _parseTraitBlock(block) {
    // This is a simplified example - actual implementation would be more complex
    // and would need to handle various formats
    
    // Example parsing logic
    const lines = block.split('\n');
    if (lines.length < 2) {  // Basic validation
      return null;
    }
    
    // Extract trait name from first line
    const nameMatch = lines[0].match(/Trait: ([\w\s]+)/);
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown Trait';
    
    // Create trait data object for Foundry VTT
    const traitData = {
      name: name,
      type: 'feat',  // Using feat type for traits in Foundry
      img: 'icons/svg/trait.svg',  // Default icon
      system: {
        description: {
          value: block,  // Store the full text as description for now
          chat: '',
          unidentified: ''
        },
        requirements: '',
        source: this.pdfFile.name,
        identifier: generateUUID()
      }
    };
    
    return traitData;
  }
}

/**
 * Extractor for character feats
 */
class FeatExtractor extends PDFExtractor {
  /**
   * Initialize the extractor
   * @param {File} pdfFile - The PDF file object
   * @param {string} outputDir - Base directory for the Foundry VTT system
   */
  constructor(pdfFile, outputDir = null) {
    super(pdfFile, outputDir);
  }

  /**
   * Extract feats from the PDF
   * @param {Object} pageRange - Optional page range to process
   * @returns {Promise<Array>} - Extracted feat data
   */
  async extractFeats(pageRange = null) {
    const text = await this.extractText(pageRange);
    
    // Find feat blocks using regex patterns
    const featBlocks = this._findFeatBlocks(text);
    const results = [];
    
    for (const feat of featBlocks) {
      const featData = this._parseFeatBlock(feat);
      if (featData) {
        // Save feat data to appropriate location
        await this.saveJSON(featData, 'feats', 'character', featData.name);
        results.push(featData);
      }
    }
    
    return results;
  }

  /**
   * Find feat blocks in the text
   * @param {string} text - Extracted text from the PDF
   * @returns {Array<string>} - List of text blocks containing feat descriptions
   * @private
   */
  _findFeatBlocks(text) {
    // This is a simplified implementation - would need to be adapted for specific PDFs
    const blocks = [];
    
    // Example pattern for finding feat blocks
    // This would need to be adapted based on the specific PDF format
    const pattern = /Feat: ([\w\s]+)\nPrerequisite: ([\w\s,]+)/g;
    
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Extract the entire feat block
      const startPos = match.index;
      // Find the end of the feat block (this is simplified)
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
   * Parse a feat block into structured data
   * @param {string} block - Text block containing a feat description
   * @returns {Object} - Dictionary with parsed feat data
   * @private
   */
  _parseFeatBlock(block) {
    // This is a simplified example - actual implementation would be more complex
    // and would need to handle various formats
    
    // Example parsing logic
    const lines = block.split('\n');
    if (lines.length < 3) {  // Basic validation
      return null;
    }
    
    // Extract feat name from first line
    const nameMatch = lines[0].match(/Feat: ([\w\s]+)/);
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown Feat';
    
    // Extract prerequisites from second line
    const prereqMatch = lines[1].match(/Prerequisite: ([\w\s,]+)/);
    const prerequisites = prereqMatch ? prereqMatch[1].trim() : '';
    
    // Create feat data object for Foundry VTT
    const featData = {
      name: name,
      type: 'feat',
      img: 'icons/svg/upgrade.svg',  // Default icon
      system: {
        description: {
          value: block,  // Store the full text as description for now
          chat: '',
          unidentified: ''
        },
        requirements: prerequisites,
        source: this.pdfFile.name,
        identifier: generateUUID()
      }
    };
    
    return featData;
  }
}

/**
 * Extractor for roll tables
 */
class RollTableExtractor extends PDFExtractor {
  /**
   * Initialize the extractor
   * @param {File} pdfFile - The PDF file object
   * @param {string} outputDir - Base directory for the Foundry VTT system
   */
  constructor(pdfFile, outputDir = null) {
    super(pdfFile, outputDir);
  }

  /**
   * Extract roll tables from the PDF
   * @param {Object} pageRange - Optional page range to process
   * @returns {Promise<Array>} - Extracted roll table data
   */
  async extractRollTables(pageRange = null) {
    const text = await this.extractText(pageRange);
    
    // Find roll table blocks using regex patterns
    const tableBlocks = this._findRollTableBlocks(text);
    const results = [];
    
    for (const table of tableBlocks) {
      const tableData = this._parseRollTableBlock(table);
      if (tableData) {
        // Save roll table data to appropriate location
        await this.saveJSON(tableData, 'rolltables', 'tables', tableData.name);
        results.push(tableData);
      }
    }
    
    return results;
  }

  /**
   * Find roll table blocks in the text
   * @param {string} text - Extracted text from the PDF
   * @returns {Array<string>} - List of text blocks containing roll tables
   * @private
   */
  _findRollTableBlocks(text) {
    // This is a simplified implementation - would need to be adapted for specific PDFs
    const blocks = [];
    
    // Example pattern for finding roll table blocks
    // This would need to be adapted based on the specific PDF format
    const pattern = /(\w[\w\s]+) Table\n(d\d+|\d+d\d+)/g;
    
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Extract the entire roll table block
      const startPos = match.index;
      // Find the end of the roll table block (this is simplified)
      let endPos = text.indexOf('\n\n', startPos + 200);  // Look for double newline after some content
      if (endPos === -1) {
        endPos = startPos + 1500;  // Arbitrary length if no clear end
      }
      
      const block = text.substring(startPos, endPos);
      blocks.push(block);
    }
    
    return blocks;
  }

  /**
   * Parse a roll table block into structured data
   * @param {string} block - Text block containing a roll table
   * @returns {Object} - Dictionary with parsed roll table data
   * @private
   */
  _parseRollTableBlock(block) {
    // This is a simplified example - actual implementation would be more complex
    // and would need to handle various formats
    
    // Example parsing logic
    const lines = block.split('\n');
    if (lines.length < 4) {  // Basic validation - need at least a title, die type, and a couple of entries
      return null;
    }
    
    // Extract table name from first line
    const nameMatch = lines[0].match(/(\w[\w\s]+) Table/);
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown Table';
    
    // Extract die type from second line
    const dieMatch = lines[1].match(/(d\d+|\d+d\d+)/);
    const dieType = dieMatch ? dieMatch[1] : 'd20';
    
    // Parse table entries
    const results = [];
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Try to match roll range and result
      const entryMatch = line.match(/(\d+)(?:-(\d+))? (.+)/);
      if (entryMatch) {
        const rangeStart = parseInt(entryMatch[1]);
        const rangeEnd = entryMatch[2] ? parseInt(entryMatch[2]) : rangeStart;
        const resultText = entryMatch[3];
        
        // Add entry for each value in the range
        for (let r = rangeStart; r <= rangeEnd; r++) {
          results.push({
            type: 0,  // Text type
            weight: 1,
            range: [r, r],
            text: resultText,
            img: 'icons/svg/d20-black.svg',  // Default icon
            collection: null,
            resultId: null,
            drawn: false
          });
        }
      }
    }
    
    // Create roll table data object for Foundry VTT
    const tableData = {
      name: name,
      img: 'icons/svg/d20-grey.svg',  // Default icon
      description: block.split('\n').slice(2).join('\n'),  // Description is the full table text
      formula: dieType,
      replacement: true,
      displayRoll: true,
      results: results,
      flags: {
        'pdf-extractor': {
          source: this.pdfFile.name
        }
      }
    };
    
    return tableData;
  }
}

export { RaceExtractor, TraitExtractor, FeatExtractor, RollTableExtractor };
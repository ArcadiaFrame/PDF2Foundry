/**
 * Unified PDF Processor for PDF Extractor
 * This module provides a unified interface for processing PDFs from various RPG systems
 */

import { PDFExtractor } from './pdf-extractor-core.js';
import { OCRHandler } from './ocr-handler.js';
import { getSystemConfigById } from './system-configs.js';

/**
 * Class for unified PDF processing across different RPG systems
 */
export class UnifiedPDFProcessor {
  /**
   * Initialize the processor
   * @param {File|string} pdfSource - PDF file object or server path
   * @param {string} systemId - ID of the RPG system
   * @param {Array} contentTypes - Types of content to extract
   * @param {Object} options - Additional options
   */
  constructor(pdfSource, systemId, contentTypes, options = {}) {
    this.pdfSource = pdfSource;
    this.systemConfig = getSystemConfigById(systemId);
    this.contentTypes = contentTypes || [];
    this.options = options;
    this.pageRange = options.pageRange || null;
    this.useOCR = options.useOCR || false;
    
    // Initialize extractors
    this.pdfExtractor = new PDFExtractor(pdfSource, options.outputDir);
    this.ocrHandler = new OCRHandler();
    
    // Results storage
    this.results = {};
  }
  
  /**
   * Process the PDF and extract content
   * @returns {Promise<Object>} - Extracted content
   */
  async process() {
    try {
      // Load the PDF
      await this.pdfExtractor.loadPDF();
      
      // Extract text - with OCR if enabled and needed
      let text;
      if (this.useOCR && this.ocrHandler.isOCREnabled()) {
        // Get pages in the specified range
        const numPages = this.pdfExtractor.pdfDoc.numPages;
        const startPage = this.pageRange?.start || 1;
        const endPage = this.pageRange?.end ? Math.min(this.pageRange.end, numPages) : numPages;
        
        const pages = [];
        for (let i = startPage; i <= endPage; i++) {
          const page = await this.pdfExtractor.pdfDoc.getPage(i);
          pages.push(page);
        }
        
        // Process with OCR
        text = await this.ocrHandler.processPages(pages);
      } else {
        // Standard text extraction
        text = await this.pdfExtractor.extractText(this.pageRange);
      }
      
      // Process each requested content type
      for (const contentType of this.contentTypes) {
        // Get extraction patterns for this content type and system
        const patterns = this.systemConfig.getExtractionPatterns(contentType);
        
        // Extract content based on type
        const extractedContent = await this._extractContentByType(contentType, text, patterns);
        
        // Store results
        this.results[contentType] = extractedContent;
      }
      
      return this.results;
    } catch (error) {
      console.error('Unified PDF Processor | Error processing PDF:', error);
      throw error;
    } finally {
      // Clean up OCR resources if used
      if (this.useOCR) {
        await this.ocrHandler.terminate();
      }
    }
  }
  
  /**
   * Extract content based on content type
   * @param {string} contentType - Type of content to extract
   * @param {string} text - Extracted text from PDF
   * @param {Object} patterns - Extraction patterns for the content type
   * @returns {Promise<Array>} - Extracted content items
   * @private
   */
  async _extractContentByType(contentType, text, patterns) {
    // This is a simplified implementation - would need to be expanded
    // based on the specific content types and patterns
    
    switch (contentType) {
      case 'monsters':
      case 'characters':
        return this._extractCreatures(text, patterns);
        
      case 'spells':
      case 'powers':
        return this._extractSpells(text, patterns);
        
      case 'items':
      case 'equipment':
        return this._extractItems(text, patterns);
        
      case 'adventures':
      case 'lore':
      case 'cases':
        return this._extractAdventures(text, patterns);
        
      case 'glossary':
        return this._extractGlossary(text, patterns);
        
      case 'races':
      case 'species':
        return this._extractRaces(text, patterns);
        
      case 'backgrounds':
        return this._extractBackgrounds(text, patterns);
        
      case 'traits':
      case 'tags':
        return this._extractTraits(text, patterns);
        
      case 'feats':
      case 'talents':
      case 'moves':
        return this._extractFeats(text, patterns);
        
      case 'rolltables':
        return this._extractRollTables(text, patterns);
        
      case 'starships':
        return this._extractStarships(text, patterns);
        
      case 'locations':
        return this._extractLocations(text, patterns);
        
      case 'themes':
        return this._extractThemes(text, patterns);
        
      default:
        console.warn(`Unified PDF Processor | Unsupported content type: ${contentType}`);
        return [];
    }
  }
  
  /**
   * Extract creatures (monsters, characters, NPCs)
   * @param {string} text - Extracted text from PDF
   * @param {Object} patterns - Extraction patterns
   * @returns {Array} - Extracted creatures
   * @private
   */
  _extractCreatures(text, patterns) {
    const creatures = [];
    
    // Find creature blocks using patterns
    const namePattern = patterns.namePattern || /^([A-Z][\w\s]+)$/m;
    const statBlockStart = patterns.statBlockStart || /^(STR|DEX|CON|INT|WIS|CHA)/m;
    const statBlockEnd = patterns.statBlockEnd || /^Actions/m;
    
    // This is a simplified implementation - actual implementation would be more complex
    // and would need to handle various formats
    
    // Find all potential creature names
    let match;
    let lastIndex = 0;
    
    while ((match = namePattern.exec(text.slice(lastIndex))) !== null) {
      const namePos = match.index + lastIndex;
      const name = match[1].trim();
      
      // Find the start of the stat block after the name
      const afterName = text.slice(namePos + name.length);
      const statBlockMatch = statBlockStart.exec(afterName);
      
      if (statBlockMatch) {
        const statBlockPos = statBlockMatch.index + namePos + name.length;
        
        // Find the end of the stat block
        const afterStatBlock = text.slice(statBlockPos);
        const endMatch = statBlockEnd.exec(afterStatBlock);
        
        let endPos = endMatch ? endMatch.index + statBlockPos : statBlockPos + 1000; // Arbitrary length if no clear end
        
        // Extract the full creature block
        const creatureBlock = text.substring(namePos, endPos);
        
        // Parse the creature block (simplified)
        const creature = {
          name: name,
          type: 'creature',
          system: this.systemConfig.id,
          data: this._parseCreatureBlock(creatureBlock, patterns)
        };
        
        creatures.push(creature);
      }
      
      lastIndex = namePos + name.length;
    }
    
    return creatures;
  }
  
  /**
   * Parse a creature block into structured data
   * @param {string} block - Text block containing a creature description
   * @param {Object} patterns - Extraction patterns
   * @returns {Object} - Parsed creature data
   * @private
   */
  _parseCreatureBlock(block, patterns) {
    // This is a simplified example - actual implementation would be more complex
    // and would need to handle various formats based on the system
    
    const data = {
      // Basic creature data structure
      attributes: {},
      abilities: {},
      details: {}
    };
    
    // Extract attributes based on system-specific patterns
    if (patterns.acPattern) {
      const acMatch = patterns.acPattern.exec(block);
      if (acMatch) {
        data.attributes.ac = { value: parseInt(acMatch[1]) };
      }
    }
    
    if (patterns.hpPattern) {
      const hpMatch = patterns.hpPattern.exec(block);
      if (hpMatch) {
        data.attributes.hp = { value: parseInt(hpMatch[1]), max: parseInt(hpMatch[1]) };
      }
    }
    
    // Extract ability scores if pattern exists
    const abilityScorePattern = /STR\s+(\d+)\s+\(([-+]\d+)\)\s+DEX\s+(\d+)\s+\(([-+]\d+)\)\s+CON\s+(\d+)\s+\(([-+]\d+)\)\s+INT\s+(\d+)\s+\(([-+]\d+)\)\s+WIS\s+(\d+)\s+\(([-+]\d+)\)\s+CHA\s+(\d+)\s+\(([-+]\d+)\)/;
    const abilityMatch = abilityScorePattern.exec(block);
    
    if (abilityMatch) {
      data.abilities = {
        str: { value: parseInt(abilityMatch[1]) },
        dex: { value: parseInt(abilityMatch[3]) },
        con: { value: parseInt(abilityMatch[5]) },
        int: { value: parseInt(abilityMatch[7]) },
        wis: { value: parseInt(abilityMatch[9]) },
        cha: { value: parseInt(abilityMatch[11]) }
      };
    }
    
    return data;
  }
  
  /**
   * Extract spells or powers
   * @param {string} text - Extracted text from PDF
   * @param {Object} patterns - Extraction patterns
   * @returns {Array} - Extracted spells
   * @private
   */
  _extractSpells(text, patterns) {
    // Implementation would be similar to _extractCreatures but with spell-specific patterns
    return [];
  }
  
  /**
   * Extract items or equipment
   * @param {string} text - Extracted text from PDF
   * @param {Object} patterns - Extraction patterns
   * @returns {Array} - Extracted items
   * @private
   */
  _extractItems(text, patterns) {
    // Implementation would be similar to _extractCreatures but with item-specific patterns
    return [];
  }
  
  /**
   * Extract adventures, lore, or cases
   * @param {string} text - Extracted text from PDF
   * @param {Object} patterns - Extraction patterns
   * @returns {Array} - Extracted adventures
   * @private
   */
  _extractAdventures(text, patterns) {
    // Implementation would be similar to _extractCreatures but with adventure-specific patterns
    return [];
  }
  
  /**
   * Extract glossary entries
   * @param {string} text - Extracted text from PDF
   * @param {Object} patterns - Extraction patterns
   * @returns {Array} - Extracted glossary entries
   * @private
   */
  _extractGlossary(text, patterns) {
    // Implementation would be similar to _extractCreatures but with glossary-specific patterns
    return [];
  }
  
  /**
   * Extract races or species
   * @param {string} text - Extracted text from PDF
   * @param {Object} patterns - Extraction patterns
   * @returns {Array} - Extracted races
   * @private
   */
  _extractRaces(text, patterns) {
    // Implementation would be similar to _extractCreatures but with race-specific patterns
    return [];
  }
  
  /**
   * Extract backgrounds
   * @param {string} text - Extracted text from PDF
   * @param {Object} patterns - Extraction patterns
   * @returns {Array} - Extracted backgrounds
   * @private
   */
  _extractBackgrounds(text, patterns) {
    // Implementation would be similar to _extractCreatures but with background-specific patterns
    return [];
  }
  
  /**
   * Extract traits or tags
   * @param {string} text - Extracted text from PDF
   * @param {Object} patterns - Extraction patterns
   * @returns {Array} - Extracted traits
   * @private
   */
  _extractTraits(text, patterns) {
    // Implementation would be similar to _extractCreatures but with trait-specific patterns
    return [];
  }
  
  /**
   * Extract feats, talents, or moves
   * @param {string} text - Extracted text from PDF
   * @param {Object} patterns - Extraction patterns
   * @returns {Array} - Extracted feats
   * @private
   */
  _extractFeats(text, patterns) {
    // Implementation would be similar to _extractCreatures but with feat-specific patterns
    return [];
  }
  
  /**
   * Extract roll tables
   * @param {string} text - Extracted text from PDF
   * @param {Object} patterns - Extraction patterns
   * @returns {Array} - Extracted roll tables
   * @private
   */
  _extractRollTables(text, patterns) {
    // Implementation would be similar to _extractCreatures but with roll table-specific patterns
    return [];
  }
  
  /**
   * Extract starships
   * @param {string} text - Extracted text from PDF
   * @param {Object} patterns - Extraction patterns
   * @returns {Array} - Extracted starships
   * @private
   */
  _extractStarships(text, patterns) {
    // Implementation would be similar to _extractCreatures but with starship-specific patterns
    return [];
  }
  
  /**
   * Extract locations
   * @param {string} text - Extracted text from PDF
   * @param {Object} patterns - Extraction patterns
   * @returns {Array} - Extracted locations
   * @private
   */
  _extractLocations(text, patterns) {
    // Implementation would be similar to _extractCreatures but with location-specific patterns
    return [];
  }
  
  /**
   * Extract themes
   * @param {string} text - Extracted text from PDF
   * @param {Object} patterns - Extraction patterns
   * @returns {Array} - Extracted themes
   * @private
   */
  _extractThemes(text, patterns) {
    // Implementation would be similar to _extractCreatures but with theme-specific patterns
    return [];
  }
}
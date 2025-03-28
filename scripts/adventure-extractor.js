/**
 * Adventure and Glossary Extractor for PDF Extractor
 * 
 * This module extends the PDF Extractor with functionality to extract adventure/campaign
 * content and glossaries/indexes from RPG PDFs. It is designed to be system agnostic
 * while working well with 5e compatible books.
 */

import { PDFExtractor } from './pdf-extractor-core.js';

/**
 * Extractor for adventure/campaign content
 */
class AdventureExtractor extends PDFExtractor {
  /**
   * Initialize the extractor
   * @param {File} pdfFile - The PDF file object
   * @param {string} outputDir - Base directory for the Foundry VTT system
   */
  constructor(pdfFile, outputDir = null) {
    super(pdfFile, outputDir);
  }

  /**
   * Extract adventure content from the PDF
   * @returns {Promise<Object>} - The extracted adventure data
   */
  async extractAdventure() {
    const text = await this.extractText();
    
    // Extract adventure metadata
    const metadata = this._extractAdventureMetadata(text);
    
    // Extract chapters/sections
    const chapters = this._extractChapters(text);
    
    // Extract locations
    const locations = this._extractLocations(text);
    
    // Extract NPCs (that aren't full monster stat blocks)
    const npcs = this._extractNPCs(text);
    
    // Extract encounters
    const encounters = this._extractEncounters(text);
    
    // Extract maps
    const maps = await this._extractMaps();
    
    // Organize all content into a compendium structure
    const adventureData = {
      name: metadata.title || 'Unknown Adventure',
      type: 'adventure',
      _id: this._generateUUID(),
      system: {
        description: {
          value: metadata.description || '',
          chat: ''
        },
        source: {
          custom: '',
          book: metadata.source || 'Custom',
          page: '',
          license: ''
        },
        chapters,
        locations,
        npcs,
        encounters,
        maps
      }
    };
    
    // Save the adventure data
    await this.saveJSON(
      adventureData,
      'adventures',
      '',  // No subcategory for adventures
      adventureData.name.toLowerCase().replace(/\s+/g, '-')
    );
    
    // Save individual chapters as journal entries
    for (const chapter of chapters) {
      const chapterData = {
        name: chapter.title,
        type: 'journal',
        _id: this._generateUUID(),
        system: {
          content: chapter.content,
          source: metadata.title || 'Unknown Adventure'
        }
      };
      
      await this.saveJSON(
        chapterData,
        'journal',
        'adventure',
        `${adventureData.name.toLowerCase().replace(/\s+/g, '-')}-${chapter.title.toLowerCase().replace(/\s+/g, '-')}`
      );
    }
    
    return adventureData;
  }

  /**
   * Generate a UUID for Foundry VTT entities
   * @returns {string} - A UUID string
   * @private
   */
  _generateUUID() {
    // Simple UUID generation for demo purposes
    // In a real implementation, we'd use Foundry's UUID generation
    return 'xxxxxxxxxxxx'.replace(/[x]/g, () => {
      return (Math.random() * 16 | 0).toString(16);
    });
  }

  /**
   * Extract adventure metadata like title, author, level range
   * @param {string} text - Full text from the PDF
   * @returns {Object} - Dictionary with adventure metadata
   * @private
   */
  _extractAdventureMetadata(text) {
    // This is a simplified implementation
    const metadata = {
      title: 'Unknown Adventure',
      author: 'Unknown',
      levelRange: '1-20',
      description: '',
      source: 'Custom'
    };
    
    // Try to extract title from first page
    const titleMatch = text.match(/^([\w\s:]+)\n/);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }
    
    // Try to extract author
    const authorMatch = text.match(/(?:By|Author[s]?:?)\s+([\w\s,]+)\n/);
    if (authorMatch) {
      metadata.author = authorMatch[1].trim();
    }
    
    // Try to extract level range
    const levelMatch = text.match(/(?:An adventure for|Character levels|Levels)\s+([\w\s-]+)\s+characters/);
    if (levelMatch) {
      metadata.levelRange = levelMatch[1].trim();
    }
    
    // Try to extract description
    // Look for text after title but before table of contents
    const tocMatch = text.match(/(?:Table of Contents|Contents)\n/);
    if (tocMatch && titleMatch) {
      let descriptionText = text.substring(titleMatch.index + titleMatch[0].length, tocMatch.index);
      // Clean up the description
      descriptionText = descriptionText.replace(/By[\w\s,]+\n/, '');
      descriptionText = descriptionText.trim();
      metadata.description = `<p>${descriptionText.replace(/\n\n/g, '</p><p>')}</p>`;
    }
    
    return metadata;
  }

  /**
   * Extract chapters/sections from the adventure
   * @param {string} text - Full text from the PDF
   * @returns {Array<Object>} - List of dictionaries with chapter data
   * @private
   */
  _extractChapters(text) {
    // This is a simplified implementation
    const chapters = [];
    
    // Look for chapter headings
    const chapterPattern = /Chapter (\d+)[:\s]+(.*?)\n/g;
    const chapterMatches = Array.from(text.matchAll(chapterPattern));
    
    for (let i = 0; i < chapterMatches.length; i++) {
      const match = chapterMatches[i];
      const chapterNum = match[1];
      const chapterTitle = match[2].trim();
      
      // Find the end of this chapter
      const startPos = match.index + match[0].length;
      let endPos = text.length;
      if (i < chapterMatches.length - 1) {
        endPos = chapterMatches[i+1].index;
      }
      
      // Extract chapter content
      const chapterContent = text.substring(startPos, endPos).trim();
      
      // Format for HTML
      const chapterContentHtml = `<h1>${chapterTitle}</h1><p>${chapterContent.replace(/\n\n/g, '</p><p>')}</p>`;
      
      chapters.push({
        number: parseInt(chapterNum),
        title: chapterTitle,
        content: chapterContentHtml
      });
    }
    
    return chapters;
  }

  /**
   * Extract locations from the adventure
   * @param {string} text - Full text from the PDF
   * @returns {Array<Object>} - List of dictionaries with location data
   * @private
   */
  _extractLocations(text) {
    // This is a simplified implementation
    const locations = [];
    
    // Look for location headings (simplified pattern)
    const locationPattern = /([\w\s']+)\n(?:Location|Area) (\d+)[.:]\s*(.*?)\n/g;
    const locationMatches = Array.from(text.matchAll(locationPattern));
    
    for (let i = 0; i < locationMatches.length; i++) {
      const match = locationMatches[i];
      const locationName = match[1].trim();
      const locationNumber = match[2];
      const locationDesc = match[3].trim();
      
      // Find the end of this location description
      const startPos = match.index + match[0].length;
      let endPos = text.length;
      if (i < locationMatches.length - 1) {
        endPos = locationMatches[i+1].index;
      } else {
        // Look for the next section heading
        const nextHeadingMatch = text.substring(startPos).match(/\n\n[A-Z][\w\s]+\n/);
        if (nextHeadingMatch) {
          endPos = startPos + nextHeadingMatch.index;
        }
      }
      
      // Extract location content
      const locationContent = text.substring(startPos, endPos).trim();
      
      // Format for HTML
      const locationContentHtml = `<h2>${locationName}</h2><p>${locationDesc}</p><p>${locationContent.replace(/\n\n/g, '</p><p>')}</p>`;
      
      locations.push({
        name: locationName,
        number: parseInt(locationNumber),
        description: locationContentHtml
      });
    }
    
    return locations;
  }

  /**
   * Extract NPCs from the adventure (that aren't full monster stat blocks)
   * @param {string} text - Full text from the PDF
   * @returns {Array<Object>} - List of dictionaries with NPC data
   * @private
   */
  _extractNPCs(text) {
    // This is a simplified implementation
    const npcs = [];
    
    // Look for NPC descriptions (simplified pattern)
    const npcPattern = /([\w\s']+) \(NPC\)\n(.*?)\n/g;
    const npcMatches = Array.from(text.matchAll(npcPattern));
    
    for (let i = 0; i < npcMatches.length; i++) {
      const match = npcMatches[i];
      const npcName = match[1].trim();
      const npcShortDesc = match[2].trim();
      
      // Find the end of this NPC description
      const startPos = match.index + match[0].length;
      let endPos = text.length;
      if (i < npcMatches.length - 1) {
        endPos = npcMatches[i+1].index;
      } else {
        // Look for the next section heading
        const nextHeadingMatch = text.substring(startPos).match(/\n\n[A-Z][\w\s]+\n/);
        if (nextHeadingMatch) {
          endPos = startPos + nextHeadingMatch.index;
        }
      }
      
      // Extract NPC content
      const npcContent = text.substring(startPos, endPos).trim();
      
      npcs.push({
        name: npcName,
        description: `<p>${npcShortDesc}</p><p>${npcContent.replace(/\n\n/g, '</p><p>')}</p>`
      });
    }
    
    return npcs;
  }

  /**
   * Extract encounters from the adventure
   * @param {string} text - Full text from the PDF
   * @returns {Array<Object>} - List of dictionaries with encounter data
   * @private
   */
  _extractEncounters(text) {
    // This is a simplified implementation
    const encounters = [];
    
    // Look for encounter descriptions (simplified pattern)
    const encounterPattern = /Encounter:?\s+([\w\s']+)\n(.*?)\n/g;
    const encounterMatches = Array.from(text.matchAll(encounterPattern));
    
    for (let i = 0; i < encounterMatches.length; i++) {
      const match = encounterMatches[i];
      const encounterName = match[1].trim();
      const encounterShortDesc = match[2].trim();
      
      // Find the end of this encounter description
      const startPos = match.index + match[0].length;
      let endPos = text.length;
      if (i < encounterMatches.length - 1) {
        endPos = encounterMatches[i+1].index;
      } else {
        // Look for the next section heading
        const nextHeadingMatch = text.substring(startPos).match(/\n\n[A-Z][\w\s]+\n/);
        if (nextHeadingMatch) {
          endPos = startPos + nextHeadingMatch.index;
        }
      }
      
      // Extract encounter content
      const encounterContent = text.substring(startPos, endPos).trim();
      
      encounters.push({
        name: encounterName,
        description: `<p>${encounterShortDesc}</p><p>${encounterContent.replace(/\n\n/g, '</p><p>')}</p>`
      });
    }
    
    return encounters;
  }

  /**
   * Extract maps from the PDF
   * @returns {Promise<Array<Object>>} - List of dictionaries with map data
   * @private
   */
  async _extractMaps() {
    // This is a simplified implementation
    // In a real implementation, we'd extract maps from the PDF
    // and save them as images
    const maps = [];
    
    // Extract images from the PDF
    const images = await this.extractImages();
    
    // Filter for likely map images (this is very simplified)
    // In a real implementation, we'd use more sophisticated detection
    for (const image of images) {
      // For now, just assume all images might be maps
      maps.push({
        name: `Map ${maps.length + 1}`,
        description: '',
        image: `maps/map-${maps.length + 1}.png`  // This would be a real path in a full implementation
      });
    }
    
    return maps;
  }
}

/**
 * Extractor for glossaries and indexes
 */
class GlossaryExtractor extends PDFExtractor {
  /**
   * Initialize the extractor
   * @param {File} pdfFile - The PDF file object
   * @param {string} outputDir - Base directory for the Foundry VTT system
   */
  constructor(pdfFile, outputDir = null) {
    super(pdfFile, outputDir);
  }

  /**
   * Extract glossary/index from the PDF
   * @returns {Promise<Object>} - The extracted glossary data
   */
  async extractGlossary() {
    const text = await this.extractText();
    
    // Find the glossary/index section
    const glossaryEntries = this._extractGlossaryEntries(text);
    
    // Create glossary data structure
    const glossaryData = {
      name: 'Glossary',
      type: 'journal',
      _id: this._generateUUID(),
      system: {
        content: this._formatGlossaryContent(glossaryEntries)
      }
    };
    
    // Save the glossary data
    await this.saveJSON(
      glossaryData,
      'journal',
      'glossary',
      'glossary'
    );
    
    return glossaryData;
  }

  /**
   * Generate a UUID for Foundry VTT entities
   * @returns {string} - A UUID string
   * @private
   */
  _generateUUID() {
    // Simple UUID generation for demo purposes
    // In a real implementation, we'd use Foundry's UUID generation
    return 'xxxxxxxxxxxx'.replace(/[x]/g, () => {
      return (Math.random() * 16 | 0).toString(16);
    });
  }

  /**
   * Extract glossary entries from the text
   * @param {string} text - Full text from the PDF
   * @returns {Array<Object>} - List of dictionaries with glossary entries
   * @private
   */
  _extractGlossaryEntries(text) {
    // This is a simplified implementation
    const entries = [];
    
    // Try to find the glossary section
    const glossaryMatch = text.match(/(?:Glossary|Index|Appendix)[:\s]*\n/i);
    if (!glossaryMatch) {
      return entries;
    }
    
    // Extract the glossary section
    const glossaryText = text.substring(glossaryMatch.index + glossaryMatch[0].length);
    
    // Look for glossary entries (simplified pattern)
    // This pattern looks for terms followed by descriptions
    const entryPattern = /([\w\s',-]+)[.:]\s+(.*?)(?=\n[\w\s',-]+[.:]|$)/gs;
    const entryMatches = Array.from(glossaryText.matchAll(entryPattern));
    
    for (const match of entryMatches) {
      const term = match[1].trim();
      const definition = match[2].trim();
      
      entries.push({
        term,
        definition
      });
    }
    
    return entries;
  }

  /**
   * Format glossary entries as HTML content
   * @param {Array<Object>} entries - List of glossary entries
   * @returns {string} - HTML content
   * @private
   */
  _formatGlossaryContent(entries) {
    if (entries.length === 0) {
      return '<p>No glossary entries found.</p>';
    }
    
    let content = '<h1>Glossary</h1><dl>';
    
    for (const entry of entries) {
      content += `<dt>${entry.term}</dt><dd>${entry.definition}</dd>`;
    }
    
    content += '</dl>';
    return content;
  }
}

// Export the classes for use in the main module
export { AdventureExtractor, GlossaryExtractor };
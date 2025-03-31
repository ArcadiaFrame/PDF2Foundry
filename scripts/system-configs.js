/**
 * System Configurations for PDF Extractor
 * This module provides configuration templates for different RPG systems
 * to make the PDF extractor system-agnostic
 */

/**
 * Base class for system configurations
 */
class SystemConfig {
  constructor() {
    this.id = 'base';
    this.name = 'Base System';
    this.description = 'Base configuration for RPG systems';
    
    // Default content types that can be extracted
    this.contentTypes = [
      { id: 'monsters', label: 'Monsters/NPCs', enabled: true },
      { id: 'spells', label: 'Spells', enabled: true },
      { id: 'items', label: 'Items', enabled: true },
      { id: 'adventures', label: 'Adventures', enabled: true },
      { id: 'glossary', label: 'Glossary/Index', enabled: true },
      { id: 'backgrounds', label: 'Backgrounds', enabled: false },
      { id: 'races', label: 'Species/Races', enabled: false },
      { id: 'traits', label: 'Traits', enabled: false },
      { id: 'feats', label: 'Feats', enabled: false },
      { id: 'rolltables', label: 'Roll Tables', enabled: false }
    ];
    
    // Default extraction patterns (very basic, to be overridden)
    this.extractionPatterns = {
      monsters: {
        namePattern: /^([A-Z][\w\s]+)$/m,
        statBlockStart: /^(STR|DEX|CON|INT|WIS|CHA|Armor Class|Hit Points|Speed)/m,
        statBlockEnd: /(Actions|Legendary Actions|Lair Actions)/m
      },
      spells: {
        namePattern: /^([A-Z][\w\s]+)$/m,
        levelPattern: /^(\d)(?:st|nd|rd|th) level/,
        castingTimePattern: /Casting Time: ([\w\s]+)/,
        rangePattern: /Range: ([\w\s]+)/
      }
    };
    
    // Default entity mappings (how extracted content maps to Foundry entities)
    this.entityMappings = {
      monsters: 'Actor',
      spells: 'Item',
      items: 'Item',
      adventures: 'JournalEntry',
      glossary: 'JournalEntry'
    };
  }
  
  /**
   * Get content types available for this system
   * @returns {Array} - List of content type objects
   */
  getContentTypes() {
    return this.contentTypes;
  }
  
  /**
   * Get extraction patterns for a specific content type
   * @param {string} contentType - The type of content to get patterns for
   * @returns {Object} - Extraction patterns for the content type
   */
  getExtractionPatterns(contentType) {
    return this.extractionPatterns[contentType] || {};
  }
  
  /**
   * Get entity mapping for a content type
   * @param {string} contentType - The type of content
   * @returns {string} - Foundry entity type
   */
  getEntityMapping(contentType) {
    return this.entityMappings[contentType] || 'JournalEntry';
  }
}

/**
 * D&D 5e System Configuration
 */
class DnD5eConfig extends SystemConfig {
  constructor() {
    super();
    this.id = 'dnd5e';
    this.name = 'Dungeons & Dragons 5e';
    this.description = 'Configuration for D&D 5th Edition';
    
    // Enable all content types for D&D 5e
    this.contentTypes.forEach(type => type.enabled = true);
    
    // D&D 5e specific extraction patterns
    this.extractionPatterns = {
      monsters: {
        namePattern: /^([A-Z][\w\s]+)$/m,
        sizeTypePattern: /^(Tiny|Small|Medium|Large|Huge|Gargantuan) (\w+)/i,
        acPattern: /Armor Class (\d+)/i,
        hpPattern: /Hit Points (\d+) \((\d+)d(\d+)(?:\s?\+\s?(\d+))?\)/i,
        statBlockStart: /^STR\s+DEX\s+CON\s+INT\s+WIS\s+CHA$/m,
        statBlockEnd: /^Actions/m
      },
      spells: {
        namePattern: /^([A-Z][\w\s]+)$/m,
        levelPattern: /^(\d)(?:st|nd|rd|th)-level (\w+)/i,
        schoolPattern: /^(?:\d(?:st|nd|rd|th)-level )?(\w+)/i,
        castingTimePattern: /Casting Time: ([\w\s]+)/i,
        rangePattern: /Range: ([\w\s]+)/i,
        componentsPattern: /Components: ([\w\s,]+)/i,
        durationPattern: /Duration: ([\w\s]+)/i
      },
      feats: {
        namePattern: /^([A-Z][\w\s]+)$/m,
        prerequisitePattern: /Prerequisite: ([\w\s,]+)/i
      }
    };
  }
}

/**
 * Pathfinder 2e System Configuration
 */
class Pathfinder2eConfig extends SystemConfig {
  constructor() {
    super();
    this.id = 'pf2e';
    this.name = 'Pathfinder 2nd Edition';
    this.description = 'Configuration for Pathfinder 2e';
    
    // Enable all content types for Pathfinder 2e
    this.contentTypes.forEach(type => type.enabled = true);
    
    // Pathfinder 2e specific extraction patterns
    this.extractionPatterns = {
      monsters: {
        namePattern: /^([A-Z][\w\s]+)\s+Creature (\d+)/m,
        traitsPattern: /^((?:[A-Z][\w]+ )+)$/m,
        perceptionPattern: /Perception \+([\d]+)/i,
        statBlockStart: /^STR\s+DEX\s+CON\s+INT\s+WIS\s+CHA$/m,
        statBlockEnd: /^Actions/m
      },
      spells: {
        namePattern: /^([A-Z][\w\s]+)\s+Spell (\d+)/m,
        traitsPattern: /^((?:[A-Z][\w]+ )+)$/m,
        castingTimePattern: /Cast (?:\([^)]+\) )?([\w\s]+)/i,
        rangePattern: /Range ([\w\s]+)/i,
        targetsPattern: /Targets ([\w\s]+)/i,
        durationPattern: /Duration ([\w\s]+)/i
      }
    };
  }
}

/**
 * World of Darkness System Configuration
 */
class WorldOfDarknessConfig extends SystemConfig {
  constructor() {
    super();
    this.id = 'wod';
    this.name = 'World of Darkness';
    this.description = 'Configuration for World of Darkness games';
    
    // Adjust content types for WoD
    this.contentTypes = [
      { id: 'characters', label: 'Characters/NPCs', enabled: true },
      { id: 'powers', label: 'Powers/Disciplines', enabled: true },
      { id: 'items', label: 'Items', enabled: true },
      { id: 'lore', label: 'Lore', enabled: true },
      { id: 'locations', label: 'Locations', enabled: true },
      { id: 'rolltables', label: 'Roll Tables', enabled: true }
    ];
    
    // WoD specific extraction patterns
    this.extractionPatterns = {
      characters: {
        namePattern: /^([A-Z][\w\s]+)$/m,
        attributesPattern: /Attributes: ([\w\s,]+)/i,
        skillsPattern: /Skills: ([\w\s,]+)/i,
        powersPattern: /(?:Disciplines|Powers): ([\w\s,]+)/i
      },
      powers: {
        namePattern: /^([A-Z][\w\s]+)\s+\(([\w\s]+)\)$/m,
        costPattern: /Cost: ([\w\s]+)/i,
        dicePoolPattern: /Dice Pool: ([\w\s+]+)/i,
        descriptionStart: /Description:/i
      }
    };
    
    // Entity mappings for WoD
    this.entityMappings = {
      characters: 'Actor',
      powers: 'Item',
      items: 'Item',
      lore: 'JournalEntry',
      locations: 'Scene'
    };
  }
}

/**
 * Star Trek Adventures System Configuration
 */
class StarTrekConfig extends SystemConfig {
  constructor() {
    super();
    this.id = 'startrek';
    this.name = 'Star Trek Adventures';
    this.description = 'Configuration for Star Trek Adventures';
    
    // Adjust content types for Star Trek
    this.contentTypes = [
      { id: 'characters', label: 'Characters/NPCs', enabled: true },
      { id: 'starships', label: 'Starships', enabled: true },
      { id: 'equipment', label: 'Equipment', enabled: true },
      { id: 'talents', label: 'Talents', enabled: true },
      { id: 'species', label: 'Species', enabled: true },
      { id: 'locations', label: 'Locations', enabled: true },
      { id: 'rolltables', label: 'Roll Tables', enabled: true }
    ];
    
    // Star Trek specific extraction patterns
    this.extractionPatterns = {
      characters: {
        namePattern: /^([A-Z][\w\s]+)$/m,
        attributesPattern: /ATTRIBUTES\s+([\w\s\d]+)DISCIPLINES/i,
        disciplinesPattern: /DISCIPLINES\s+([\w\s\d]+)VALUES/i,
        valuesPattern: /VALUES\s+([\w\s\d]+)/i
      },
      starships: {
        namePattern: /^([A-Z][\w\s-]+)$/m,
        servicePattern: /Service Entry Date: ([\w\s\d]+)/i,
        systemsPattern: /SYSTEMS\s+([\w\s\d]+)DEPARTMENTS/i,
        departmentsPattern: /DEPARTMENTS\s+([\w\s\d]+)/i
      }
    };
    
    // Entity mappings for Star Trek
    this.entityMappings = {
      characters: 'Actor',
      starships: 'Actor',
      equipment: 'Item',
      talents: 'Item',
      species: 'JournalEntry',
      locations: 'Scene'
    };
  }
}

/**
 * City of Mist System Configuration
 */
class CityOfMistConfig extends SystemConfig {
  constructor() {
    super();
    this.id = 'cityofmist';
    this.name = 'City of Mist';
    this.description = 'Configuration for City of Mist';
    
    // Adjust content types for City of Mist
    this.contentTypes = [
      { id: 'characters', label: 'Characters', enabled: true },
      { id: 'moves', label: 'Moves', enabled: true },
      { id: 'themes', label: 'Themes', enabled: true },
      { id: 'tags', label: 'Tags', enabled: true },
      { id: 'locations', label: 'Locations', enabled: true },
      { id: 'cases', label: 'Cases', enabled: true },
      { id: 'rolltables', label: 'Roll Tables', enabled: true }
    ];
    
    // City of Mist specific extraction patterns
    this.extractionPatterns = {
      characters: {
        namePattern: /^([A-Z][\w\s]+)$/m,
        themesPattern: /Themes:\s+([\w\s,]+)/i,
        statusPattern: /Status:\s+([\w\s,]+)/i
      },
      moves: {
        namePattern: /^([A-Z][\w\s]+)$/m,
        triggerPattern: /Trigger:\s+([\w\s,\.]+)/i,
        effectPattern: /Effect:\s+([\w\s,\.]+)/i
      }
    };
    
    // Entity mappings for City of Mist
    this.entityMappings = {
      characters: 'Actor',
      moves: 'Item',
      themes: 'Item',
      tags: 'Item',
      locations: 'Scene',
      cases: 'JournalEntry'
    };
  }
}

/**
 * Get all available system configurations
 * @returns {Array} - List of system configuration objects
 */
export function getAvailableSystemConfigs() {
  return [
    new DnD5eConfig(),
    new Pathfinder2eConfig(),
    new WorldOfDarknessConfig(),
    new StarTrekConfig(),
    new CityOfMistConfig()
  ];
}

/**
 * Get a system configuration by ID
 * @param {string} id - System ID
 * @returns {SystemConfig} - System configuration object
 */
export function getSystemConfigById(id) {
  const configs = getAvailableSystemConfigs();
  return configs.find(config => config.id === id) || new SystemConfig();
}

/**
 * Get the default system configuration
 * @returns {SystemConfig} - Default system configuration
 */
export function getDefaultSystemConfig() {
  // Check if a default is set in settings
  if (game && game.settings) {
    const defaultSystemId = game.settings.get('pdf-extractor-plus', 'defaultSystem') || 'dnd5e';
    return getSystemConfigById(defaultSystemId);
  }
  // Fallback to default system if settings not available
  return getSystemConfigById('dnd5e');
}
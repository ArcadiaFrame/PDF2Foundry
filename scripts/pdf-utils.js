/**
 * PDF Utilities for Foundry VTT PDF Extractor
 * 
 * This module provides utility functions for working with PDFs in the browser environment
 * using PDF.js library.
 */

/**
 * Load the PDF.js library dynamically
 * @returns {Promise<void>} - Resolves when the library is loaded
 */
export async function loadPDFLibrary() {
  // Check if PDF.js is already loaded
  if (window.pdfjsLib) {
    return;
  }
  
  // Set the worker source path
  const moduleRoot = 'modules/pdf-extractor';
  
  // Load the PDF.js library
  await Promise.all([
    loadScript(`${moduleRoot}/lib/pdf.min.js`),
    loadScript(`${moduleRoot}/lib/pdf.worker.min.js`)
  ]);
  
  // Configure PDF.js
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${moduleRoot}/lib/pdf.worker.min.js`;
}

/**
 * Load a script dynamically
 * @param {string} src - The script source URL
 * @returns {Promise<void>} - Resolves when the script is loaded
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Convert a File object to an ArrayBuffer
 * @param {File} file - The file to convert
 * @returns {Promise<ArrayBuffer>} - The file as an ArrayBuffer
 */
export function fileToArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse a page range string into start and end page numbers
 * @param {string} rangeStr - The page range string (e.g., "10-25")
 * @returns {Object|null} - Object with start and end properties, or null if invalid
 */
export function parsePageRange(rangeStr) {
  if (!rangeStr || rangeStr.trim() === '') {
    return null;
  }
  
  const match = rangeStr.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if (!match) {
    return null;
  }
  
  const start = parseInt(match[1]);
  const end = match[2] ? parseInt(match[2]) : start;
  
  if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
    return null;
  }
  
  return { start, end };
}

/**
 * Create a Foundry VTT compatible UUID
 * @returns {string} - A UUID string
 */
export function generateUUID() {
  // In a real implementation, we'd use Foundry's UUID generation
  // This is a simplified version for demonstration
  return 'xxxxxxxxxxxx'.replace(/[x]/g, () => {
    return (Math.random() * 16 | 0).toString(16);
  });
}

/**
 * Create a compendium pack in Foundry VTT
 * @param {string} type - The entity type (e.g., 'Actor', 'Item')
 * @param {string} name - The pack name
 * @returns {Promise<Object>} - The created pack
 */
export async function createCompendiumPack(type, name) {
  // This is a placeholder for the actual implementation
  // In a real implementation, we'd use Foundry's API to create compendium packs
  console.log(`Creating compendium pack: ${type}.${name}`);
  return null;
}

/**
 * Import an entity into a compendium pack
 * @param {Object} pack - The compendium pack
 * @param {Object} data - The entity data
 * @returns {Promise<Object>} - The imported entity
 */
export async function importToCompendium(pack, data) {
  // This is a placeholder for the actual implementation
  // In a real implementation, we'd use Foundry's API to import entities
  console.log(`Importing ${data.name} into ${pack.collection}`);
  return null;
}
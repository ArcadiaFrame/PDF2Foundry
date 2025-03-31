/**
 * System Selector for PDF Extractor
 * This module handles the dynamic loading of system configurations
 * and updating the UI based on the selected system
 */

import { getAvailableSystemConfigs, getSystemConfigById, getDefaultSystemConfig } from './system-configs.js';

/**
 * Initialize the system selector in the PDF Extractor UI
 * @param {HTMLElement} html - The HTML element containing the form
 */
export function initializeSystemSelector(html) {
  const systemSelect = html.find('#system-select');
  const contentTypeContainer = html.find('.checkbox-group');
  
  // Populate system options
  populateSystemOptions(systemSelect);
  
  // Set initial content types based on default system
  updateContentTypes(contentTypeContainer, getDefaultSystemConfig());
  
  // Update content types when system changes
  systemSelect.on('change', (event) => {
    const selectedSystemId = event.target.value;
    const systemConfig = getSystemConfigById(selectedSystemId);
    updateContentTypes(contentTypeContainer, systemConfig);
  });
}

/**
 * Populate the system selector dropdown with available systems
 * @param {jQuery} systemSelect - The system select element
 */
function populateSystemOptions(systemSelect) {
  // Clear existing options
  systemSelect.empty();
  
  // Get available systems
  const systems = getAvailableSystemConfigs();
  
  // Get default system
  const defaultSystemId = game.settings.get('pdf-extractor-plus', 'defaultSystem') || 'dnd5e';
  
  // Add options for each system
  systems.forEach(system => {
    const option = $(`<option value="${system.id}">${system.name}</option>`);
    if (system.id === defaultSystemId) {
      option.attr('selected', 'selected');
    }
    systemSelect.append(option);
  });
}

/**
 * Update content type checkboxes based on selected system
 * @param {jQuery} container - The container for content type checkboxes
 * @param {SystemConfig} systemConfig - The selected system configuration
 */
function updateContentTypes(container, systemConfig) {
  // Clear existing checkboxes
  container.empty();
  
  // Get content types for the selected system
  const contentTypes = systemConfig.getContentTypes();
  
  // Add checkboxes for each content type
  contentTypes.forEach(type => {
    if (type.enabled) {
      const checkbox = $(`
        <div class="checkbox-item">
          <input type="checkbox" id="${type.id}" name="content_types[]" value="${type.id}" ${type.enabled ? 'checked' : ''}>
          <label for="${type.id}">${type.label}</label>
        </div>
      `);
      container.append(checkbox);
    }
  });
}

/**
 * Get the selected system configuration from the form
 * @param {HTMLElement} form - The form element
 * @returns {SystemConfig} - The selected system configuration
 */
export function getSelectedSystemConfig(form) {
  const systemId = form.find('#system-select').val();
  return getSystemConfigById(systemId);
}

/**
 * Get the selected content types from the form
 * @param {HTMLElement} form - The form element
 * @returns {Array} - List of selected content type IDs
 */
export function getSelectedContentTypes(form) {
  const selectedTypes = [];
  form.find('input[name="content_types[]"]:checked').each(function() {
    selectedTypes.push($(this).val());
  });
  return selectedTypes;
}
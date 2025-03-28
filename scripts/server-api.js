/**
 * Server API for PDF Extractor
 * This module provides server-side API routes for browsing and fetching PDF files
 */

// Register API routes
Hooks.once('ready', () => {
  if (game.user.isGM) {
    // Register the API routes
    registerAPIRoutes();
  }
});

/**
 * Register API routes for the PDF Extractor
 */
function registerAPIRoutes() {
  // Route for browsing server directories
  game.modules.get('pdf-extractor').api = {
    browse: handleBrowseRequest,
    fetch: handleFetchRequest
  };
  
  // Register the API endpoints
  const socket = game.socket;
  socket.on('module.pdf-extractor', handleSocketRequest);
}

/**
 * Handle socket requests
 * @param {Object} data - The request data
 * @param {string} userId - The user ID
 */
async function handleSocketRequest(data, userId) {
  // Verify that the user is a GM
  const user = game.users.get(userId);
  if (!user || !user.isGM) {
    return { success: false, error: 'Unauthorized' };
  }
  
  // Handle the request based on the action
  switch (data.action) {
    case 'browse':
      return await handleBrowseRequest(data);
    case 'fetch':
      return await handleFetchRequest(data);
    default:
      return { success: false, error: 'Invalid action' };
  }
}

/**
 * Handle browse request
 * @param {Object} data - The request data
 * @returns {Object} - The response data
 */
async function handleBrowseRequest(data) {
  try {
    const path = data.path || '/data';
    
    // Validate the path to prevent directory traversal
    if (!isValidPath(path)) {
      return { success: false, error: 'Invalid path' };
    }
    
    // Get the directory contents
    const files = await FilePicker.browse('data', path);
    
    return {
      success: true,
      path: path,
      files: files.files,
      dirs: files.dirs
    };
  } catch (error) {
    console.error('Error browsing directory:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle fetch request
 * @param {Object} data - The request data
 * @returns {Object} - The response data
 */
async function handleFetchRequest(data) {
  try {
    const path = data.path;
    
    // Validate the path to prevent directory traversal
    if (!isValidPath(path)) {
      return { success: false, error: 'Invalid path' };
    }
    
    // Get the file contents
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    return {
      success: true,
      file: blob
    };
  } catch (error) {
    console.error('Error fetching file:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Validate a path to prevent directory traversal
 * @param {string} path - The path to validate
 * @returns {boolean} - Whether the path is valid
 */
function isValidPath(path) {
  // Prevent directory traversal
  if (path.includes('..')) {
    return false;
  }
  
  // Ensure the path is within the data directory
  if (!path.startsWith('/data')) {
    return false;
  }
  
  return true;
}
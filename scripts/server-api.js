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
  
  // Register Express API routes for direct HTTP access
  // In Foundry v12, we need to use game.modules.get('pdf-extractor').api.router
  // or fall back to game.server?.router if available
  const router = game.modules.get('pdf-extractor').api.router || game.server?.router;
  
  if (router) {
    console.log('PDF Extractor | Registering API routes');
    
    router.get('/modules/pdf-extractor/api/browse', (req, res) => {
      const path = req.query.path;
      handleBrowseRequest({ path }).then(result => {
        res.json(result);
      }).catch(err => {
        console.error('PDF Extractor | Browse API error:', err);
        res.status(500).json({ success: false, error: err.message });
      });
    });
    
    router.get('/modules/pdf-extractor/api/fetch', (req, res) => {
      const path = req.query.path;
      handleFetchRequest({ path }).then(result => {
        if (result.success) {
          res.type('application/pdf');
          res.send(result.file);
        } else {
          res.status(500).json(result);
        }
      }).catch(err => {
        console.error('PDF Extractor | Fetch API error:', err);
        res.status(500).json({ success: false, error: err.message });
      });
    });
  } else {
    console.error('PDF Extractor | Failed to register API routes: router not available');
  }
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
    // Normalize the path - remove leading slash if present for FilePicker compatibility
    let path = data.path || 'data';
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    
    // Validate the path to prevent directory traversal
    if (!isValidPath(path)) {
      return { success: false, error: 'Invalid path. Please select a PDF file from the data directory.' };
    }
    
    // Check if path points to a file (only validate extension for files)
    if (path.includes('.') && !path.toLowerCase().endsWith('.pdf')) {
      return { success: false, error: 'Selected file is not a PDF. Please choose a PDF file.' };
    }
    
    console.log(`PDF Extractor | Browsing directory: ${path}`);
    
    // Get the directory contents using FilePicker
    // In Foundry v12, we need to specify the source as 'data'
    const files = await FilePicker.browse('data', path);
    
    console.log(`PDF Extractor | Found ${files.files.length} files and ${files.dirs.length} directories`);
    
    // Return the files in the format expected by the client
    return {
      success: true,
      path: path,
      files: files.files,
      dirs: files.dirs
    };
  } catch (error) {
    console.error('PDF Extractor | Error browsing directory:', error);
    return { success: false, error: error.message || 'Unknown error browsing directory' };
  }
}

/**
 * Handle fetch request
 * @param {Object} data - The request data
 * @returns {Object} - The response data
 */
async function handleFetchRequest(data) {
  try {
    // Normalize the path for FilePicker compatibility
    let path = data.path;
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    
    // Validate the path to prevent directory traversal
    if (!isValidPath(path)) {
      return { success: false, error: 'Invalid path. Please select a PDF file from the data directory.' };
    }
    
    // Check if path points to a file (only validate extension for files)
    if (path.includes('.') && !path.toLowerCase().endsWith('.pdf')) {
      return { success: false, error: 'Selected file is not a PDF. Please choose a PDF file.' };
    }
    
    console.log(`PDF Extractor | Fetching file: ${path}`);
    
    // Use FilePicker to get the proper URL for the file
    const fileUrl = await FilePicker.getAbsoluteURL(path);
    
    // Get the file contents
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log(`PDF Extractor | Successfully fetched file: ${path} (${blob.size} bytes)`);
    
    return {
      success: true,
      file: blob
    };
  } catch (error) {
    console.error('PDF Extractor | Error fetching file:', error);
    return { success: false, error: error.message || 'Unknown error fetching file' };
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
    console.warn(`PDF Extractor | Invalid path detected (directory traversal): ${path}`);
    return false;
  }
  
  // Ensure the path is within the data directory
  const normalizedPath = path.replace(/^\//, '');
  if (!normalizedPath.startsWith('data/') && normalizedPath !== 'data') {
    console.warn(`PDF Extractor | Invalid path detected (not in data directory): ${path}`);
    return false;
  }
  
  // Additional check for empty path
  if (!path || path.trim() === '') {
    console.warn('PDF Extractor | Empty path provided');
    return false;
  }
  
  return true;
}
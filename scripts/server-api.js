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
  game.modules.get('pdf-extractor-plus').api = {
    browse: handleBrowseRequest,
    fetch: handleFetchRequest
  };
  
  // Register the API endpoints
  const socket = game.socket;
  socket.on('module.pdf-extractor-plus', handleSocketRequest);
  
  // Register Express API routes for direct HTTP access
  // In Foundry v12, we need to use game.modules.get('pdf-extractor-plus').api.router
  // or fall back to game.server?.router if available
  const router = game.modules.get('pdf-extractor-plus').api.router || game.server?.router;
  
  if (router) {
    console.log('PDF Extractor | Registering API routes');
    
    router.get('/modules/pdf-extractor-plus/api/browse', (req, res) => {
      const path = req.query.path;
      handleBrowseRequest({ path }).then(result => {
        res.json(result);
      }).catch(err => {
        console.error('PDF Extractor | Browse API error:', err);
        res.status(500).json({ success: false, error: err.message });
      });
    });
    
    router.get('/modules/pdf-extractor-plus/api/fetch', (req, res) => {
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
 * Handle socket request
 * @param {Object} data - The request data
 */
async function handleSocketRequest(data) {
  try {
    const { action, data: requestData } = data;
    
    switch (action) {
      case 'browse':
        return await handleBrowseRequest(requestData);
      case 'fetch':
        return await handleFetchRequest(requestData);
      case 'extractPDF':
        return await handleExtractPDFRequest(requestData);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('PDF Extractor | Socket API error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle browse request
 * @param {Object} data - The request data
 * @returns {Promise<Object>} - The response data
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
 * @returns {Promise<Object>} - The response data
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
 * Handle extract PDF request
 * @param {Object} data - The request data
 * @returns {Promise<Object>} - The response data
 */
async function handleExtractPDFRequest(data) {
  try {
    const { file, filename, contentType, startPage, endPage, outputFormat } = data;
    
    // Save the file to a temporary location
    const tempPath = await saveTempFile(file, filename);
    
    // Process the PDF using the Python backend
    const result = await processPDFWithPython(tempPath, contentType, startPage, endPage, outputFormat);
    
    // Clean up the temporary file
    await deleteTempFile(tempPath);
    
    // Send the results back to the client
    game.socket.emit('module.pdf-extractor-plus', {
      action: 'extractionResults',
      data: {
        success: true,
        message: `Successfully processed ${filename}`,
        result
      }
    });
    
    return {
      success: true,
      message: `Processing ${filename} started successfully`
    };
  } catch (error) {
    console.error('PDF Extractor | Extract PDF API error:', error);
    
    // Send the error back to the client
    game.socket.emit('module.pdf-extractor-plus', {
      action: 'extractionResults',
      data: {
        success: false,
        error: error.message
      }
    });
    
    return { success: false, error: error.message };
  }
}

/**
 * Save a file to a temporary location
 * @param {ArrayBuffer} data - The file data
 * @param {string} filename - The file name
 * @returns {Promise<string>} - The path to the temporary file
 */
async function saveTempFile(data, filename) {
  // In a real implementation, this would save the file to the server's temp directory
  // For now, we'll just simulate it
  console.log(`PDF Extractor | Saving temporary file: ${filename}`);
  
  // In a real implementation, we would use the Foundry API to save the file
  // For now, we'll just return a simulated path
  return `temp/${filename}`;
}

/**
 * Delete a temporary file
 * @param {string} path - The path to the temporary file
 * @returns {Promise<void>}
 */
async function deleteTempFile(path) {
  // In a real implementation, this would delete the file from the server's temp directory
  // For now, we'll just simulate it
  console.log(`PDF Extractor | Deleting temporary file: ${path}`);
}

/**
 * Process a PDF using the Python backend
 * @param {string} path - The path to the PDF file
 * @param {string} contentType - The type of content to extract
 * @param {number|null} startPage - The starting page (optional)
 * @param {number|null} endPage - The ending page (optional)
 * @param {string} outputFormat - The output format (compendium or world)
 * @returns {Promise<Object>} - The extraction results
 */
async function processPDFWithPython(path, contentType, startPage, endPage, outputFormat) {
  // In a real implementation, this would call the Python backend
  // For now, we'll just simulate it
  console.log(`PDF Extractor | Processing PDF: ${path}`);
  console.log(`Content Type: ${contentType}, Pages: ${startPage || 'start'}-${endPage || 'end'}, Format: ${outputFormat}`);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return simulated results
  return {
    extractedItems: [
      { type: 'journal', name: 'Chapter 1', pages: 10 },
      { type: 'actor', name: 'Goblin', cr: 1 },
      { type: 'item', name: 'Magic Sword', type: 'weapon' }
    ]
  };
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
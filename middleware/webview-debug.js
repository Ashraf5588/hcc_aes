// WebView debugging middleware
// Add this to your Express app to help debug WebView issues

const webviewDebugMiddleware = (req, res, next) => {
    const userAgent = req.get('User-Agent') || '';
    const isWebView = /wv|WebView|Android.*Version\/\d+\.\d+/.test(userAgent);
    
    // Log WebView requests
    if (isWebView || req.path.includes('admin')) {
        console.log('=== WebView Request Debug ===');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Method:', req.method);
        console.log('Path:', req.path);
        console.log('User-Agent:', userAgent);
        console.log('Is WebView:', isWebView);
        console.log('Content-Type:', req.get('Content-Type'));
        console.log('Content-Length:', req.get('Content-Length'));
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        
        if (req.method === 'POST') {
            console.log('Body Keys:', Object.keys(req.body || {}));
            if (req.files) {
                console.log('Files:', Object.keys(req.files));
                Object.keys(req.files).forEach(key => {
                    const file = req.files[key];
                    console.log(`File ${key}:`, {
                        name: file.originalname,
                        size: file.size,
                        mimetype: file.mimetype,
                        encoding: file.encoding
                    });
                });
            }
            if (req.file) {
                console.log('Single File:', {
                    name: req.file.originalname,
                    size: req.file.size,
                    mimetype: req.file.mimetype,
                    encoding: req.file.encoding,
                    destination: req.file.destination,
                    filename: req.file.filename
                });
            }
        }
        console.log('=== End WebView Debug ===\n');
    }
    
    // Add WebView-specific headers to response
    if (isWebView) {
        res.setHeader('X-WebView-Detected', 'true');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    
    next();
};

module.exports = webviewDebugMiddleware;

const express = require('express');
const student  = require('./routers/mainpage');
const fs = require('fs');

const app = express();


const connection = require('./config/connection')
// Serve static files from 'uploads' folder
// app.use('/uploads', express.static(__dirname + '/uploads'));
const path = require('path')
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath, stat) => {
    const fileName = path.basename(filePath);
    const req = res.req; // Get the request object
    
    // Ensure PDFs are served inline with enhanced headers for VM compatibility
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      
      // Check if the request is from a browser that might have issues with inline PDFs
      const userAgent = req.headers['user-agent'] || '';
      const isChrome = userAgent.includes('Chrome');
      const isFirefox = userAgent.includes('Firefox');
      const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
      const isEdge = userAgent.includes('Edge');
      
      console.log('PDF request from:', { userAgent, isChrome, isFirefox, isSafari, isEdge });
      
      // Force inline for all browsers in VM environment
      res.setHeader('Content-Disposition', 'inline; filename="' + fileName + '"');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      
      // Add specific headers for PDF viewing
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    }
    // Handle other file types
    else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Disposition', 'inline; filename="' + fileName + '"');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
    else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'inline; filename="' + fileName + '"');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
    else if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Content-Disposition', 'inline; filename="' + fileName + '"');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
    // Force download for Word documents
    else if (filePath.endsWith('.doc') || filePath.endsWith('.docx')) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment; filename="' + fileName + '"');
    }
  }
}))
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'))
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json())
app.use(cookieParser());
app.use(express.urlencoded({extended:true}))

connection();

// Middleware to log PDF requests for debugging
app.use('/uploads', (req, res, next) => {
  if (req.path.endsWith('.pdf')) {
    console.log('=== PDF REQUEST DEBUG ===');
    console.log('PDF Request URL:', req.originalUrl);
    console.log('File path:', req.path);
    console.log('User-Agent:', req.headers['user-agent']);
    console.log('Accept:', req.headers['accept']);
    console.log('Referer:', req.headers['referer']);
    console.log('Query params:', req.query);
    console.log('========================');
  }
  next();
});

// Dedicated PDF viewing route for better VM compatibility
app.get('/view-pdf/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }
    
    // Serve PDF with explicit headers for VM compatibility
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + filename + '"');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Less restrictive headers for VM compatibility
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(500).send('Error serving file');
  }
});

// Enhanced file viewer route for better compatibility
app.get('/file-viewer/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).render('404', { message: 'File not found' });
    }
    
    res.render('file-viewer', { filename: filename });
  } catch (error) {
    console.error('Error in file viewer:', error);
    res.status(500).render('404', { message: 'Error loading file viewer' });
  }
});

// Test route for PDF serving debugging
app.get('/test-pdf/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    console.log('=== PDF TEST ROUTE ===');
    console.log('Requested file:', filename);
    console.log('Full path:', filePath);
    console.log('File exists:', fs.existsSync(filePath));
    
    if (!fs.existsSync(filePath)) {
      console.log('File not found');
      return res.status(404).send('File not found');
    }
    
    const stats = fs.statSync(filePath);
    console.log('File size:', stats.size);
    console.log('User-Agent:', req.headers['user-agent']);
    console.log('Accept header:', req.headers['accept']);
    
    // Set minimal headers for maximum compatibility
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stats.size);
    
    // Try different Content-Disposition approaches
    const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
    
    console.log('Headers set:', {
      'Content-Type': 'application/pdf',
      'Content-Length': stats.size,
      'Content-Disposition': `${disposition}; filename="${filename}"`
    });
    
    // Stream the file
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    
    stream.on('end', () => {
      console.log('PDF streaming completed successfully');
    });
    
    stream.on('error', (error) => {
      console.error('PDF streaming error:', error);
    });
    
  } catch (error) {
    console.error('Error in test PDF route:', error);
    res.status(500).send('Error serving PDF');
  }
});

app.use(student)

app.listen(80,()=>{
    console.log('Server is running on port 80')

})

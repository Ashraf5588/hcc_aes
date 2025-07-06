const express = require('express');
const student  = require('./routers/mainpage');
const fs = require('fs');

const app = express();


const connection = require('./config/connection')
// Serve static files from 'uploads' folder
// app.use('/uploads', express.static(__dirname + '/uploads'));
const path = require('path')
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    const fileName = path.basename(filePath);
    
    // Ensure PDFs are served inline with enhanced headers for VM compatibility
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + fileName + '"');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      // Additional headers for better VM/browser compatibility
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
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
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
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

app.use(student)

app.listen(80,()=>{
    console.log('Server is running on port 80')

})

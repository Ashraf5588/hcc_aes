/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Enhanced viewer.js file with better Android WebView compatibility
"use strict";

// Document initialization code
document.addEventListener("DOMContentLoaded", function() {
  // Extract PDF URL from query string
  const urlParams = new URLSearchParams(window.location.search);
  const fileParam = urlParams.get('file');
  
  // Make sure we have a PDF file to display
  if (!fileParam) {
    showError('No PDF file specified');
    return;
  }

  // Get the full URL to the PDF
  const pdfUrl = fileParam;

  // Update page title
  const fileName = pdfUrl.split('/').pop();
  document.title = fileName + ' - PDF Viewer';
  
  // Display loading bar
  const loadingBar = document.getElementById('loadingBar');
  if (loadingBar) {
    loadingBar.classList.add('indeterminate');
  }      // For Android WebView, add a note and optimizations
      if (navigator.userAgent.indexOf('wv') > -1 || 
          (navigator.userAgent.indexOf('Android') > -1 && navigator.userAgent.indexOf('Chrome') === -1)) {
        const webViewNote = document.createElement('div');
        webViewNote.className = 'webview-note';
        webViewNote.innerHTML = '<div style="position: fixed; top: 0; left: 0; right: 0; background: rgba(33, 150, 243, 0.9); color: white; padding: 5px 10px; font-size: 12px; text-align: center; z-index: 1000;">Android WebView Optimized Mode</div>';
        document.body.appendChild(webViewNote);
        
        // Add class to body for Android WebView specific styling
        document.body.classList.add('android-webview');
        
        // Add back button for easier navigation in WebView
        const backButton = document.createElement('div');
        backButton.className = 'webview-back-button';
        backButton.innerHTML = `
          <button style="position: fixed; top: 30px; left: 10px; z-index: 1001; 
                         background: rgba(255,255,255,0.9); border: none; border-radius: 50%; 
                         width: 40px; height: 40px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
            <span style="font-size: 24px;">&larr;</span>
          </button>
        `;
        document.body.appendChild(backButton);
        
        // Add event listener to back button
        backButton.querySelector('button').addEventListener('click', function() {
          history.back();
        });
        
        // Force hardware acceleration to improve rendering
        document.body.style.transform = 'translateZ(0)';
        document.body.style.backfaceVisibility = 'hidden';
        document.body.style.perspective = '1000px';
  }
  
  try {
    // Load the PDF using PDF.js
    loadPDF(pdfUrl);
  } catch (error) {
    showError("Failed to load PDF: " + error.message);
  }
  
  // Set up the download button handler
  const downloadButton = document.getElementById('download');
  if (downloadButton) {
    downloadButton.addEventListener('click', function() {
      // Create a temporary link for downloading
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = pdfUrl.split('/').pop();
      link.target = '_blank';
      link.click();
    });
  }
  
  // Set up zoom controls
  const zoomIn = document.getElementById('zoomIn');
  const zoomOut = document.getElementById('zoomOut');
  let currentScale = 1.0;
  
  if (zoomIn) {
    zoomIn.addEventListener('click', function() {
      currentScale = Math.min(currentScale + 0.2, 3.0);
      applyZoom();
    });
  }
  
  if (zoomOut) {
    zoomOut.addEventListener('click', function() {
      currentScale = Math.max(currentScale - 0.2, 0.5);
      applyZoom();
    });
  }
  
  function applyZoom() {
    const page = document.querySelector('.page');
    if (page) {
      page.style.transform = `scale(${currentScale})`;
      page.style.transformOrigin = 'top left';
    }
  }
});

function loadPDF(url) {
  // Set up PDF.js
  const loadingTask = pdfjsLib.getDocument({
    url: url,
    // Remove cMapUrl as it's not needed for our simplified version
    // cMapUrl: "../web/cmaps/",
    // cMapPacked: true,
  });
  
  loadingTask.promise
    .then(function(pdfDocument) {
      // PDF loaded successfully
      document.getElementById("loadingBar").classList.remove("indeterminate");
      document.getElementById("loadingBar").style.display = "none";
      
      // Update page info
      const numPages = pdfDocument.numPages;
      const pageInfo = document.getElementById('pageInfo');
      if (pageInfo) {
        pageInfo.textContent = 'Pages: ' + numPages;
      }
      
      // Get the first page
      return pdfDocument.getPage(1).then(function(page) {
        const scale = 1.0;
        const viewport = page.getViewport({ scale });
        
        // Prepare canvas
        const container = document.getElementById("viewerContainer");
        const pdfViewer = document.createElement("div");
        pdfViewer.className = "pdfViewer";
        container.appendChild(pdfViewer);
        
        // Create page container
        const pageContainer = document.createElement("div");
        pageContainer.className = "page";
        pageContainer.style.width = viewport.width + "px";
        pageContainer.style.height = viewport.height + "px";
        pdfViewer.appendChild(pageContainer);
        
        // Create canvas
        const canvas = document.createElement("canvas");
        canvas.className = "pageCanvas";
        pageContainer.appendChild(canvas);
        
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render PDF page
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        page.render(renderContext).promise.then(function() {
          // First page rendered
          console.log("Page rendered successfully");
          
          // Handle Android WebView specific optimizations
          if (navigator.userAgent.indexOf('wv') > -1) {
            // Force redraw in Android WebView to prevent rendering issues
            setTimeout(function() {
              canvas.style.opacity = '0.99';
              setTimeout(function() {
                canvas.style.opacity = '1';
              }, 10);
            }, 100);
          }
        });
      });
    })
    .catch(function(error) {
      // PDF failed to load
      showError(error.message || "Failed to load PDF");
    });
}

function showError(message) {
  document.getElementById("loadingBar").style.display = "none";
  
  const errorWrapper = document.getElementById("errorWrapper");
  errorWrapper.style.display = "block";
  
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = message;
  
  console.error(message);
  
  // Also provide a download link as fallback
  const pdfUrl = new URLSearchParams(window.location.search).get('file');
  if (pdfUrl) {
    const fallbackLink = document.createElement('div');
    fallbackLink.className = 'fallback-link';
    fallbackLink.innerHTML = `
      <div style="margin-top: 20px; text-align: center;">
        <p>You can still access the PDF directly:</p>
        <a href="${pdfUrl}" class="btn" style="display: inline-block; padding: 8px 16px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 4px;" target="_blank">
          Download PDF
        </a>
      </div>
    `;
    errorWrapper.appendChild(fallbackLink);
  }
}

// Debug script for WebView file upload testing
// Add this script to test WebView functionality

(function() {
    console.log('=== WebView File Upload Debug Script ===');
    
    // Environment Detection
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isWebView = /wv|WebView|Android.*Version\/\d+\.\d+/.test(userAgent) || 
                      window.AndroidInterface !== undefined ||
                      window.webkit && window.webkit.messageHandlers;
    
    console.log('User Agent:', userAgent);
    console.log('Is WebView:', isWebView);
    console.log('Platform:', navigator.platform);
    console.log('Touch Support:', 'ontouchstart' in window);
    
    // Feature Detection
    const fileInputSupport = (() => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            return input.type === 'file';
        } catch (e) {
            return false;
        }
    })();
    
    console.log('File Input Support:', fileInputSupport);
    
    // File API Support
    console.log('File API Support:', {
        File: typeof File !== 'undefined',
        FileReader: typeof FileReader !== 'undefined',
        FileList: typeof FileList !== 'undefined',
        Blob: typeof Blob !== 'undefined'
    });
    
    // Add debug event listeners to file inputs
    document.addEventListener('DOMContentLoaded', function() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        
        fileInputs.forEach((input, index) => {
            console.log(`Found file input ${index}:`, input.id || 'no-id');
            
            // Add comprehensive event listeners
            const events = ['click', 'change', 'focus', 'blur', 'touchstart', 'touchend'];
            
            events.forEach(eventType => {
                input.addEventListener(eventType, function(e) {
                    console.log(`File input ${index} - ${eventType}:`, {
                        timestamp: new Date().toISOString(),
                        files: this.files ? this.files.length : 'no files',
                        value: this.value
                    });
                    
                    if (eventType === 'change' && this.files) {
                        Array.from(this.files).forEach((file, fileIndex) => {
                            console.log(`File ${fileIndex}:`, {
                                name: file.name,
                                size: file.size,
                                type: file.type,
                                lastModified: new Date(file.lastModified).toISOString()
                            });
                        });
                    }
                });
            });
            
            // Test programmatic click (hidden by default)
            if (input.id === 'questionPaper' && window.location.search.includes('debug=true')) {
                console.log('Adding test button for', input.id);
                
                const testButton = document.createElement('button');
                testButton.textContent = 'Debug: Trigger File Input';
                testButton.type = 'button';
                testButton.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    z-index: 9999;
                    background: red;
                    color: white;
                    padding: 10px;
                    border: none;
                    border-radius: 5px;
                    font-size: 12px;
                `;
                
                testButton.addEventListener('click', function() {
                    console.log('Debug button clicked - triggering file input');
                    input.click();
                });
                
                document.body.appendChild(testButton);
            }
        });
    });
    
    // Test form submission
    document.addEventListener('submit', function(e) {
        if (e.target.classList.contains('subject-form')) {
            console.log('Form submission detected');
            
            const formData = new FormData(e.target);
            console.log('Form data entries:');
            
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`${key}:`, {
                        name: value.name,
                        size: value.size,
                        type: value.type
                    });
                } else {
                    console.log(`${key}:`, value);
                }
            }
        }
    });
    
    console.log('=== Debug script initialized ===');
})();

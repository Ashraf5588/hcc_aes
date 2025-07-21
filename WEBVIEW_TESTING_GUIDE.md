# WebView File Upload Testing Guide

## Quick Testing Steps

### 1. Test in Mobile Browsers First

1. Open the subject management page in mobile Chrome
2. Try uploading a file - should work
3. Open the same page in mobile Safari
4. Try uploading a file - should work

### 2. Test in WebView App

1. Open the page in your Android WebView app
2. Open browser developer tools (if debugging enabled)
3. Check console for debug messages
4. Try clicking the file input
5. Look for any error messages

### 3. Debug Information

With the debug script enabled, you should see:

- WebView detection status
- File input events
- File selection details
- Form submission data

## Expected Console Output

### In Regular Browser:

```
=== WebView File Upload Debug Script ===
User Agent: Mozilla/5.0 (Linux; Android 10; SM-G975F)...
Is WebView: false
Platform: Linux armv8l
Touch Support: true
File Input Support: true
File API Support: {File: true, FileReader: true, FileList: true, Blob: true}
```

### In WebView:

```
=== WebView File Upload Debug Script ===
User Agent: Mozilla/5.0 (Linux; Android 10; wv)...
Is WebView: true
Platform: Linux armv8l
Touch Support: true
File Input Support: true (but may not work without proper app implementation)
```

## Testing Checklist

### Basic Functionality

- [ ] Page loads correctly in WebView
- [ ] File input is visible
- [ ] Clicking file input shows some response
- [ ] Debug button appears (top-right corner)
- [ ] Console shows debug messages

### File Selection

- [ ] File picker opens when input is clicked
- [ ] Files can be selected
- [ ] File name appears in status area
- [ ] File details are logged to console

### Form Submission

- [ ] Form submits with file attached
- [ ] Server receives file correctly
- [ ] Success/error feedback works
- [ ] Page redirects or updates properly

## Troubleshooting

### Issue: Nothing happens when clicking file input

**Cause:** Android app doesn't implement WebChromeClient file chooser
**Solution:** Android developer needs to implement file chooser callback

### Issue: File picker opens but selection doesn't work

**Cause:** onActivityResult not properly handling file selection
**Solution:** Check Android app's onActivityResult implementation

### Issue: Files selected but form submission fails

**Cause:** Server-side issues or network problems
**Solution:** Check server logs and network connectivity

### Issue: Large files don't upload

**Cause:** File size limits or timeout issues
**Solution:** Check server file size limits and timeout settings

## Android App Requirements

The Android app must include:

```java
// In MainActivity or WebView fragment
WebView webView = findViewById(R.id.webview);

// Configure WebView settings
WebSettings webSettings = webView.getSettings();
webSettings.setJavaScriptEnabled(true);
webSettings.setAllowFileAccess(true);
webSettings.setAllowContentAccess(true);
webSettings.setDomStorageEnabled(true);

// Set WebChromeClient for file uploads
webView.setWebChromeClient(new WebChromeClient() {
    @Override
    public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                   FileChooserParams fileChooserParams) {
        // Store callback
        mFilePathCallback = filePathCallback;

        // Create intent for file selection
        Intent intent = fileChooserParams.createIntent();
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");

        try {
            startActivityForResult(intent, FILECHOOSER_RESULTCODE);
            return true;
        } catch (ActivityNotFoundException e) {
            mFilePathCallback = null;
            return false;
        }
    }
});
```

## Server-Side Debugging

Check server logs for:

1. Request method (should be POST)
2. Content-Type (should be multipart/form-data)
3. File data presence
4. File size and type
5. Any multer errors

## Performance Considerations

1. **File Size Limits**: Set appropriate limits (e.g., 10MB)
2. **Timeout Settings**: Increase for large files
3. **Progress Indication**: Show upload progress
4. **Error Handling**: Provide clear error messages
5. **Retry Mechanism**: Allow retrying failed uploads

## Security Considerations

1. **File Type Validation**: Server-side validation required
2. **File Size Limits**: Prevent DoS attacks
3. **Virus Scanning**: For production environments
4. **Access Controls**: Ensure proper authentication
5. **File Storage**: Secure file storage location

## Production Deployment

Before going live:

1. Remove debug scripts
2. Remove debug middleware
3. Implement proper error handling
4. Add file upload progress indicators
5. Test on multiple devices and WebView implementations
6. Monitor file upload success rates
7. Implement analytics and logging

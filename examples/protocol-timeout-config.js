/*!
 * Copyright 2021 WPPConnect Team
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

/**
 * Example configuration for handling protocol timeouts
 *
 * This example shows how to configure WA-JS to handle media sending timeout issues,
 * particularly the "Runtime.callFunctionOn timed out" error.
 */

/* global WPP, window, console */

// Configure WA-JS before injection
window.WPPConfig = {
  deviceName: 'My WhatsApp Bot',

  // Protocol timeout configuration (in milliseconds)
  // This is crucial for preventing timeout errors during media operations
  protocolTimeout: 300000, // 5 minutes (recommended for media files)

  // For very large files, you might need an even longer timeout
  // protocolTimeout: 600000, // 10 minutes for large files
  // Other useful configurations
  sendStatusToDevice: false,
  disableGoogleAnalytics: true,
  liveLocationLimit: 5,
};

// Usage example with Playwright
async function sendMediaWithTimeout() {
  try {
    // Example of sending a file with proper error handling
    const result = await WPP.chat.sendFileMessage(
      '[number]@c.us',
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
      {
        type: 'image',
        caption: 'My image with timeout handling',
        filename: 'example.jpg',
      }
    );

    console.log('File sent successfully:', result);
  } catch (error) {
    if (error.code === 'media_prep_timeout') {
      console.error(
        'Media preparation timeout. Consider increasing protocolTimeout in WPPConfig.'
      );
    } else if (error.code === 'protocol_timeout') {
      console.error('Protocol timeout. The current timeout is:', error.timeout);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example with debugging
WPP.webpack.onReady(() => {
  console.log('WA-JS is ready!');
  console.log('Current protocol timeout:', WPP.config.protocolTimeout);

  // Send a test message to verify everything is working
  sendMediaWithTimeout();
});

/*!
 * Copyright 2024 WPPConnect Team
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

import * as webpack from '../webpack';

/**
 * Patch MediaPrep to handle longer processing times and add retry logic
 */
webpack.onInjected(() => {
  console.log('[WA.js MediaPrep Patch] Applying MediaPrep patches...');

  // Find MediaPrep module
  const mediaPrepModule = webpack.search((m) => m.MediaPrep && m.prepRawMedia);

  if (mediaPrepModule?.MediaPrep?.prototype) {
    const MediaPrepProto = mediaPrepModule.MediaPrep.prototype;

    // Patch waitForPrep to have longer timeout
    const originalWaitForPrep = MediaPrepProto.waitForPrep;
    if (originalWaitForPrep) {
      MediaPrepProto.waitForPrep = async function () {
        console.log('[WA.js] waitForPrep called - extending timeout...');

        // Create a promise that never rejects (removes internal timeout)
        const noTimeoutPromise = originalWaitForPrep.call(this);

        // Add our own longer timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Media preparation timeout after 10 minutes'));
          }, 600000); // 10 minutes
        });

        try {
          const result = await Promise.race([noTimeoutPromise, timeoutPromise]);
          console.log('[WA.js] waitForPrep completed successfully');
          return result;
        } catch (error: any) {
          console.error('[WA.js] waitForPrep failed:', error);
          throw error;
        }
      };
      console.log('[WA.js] ✓ Patched MediaPrep.waitForPrep');
    }

    // Patch sendToChat to have longer timeout and retry logic
    const originalSendToChat = MediaPrepProto.sendToChat;
    if (originalSendToChat) {
      MediaPrepProto.sendToChat = async function (...args: any[]) {
        console.log('[WA.js] sendToChat called - extending timeout...');

        let lastError: any;
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`[WA.js] sendToChat attempt ${attempt}/${maxRetries}`);

            const sendPromise = originalSendToChat.apply(this, args);

            // Add our own longer timeout
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => {
                reject(
                  new Error(
                    `Media upload timeout after 10 minutes (attempt ${attempt})`
                  )
                );
              }, 600000); // 10 minutes
            });

            const result = await Promise.race([sendPromise, timeoutPromise]);
            console.log('[WA.js] sendToChat completed successfully');
            return result;
          } catch (error: any) {
            lastError = error;
            console.error(
              `[WA.js] sendToChat attempt ${attempt} failed:`,
              error
            );

            if (attempt < maxRetries) {
              const retryDelay = attempt * 2000; // 2s, 4s
              console.log(
                `[WA.js] Retrying in ${retryDelay}ms... (${maxRetries - attempt} attempts remaining)`
              );
              await new Promise((resolve) => setTimeout(resolve, retryDelay));
            }
          }
        }

        console.error(
          '[WA.js] sendToChat failed after all retries:',
          lastError
        );
        throw lastError;
      };
      console.log('[WA.js] ✓ Patched MediaPrep.sendToChat');
    }
  } else {
    console.warn('[WA.js] ✗ Could not find MediaPrep module');
  }

  console.log('[WA.js MediaPrep Patch] Patches applied!');
});

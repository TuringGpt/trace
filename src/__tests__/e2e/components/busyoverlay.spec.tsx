import { browser, $ } from '@wdio/globals';

describe('Compnent Test', () => {
  it('test busyoverlay component', async () => {
    const videoSelectBtn = $('#videoSelectBtn');
    const startButton = $('#startButton');
    const stopButton = $('#stopButton');

    // Select source
    await videoSelectBtn.click();
    await browser.pause(500);

    // Start recording
    await startButton.click();

    await browser.pause(500);

    // Stop recording
    await stopButton.click();

    const overlay = $('#loadingOverlay');
    await expect(overlay).not.toHaveAttribute('class', 'hidden');

    // Wait for processing to complete
    await browser.waitUntil(
      async () => (await overlay.getAttribute('class')).includes('hidden'),
      { timeout: 15000 },
    );
  });
});

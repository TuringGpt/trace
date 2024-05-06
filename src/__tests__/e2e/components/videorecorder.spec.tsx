import { browser, $ } from '@wdio/globals';

describe('Compnent Test', () => {
  it('test video component', async () => {
    const videoSelectBtn = $('#videoSelectBtn');
    const startButton = $('#startButton');
    const stopButton = $('#stopButton');
    const videoPlaceholder = $('#videoPlaceholder');

    await expect(videoPlaceholder).toBeDisplayed();
    await expect(videoPlaceholder).toHaveTextContaining(
      'Please select a source',
    );

    await expect(stopButton).toBeDisabled();
    await expect(startButton).toBeDisabled();

    // Select source
    await videoSelectBtn.click();
    await browser.pause(500);

    await expect(stopButton).toBeDisabled();
    await expect(startButton).toBeEnabled();

    // Start recording
    await startButton.click();
    await expect(stopButton).toBeEnabled();
    await expect(startButton).toBeDisabled();
    const recordingIndicator = $('.recording-dot');
    await expect(recordingIndicator).toHaveElementClass('is-recording');

    await browser.pause(500);

    // Stop recording
    await stopButton.click();
    const overlay = $('#loadingOverlay');
    await expect(overlay).not.toHaveAttribute('class', 'hidden');
  });
});

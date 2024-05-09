import { browser, $ } from '@wdio/globals';

describe('Complete Application Flow', () => {
  it('should handle the complete flow from recording to saving', async () => {
    const headerTitle = $('.text-5xl');
    await expect(headerTitle).toHaveText('Trace');

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

    await browser.pause(3000);

    // Stop recording
    await stopButton.click();
    const overlay = $('#loadingOverlay');
    await expect(overlay).not.toHaveAttribute('class', 'hidden');

    // Wait for processing to complete
    await browser.waitUntil(
      async () => (await overlay.getAttribute('class')).includes('hidden'),
      { timeout: 15000 },
    );

    // Input validation and save recording
    const descriptionInput = $('#description');
    const saveButton = $('#saveVideoBtn');

    await descriptionInput.setValue('');
    await saveButton.click();
    await expect($('.description-error')).toHaveText('This field is required');

    await descriptionInput.setValue('short');
    await saveButton.click();
    await expect($('.description-error')).toHaveText(
      'Description should be at least 15 characters long',
    );

    await descriptionInput.setValue(
      'This is a valid description longer than 15 characters.',
    );

    await saveButton.click();
    // Confirm navigation to home page
    await expect(videoSelectBtn).toBeDisplayed();
    await expect(videoPlaceholder).toBeDisplayed();
    await expect(videoPlaceholder).toHaveTextContaining(
      'Please select a source',
    );
  });
});

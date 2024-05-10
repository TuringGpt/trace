import { browser, $ } from '@wdio/globals';

describe('Compnent Test', () => {
  it('test fileoption component', async () => {
    const videoSelectBtn = $('#videoSelectBtn');
    const startButton = $('#startButton');
    const stopButton = $('#stopButton');
    const videoPlaceholder = $('#videoPlaceholder');

    // Select source
    await videoSelectBtn.click();
    await browser.pause(500);

    // Start recording
    await startButton.click();
    await browser.pause(500);

    // Stop recording
    await stopButton.click();

    const overlay = $('#loadingOverlay');

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

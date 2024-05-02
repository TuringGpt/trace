/* eslint-disable */
import { browser } from '@wdio/globals';

describe('AppHeader Component', () => {
  it('should render the application header with correct title and description', () => {
    // Load the application URL
    browser.url('/');

    // Assert that the application title is displayed correctly
    const title = $('.text-5xl');
    expect(title).toHaveText('Trace');

    // Assert that the description is displayed correctly
    const description = $('.text-center.text-xl');
    expect(description).toHaveText(
      'Screen Recorder with clicks and keystrokes',
    );
  });
});

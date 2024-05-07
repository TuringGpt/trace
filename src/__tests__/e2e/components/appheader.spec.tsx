import { $ } from '@wdio/globals';

describe('Compnent Test', () => {
  it('test appheader component', async () => {
    const headerTitle = $('.text-5xl');
    await expect(headerTitle).toHaveText('Trace');
  });
});

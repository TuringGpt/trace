export const setZipData = (zipFileName: string, zipFilePath: string) =>
  ({
    type: 'setZipData',
    payload: { zipFileName, zipFilePath },
  }) as const;

export const resetZipData = () => ({ type: 'resetZipData' }) as const;

export const showBusyIndicator = (message: string) =>
  ({
    type: 'setBusyIndicator',
    payload: { isShow: true, message },
  }) as const;

export const hideBusyIndicator = () =>
  ({
    type: 'hideBusyIndicator',
    payload: { isShow: false, message: '' },
  }) as const;

export type Action =
  | ReturnType<typeof resetZipData>
  | ReturnType<typeof setZipData>
  | ReturnType<typeof showBusyIndicator>
  | ReturnType<typeof hideBusyIndicator>;

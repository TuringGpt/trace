/* eslint-disable no-bitwise */
import HID from 'node-hid';

import logger from './logger';

const log = logger.child({ module: 'gamepad' });

const ps4VendorId = 1356;

interface PS4ControllerState {
  leftStickX: number;
  leftStickY: number;
  rightStickX: number;
  rightStickY: number;
  dpadState: string;
  buttons: {
    square: boolean;
    cross: boolean;
    circle: boolean;
    triangle: boolean;
    l1: boolean;
    r1: boolean;
    l2: boolean;
    r2: boolean;
    share: boolean;
    options: boolean;
    l3: boolean;
    r3: boolean;
    ps: boolean;
    touchpad: boolean;
  };
  l2Analog: number;
  r2Analog: number;
}

function getDpadState(dpadValue: number): string {
  switch (dpadValue) {
    case 0:
      return 'UP';
    case 1:
      return 'UP_RIGHT';
    case 2:
      return 'RIGHT';
    case 3:
      return 'DOWN_RIGHT';
    case 4:
      return 'DOWN';
    case 5:
      return 'DOWN_LEFT';
    case 6:
      return 'LEFT';
    case 7:
      return 'UP_LEFT';
    default:
      return 'NEUTRAL';
  }
}

function hasStateChanged(
  prevState: PS4ControllerState | null,
  newState: PS4ControllerState,
): boolean {
  if (!prevState) return true;

  // Check analog sticks (with a small threshold to avoid noise)
  const analogThreshold = 5;
  if (
    Math.abs(prevState.leftStickX - newState.leftStickX) > analogThreshold ||
    Math.abs(prevState.leftStickY - newState.leftStickY) > analogThreshold ||
    Math.abs(prevState.rightStickX - newState.rightStickX) > analogThreshold ||
    Math.abs(prevState.rightStickY - newState.rightStickY) > analogThreshold
  ) {
    return true;
  }

  // Check D-pad
  if (prevState.dpadState !== newState.dpadState) return true;

  // Check buttons
  // eslint-disable-next-line no-restricted-syntax
  for (const button in prevState.buttons) {
    if (
      prevState.buttons[button as keyof typeof prevState.buttons] !==
      newState.buttons[button as keyof typeof newState.buttons]
    ) {
      return true;
    }
  }

  // Check L2 and R2 analog (with a small threshold)
  if (
    Math.abs(prevState.l2Analog - newState.l2Analog) > analogThreshold ||
    Math.abs(prevState.r2Analog - newState.r2Analog) > analogThreshold
  ) {
    return true;
  }

  return false;
}

function getChangedValues(
  prevState: PS4ControllerState | null,
  newState: PS4ControllerState,
): Partial<PS4ControllerState> {
  if (!prevState) return newState;

  const changes: Partial<PS4ControllerState> = {};
  const analogThreshold = 5;

  // Check analog sticks
  if (Math.abs(prevState.leftStickX - newState.leftStickX) > analogThreshold)
    changes.leftStickX = newState.leftStickX;
  if (Math.abs(prevState.leftStickY - newState.leftStickY) > analogThreshold)
    changes.leftStickY = newState.leftStickY;
  if (Math.abs(prevState.rightStickX - newState.rightStickX) > analogThreshold)
    changes.rightStickX = newState.rightStickX;
  if (Math.abs(prevState.rightStickY - newState.rightStickY) > analogThreshold)
    changes.rightStickY = newState.rightStickY;

  // Check D-pad
  if (prevState.dpadState !== newState.dpadState)
    changes.dpadState = newState.dpadState;

  // Check buttons
  const changedButtons: Partial<PS4ControllerState['buttons']> = {};
  let buttonChanged = false;
  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const button in prevState.buttons) {
    const buttonKey = button as keyof typeof prevState.buttons;
    if (prevState.buttons[buttonKey] !== newState.buttons[buttonKey]) {
      changedButtons[buttonKey] = newState.buttons[buttonKey];
      buttonChanged = true;
    }
  }
  if (buttonChanged) {
    changes.buttons = changedButtons;
  }

  // Check L2 and R2 analog
  if (Math.abs(prevState.l2Analog - newState.l2Analog) > analogThreshold)
    changes.l2Analog = newState.l2Analog;
  if (Math.abs(prevState.r2Analog - newState.r2Analog) > analogThreshold)
    changes.r2Analog = newState.r2Analog;

  return changes;
}

function parsePS4ControllerData(data: Buffer): PS4ControllerState {
  const state: PS4ControllerState = {
    leftStickX: data[1] - 128,
    leftStickY: data[2] - 128,
    rightStickX: data[3] - 128,
    rightStickY: data[4] - 128,
    dpadState: getDpadState(data[5] & 0xf),
    buttons: {
      square: !!(data[5] & 0x10),
      cross: !!(data[5] & 0x20),
      circle: !!(data[5] & 0x40),
      triangle: !!(data[5] & 0x80),
      l1: !!(data[6] & 0x01),
      r1: !!(data[6] & 0x02),
      l2: !!(data[6] & 0x04),
      r2: !!(data[6] & 0x08),
      share: !!(data[6] & 0x10),
      options: !!(data[6] & 0x20),
      l3: !!(data[6] & 0x40),
      r3: !!(data[6] & 0x80),
      ps: !!(data[7] & 0x01),
      touchpad: !!(data[7] & 0x02),
    },
    l2Analog: data[8],
    r2Analog: data[9],
  };
  return state;
}
let previousState: PS4ControllerState | null = null;
export default async function startGamepadListener() {
  const devices = await HID.devicesAsync();
  const deviceListSet = new Set<string>();

  const devicesWithNoDuplicates = devices.filter((d) => {
    const key = `${d.vendorId}:${d.productId}`;
    if (deviceListSet.has(key)) {
      return false;
    }
    deviceListSet.add(key);

    return true;
  });
  log.info('Found devices:', {
    products: devicesWithNoDuplicates.map((d) => d.product),
  });
  // Correct approach to avoid double serialization and ensure pretty printing
  log.info(`Devices: ${JSON.stringify(devices, null, 2)}`);
  log.info(
    `no duplicates: ${JSON.stringify(devicesWithNoDuplicates, null, 2)}`,
  );

  const ps4Controllers = devices.filter((d) => d.vendorId === ps4VendorId);
  log.info('PS4 controllers:', {
    products: ps4Controllers,
  });

  // open the first PS4 controller
  if (ps4Controllers.length > 0 && ps4Controllers[0].path) {
    log.info('opening controller with', {
      path: ps4Controllers[0].path,
    });
    try {
      const controller = await HID.HIDAsync.open(ps4Controllers[0].path);
      controller.on('data', (data) => {
        const newState = parsePS4ControllerData(data);
        if (hasStateChanged(previousState, newState)) {
          const changes = getChangedValues(previousState, newState);
          if (Object.keys(changes).length > 0) {
            log.info('PS4 controller state changed:', { changes });
          }
          // log.info('PS4 controller state changed:', { state: newState });
          previousState = newState;
        }
      });
      controller.on('error', (err) => {
        log.error('PS4 controller error:', { err });
      });
    } catch (err) {
      if (err instanceof Error) {
        log.error('Error opening controller:', {
          err: err.message,
          errStack: err.stack,
        });
      } else {
        log.error('Error opening controller:', {
          err,
        });
      }
    }
  }
}

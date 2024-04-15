const keycodesMapping: Record<string, string> = {
  0x000e: 'Backspace',
  0x000f: 'Tab',
  0x001c: 'Enter',
  0x003a: 'CapsLock',
  0x0001: 'Escape',
  0x0039: 'Space',
  0x0e49: 'PageUp',
  0x0e51: 'PageDown',
  0x0e4f: 'End',
  0x0e47: 'Home',
  0xe04b: 'ArrowLeft',
  0xe048: 'ArrowUp',
  0xe04d: 'ArrowRight',
  0xe050: 'ArrowDown',
  0x0e52: 'Insert',
  0x0e53: 'Delete',
  0x000b: '0',
  0x0002: '1',
  0x0003: '2',
  0x0004: '3',
  0x0005: '4',
  0x0006: '5',
  0x0007: '6',
  0x0008: '7',
  0x0009: '8',
  0x000a: '9',
  0x001e: 'A',
  0x0030: 'B',
  0x002e: 'C',
  0x0020: 'D',
  0x0012: 'E',
  0x0021: 'F',
  0x0022: 'G',
  0x0023: 'H',
  0x0017: 'I',
  0x0024: 'J',
  0x0025: 'K',
  0x0026: 'L',
  0x0032: 'M',
  0x0031: 'N',
  0x0018: 'O',
  0x0019: 'P',
  0x0010: 'Q',
  0x0013: 'R',
  0x001f: 'S',
  0x0014: 'T',
  0x0016: 'U',
  0x002f: 'V',
  0x0011: 'W',
  0x002d: 'X',
  0x0015: 'Y',
  0x002c: 'Z',
  0x0052: 'Numpad0',
  0x004f: 'Numpad1',
  0x0050: 'Numpad2',
  0x0051: 'Numpad3',
  0x004b: 'Numpad4',
  0x004c: 'Numpad5',
  0x004d: 'Numpad6',
  0x0047: 'Numpad7',
  0x0048: 'Numpad8',
  0x0049: 'Numpad9',
  0x0037: 'NumpadMultiply',
  0x004e: 'NumpadAdd',
  0x004a: 'NumpadSubtract',
  0x0053: 'NumpadDecimal',
  0x0e35: 'NumpadDivide',
  0xee00: 'NumpadEnd',
  0x003b: 'F1',
  0x003c: 'F2',
  0x003d: 'F3',
  0x003e: 'F4',
  0x003f: 'F5',
  0x0040: 'F6',
  0x0041: 'F7',
  0x0042: 'F8',
  0x0043: 'F9',
  0x0044: 'F10',
  0x0057: 'F11',
  0x0058: 'F12',
  0x005b: 'F13',
  0x005c: 'F14',
  0x005d: 'F15',
  0x0063: 'F16',
  0x0064: 'F17',
  0x0065: 'F18',
  0x0066: 'F19',
  0x0067: 'F20',
  0x0068: 'F21',
  0x0069: 'F22',
  0x006a: 'F23',
  0x006b: 'F24',
  0x0027: 'Semicolon',
  0x000d: 'Equal',
  0x0033: 'Comma',
  0x000c: 'Minus',
  0x0034: 'Period',
  0x0035: 'Slash',
  0x0029: 'Backquote',
  0x001a: 'BracketLeft',
  0x002b: 'Backslash',
  0x001b: 'BracketRight',
  0x0028: 'Quote',
  0x001d: 'Ctrl',
  0x0e1d: 'CtrlRight',
  0x0038: 'Alt',
  0x0e38: 'AltRight',
  0x002a: 'Shift',
  0x0036: 'ShiftRight',
  0x0e5b: 'Meta',
  0x0e5c: 'MetaRight',
  0x0045: 'NumLock',
  0x0046: 'ScrollLock',
  0x0e37: 'PrintScreen',
};
export default keycodesMapping;

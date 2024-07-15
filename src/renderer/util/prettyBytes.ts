export default function prettyBytes(bytes: number | undefined) {
  if (bytes === undefined) {
    return 'Size: NA';
  }

  const kb = bytes / 1024;
  const mb = kb / 1024;
  const gb = mb / 1024;

  if (gb > 1) {
    return `${gb.toFixed(2)} GB`;
  }
  if (mb > 1) {
    return `${mb.toFixed(2)} MB`;
  }
  return `${kb.toFixed(2)} KB`;
}

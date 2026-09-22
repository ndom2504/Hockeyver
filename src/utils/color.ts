export function onColor(hex: string) {
  const value = hex.replace('#', '');
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  const luma = (red * 299 + green * 587 + blue * 114) / 1000;
  return luma > 160 ? '#12171F' : '#FFFFFF';
}

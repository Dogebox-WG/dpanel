// Mock toggles for additional pup variants (Core green, Sakura)
// These control whether these pups appear in bootstrap response

export const mockCoreGreen = {
  name: 'Core green',
  method: 'get',
  group: 'monitoring',
  res: () => ({ enabled: true })
};

export const mockSakura = {
  name: 'Sakura',
  method: 'get',
  group: 'monitoring',
  res: () => ({ enabled: true })
};

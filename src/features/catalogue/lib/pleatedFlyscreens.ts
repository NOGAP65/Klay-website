/** Configurations from the user's supplied product image, 10 September 2026. */
export const FLYSCREEN_CONFIGURATIONS = [
  { id: 'single', name: 'Single', width: 4500, height: 3000 },
  { id: 'double', name: 'Double', width: 9000, height: 3000 },
] as const;

// The supplied custom-colour option is explicitly excluded from Klay's range.
export const FLYSCREEN_COLOURS = [
  { name: 'Black', hex: '#20272B' },
  { name: 'White', hex: '#F4F4EF' },
  { name: 'Clear Anodised', hex: '#BEC1BD' },
  { name: 'Monument', hex: '#363C3D' },
];

export const flyscreenConfiguration = (id?: string) =>
  FLYSCREEN_CONFIGURATIONS.find(configuration => configuration.id === id) ?? FLYSCREEN_CONFIGURATIONS[0];
export const flyscreenDimensions = (id?: string) => {
  const configuration = flyscreenConfiguration(id);
  return `W${configuration.width} × H${configuration.height} mm`;
};
export const flyscreenSpecifications = (id?: string) => [
  { label: 'Dimensions (W × H)', value: flyscreenDimensions(id) },
];

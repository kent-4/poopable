export const colors = {
  primary: '#00685f',
  primaryHover: '#00544d',
  primaryActive: '#003e39',
  primaryLight: '#0d9488',
  primaryContainer: '#d0f5ec',
  onPrimaryContainer: '#00201c',
  water: '#0284c7',
  waterBackground: '#e0f2fe',
  page: '#f6fbf9',
  surface: '#ffffff',
  subtle: '#eff7f4',
  muted: '#e4eee9',
  border: '#e4eee9',
  divider: '#eef5f2',
  ink: '#13211e',
  secondary: '#4d605a',
  mutedInk: '#849892',
  inverse: '#ffffff',
} as const;

export const tiers = {
  recommended: {
    background: '#e6f9ed',
    border: '#a7f3d0',
    text: '#15803d',
    icon: '#16a34a',
  },
  average: {
    background: '#fefce8',
    border: '#fde68a',
    text: '#b45309',
    icon: '#d97706',
  },
  emergency: {
    background: '#fef2f2',
    border: '#fecaca',
    text: '#b91c1c',
    icon: '#dc2626',
  },
} as const;
export type Tier = keyof typeof tiers;
export const radii = { sm: 8, md: 14, lg: 18, xl: 24, full: 9999 } as const;
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;
export const fonts = {
  display: 'Quicksand_700Bold',
  displayMedium: 'Quicksand_500Medium',
  displaySemibold: 'Quicksand_600SemiBold',
  body: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
  italic: 'Nunito_400Regular_Italic',
  semiboldItalic: 'Nunito_600SemiBold_Italic',
} as const;
export const shadows = {
  sm: '0 1px 3px rgba(19,33,30,0.05), 0 1px 2px rgba(19,33,30,0.03)',
  md: '0 4px 16px -2px rgba(0,104,95,0.08), 0 2px 6px -1px rgba(19,33,30,0.04)',
  lg: '0 10px 25px -3px rgba(0,104,95,0.12), 0 4px 10px -2px rgba(19,33,30,0.04)',
  floating: '0 12px 28px -4px rgba(0,104,95,0.22)',
  sheet: '0 -8px 30px rgba(19,33,30,0.08)',
} as const;
export const motion = { fast: 150, base: 220 } as const;

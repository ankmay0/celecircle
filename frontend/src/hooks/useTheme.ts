import { useThemeStore } from '@/stores/themeStore'

export function useTheme() {
  const { mode, setMode, resolvedTheme } = useThemeStore()

  return {
    mode,
    setMode,
    resolvedTheme: resolvedTheme(),
    isDark: resolvedTheme() === 'dark',
  }
}

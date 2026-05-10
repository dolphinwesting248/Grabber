import { createContext, useContext } from "react"

export type Theme = "dark" | "light"

export const ThemeContext = createContext<Theme>("light")

export function useTheme() {
  return useContext(ThemeContext)
}

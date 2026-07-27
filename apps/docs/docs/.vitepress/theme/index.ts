import DefaultTheme from 'vitepress/theme'
import { inject as injectAnalytics } from '@vercel/analytics'
import type { Theme } from 'vitepress'

injectAnalytics()

export default DefaultTheme satisfies Theme

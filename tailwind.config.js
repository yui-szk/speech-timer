/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ミントグリーン - メインカラー
        mint: {
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6e0',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        // イエロー - アクセントカラー（ベルアイコン用）
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Figmaデザインに基づくフォントサイズ
        'title2': ['22px', '28px'],
        'subheadline': ['15px', '20px'],
        'caption1': ['12px', '16px'],
      },
      spacing: {
        // タップ領域の最小サイズ（44x44px）
        'tap': '44px',
      },
    },
  },
  plugins: [],
}
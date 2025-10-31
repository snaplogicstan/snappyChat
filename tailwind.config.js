import defaultTheme from "tailwindcss/defaultTheme"

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts}",
    ],
    theme: {
        extend: {
            fontFamily: {
                mono: ['"Fira Code"', ...defaultTheme.fontFamily.mono]
            }
        }
    },
    plugins: []
}
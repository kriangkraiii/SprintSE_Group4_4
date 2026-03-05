module.exports = {
    root: true,
    env: {
        browser: true,
        node: true,
    },
    extends: [
        'plugin:vue/vue3-recommended',
        'plugin:prettier/recommended',
    ],
    plugins: [],
    // add your custom rules here
    rules: {
        'vue/multi-word-component-names': 'off',
        'vue/no-v-html': 'off',
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
}

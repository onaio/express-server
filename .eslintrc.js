module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
        'airbnb-base',
        'airbnb-typescript/base',
        'plugin:prettier/recommended',
        'typestrict',
    ],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        project: './tsconfig.json',
    },
    plugins: ['@typescript-eslint', 'prettier'],
    rules: {
        'prettier/prettier': 2,
        '@typescript-eslint/naming-convention': [
            'error',
            // variableLike - matches the same as variable, function and parameter
            {
                selector: 'variableLike',
                format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
                leadingUnderscore: 'allow',
            },
            // typeLike - matches the same as class, interface, typeAlias, enum, typeParameter
            {
                selector: 'typeLike',
                format: ['PascalCase'],
            },
        ],
        //ignore extensions for importing files with .js and .ts extensions
        'import/extensions': [
            'error',
            'ignorePackages',
            {
                js: 'never',
                ts: 'never',
            },
        ],
    },
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.js', '.ts'],
                moduleDirectory: ['src', 'node_modules'],
            },
            project: './tsconfig.json',
        },
    },
};

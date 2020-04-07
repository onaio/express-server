module.exports = {
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    testEnvironment: 'node',
    collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/tests/', '!src/index.ts'],
    coverageReporters: ['lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 85,
            lines: 85,
            statements: 90,
        },
    },
};

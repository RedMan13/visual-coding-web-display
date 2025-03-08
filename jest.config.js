export default {
    testEnvironment: 'jsdom',
    transform: {
        // "^.+\\.ne$": "jest-transform-nearley"
    },
    moduleNameMapper: {
        '\\.css$': 'identity-obj-proxy', // CSS imports
    },
};

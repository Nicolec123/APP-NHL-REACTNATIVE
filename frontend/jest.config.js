module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-navigation|expo(-.*)?)/)'
  ],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect']
};

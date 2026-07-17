module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  forceExit: true,
  testTimeout: 15000,
  setupFilesAfterEnv: ['./tests/setup.js']
};

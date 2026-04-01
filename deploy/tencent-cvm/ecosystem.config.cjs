const path = require('path');

/** Model Billing Bridge repo root (parent of deploy/) */
const root = path.resolve(__dirname, '../..');

module.exports = {
  apps: [
    {
      name: 'mb-web',
      cwd: path.join(root, 'web'),
      script: 'npm',
      args: 'run start',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    },
    {
      name: 'mb-gateway',
      cwd: path.join(root, 'gateway'),
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: '8080',
      },
    },
  ],
};

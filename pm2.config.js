module.exports = {
  apps: [
    {
      name: 'ChurningFlair',
      script: 'bin/www',
      log_date_format: 'YYYY-MM-DDTHH:mm:ss.SSS',
      env: {
        NODE_ENV: 'production',
        PORT: '5372'
      }
    }
  ]
};
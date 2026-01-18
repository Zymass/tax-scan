module.exports = {
  apps: [{
    name: 'taxcalculator-backend',
    script: './dist/app.js',
    cwd: '/var/www/taxcalculator/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/taxcalculator-backend-error.log',
    out_file: '/var/log/pm2/taxcalculator-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};

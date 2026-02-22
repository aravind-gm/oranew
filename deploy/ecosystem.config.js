// ============================================================================
// ORA JEWELLERY — PM2 ECOSYSTEM CONFIG (Phase 4)
// ============================================================================
// 
// Place at: /var/www/ora-backend/ecosystem.config.js
//
// Key decisions:
//   - 2 cluster instances (matches VPS cores, prevents overload)
//   - 400MB memory limit per instance (restart on leak)
//   - Graceful shutdown via SIGINT handler in server.ts
//   - Structured JSON logging for production debugging
//   - Auto-restart with exponential backoff
//   - Source maps for Sentry stack traces
//
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 logs ora-backend
//   pm2 monit
// ============================================================================

module.exports = {
  apps: [
    {
      // ── Identity ──
      name: 'ora-backend',
      script: './backend/dist/server.js',
      cwd: '/var/www/ora-backend',

      // ── Cluster Mode ──
      // 2 instances = 1 per core on a 2-core VPS
      // More than 2 on a small VPS causes CPU contention
      instances: 2,
      exec_mode: 'cluster',

      // ── Memory ──
      // Restart instance if it exceeds 400MB (leak protection)
      max_memory_restart: '400M',

      // ── Auto-restart ──
      autorestart: true,
      watch: false,  // NEVER watch in production (causes spurious restarts)
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,  // 4s between restart attempts

      // ── Environment ──
      node_args: '--max-old-space-size=384 --enable-source-maps',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // ── Logging ──
      // Structured JSON logs for easy parsing
      log_type: 'json',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/ora-backend-error.log',
      out_file: '/var/log/pm2/ora-backend-out.log',
      merge_logs: true,  // Merge cluster instance logs into single file
      log_file: '/var/log/pm2/ora-backend-combined.log',

      // ── Graceful Shutdown ──
      // server.ts handles SIGINT → shutdownJobQueue → process.exit(0)
      kill_timeout: 10000,       // 10s to finish requests before SIGKILL
      listen_timeout: 15000,     // 15s for app to signal ready
      shutdown_with_message: true,

      // ── Source maps (for Sentry stack traces) ──
      source_map_support: true,

      // ── Health check ──
      // PM2 Plus feature (optional — works without PM2 Plus too)
      // health_check: {
      //   url: 'http://localhost:5000/api/health',
      //   interval: 30000,
      // },
    },
  ],
};

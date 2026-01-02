module.exports = {
  apps : [{
    name: "syrblox-bot",      // Nama bot di list PM2
    script: "./src/index.js", // Lokasi file utama
    
    // 1. Fitur Watch: Bot restart sendiri kalau kamu edit kodingan
    watch: true,
    
    // 2. PENTING: Jangan restart kalau file Database berubah!
    // Kalau ini tidak ada, bot akan restart terus setiap ada transaksi.
    ignore_watch: [
        "node_modules", 
        "logs",
        "*.db", 
        "*.db-shm", 
        "*.db-wal",
        "database/*.db*", // Jaga-jaga kalau db ada di folder database
    ],

    // 3. Setting Restart
    max_memory_restart: "500M", // Restart kalau makan RAM > 500MB (Anti Memory Leak)
    autorestart: true,          // INI KUNCINYA: Hidupkan lagi kalau mati (termasuk saat /restart)
    
    // 4. Environment Variables
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
};
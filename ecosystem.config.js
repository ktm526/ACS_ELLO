/** ecosystem.config.js */
module.exports = {
    apps: [
        /* ───────────────────────── Frontend ─────────────────────── */
        {
            name: "frontend",
            cwd: "./frontend",
            script: "npm",
            args: "run dev",          // vite / CRA dev 서버
            env: {
                PORT: 5173                 // 예시: vite 포트
            },
            watch: false
        },

        /* ───────────────────────── Core Server ───────────────────── */
        {
            name: "core_server",
            cwd: "./core_server",
            script: "node",
            args: "app.js",
            // env: {
            //     NODE_ENV: "production",
            //     PORT: 3000
            // },
            watch: ["app.js", "models", "routes", "services"]
        },

        /* ───────────────────────── IO Server ─────────────────────── */
        {
            name: "io_server",
            cwd: "./io_server",
            script: "node",
            args: "ioServer.js",
            // env: {
            //     NODE_ENV: "production",
            //     PORT: 4000,
            //     CORE_URL: "http://localhost:3000",
            //     AMR_IP: "192.168.0.100"
            // },
            watch: ["ioServer.js", "services", "routes"]
        }
    ]
};

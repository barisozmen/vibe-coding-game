module.exports = {
    apps: [
      {
        name: "game1",
        script: "npm",
        args: "run dev",
        env: {
          NODE_ENV: "development",
          PORT: "8010"
        },
        watch: false
      }
    ]
};
// use command: pm2 start ecosystem.config.cjs
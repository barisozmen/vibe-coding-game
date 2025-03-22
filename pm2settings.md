
# Setting Up Vite with PM2

To run your Vite server automatically using PM2 with a specific port, follow these steps:

## 1. First, modify your package.json script

If you haven't already specified a port in your package.json, update your dev script to include the port:

```json
"scripts": {
  "dev": "vite --port 3000"
}
```

(Replace 3000 with your desired port)

## 2. Create a PM2 ecosystem.config.js file

Create a file named `ecosystem.config.js` in your project root:

```javascript
module.exports = {
  apps: [
    {
      name: "vite-app",
      script: "npm",
      args: "run dev",
      env: {
        NODE_ENV: "development"
      },
      watch: false
    }
  ]
};
```

## 3. Start your application with PM2

```bash
# Install PM2 globally if you haven't already
npm install -g pm2

# Start your application using the ecosystem config
pm2 start ecosystem.config.js

# To ensure PM2 restarts the app if your server reboots
pm2 save
pm2 startup
```

## 4. PM2 commands to manage your application

```bash
# View logs
pm2 logs vite-app

# Restart the app
pm2 restart vite-app

# Stop the app
pm2 stop vite-app

# Delete the app from PM2
pm2 delete vite-app
```

This setup will automatically run your Vite server using PM2, which will keep it running and restart it if it crashes.

# How to Share Your App with Reviewers

## Local Network Sharing (Same WiFi)

If your reviewer is on the same WiFi network as you, they can access your app directly without any tunnels or additional setup.

### Steps:

1. **Find Your Local IP Address**
   ```bash
   # On Mac
   ipconfig getifaddr en0
   # Or if that doesn't work
   ipconfig getifaddr en1
   ```
   Your IP is typically something like: `192.168.1.32`

2. **Share the URL**
   - Your Local IP: `http://192.168.1.32:3000/`
   - Give this URL to your reviewer
   - They must be on the **same WiFi network** as you

3. **Keep Your Server Running**
   ```bash
   # In the server directory
   node index.js
   ```

### What Your Reviewer Will See:
- Full DocGen AI Dashboard
- All projects with INR (₹) costs
- Ability to create new projects
- Export PDF functionality
- Cost statistics

### Troubleshooting:

**If the reviewer can't access the app:**

1. **Check firewall settings:**
   - Go to System Preferences → Security & Privacy → Firewall
   - Make sure Node.js is allowed to accept incoming connections

2. **Verify you're on the same network:**
   - Both devices must be connected to the same WiFi router

3. **Try the alternative IP:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   This shows all your local IPs - try each one with `:3000` at the end

### Security Note:
- This only works on your local network
- The app is NOT accessible from the internet
- Your reviewer must be physically nearby on the same WiFi

---

## Alternative: Internet Sharing (If Remote Reviewer)

If your reviewer is not on the same network, you can use:

### Option A: ngrok (Recommended for remote)
```bash
# Install (one-time)
brew install ngrok

# Sign up at ngrok.com for free auth token
ngrok config add-authtoken YOUR_TOKEN

# Start tunnel
ngrok http 3000
```

### Option B: localtunnel (Less stable)
```bash
# Already installed
lt --port 3000
```
Note: This can be unreliable with frequent disconnections.

### Option C: Deploy to a hosting service
- Render.com (free tier)
- Railway.app (free tier)
- Vercel (frontend) + Railway (backend)

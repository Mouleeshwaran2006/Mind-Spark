# 🚀 Deployment Guide: Mind Spark Smart Parking Marketplace

This guide outlines how to deploy the **Mind Spark** application. Follow the instructions corresponding to your chosen deployment path.

---

## 🗃️ Database Setup: MongoDB Atlas (Required for Cloud/VPS)

If you are deploying to the cloud (Option A) or VPS (Option B), you need a hosted MongoDB database. **MongoDB Atlas** offers a free permanent cluster:

1. **Sign Up / Log In**: Visit [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. **Create a Database Cluster**:
   - Choose the **M0 (Free)** cluster.
   - Select your preferred cloud provider (AWS/Google Cloud/Azure) and a region closest to you.
   - Click **Create**.
3. **Database Security (Crucial)**:
   - **Database User**: Create a user with a strong username and password (e.g., user: `mindspark_admin`). Keep these credentials safe!
   - **IP Access List**: Go to **Network Access** → **Add IP Address**.
     - For **Render/Vercel (Option A)**: Click **Allow Access from Anywhere** (`0.0.0.0/0`). (Cloud servers rotate IPs, so this is required).
     - For **VPS (Option B)**: Add your specific VPS server's public IP address.
4. **Get the Connection String**:
   - Go to your database Dashboard, click **Connect** → **Drivers** (Node.js).
   - Copy the connection string. It will look like this:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/mindspark?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with the credentials you created in Step 3.

---

## 🌟 Option A: Modern Cloud Deployment (Recommended)

This is the fastest, safest, and most modern approach using free tiers.

### 1. Push Code to GitHub
Ensure your code is stored in a private or public GitHub repository. Both Vercel and Render connect directly to GitHub to build and deploy your project automatically on every push.

### 2. Deploy Backend on Render
1. Go to [render.com](https://render.com) and log in using your GitHub account.
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Name**: `mindspark-backend`
   - **Root Directory**: `backend`
   - **Language**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Scroll down to **Environment Variables** and add the following keys:
   - `PORT` = `5000` (Render will override this, but good to have)
   - `MONGO_URI` = *(Your MongoDB Atlas connection string from above)*
   - `JWT_SECRET` = *(Create a random 32+ character string)*
   - `JWT_EXPIRES_IN` = `7d`
   - `CLIENT_URL` = *(Leave blank for now; you will fill this with your Vercel URL later)*
   - `RAZORPAY_KEY_ID` = `rzp_test_YOUR_KEY_ID`
   - `RAZORPAY_KEY_SECRET` = `YOUR_KEY_SECRET`
   - `PLATFORM_COMMISSION` = `0.20`
6. Click **Deploy Web Service**. Once deployed, copy your service URL (e.g., `https://mindspark-backend.onrender.com`).

### 3. Deploy Frontend on Vercel
1. Go to [vercel.com](https://vercel.com) and log in using your GitHub account.
2. Click **Add New** → **Project**.
3. Import your GitHub repository.
4. In the configuration:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* and select **`frontend`**.
5. Expand **Environment Variables** and add:
   - `NEXT_PUBLIC_API_URL` = `https://mindspark-backend.onrender.com/api` *(Your Render backend URL + /api)*
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` = `rzp_test_YOUR_KEY_ID`
   - `NEXT_PUBLIC_APP_NAME` = `Mind Spark`
6. Click **Deploy**. Vercel will build and host your Next.js frontend in ~2 minutes.
7. Copy your deployed frontend domain (e.g., `https://mindspark-frontend.vercel.app`).

### 4. Link Frontend to Backend (Final CORS Step)
1. Go back to your **Render Backend Dashboard** → **Environment**.
2. Update the environment variable:
   - `CLIENT_URL` = `https://mindspark-frontend.vercel.app` *(Your Vercel frontend URL)*
3. Save changes. Render will automatically redeploy the backend with the correct CORS permissions. Your full-stack app is now live!

---

## 🖥️ Option B: Self-Hosted Linux VPS (Hostinger, AWS, DigitalOcean)

If you own an Ubuntu Linux server and a domain name (e.g., `mindspark.com`).

### 1. Initial VPS Server Setup
SSH into your server and install Node.js, Git, PM2, and Nginx:
```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git & PM2 globally
sudo npm install -y pm2 -g

# Install Nginx
sudo apt install nginx -y
```

### 2. Deploy Project Code
Clone your repository to `/var/www/mindspark` and install dependencies:
```bash
cd /var/www
sudo git clone <your-repo-link> mindspark
cd mindspark

# Build backend
cd backend
npm install
cp .env.example .env
nano .env # Paste production variables: MONGO_URI, JWT_SECRET, CLIENT_URL=https://mindspark.com, etc.

# Build frontend
cd ../frontend
npm install
# Set API URL pointing to your backend subdomain (e.g., https://api.mindspark.com/api)
echo "NEXT_PUBLIC_API_URL=https://api.mindspark.com/api" > .env.local
echo "NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_id" >> .env.local
echo "NEXT_PUBLIC_APP_NAME=Mind Spark" >> .env.local
npm run build
```

### 3. Launch with PM2 Process Manager
Run the pre-configured PM2 ecosystem file from the root folder:
```bash
cd /var/www/mindspark
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup # Follow the screen instructions to enable auto-boot on restart
```

### 4. Nginx Reverse Proxy Setup
Configure Nginx to proxy traffic to port `3000` (Next.js) and port `5000` (API backend):
```bash
sudo nano /etc/nginx/sites-available/mindspark
```
Paste this configuration:
```nginx
# Frontend config (mindspark.com)
server {
    listen 80;
    server_name mindspark.com www.mindspark.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API config (api.mindspark.com)
server {
    listen 80;
    server_name api.mindspark.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/mindspark /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Install SSL Certificate (HTTPS)
Use Let's Encrypt Certbot to generate free SSL certificates:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d mindspark.com -d www.mindspark.com -d api.mindspark.com
```

---

## 🏠 Option C: Local Server / Network Sharing

Perfect for sharing your app over your local Wi-Fi network, or showing it to someone remotely using a free secure tunnel.

### 1. Share on Local Network (Wi-Fi)
Anyone on your home or office Wi-Fi can open your app.
1. Find your computer's local IP address (open PowerShell and type `ipconfig`). Look for **IPv4 Address** (e.g. `192.168.1.15`).
2. Update the frontend's `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://192.168.1.15:5000/api
   ```
3. Update the backend's `.env` file:
   ```env
   CLIENT_URL=http://192.168.1.15:3000
   ```
4. Start both apps:
   - Backend: `npm run dev` or `npm start`
   - Frontend: `npm run dev` or `npm run build && npm start`
5. Other devices can now visit: `http://192.168.1.15:3000`

### 2. Public Secure Tunneling (ngrok)
Generate a public URL that works anywhere in the world, running directly from your computer!
1. Install **ngrok** globally:
   ```bash
   npm install ngrok -g
   ```
2. Start your backend and frontend servers locally as usual.
3. Open a terminal and tunnel the frontend (port 3000):
   ```bash
   ngrok http 3000
   ```
   Copy the secure URL provided by ngrok (e.g., `https://xxxx-xx.ngrok-free.app`).
4. Open a second terminal and tunnel the backend API (port 5000):
   ```bash
   ngrok http 5000
   ```
   Copy the secure API URL provided by ngrok (e.g., `https://yyyy-yy.ngrok-free.app`).
5. Update your environmental variables:
   - In `backend/.env`: `CLIENT_URL=https://xxxx-xx.ngrok-free.app`
   - In `frontend/.env.local`: `NEXT_PUBLIC_API_URL=https://yyyy-yy.ngrok-free.app/api`
6. Restart both servers. Now your app is accessible worldwide via the ngrok URL!

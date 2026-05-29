#!/bin/bash
source ~/.bashrc

set -e 
#make sure we're in the right directory
cd ~/BruinBet
#get latest version
git pull origin main
#install server and run server
cd server
npm install
pm2 restart bruinbet-server || pm2 start index.js --name "bruinbet-server"
#run client
cd ../client
npm install --include=dev
#important for prod
echo "VITE_API_BASE_URL=https://api.bruin.bet" > .env
echo "Building client..."
npm run build
echo "Starting frontend preview server..."
pm2 restart bruinbet-client || pm2 start npx --name "bruinbet-client" -- vite preview --host --port 5173
cd ../server
#seed
npm run seed
echo "Deployment complete!"

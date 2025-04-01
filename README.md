# l7-dstat
Overcomplicated Layer 7 DSTAT website made by v0 dev.
Demo: https://unhittable.club
![image](https://github.com/user-attachments/assets/af08c704-ca0f-48c0-8e29-364aaf07c6ec)

# How to start?
1. Install nginx
2. create a new text file in /etc/nginx/sites-enabled
3. Paste this in new file (change domain.com to your domain)
```
server {
    listen 80;
    server_name www.domain.com domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    location /nginx_status {
        stub_status on;
        access_log off;
    }
}
```

4. Download repository as Zip and unarchive.
5. Install Node JS
`curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash`
6. Create new project
`npx create-next-app@latest .`
(1. Yes, 2. Yes, 3. Yes, 4. No, 5. Yes, 6. Yes, 7. No)
7. Copy files from archive to the project folder overwriting everything
8. Run these commands (you might also need to install some dependencies. read error log for dependencies and install them if needed):
```
npm install tailwind-merge --force
npm audit fix --force
npm run build
npm start
```

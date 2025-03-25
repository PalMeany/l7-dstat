# l7-dstat
Overcomplicated Layer 7 DSTAT website made by v0 dev
Demo: unhittable.club

# How to start?
1. Install nginx
2. create a new text file in /etc/nginx/sites-enabled
3. Paste this in new file
'''
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
        # Turn on stats
        stub_status on;
        access_log off;
    }
}
'''

4. Download repository as Zip and unarchive.
5. Install Node JS
'curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash'
6. Create new project
'npx create-next-app@latest .'
7. Copy files from archive to the project folder overwriting everything
8. Run these commands:
'''
npm run build
npm start
'''

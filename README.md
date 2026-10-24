# Nginx Server visual

An interactive, responsive, beginner-friendly visualization of how a web request reaches NGINX on an AWS EC2 instance and how static website files are returned to the visitor.

**Branding:** `#Buildwithvinit`  
**Stack:** HTML, CSS, vanilla JavaScript, SVG  
**Build step:** None — open `index.html` or serve the folder with a static web server.

> This is an educational project. The landing-page preview uses original CSS-generated artwork and a fictional streaming-inspired brand called **N Verse**. It is not affiliated with or endorsed by Netflix. No Netflix source code, logos, or proprietary artwork are included.

## Features

- Nine clickable learning steps with auto-play every five seconds
- Pause/resume, reset, previous/next, keyboard arrows and command-copy button
- Animated SVG infrastructure map for browser, internet, security group, EC2, NGINX and site files
- Request/response packet animation for HTTP flow
- Original streaming-inspired page preview with hero artwork and interactive poster cards
- Dark/light theme and responsive layout
- Beginner-friendly explanation, command examples and interview tips per step
- No framework, package manager or build process

## Run locally

1. Download and extract the ZIP.
2. Open `index.html` in a modern browser.
3. For a local HTTP server, from the project folder run:

   ```bash
   python -m http.server 8080
   ```

   Then visit `http://localhost:8080`.

## Deploy to GitHub Pages

1. Create a GitHub repository, for example `nginx-server-visual`.
2. Upload all project files and folders to the repository root. Keep `index.html`, `css/`, `js/`, `assets/`, `.nojekyll`, `LICENSE` and `README.md` together.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/(root)`, then click **Save**.
6. Wait for the Pages deployment to finish. The URL will look like:

   `https://YOUR-USERNAME.github.io/nginx-server-visual/`

GitHub Pages hosts the **visualization itself** as static files. It does not create an EC2 instance or run NGINX. To learn the real server path, deploy the same site on EC2 using the steps below.

## Deploy the visualization to AWS EC2 (Amazon Linux 2023)

### 1. Launch the instance

- Launch an Amazon Linux 2023 EC2 instance in a suitable VPC/subnet.
- For a public test, assign a public IPv4 address and ensure the subnet route table has a route to an Internet Gateway.
- Create/select a key pair and save the private key securely.
- In the security group, allow **HTTP TCP 80 from `0.0.0.0/0`** for a public demo.
- Allow **SSH TCP 22 only from your trusted public IP `/32`**. Do not expose SSH to everyone.
- Consider cost, account eligibility and regional pricing before launching resources.

### 2. Connect over SSH

From a terminal with your key file:

```bash
chmod 400 my-key.pem
ssh -i my-key.pem ec2-user@EC2_PUBLIC_IP
```

On Windows, Git Bash supports the `chmod` command; use the correct path to your key file. Replace `EC2_PUBLIC_IP` with the instance's actual public IPv4 address.

### 3. Install and start NGINX

```bash
sudo dnf update -y
sudo dnf install nginx -y
sudo systemctl enable --now nginx
sudo systemctl status nginx --no-pager
curl -I http://localhost
```

### 4. Upload the project

Run the following command **from your local computer**, in the directory containing the extracted `Nginx Server visual` folder. Replace the key path and public IP.

```bash
scp -i /path/to/my-key.pem -r "Nginx Server visual/"* ec2-user@EC2_PUBLIC_IP:/home/ec2-user/nginx-server-visual/
```

If the destination directory does not exist yet, create it first over SSH:

```bash
mkdir -p ~/nginx-server-visual
```

Then from the EC2 SSH session copy the project into NGINX's document root:

```bash
sudo cp -r ~/nginx-server-visual/. /usr/share/nginx/html/
sudo find /usr/share/nginx/html -maxdepth 2 -type f
sudo systemctl reload nginx
```

If SCP complains that the remote destination is missing, create it with SSH before repeating SCP. Alternatively, use SFTP or upload the files using another secure transfer method.

### 5. Test in a browser

Open:

`http://EC2_PUBLIC_IP/`

Also test locally on EC2:

```bash
curl -I http://localhost
sudo ss -lntp | grep ':80'
```

A successful response commonly includes `HTTP/1.1 200 OK`. For a production deployment, use a domain name and HTTPS/TLS, tighten network rules and apply normal server hardening.

## Troubleshooting checklist

- **Browser times out:** check instance state, public IPv4, subnet route to Internet Gateway, network ACLs and security group inbound TCP/80.
- **Connection refused:** check `sudo systemctl status nginx --no-pager` and `sudo ss -lntp | grep ':80'`.
- **Local curl fails:** inspect `sudo tail -n 50 /var/log/nginx/error.log` and `sudo journalctl -u nginx --no-pager -n 50`.
- **Default page still appears:** confirm `index.html` is in `/usr/share/nginx/html/` and the active NGINX configuration points to that document root.
- **Styles/scripts missing:** confirm `css/style.css` and `js/app.js` exist with matching paths and readable permissions.

## Interview-ready explanation

“When a visitor opens the EC2 public IP, the browser sends an HTTP request to port 80. The route and network controls must allow the traffic, including the EC2 security group. NGINX listens for the request, maps the URL to its document root, reads `index.html` and related static assets, and returns an HTTP response. The browser then downloads CSS, JavaScript and any images needed to render the page. If it fails, I check reachability and security rules first, then the NGINX service, listener, local `curl`, document root and logs.”

## Keyboard controls

- `←` previous step
- `→` next step
- `Space` pause/resume auto-play

## Project structure

```text
Nginx Server visual/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── assets/
│   └── README.md
├── .nojekyll
├── LICENSE
└── README.md
```

## Credits and disclaimer

Created as a learning project for cloud and web-server fundamentals. Branding tag: **#Buildwithvinit**. The fictional N Verse title, posters and artwork are original CSS illustrations made for this project. Streaming-service references describe the visual style only and do not imply affiliation.

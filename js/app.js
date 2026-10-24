(() => {
  "use strict";
  const steps = [
    {title:"Launch an EC2 instance",icon:"☁",simple:"Think of EC2 as renting a computer in AWS. It will run Linux and host our website.",technical:"Launch an Amazon Linux 2023 instance in a VPC subnet. Attach an instance profile only if the workload needs AWS API access; use a public IPv4 address or another reachable entry point for a public demo.",command:"# AWS Console → EC2 → Launch instance\n# AMI: Amazon Linux 2023 • Instance type: t2.micro/t3.micro (if eligible)\n# Configure key pair, VPC/subnet and public IP",tip:"Interview tip: EC2 is AWS's resizable compute service.",eyebrow:"STEP 01 / INFRASTRUCTURE",nodes:["ec2"],paths:[],preview:"Preview: preparing the host"},
    {title:"Configure the security group",icon:"⛨",simple:"A security group is like a virtual door guard. It decides which network traffic is allowed to reach the instance.",technical:"Add an inbound TCP rule for port 80 from the intended audience (0.0.0.0/0 for a deliberately public demo). Allow SSH on port 22 only from your trusted public IP, not from everywhere. Outbound rules also affect connections initiated by the instance.",command:"# Inbound rules (recommended for a lab)\nHTTP  TCP  80  Source: 0.0.0.0/0\nSSH   TCP  22  Source: YOUR_PUBLIC_IP/32\n# Keep SSH restricted to a trusted IP.",tip:"Interview tip: security groups are stateful virtual firewalls attached to ENIs.",eyebrow:"STEP 02 / NETWORK SECURITY",nodes:["security"],paths:[0],preview:"Preview: checking network access"},
    {title:"Connect to the instance",icon:"⌘",simple:"SSH gives you a secure terminal session so you can install software and manage your Linux server.",technical:"Use the private key that matches the EC2 key pair. The instance must be reachable, SSH must be allowed from your IP, and the username for Amazon Linux is typically ec2-user.",command:"# On macOS/Linux/Git Bash — replace placeholders\nchmod 400 my-key.pem\nssh -i my-key.pem ec2-user@EC2_PUBLIC_IP\n\n# Windows PowerShell: use your downloaded .pem key\n# Keep private keys secret; never commit them to GitHub.",tip:"Interview tip: SSH uses TCP port 22. Prefer Systems Manager Session Manager where practical.",eyebrow:"STEP 03 / SECURE ACCESS",nodes:["ec2"],paths:[0,1],preview:"Preview: terminal connected"},
    {title:"Install NGINX",icon:"↓",simple:"NGINX is the web server software. We install it so Linux knows how to answer browser requests for website files.",technical:"Amazon Linux 2023 uses dnf. The package manager downloads NGINX and its dependencies from configured repositories.",command:"sudo dnf install nginx -y\n\n# Confirm package details\nnginx -v",tip:"Interview tip: NGINX can serve static files and also act as a reverse proxy or load balancer.",eyebrow:"STEP 04 / PACKAGE INSTALL",nodes:["ec2","nginx"],paths:[1,2],preview:"Preview: NGINX installed"},
    {title:"Start and enable NGINX",icon:"▶",simple:"Starting runs NGINX now. Enabling makes it start automatically after a server reboot.",technical:"systemd manages the service. Check its active state and review logs if it fails. The process must listen on the intended address and port.",command:"sudo systemctl enable --now nginx\nsudo systemctl status nginx --no-pager\n\n# Verify the local HTTP response\ncurl -I http://localhost",tip:"Interview tip: enable and start are different actions; --now combines them.",eyebrow:"STEP 05 / SERVICE HEALTH",nodes:["ec2","nginx"],paths:[2,3],preview:"Preview: NGINX is running"},
    {title:"Publish the website files",icon:"▤",simple:"HTML gives the page its structure, CSS makes it look cinematic, JavaScript adds interactions, and images provide artwork.",technical:"The default Amazon Linux NGINX document root is commonly /usr/share/nginx/html/. Put index.html there and ensure the NGINX worker can read the files. Custom NGINX configurations may use another root.",command:"sudo cp index.html /usr/share/nginx/html/index.html\nsudo mkdir -p /usr/share/nginx/html/css /usr/share/nginx/html/js\n# Copy css/style.css and js/app.js into their folders\nsudo find /usr/share/nginx/html -maxdepth 2 -type f",tip:"Interview tip: static content is served as files; no application runtime is needed for this demo.",eyebrow:"STEP 06 / STATIC CONTENT",nodes:["nginx"],paths:[3],preview:"Preview: files published"},
    {title:"Send a browser request",icon:"↗",simple:"When a visitor opens the public IP, the browser sends an HTTP request. The request must pass the network path and security rules.",technical:"The browser resolves the host (or uses the IP), opens a TCP connection to port 80, then sends an HTTP request such as GET /. A real production site should use a DNS name and HTTPS/TLS.",command:"# From your local browser, open:\nhttp://EC2_PUBLIC_IP\n\n# Or test from another terminal:\ncurl -v http://EC2_PUBLIC_IP/",tip:"Interview tip: HTTP port 80 is unencrypted. Use HTTPS (443) with TLS for production.",eyebrow:"STEP 07 / HTTP REQUEST",nodes:["browser","internet","security","ec2","nginx"],paths:[0,1,2,3],preview:"Preview: request in transit"},
    {title:"NGINX returns the page",icon:"↩",simple:"NGINX finds the requested files and sends them back. Your browser reads the HTML, downloads CSS and JavaScript, and paints the page.",technical:"NGINX maps the URI to its configured root/index, reads the requested static asset, and returns an HTTP status such as 200 OK. Missing files may return 404; permission or configuration issues can cause errors.",command:"# On EC2, test the local web server\ncurl -I http://localhost\n\n# Expected response includes a status line such as:\n# HTTP/1.1 200 OK",tip:"Interview tip: HTTP status codes help distinguish success (2xx), redirects (3xx) and errors (4xx/5xx).",eyebrow:"STEP 08 / RESPONSE",nodes:["nginx","ec2","browser"],paths:[3,2,1,0],preview:"Preview: page delivered"},
    {title:"Troubleshoot systematically",icon:"⚙",simple:"If the page does not open, check the public IP, security group, service status, and local response one at a time.",technical:"Separate network reachability from service health. Confirm the instance is running and has the expected public IP; verify inbound TCP/80, NGINX status, listener sockets, local curl output, and relevant logs.",command:"sudo systemctl status nginx --no-pager\nsudo ss -lntp | grep ':80'\ncurl -I http://localhost\nsudo tail -n 50 /var/log/nginx/error.log\n\n# Also check: EC2 state, public IP, subnet route,\n# internet gateway, network ACL and security group.",tip:"Interview tip: diagnose layer by layer; do not open SSH to 0.0.0.0/0 as a shortcut.",eyebrow:"STEP 09 / TROUBLESHOOTING",nodes:["security","ec2","nginx"],paths:[0,2,3],preview:"Preview: diagnostic checklist"}
  ];

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const state = {index:0, playing:true, timer:null, toastTimer:null};
  const navItems = $$(".step-item");
  const requestPacket = $(".packet-request");
  const responsePacket = $(".packet-response");
  const requestPaths = $$(".flow-request");
  const responsePaths = $$(".flow-response");

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }
  function setPacketPosition(packet, x, y) {
    packet.setAttribute("transform", `translate(${x} ${y})`);
  }
  function animatePackets(index) {
    requestPacket.classList.remove("show");
    responsePacket.classList.remove("show");
    requestPaths.forEach((path, i) => path.classList.toggle("animated", index >= 6 && i <= 3));
    responsePaths.forEach((path, i) => path.classList.toggle("animated", index === 7 && i <= 3));
    if (index === 6 || index === 7) {
      requestPacket.classList.add("show");
      responsePacket.classList.toggle("show", index === 7);
      const reqMotion = [{x:145,y:230},{x:245,y:230},{x:425,y:230},{x:610,y:230},{x:800,y:230}];
      const resMotion = [{x:800,y:258},{x:725,y:258},{x:610,y:258},{x:535,y:258},{x:335,y:258},{x:245,y:258},{x:145,y:258}];
      let pos = 0;
      setPacketPosition(requestPacket, reqMotion[0].x, reqMotion[0].y);
      setPacketPosition(responsePacket, resMotion[0].x, resMotion[0].y);
      const packetTimer = setInterval(() => {
        if (state.index !== index) { clearInterval(packetTimer); return; }
        pos += 1;
        const p = reqMotion[Math.min(pos, reqMotion.length - 1)];
        setPacketPosition(requestPacket, p.x, p.y);
        const r = resMotion[Math.min(pos, resMotion.length - 1)];
        setPacketPosition(responsePacket, r.x, r.y);
        if (pos >= Math.max(reqMotion.length, resMotion.length) - 1) clearInterval(packetTimer);
      }, 220);
    }
  }
  function renderStep(index) {
    state.index = (index + steps.length) % steps.length;
    const step = steps[state.index];
    navItems.forEach((item, i) => {
      item.classList.toggle("active", i === state.index);
      item.querySelector(".step-state").textContent = i === state.index ? "●" : (i < state.index ? "✓" : "○");
      item.setAttribute("aria-current", i === state.index ? "step" : "false");
    });
    $("#progressFill").style.width = `${((state.index + 1) / steps.length) * 100}%`;
    $("#stepCounter").textContent = `${String(state.index + 1).padStart(2,"0")} / 09`;
    $("#stepTitle").textContent = step.title;
    $("#lessonIcon").textContent = step.icon;
    $("#simpleText").textContent = step.simple;
    $("#technicalText").textContent = step.technical;
    $("#commandText").textContent = step.command;
    $("#stepTip").textContent = step.tip;
    $("#diagramEyebrow").textContent = step.eyebrow;
    $("#previewStatus").textContent = step.preview;
    $$(".node").forEach(node => node.classList.toggle("active", step.nodes.includes(node.dataset.node)));
    animatePackets(state.index);
  }
  function startTimer() {
    clearInterval(state.timer);
    state.timer = setInterval(() => { if (state.playing) renderStep(state.index + 1); }, 5000);
  }
  function updatePlayButton() {
    $("#playIcon").textContent = state.playing ? "Ⅱ" : "▶";
    $("#playLabel").textContent = state.playing ? "Pause tour" : "Resume tour";
  }

  navItems.forEach(item => item.addEventListener("click", () => renderStep(Number(item.dataset.step))));
  $("#playPause").addEventListener("click", () => {
    state.playing = !state.playing;
    updatePlayButton();
    showToast(state.playing ? "Auto-play resumed · 5 seconds per step" : "Auto-play paused");
  });
  $("#resetBtn").addEventListener("click", () => {
    state.playing = false;
    updatePlayButton();
    renderStep(0);
    showToast("Tour reset to step 01");
  });
  $("#prevStep").addEventListener("click", () => renderStep(state.index - 1));
  $("#nextStep").addEventListener("click", () => renderStep(state.index + 1));
  $("#copyCommand").addEventListener("click", async () => {
    const command = $("#commandText").textContent;
    try {
      await navigator.clipboard.writeText(command);
      showToast("Step commands copied");
    } catch (_) {
      const area = document.createElement("textarea");
      area.value = command; document.body.appendChild(area); area.select();
      const copied = document.execCommand("copy"); area.remove();
      showToast(copied ? "Step commands copied" : "Copy unavailable — select the command text");
    }
  });
  $("#themeToggle").addEventListener("click", () => {
    const html = document.documentElement;
    const next = html.dataset.theme === "dark" ? "light" : "dark";
    html.dataset.theme = next;
    $("#themeToggle").textContent = next === "dark" ? "☼" : "☾";
    showToast(`${next === "dark" ? "Dark" : "Light"} mode enabled`);
  });
  const dialog = $("#infoDialog");
  $("#infoButton").addEventListener("click", () => dialog.showModal());
  $("#closeDialog").addEventListener("click", () => dialog.close());
  $("#dialogGotIt").addEventListener("click", () => dialog.close());
  $("#watchButton").addEventListener("click", () => {
    renderStep(6);
    showToast("Story started: follow the HTTP request in the diagram");
  });
  $$(".poster").forEach(poster => poster.addEventListener("click", () => {
    showToast(`${poster.dataset.movie} · Original learning artwork`);
  }));
  document.addEventListener("keydown", event => {
    if (event.target.matches("input,textarea,button,a")) return;
    if (event.key === "ArrowRight") renderStep(state.index + 1);
    if (event.key === "ArrowLeft") renderStep(state.index - 1);
    if (event.key === " ") { event.preventDefault(); state.playing = !state.playing; updatePlayButton(); }
  });
  renderStep(0);
  updatePlayButton();
  startTimer();
})();

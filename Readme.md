# Semantec Enterprise Homelab Infrastructure

This document outlines the architecture, initialization, and maintenance procedures for the Semantec Local IT Infrastructure. The environment utilizes a decoupled storage architecture (VHDX over PCIe 4.0 NVMe) running inside WSL2 (Ubuntu) with Mirrored Networking and a strict containerized microservice topology.

---

## 1. Service Catalog & Technical Specifications

### 🌐 Core Infrastructure
| Service | Endpoint | Designation | Peculiarities |
| :--- | :--- | :--- | :--- |
| **CoreDNS** | `192.168.0.22:53` | Primary DNS resolver. | Routes `*.semantec.lan` to local host. Forwards external queries. |
| **Caddy** | `https://*.semantec.lan` | Edge Reverse Proxy & TLS. | Uses `local_certs` to act as an internal CA. Generates SSL certificates on-the-fly. |
| **Homelab Portal**| [https://semantec.lan](https://semantec.lan) | Frontend UI / Entrypoint. | Custom HTML5/JS. Fetches live status via VictoriaMetrics API. |
| **Dashy** | [https://dashy.semantec.lan](https://dashy.semantec.lan) | NOC Dashboard. | Driven by `conf.yml`. Embeds Grafana iframes and Portainer API data. |
| **Portainer** | [https://portainer.semantec.lan](https://portainer.semantec.lan) | Container Orchestration. | Mounts `docker.sock`. Used for rapid stack inspection and log tailing. |

### 💻 Development & Collaboration
| Service | Endpoint | Designation | Peculiarities |
| :--- | :--- | :--- | :--- |
| **GitLab** | [https://gitlab.semantec.lan](https://gitlab.semantec.lan) | SCM & CI/CD. | Heavy I/O. Relies on internal Nginx. Exposed SSH on port 2222. |
| **Confluence** | [https://confluence.semantec.lan](https://confluence.semantec.lan) | Team Wiki. | Java/JVM based. Coupled with dedicated PostgreSQL container. |
| **Secure Mail** | [https://mail.semantec.lan](https://mail.semantec.lan) | Mail Server & Webmail. | `docker-mailserver` backend, `roundcube` frontend via PHP-FPM. |

### 👁️ Observability Stack (CNCF)

---

## 2. Cold Start Instructions (First-Time Initialization)

Perform these steps strictly in order during the initial deployment.

### Phase 1: Host Preparation & Spin-Up
1. **Initialize Storage:** Run `.\manage-homelab.ps1 -Action Mount` as Administrator in Windows. Verify disks are mounted in WSL (`df -h`).
2. **Start Infrastructure:** 
   ```bash
   docker compose up -d
   ```
3. **Trust Local CA (Crucial for HTTPS):**
   * Navigate to `\\wsl.localhost\Ubuntu-26.04\mnt\wsl\services\caddy\data\caddy\pki\authorities\local` in Windows Explorer.
   * Double-click `root.crt` -> **Install Certificate** -> **Local Machine** -> Place in **Trusted Root Certification Authorities**.
   * OR just execute script `./scripts/root-cert.ps1` from Administrator Powershell console
4. **Set Local DNS:** Change your Windows IPv4 DNS adapter settings. Set Primary DNS to `192.168.0.22`.

### Phase 2: Service Coupling & Configuration
**1. Portainer ([Setup](https://portainer.semantec.lan))**
* Create the initial admin account.
  > semantec : Semantec1973
* Go to **My Account** -> **Access tokens** -> Add token named `dashy`. Copy the token.
  > ptr_yjgPpdemPm+wrEmd2hQkfFwTremDnoPX3/dX+/h2B20=
* Paste this token into your `./dashy/conf.yml` under the `portainer` widget `apiKey` field.

**3. Grafana ([Setup](https://grafana.semantec.lan))**
* Login with `admin` / `Semantec1973`. (Skip password change if prompted).
* Navigate to **Dashboards** -> **Import**: Import ID `1860` (Node Exporter Full).
* *Note: Refresh Dashy; the system monitor iframe should now render securely.*

**4. GitLab ([Setup](https://gitlab.semantec.lan))**
* It takes ~5 minutes to fully boot initially.

* If everything goes well, at the end this command `docker exec -it gitlab gitlab-ctl status` should show healthy status:
  ```bash
  run: gitaly: (pid 578) 141s; run: log: (pid 631) 138s
  run: gitlab-pages: (pid 1171) 105s; run: log: (pid 1206) 102s
  run: gitlab-workhorse: (pid 1530) 70s; run: log: (pid 1066) 114s
  run: logrotate: (pid 501) 153s; run: log: (pid 526) 150s
  run: mattermost: (pid 1576) 69s; run: log: (pid 1446) 90s
  run: nginx: (pid 1094) 111s; run: log: (pid 1139) 107s
  run: postgresql: (pid 641) 135s; run: log: (pid 931) 132s
  run: puma: (pid 934) 129s; run: log: (pid 959) 126s
  run: redis: (pid 536) 147s; run: log: (pid 553) 145s
  run: registry: (pid 1550) 69s; run: log: (pid 1242) 96s
  run: sidekiq: (pid 965) 123s; run: log: (pid 1006) 121s
  run: sshd: (pid 43) 163s; run: log: (pid 42) 163s
  ```

* To get the initial root password, run in WSL:
  `docker exec -it gitlab grep 'Password:' /etc/gitlab/initial_root_password`

* Login as `root` and immediately change the password in user settings.
  > root : Semantec1973

* Fix 1: "Web IDE single origin fallback is enabled"
This warning appears because using the same domain for running untrusted third-party VS Code Web IDE extensions poses a cross-site scripting (XSS) risk. In a local homelab, you can securely suppress this warning by telling GitLab it is intended behavior.
   1. Click on your profile avatar in the left sidebar and select Admin Area (Администрирование).
   2. Navigate to Settings (Настройки) → General (Общие).
   3. Scroll down to the Web IDE section and click Expand (Развернуть).
   4. Uncheck the box that says Enable Single Origin Fallback for Web IDE.
   5. Scroll down and click Save changes (Сохранить изменения).

* Fix 2: "Check the restrictions for new users"
This warning triggers because anyone who can reach your GitLab landing page can click "Register" and create an account. To block random users from signing up:
   1. Inside the Admin Area, navigate to Settings (Настройки) → General (Общие).
   2. Scroll down to the *New user account restrictions* (Ограничения при регистрации) section and click Expand (Развернуть).
   3. Uncheck the box that says *Allow new user accounts* (Регистрация разрешена).
   4. Scroll down and click Save changes (Сохранить изменения).
Note: Existing users and admins can still manually create or invite new user accounts from the Admin panel.

**5. Mailserver Setup**
* To create the first email account (e.g., admin), run in WSL:
  `docker exec -ti mailserver setup email add admin@semantec.lan <your_password>`
* Log into [Webmail](https://mail.semantec.lan) using those credentials.

---

## 3. Warm Start & Maintenance

### Warm Start (Daily Operations)
The system is designed for **Zero-Touch Warm Starts**.
1. Boot Windows 11.
2. The Scheduled Task automatically triggers WSL, mounts the VHDX drives idempotenly, and links them.
3. The WSL `systemd` daemon initializes the Docker Engine.
4. Docker automatically starts all containers with `restart: unless-stopped`.
5. *Time to ready:* ~15 seconds after Windows logon. Navigate to [https://semantec.lan](https://semantec.lan).

### System Maintenance
**1. Updating Services**
Use Docker Compose to pull and recreate services without touching data:
```bash
docker compose pull
docker compose up -d
```

**2. VHDX Compaction (Storage Reclamation)**
Because Dynamic VHDX files expand but do not automatically shrink when data is deleted in Linux, perform this monthly:
1. In Windows PowerShell (Admin): `.\manage-homelab.ps1 -Action Unmount`
2. Run Hyper-V optimization:
   ```powershell
   Optimize-VHD -Path "D:\vhdx\workspace.vhdx" -Mode Full
   Optimize-VHD -Path "D:\vhdx\services.vhdx" -Mode Full
   ```
3. Remount: `.\manage-homelab.ps1 -Action Mount`

**3. Adding New Services**
To add a new service (e.g., Nextcloud) and ensure it integrates automatically:
1. Add the service to `main.yml`.
2. Add Prometheus labels to the container:
   ```yaml
   labels:
     - "prometheus.scrape=true"
     - "prometheus.port=<PORT>"
     - "service.name=nextcloud"
   ```
3. Add the routing rule to `Caddyfile`.
4. Add the local IP mapping to `Corefile`.
5. Run `docker compose up -d`. DNS, TLS, Logs (via Promtail), and Metrics (via Auto-Discovery) will configure instantly.
```

-------------------------------------------------------------------------------------------------------------
|         |          CPU          |          RAM          |                      NVMe                       |
| Service | Docker, % | System, % | Docker, % | System, % | Read, GB | Read, IOPS | Write, GB | Write, IOPS |
-------------------------------------------------------------------------------------------------------------
# DB Connection Guide (SQL Server)

This project uses a **Node.js/Express** backend (`api/`) and connects to **Microsoft SQL Server** using the Node package **`mssql`** (which uses the **tedious** driver).

Because of that, two things are important:

- SQL Server must be reachable via **TCP/IP** (not only Shared Memory).
- The simplest/auth-friendly approach is using **SQL Authentication** (username/password).

---

## Backend environment variables

Create/update `api/.env`:

```env
PORT=5000
JWT_SECRET=change_me
FRONTEND_URL=http://localhost:3000

# Recommended (SQL Authentication)
DB_CONNECTION_STRING=Server=127.0.0.1,1433;Database=RecycleX;User Id=recyclexapp;Password=StrongPass123!;Encrypt=False;TrustServerCertificate=True;
```

---

## 1) Make sure SQL Server is running

Open **Services** and ensure one of these is **Running**:

- **SQL Server (MSSQLSERVER)** (default instance)
- **SQL Server (MSSQL$\<InstanceName\>)** (named instance)

If it’s stopped, start it.

---

## 2) Enable TCP/IP and set a fixed port (1433)

The Node driver connects over TCP. If TCP is disabled, you may see:

- `Failed to connect to localhost:1433`

### Option A (recommended): SQL Server Configuration Manager

1. Open **SQL Server Configuration Manager**
2. Go to **SQL Server Network Configuration** → **Protocols for \<your instance\>**
3. Enable **TCP/IP**
4. Open **TCP/IP** → **IP Addresses** → **IPAll**
   - Set **TCP Port** to `1433`
   - Set **TCP Dynamic Ports** to empty (or `0`)
5. Restart the SQL Server service

### Option B (workaround): check from SSMS

In SSMS, run:

```sql
SELECT local_net_address, local_tcp_port
FROM sys.dm_exec_connections
WHERE session_id = @@SPID;
```

- If you get `NULL` values, SSMS is using **Shared Memory**, and TCP may not be enabled yet.

---

## 3) Enable SQL Authentication (Mixed Mode)

This project uses `mssql` (tedious). The most reliable way is SQL Authentication.

### Enable Mixed Mode

In SSMS:

1. Right-click your server → **Properties**
2. Go to **Security**
3. Select **SQL Server and Windows Authentication mode**
4. Click OK
5. Restart SQL Server service

---

## 4) Create an application login/user

Run this in SSMS (edit the password first):

```sql
USE master;
GO
CREATE LOGIN recyclexapp WITH PASSWORD = 'StrongPass123!', CHECK_POLICY = OFF;
GO

USE RecycleX;
GO
CREATE USER recyclexapp FOR LOGIN recyclexapp;
GO
ALTER ROLE db_owner ADD MEMBER recyclexapp;
GO
```

Then use this in `api/.env`:

```env
DB_CONNECTION_STRING=Server=127.0.0.1,1433;Database=RecycleX;User Id=recyclexapp;Password=StrongPass123!;Encrypt=False;TrustServerCertificate=True;
```

---

## 5) Start the backend

```bash
cd api
npm install
npm start
```

If the connection is good, you should see a log like:

- `Database connected`
- `Server running on http://localhost:5000`

---

## 6) Quick test endpoint

Open in browser / Postman:

- `GET /api/health`

Expected response:

```json
{ "status": "Server is running" }
```

---

## Troubleshooting

### `Failed to connect to localhost:1433`

- SQL Server service is stopped
- TCP/IP is disabled
- Wrong port (if your instance uses another port)
- Firewall blocking inbound TCP 1433 (less common for localhost)

### `Login failed for user ''`

This happens when Windows Integrated auth isn’t being used and no SQL username was provided.

Fix:

- Enable **Mixed Mode**
- Use a SQL login in the connection string:

```env
DB_CONNECTION_STRING=Server=127.0.0.1,1433;Database=RecycleX;User Id=recyclexapp;Password=StrongPass123!;Encrypt=False;TrustServerCertificate=True;
```

### “Works in SSMS but not in Node”

SSMS can connect via Shared Memory; Node needs TCP.

Verify TCP is enabled and the port is fixed (1433 recommended).

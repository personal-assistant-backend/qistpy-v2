# QistPY — Network / LAN Setup

## Same PC (Default)

Works out of the box. Just run both servers.

```
http://localhost:4200    → Frontend
http://localhost:3000/api → Backend
```

---

## Other Device on Same WiFi

### Step 1 — Find your IP

```cmd
ipconfig
```
Note your `IPv4 Address` e.g. `192.168.25.13`

### Step 2 — Update 2 files

**File 1:** `apps\web\src\app\core\environment.ts`
```typescript
apiUrl: 'http://192.168.25.13:3000/api',
```

**File 2:** `.env` and `apps\api\.env`
```
CORS_ORIGINS=http://localhost:4200,http://localhost:3000,http://192.168.25.13:4200,http://192.168.25.13:3000
```

### Step 3 — Firewall (run as Administrator)

```cmd
netsh advfirewall firewall add rule name="QistPY API" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="QistPY Web" dir=in action=allow protocol=TCP localport=4200
```

### Step 4 — Restart Servers

```cmd
cd apps\web && rmdir /s /q .angular && cd ..\..
pnpm dev:api
pnpm dev:web
```

### Step 5 — Open on Other Device

```
http://192.168.25.13:4200
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Connection refused` | Run firewall commands (Step 3) |
| API errors on other device | Check `environment.ts` has IP, not localhost |
| CORS error | Check `.env` CORS_ORIGINS includes IP |
| `netstat` shows `[::1]:4200` | `package.json` start script needs `--host 0.0.0.0` |

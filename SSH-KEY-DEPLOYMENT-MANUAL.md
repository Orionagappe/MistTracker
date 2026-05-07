# SSH Public Key Deployment - Manual Steps

Since Paramiko authentication is failing (likely SSH server configuration), here are the manual steps to deploy your SSH public key:

## Your SSH Public Key

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDMQMHMlwSiG+jKB91w6qp5J5/UfcrzXFtNl5b7q/QYMCbSAYpK55lV2OsDtHpAo5HM8cpcRE/eRBPprX66cIF6OgCZ4hDvKJOjf+uZP8qOs2WZqpAkJGU65YeWJd25mPXFHpeDTwHlKtKfj6kFQ23dPCA8e4byOkghoK4nYkPJLjBGi7WAhV1NYub7BEzrNjpW1UqD9MLmiIfW7LHym3iDK7k8ob2R2mDQZUov6hwRXKjnRlJxWjMMmYTxWdGVF2u8pejuDixkWpv2Kkkmnc+0FKMcAMgCr514ROGlqG8KTQFGxjPInoWhbd88lYhVnDf7+3JWhfFgEj5sBZmytR0XBJ1Vi93lKDM2eq9Tk9W9TCtj3hKbKTirKYDrpJ4z9AY4O5/ETVr5EJ68LBMUBvcHYBriOyZvG0VhvpJGIUmkoaprjrYLQRn1lyfy07P2oBEc1QFiwzshpDD/WR8Czbc0+pKHfMPbSomzSRpmJpfVuUFYaVNem7Hbkm9rfFcbTas= s_bre@DESKTOP-IEUIJ85
```

## Deployment Steps (Copy-Paste Friendly)

### Step 1: SSH to Devuan
```bash
ssh orion@10.144.113.100
```
When prompted, enter password: `Popsnap1`

### Step 2: Create SSH directory and authorized_keys
```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
```

### Step 3: Add your public key
```bash
echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDMQMHMlwSiG+jKB91w6qp5J5/UfcrzXFtNl5b7q/QYMCbSAYpK55lV2OsDtHpAo5HM8cpcRE/eRBPprX66cIF6OgCZ4hDvKJOjf+uZP8qOs2WZqpAkJGU65YeWJd25mPXFHpeDTwHlKtKfj6kFQ23dPCA8e4byOkghoK4nYkPJLjBGi7WAhV1NYub7BEzrNjpW1UqD9MLmiIfW7LHym3iDK7k8ob2R2mDQZUov6hwRXKjnRlJxWjMMmYTxWdGVF2u8pejuDixkWpv2Kkkmnc+0FKMcAMgCr514ROGlqG8KTQFGxjPInoWhbd88lYhVnDf7+3JWhfFgEj5sBZmytR0XBJ1Vi93lKDM2eq9Tk9W9TCtj3hKbKTirKYDrpJ4z9AY4O5/ETVr5EJ68LBMUBvcHYBriOyZvG0VhvpJGIUmkoaprjrYLQRn1lyfy07P2oBEc1QFiwzshpDD/WR8Czbc0+pKHfMPbSomzSRpmJpfVuUFYaVNem7Hbkm9rfFcbTas= s_bre@DESKTOP-IEUIJ85' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Step 4: Verify
```bash
exit
```

### Step 5: Test key-based authentication
```bash
ssh -o BatchMode=yes orion@10.144.113.100 whoami
```

If successful, you should see: `orion` (no password prompt)

## Alternative: One-Command Deployment

If you SSH to the server, you can paste this entire command in one go:

```bash
mkdir -p ~/.ssh && echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDMQMHMlwSiG+jKB91w6qp5J5/UfcrzXFtNl5b7q/QYMCbSAYpK55lV2OsDtHpAo5HM8cpcRE/eRBPprX66cIF6OgCZ4hDvKJOjf+uZP8qOs2WZqpAkJGU65YeWJd25mPXFHpeDTwHlKtKfj6kFQ23dPCA8e4byOkghoK4nYkPJLjBGi7WAhV1NYub7BEzrNjpW1UqD9MLmiIfW7LHym3iDK7k8ob2R2mDQZUov6hwRXKjnRlJxWjMMmYTxWdGVF2u8pejuDixkWpv2Kkkmnc+0FKMcAMgCr514ROGlqG8KTQFGxjPInoWhbd88lYhVnDf7+3JWhfFgEj5sBZmytR0XBJ1Vi93lKDM2eq9Tk9W9TCtj3hKbKTirKYDrpJ4z9AY4O5/ETVr5EJ68LBMUBvcHYBriOyZvG0VhvpJGIUmkoaprjrYLQRn1lyfy07P2oBEc1QFiwzshpDD/WR8Czbc0+pKHfMPbSomzSRpmJpfVuUFYaVNem7Hbkm9rfFcbTas= s_bre@DESKTOP-IEUIJ85' >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys && echo "[OK] SSH key deployed"
```

## After Deployment

Once your SSH public key is deployed to `~/.ssh/authorized_keys`, you can:

1. **Use key-based SSH without passwords:**
   ```powershell
   ssh orion@10.144.113.100 'command here'
   ```

2. **Copy files via SCP without passwords:**
   ```powershell
   scp hardware-fitness-validator.js orion@10.144.113.100:~/misttracker/
   ```

3. **Deploy MistTracker automatically:**
   ```powershell
   .\deploy-via-ssh-keys.ps1
   ```

4. **Root escalation via su (still secure):**
   ```bash
   ssh orion@10.144.113.100 "echo 'popsnap2' | su -c 'whoami'"
   ```

## Verification Checklist

- [ ] SSH public key deployed to ~/.ssh/authorized_keys on Devuan
- [ ] File permissions: ~/.ssh (700), authorized_keys (600)
- [ ] Test key-based auth: `ssh -o BatchMode=yes orion@10.144.113.100 whoami`
- [ ] No password prompt appears
- [ ] Output shows: `orion`

Once completed, you're ready for automated MistTracker deployment!

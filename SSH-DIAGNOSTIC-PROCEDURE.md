═══════════════════════════════════════════════════════════════════════════════
  SSH AUTHENTICATION DIAGNOSTIC & RESOLUTION PLAN
  Target: Devuan Excaliber (10.144.113.100)
═══════════════════════════════════════════════════════════════════════════════

OBJECTIVE
─────────────────────────────────────────────────────────────────────────────
Diagnose why SSH password authentication repeatedly fails despite correct
credentials, and implement fixes to enable reliable remote access.

KNOWN ISSUES
─────────────────────────────────────────────────────────────────────────────
✗ SSH password auth rejected: "Permission denied (publickey,password)"
✗ Multiple password attempts fail (3+ retries rejected)
✗ Direct root SSH login appears disabled/restricted
✗ SU escalation with embedded passwords works, but interactive SSH fails
✓ Files transferable via SCP (partially working)
✓ System is responsive and functional

HYPOTHESIS
─────────────────────────────────────────────────────────────────────────────
SSH server configuration is restricting password authentication:
  a) PasswordAuthentication disabled in sshd_config
  b) PubkeyOnly mode enforced
  c) PermitRootLogin set to prohibit-password
  d) MaxAuthTries limit being exceeded
  e) LoginGraceTime timeout too short

═══════════════════════════════════════════════════════════════════════════════
DIAGNOSTIC PROCEDURE (On Devuan Console/Physical Access)
═══════════════════════════════════════════════════════════════════════════════

STEP 1: CHECK SSHD CONFIGURATION
─────────────────────────────────────────────────────────────────────────────

Execute on Devuan:

  $ sudo cat /etc/ssh/sshd_config | grep -E "^(Password|PubkeyOnly|PermitRootLogin|MaxAuth|LoginGrace|AuthenticationMethods)"

Expected output variants:

ISSUE CASE (current symptoms):
  PasswordAuthentication no
  PubkeyAuthentication yes
  PermitRootLogin prohibit-password
  MaxAuthTries 3
  LoginGraceTime 120

FIXED CASE (what we need):
  PasswordAuthentication yes
  PubkeyAuthentication yes
  PermitRootLogin yes
  MaxAuthTries 6
  LoginGraceTime 300


STEP 2: CHECK SSHD SERVICE STATUS
─────────────────────────────────────────────────────────────────────────────

Execute on Devuan (sysv-rc init):

  $ sudo /etc/init.d/ssh status

Look for: "is running" or "[OK]"

If not running:
  $ sudo /etc/init.d/ssh start

Alternative (if ssh service name is different):
  $ sudo /etc/init.d/sshd status
  $ sudo /etc/init.d/sshd start


STEP 3: CHECK SSH LOGS FOR REJECTION REASON
─────────────────────────────────────────────────────────────────────────────

Execute on Devuan:

  $ sudo tail -50 /var/log/auth.log | grep -E "(sshd|Failed password|Accepted)"

Look for patterns like:
  - "Failed password for [user]" → password is being rejected
  - "Accepted publickey" → key auth is working
  - "PermitRootLogin" messages → root login restrictions
  - "MaxAuthTries exceeded" → hitting retry limit


STEP 4: TEST LOCAL SSH CONNECTION
─────────────────────────────────────────────────────────────────────────────

Execute on Devuan:

  $ ssh -v localhost
  $ ssh -v orion@localhost
  $ ssh -v root@localhost

Supply password when prompted. Look for:
  - "Authentication succeeded" → local auth works
  - "Permission denied" → same error as remote
  - Verbose output will show auth method being attempted


STEP 5: TEST REMOTE SSH FROM WINDOWS
─────────────────────────────────────────────────────────────────────────────

From Windows (PowerShell):

  ssh -vvv orion@10.144.113.100

Enable triple-verbose to see detailed auth negotiation.
Look for "Authentications that can continue" line - shows what methods
the server is allowing.

Expected: "publickey,password"
Actual (likely): "publickey" only


═══════════════════════════════════════════════════════════════════════════════
RESOLUTION PROCEDURES (Pick based on diagnosis)
═══════════════════════════════════════════════════════════════════════════════

SOLUTION A: ENABLE PASSWORD AUTHENTICATION IN SSHD
─────────────────────────────────────────────────────────────────────────────

If diagnosis shows: PasswordAuthentication no

Execute on Devuan (as root or with sudo):

  $ sudo nano /etc/ssh/sshd_config

Find and modify these lines (uncomment if needed):

  PasswordAuthentication yes
  PubkeyAuthentication yes
  PermitRootLogin yes
  MaxAuthTries 6
  LoginGraceTime 300

Save (Ctrl+O, Enter, Ctrl+X)

Then restart SSH (Devuan sysv-rc):

  $ sudo /etc/init.d/ssh restart

Verify restart successful:

  $ sudo /etc/init.d/ssh status


SOLUTION B: INCREASE MaxAuthTries LIMIT
─────────────────────────────────────────────────────────────────────────────

If diagnosis shows: MaxAuthTries 3

The limit may be causing our retry attempts to be rejected.

Edit /etc/ssh/sshd_config:

  MaxAuthTries 6

Restart SSH (Devuan sysv-rc):

  $ sudo /etc/init.d/ssh restart

Then test from Windows again.


SOLUTION C: FIX ROOT LOGIN RESTRICTION
─────────────────────────────────────────────────────────────────────────────

If diagnosis shows: PermitRootLogin prohibit-password

This prevents direct root login with passwords (requires keys only).

For testing purposes, change to:

  PermitRootLogin yes

Restart SSH:

  $ sudo /etc/init.d/ssh restart

Now test:
  ssh -v root@10.144.113.100


SOLUTION D: CLEAR FAILED LOGIN ATTEMPTS
─────────────────────────────────────────────────────────────────────────────

If we've exceeded MaxAuthTries, we may be temporarily locked.

Execute on Devuan (restart SSH service):

  $ sudo /etc/init.d/ssh restart

This resets connection limits. Then try Windows SSH again.


SOLUTION E: DISABLE PAM RESTRICTIONS (LAST RESORT)
─────────────────────────────────────────────────────────────────────────────

If other solutions don't work, PAM may be restricting authentication.

Edit /etc/ssh/sshd_config:

  UsePAM no

Restart SSH:

  $ sudo /etc/init.d/ssh restart

WARNING: Disables some security features. Re-enable after testing.


═══════════════════════════════════════════════════════════════════════════════
TESTING PROCEDURE (After Each Fix)
═══════════════════════════════════════════════════════════════════════════════

After applying each solution:

1. FROM WINDOWS (PowerShell):
   $ ssh -v orion@10.144.113.100
   
   Supply password: Popsnap1
   
   Expected: "Authentication succeeded" or prompt for next command
   
2. IF SUCCESSFUL:
   $ whoami
   Output should show: orion
   
   $ exit

3. TEST WITH ROOT:
   $ ssh -v root@10.144.113.100
   
   Supply password: popsnap2
   
   Expected: "Authentication succeeded"
   
4. IF SUCCESSFUL:
   $ whoami
   Output should show: root
   
   $ exit

5. TEST SCP (FILE TRANSFER):
   $ scp test-file.txt orion@10.144.113.100:/tmp/
   
   Should complete without password prompt or accept password


═══════════════════════════════════════════════════════════════════════════════
VALIDATION CHECKLIST (After Fixes Confirmed Working)
═══════════════════════════════════════════════════════════════════════════════

□ SSH password auth works for orion user
□ SSH password auth works for root user
□ Multiple login attempts succeed without rejection
□ SCP file transfer works without interactive issues
□ SSH keys can be deployed if needed
□ SSH session remains stable for 5+ minutes
□ Can execute commands remotely (whoami, ls, cd, node)

═══════════════════════════════════════════════════════════════════════════════
HARDENED CONFIGURATION (After Confirming Workflow)
═══════════════════════════════════════════════════════════════════════════════

Once SSH authentication is working reliably, apply this secure config:

/etc/ssh/sshd_config (RECOMMENDED SETTINGS):

  # Authentication
  PermitRootLogin prohibit-password    # Root only with keys (secure)
  PasswordAuthentication yes             # Allow passwords for users
  PubkeyAuthentication yes               # Allow SSH keys
  MaxAuthTries 6                         # Allow multiple attempts
  LoginGraceTime 300                     # 5 minutes for initial connection
  
  # Security
  Protocol 2                             # SSH v2 only
  X11Forwarding no                       # Disable X11
  PermitUserEnvironment no               # Restrict env vars
  AllowUsers orion root                  # Whitelist users
  
  # Performance
  ClientAliveInterval 300                # Keep-alive every 5 min
  ClientAliveCountMax 2                  # Close after 10 min inactivity
  Compression delayed                    # Compress after auth

Restart after applying:

  $ sudo /etc/init.d/ssh restart


═══════════════════════════════════════════════════════════════════════════════
DEPLOYMENT IMPACT
═══════════════════════════════════════════════════════════════════════════════

Once SSH authentication is fixed:

✓ Enable automated SCP file deployment
✓ Enable remote command execution via SSH
✓ Enable automated monitoring and log collection
✓ Eliminate manual USB transfer workarounds
✓ Enable password-less automation with SSH keys
✓ Establish secure remote administration channel

═══════════════════════════════════════════════════════════════════════════════
FOLLOW-UP ACTIONS
═══════════════════════════════════════════════════════════════════════════════

AFTER FIXING SSH:

1. Test automated deployment script:
   $ .\deploy-all-dependencies.ps1 -NoInteractive
   
2. Test remote command execution:
   $ ssh orion@10.144.113.100 "node /home/orion/Desktop/misttracker/hardware-fitness-validator.js"
   
3. Deploy SSH keys for password-less access:
   $ ssh-copy-id -i ~/.ssh/id_rsa.pub orion@10.144.113.100
   
4. Test key-based authentication:
   $ ssh -i ~/.ssh/id_rsa orion@10.144.113.100 "whoami"
   
5. Update all deployment scripts to use non-interactive mode

═══════════════════════════════════════════════════════════════════════════════
Notes:
- Credentials: orion/Popsnap1, root/popsnap2 (lowercase)
- SSH port: 22 (standard)
- Config file: /etc/ssh/sshd_config
- Service: sshd (OpenBSD Secure Shell)
- Log location: /var/log/auth.log
- Devuan uses sysv-rc init (systemctl may not be available)
═══════════════════════════════════════════════════════════════════════════════

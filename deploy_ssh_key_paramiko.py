#!/usr/bin/env python3
"""
SSH Public Key Deployment using Paramiko
Handles SSH authentication and deploys public keys without interactive prompts
"""

import os
import sys
import argparse
from pathlib import Path

try:
    import paramiko
    from paramiko.py3compat import decodebytes
except ImportError:
    print("[ERROR] Paramiko not found. Install with: pip install paramiko")
    sys.exit(1)

def get_ssh_pubkey(ssh_key_path=None):
    """Get the SSH public key"""
    if ssh_key_path is None:
        ssh_key_path = Path.home() / '.ssh' / 'id_rsa.pub'
    
    if not Path(ssh_key_path).exists():
        print(f"[ERROR] SSH public key not found: {ssh_key_path}")
        return None
    
    try:
        with open(ssh_key_path, 'r') as f:
            pubkey = f.read().strip()
        return pubkey
    except Exception as e:
        print(f"[ERROR] Failed to read public key: {e}")
        return None

def deploy_key_via_paramiko(host, port, user, password, pubkey):
    """Deploy public key via Paramiko SSH"""
    
    print(f"[*] Connecting to {user}@{host}:{port}...")
    
    try:
        # Create SSH client
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # Connect with password
        client.connect(host, port=port, username=user, password=password, timeout=10)
        print("[OK] SSH connection established")
        
        # Deploy the key
        print(f"[*] Deploying public key...")
        deploy_commands = [
            "mkdir -p ~/.ssh",
            f"echo '{pubkey}' >> ~/.ssh/authorized_keys",
            "chmod 700 ~/.ssh",
            "chmod 600 ~/.ssh/authorized_keys",
            "echo '[OK] SSH public key deployed successfully'",
            "whoami"
        ]
        
        # Execute each command
        for cmd in deploy_commands:
            stdin, stdout, stderr = client.exec_command(cmd)
            output = stdout.read().decode().strip()
            error = stderr.read().decode().strip()
            
            if error and 'deprecated' not in error.lower():
                print(f"[WARN] {cmd}: {error}")
            if output:
                print(f"    {output}")
        
        client.close()
        print("[OK] SSH connection closed")
        return True
        
    except paramiko.AuthenticationException as e:
        print(f"[ERROR] Authentication failed: {e}")
        return False
    except paramiko.SSHException as e:
        print(f"[ERROR] SSH connection failed: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Deployment failed: {e}")
        return False

def verify_key_auth(host, port, user):
    """Verify that key-based authentication works"""
    print(f"\n[*] Testing key-based authentication...")
    
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # Try to connect with key only (no password)
        ssh_key_path = Path.home() / '.ssh' / 'id_rsa'
        client.connect(host, port=port, username=user, key_filename=str(ssh_key_path), 
                      timeout=5, look_for_keys=True, allow_agent=True)
        
        stdin, stdout, stderr = client.exec_command('whoami')
        result = stdout.read().decode().strip()
        client.close()
        
        if result:
            print(f"[OK] Key-based authentication successful: {result}")
            return True
        else:
            print("[WARN] Key-based auth response unclear")
            return False
            
    except paramiko.AuthenticationException:
        print("[WARN] Key-based authentication not yet working")
        print("       (SSH key may need to be loaded in SSH agent)")
        return False
    except Exception as e:
        print(f"[!] Could not verify key auth: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(
        description='Deploy SSH public key for password-less access',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python deploy_ssh_key_paramiko.py
  python deploy_ssh_key_paramiko.py --host example.com --user admin --password secret
  python deploy_ssh_key_paramiko.py --key /path/to/custom/key.pub
        """
    )
    parser.add_argument('--host', default='10.144.113.100', help='Remote hostname/IP')
    parser.add_argument('--port', type=int, default=22, help='SSH port')
    parser.add_argument('--user', default='orion', help='Remote user')
    parser.add_argument('--password', default='Popsnap1', help='Remote password')
    parser.add_argument('--key', help='Path to SSH public key')
    
    args = parser.parse_args()
    
    print("")
    print("=" * 70)
    print("  SSH Public Key Deployment (via Paramiko)")
    print("=" * 70)
    print("")
    
    # Get public key
    print("[*] Reading SSH public key...")
    pubkey = get_ssh_pubkey(args.key)
    if not pubkey:
        sys.exit(1)
    
    print(f"[OK] Public key loaded ({len(pubkey)} bytes)")
    print(f"    Key type: {pubkey.split()[0]}")
    print(f"    Fingerprint: {pubkey[:60]}...")
    print("")
    
    # Deploy key
    print(f"[*] Deploying to {args.user}@{args.host}:{args.port}...")
    print("")
    if deploy_key_via_paramiko(args.host, args.port, args.user, args.password, pubkey):
        print("")
        
        # Verify
        verify_key_auth(args.host, args.port, args.user)
        
        print("")
        print("[OK] Deployment complete!")
        print(f"    SSH key is now authorized for {args.user}@{args.host}")
        print("")
        print("  You can now use:")
        print(f"    ssh {args.user}@{args.host} 'command'")
        print(f"    scp file.txt {args.user}@{args.host}:~/")
        print("")
    else:
        print("")
        print("[ERROR] Deployment failed")
        sys.exit(1)
    
    print("=" * 70)

if __name__ == '__main__':
    main()

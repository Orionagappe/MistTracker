#!/usr/bin/env python3
"""
SSH Public Key Deployment Helper
Handles SSH authentication and deploys public keys for password-less access
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path

def check_dependencies():
    """Check for required tools"""
    required_tools = {
        'ssh': 'OpenSSH client',
        'ssh-keygen': 'OpenSSH keygen',
    }
    
    missing = []
    for tool, desc in required_tools.items():
        try:
            subprocess.run([tool, '--help'], capture_output=True, timeout=2)
        except (FileNotFoundError, subprocess.TimeoutExpired):
            missing.append(f"{tool} ({desc})")
    
    if missing:
        print(f"[ERROR] Missing required tools: {', '.join(missing)}")
        return False
    return True

def get_ssh_pubkey(ssh_key_path=None):
    """Get the SSH public key"""
    if ssh_key_path is None:
        ssh_key_path = Path.home() / '.ssh' / 'id_rsa.pub'
    
    if not Path(ssh_key_path).exists():
        print(f"[ERROR] SSH public key not found: {ssh_key_path}")
        
        # Check for id_rsa.pub
        id_rsa = Path.home() / '.ssh' / 'id_rsa'
        if not id_rsa.exists():
            print("[INFO] Generate SSH keys with:")
            print(f"  ssh-keygen -t rsa -b 4096 -f {id_rsa} -N ''")
            return None
        else:
            print(f"[INFO] Private key exists but public key not found")
            print("[INFO] Generate public key with:")
            print(f"  ssh-keygen -y -f {id_rsa} > {ssh_key_path}")
            return None
    
    try:
        with open(ssh_key_path, 'r') as f:
            pubkey = f.read().strip()
        return pubkey
    except Exception as e:
        print(f"[ERROR] Failed to read public key: {e}")
        return None

def deploy_key_via_ssh(host, user, password, pubkey):
    """Deploy public key via SSH using password authentication"""
    
    # Command to deploy the key
    deploy_cmd = f"mkdir -p ~/.ssh && echo '{pubkey}' >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys && echo '[OK] Key deployed' && whoami"
    
    # Use ssh with password via stdin (requires expect or sshpass)
    # For now, provide instructions
    print(f"[*] To deploy key via SSH:")
    print(f"    ssh {user}@{host} \"{deploy_cmd}\"")
    print(f"    (You will be prompted for password: {password})")
    print(f"")
    
    # Try using sshpass if available
    try:
        # Check if sshpass is available
        result = subprocess.run(['sshpass', '-p', password, 'ssh', 
                              '-o', 'StrictHostKeyChecking=accept-new',
                              f'{user}@{host}', deploy_cmd],
                             capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            print("[OK] SSH public key deployed successfully")
            print(result.stdout)
            return True
        else:
            print(f"[ERROR] Deployment failed: {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("[!] sshpass not found. Install with: pip install sshpass (or use package manager)")
        print("")
        print("[MANUAL OPTION]")
        print("1. SSH to the server:")
        print(f"   ssh {user}@{host}")
        print("")
        print("2. Create authorized_keys and add your public key:")
        print("   mkdir -p ~/.ssh")
        print(f"   echo '{pubkey}' >> ~/.ssh/authorized_keys")
        print("   chmod 600 ~/.ssh/authorized_keys")
        print("")
        return False
    except Exception as e:
        print(f"[ERROR] Deployment failed: {e}")
        return False

def verify_key_auth(host, user):
    """Verify that key-based authentication works"""
    print("[*] Testing key-based authentication...")
    
    try:
        result = subprocess.run(['ssh', '-o', 'BatchMode=yes', 
                               '-o', 'StrictHostKeyChecking=accept-new',
                               f'{user}@{host}', 'whoami'],
                               capture_output=True, text=True, timeout=5)
        
        if result.returncode == 0:
            print(f"[OK] Key-based auth successful: {result.stdout.strip()}")
            return True
        else:
            print(f"[WARN] Key-based auth not yet working")
            print(f"       (May need SSH agent setup: ssh-add)")
            return False
            
    except Exception as e:
        print(f"[!] Could not test key auth: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Deploy SSH public key for password-less access')
    parser.add_argument('--host', default='10.144.113.100', help='Remote hostname/IP')
    parser.add_argument('--user', default='orion', help='Remote user')
    parser.add_argument('--password', default='Popsnap1', help='Remote password')
    parser.add_argument('--key', help='Path to SSH public key')
    
    args = parser.parse_args()
    
    print("")
    print("=" * 60)
    print("  SSH Public Key Deployment")
    print("=" * 60)
    print("")
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Get public key
    print("[*] Reading SSH public key...")
    pubkey = get_ssh_pubkey(args.key)
    if not pubkey:
        sys.exit(1)
    
    print(f"[OK] Public key loaded: {pubkey[:40]}...")
    print("")
    
    # Deploy key
    print(f"[*] Deploying to {args.user}@{args.host}...")
    if deploy_key_via_ssh(args.host, args.user, args.password, pubkey):
        print("")
        
        # Verify
        verify_key_auth(args.host, args.user)
    
    print("")
    print("=" * 60)

if __name__ == '__main__':
    main()

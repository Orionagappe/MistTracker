# User Account Creation Guide

## Overview
MistTracker includes a command-line tool for creating user accounts directly in the database. This is useful for:
- Initial setup and testing
- Bulk user imports
- Administrative account creation
- Development and QA environments

## Usage

### Via npm script
```bash
npm run create-user [userName] [accountId] [password]
```

### Via node directly
```bash
node create-user.js [userName] [accountId] [password]
```

### Interactive mode (no arguments)
```bash
npm run create-user
# You'll be prompted for:
# - Full Name
# - Email Address  
# - Password
```

## Examples

### Command-line arguments (recommended for scripts)
```bash
npm run create-user "John Doe" "john@example.com" "secure_password_123"
npm run create-user "Alice Wonderland" "alice@example.com" "alice_password"
npm run create-user "Bob Smith" "bob@example.com" "bob_secure_pwd"
```

### Interactive input
```bash
$ npm run create-user
=== MistTracker User Account Creator ===

Full Name: Jane Doe
Email Address: jane@example.com
Password: super_secret_pass

=== Creating New User Account ===
Name: Jane Doe
Email: jane@example.com

✓ User created successfully!
  ID: 6
  Name: Jane Doe
  Email: jane@example.com
```

## Features

✅ **Auto-initializes database** - Creates 'mist' database and schema if needed
✅ **Duplicate prevention** - Rejects duplicate email addresses  
✅ **Secure password hashing** - Passwords are hashed before storage
✅ **Instant verification** - Prints user ID and confirms creation
✅ **Error handling** - Clear messages for duplicate users or DB errors
✅ **Flexible input** - Accept via CLI args or interactive prompts

## Environment Variables

Optional for custom database settings:

```bash
DB_HOST=localhost          # MySQL host (default: localhost)
DB_USER=root              # MySQL user (default: root)
DB_PASSWORD=secret        # MySQL password (default: built-in)
DB_PORT=3306             # MySQL port (default: 3306)
```

Example:
```bash
DB_HOST=192.168.1.100 DB_USER=admin npm run create-user "User" "email@domain.com" "pass"
```

## Testing with Created Accounts

### 1. Start the REST API server
```bash
npm run server
# Server running on http://localhost:3000
```

### 2. Test login via API
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"accountId":"testuser@example.com","password":"password123"}'
```

### 3. Test via React UI
```bash
cd client
npm install
npm run dev
# Open http://localhost:5173
# Login with created credentials
```

## Pre-created Test Accounts

When you run `npm run create-user`, several test accounts are available:

| Name | Email | Password |
|------|-------|----------|
| Test User | testuser@example.com | password123 |
| Demo User | demo@example.com | demo_password_123 |
| Alice Wonderland | alice@example.com | secure_password_123 |

(These were created during initial setup)

## Troubleshooting

### "Database initialization failed: Access denied"
- Check MySQL credentials in create-user.js
- Verify MySQL is running
- Check DB_PASSWORD environment variable
- Default password is `s3cur3_9a`55w04d`

### "User already exists"
- The email address is already registered
- Use a different email or delete the user from MySQL manually:
  ```bash
  mysql -u root -p
  > USE mist;
  > DELETE FROM Users WHERE accountId = 'email@example.com';
  ```

### "All fields are required"
- When using interactive mode, you must enter all three fields
- Use CLI arguments to skip prompts: `npm run create-user "Name" "email" "pass"`

## Advanced: Bulk User Import

Create a script to bulk import users:

```bash
#!/bin/bash
# import-users.sh

npm run create-user "John Doe" "john@company.com" "pass1234"
npm run create-user "Jane Smith" "jane@company.com" "pass5678"
npm run create-user "Bob Johnson" "bob@company.com" "pass9012"
npm run create-user "Carol White" "carol@company.com" "pass3456"
```

Run with:
```bash
chmod +x import-users.sh
./import-users.sh
```

## Security Notes

⚠️ **Warning**: This tool is for development/admin use only:
- Passwords are visible in command history
- The database password is in source code
- Use environment variables in production
- Implement proper access controls
- Use environment-based database credentials

For production, consider:
- Moving database credentials to `.env` files (not in git)
- Implementing proper user management UI
- Using OAuth or SSO integration
- Enabling database encryption

## API Integration

The REST API also supports user creation via `/auth/register` endpoint:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "New User",
    "accountId": "newuser@example.com",
    "password": "secure_pass_123"
  }'
```

This endpoint is used by the React UI registration form.

---

**Next Steps**: After creating accounts, test them with:
- REST API endpoints
- React UI (client/src)
- Sprint 2 tests: `npm run test:sprint2`
- Sprint 3 API tests: `npm run test:sprint3`

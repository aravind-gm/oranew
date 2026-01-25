# 🔐 Setup Admin Access — ORA Jewellery

**Date:** January 25, 2026  
**Status:** ✅ Complete admin access setup guide

---

## 🎯 The Problem

After deployment, the admin panel is not accessible because:
1. ❌ No admin user exists in the database
2. ❌ Admin credentials were never created
3. ❌ You can't log in without a valid admin account

## ✅ The Solution

Create an admin user by running the database seed script that's already prepared.

---

## 📋 Step-by-Step Setup

### **STEP 1: Run the Seed Script Locally**

This creates the admin user in your Supabase database.

```bash
# Navigate to backend
cd /home/aravind/Downloads/oranew/backend

# Run the seed script
npm run prisma:seed
```

**You should see output like:**
```
🌱 Starting database seed...
Creating admin user...
✅ Admin user created
✅ Categories created
✅ Sample products created
```

---

### **STEP 2: Verify Admin User Was Created**

Check that the admin user exists in Supabase:

```bash
# Connect to database
psql postgresql://postgres:G.M.aravind%402006@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres

# List all users
SELECT id, email, role, "fullName" FROM "User";

# You should see a row like:
# id | email              | role  | fullName
# ---+--------------------+-------+-----------
# xyz| admin@orashop.in   | ADMIN | Admin User

# Exit psql
\q
```

**OR** use Supabase Dashboard:
1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor**
4. Run:
   ```sql
   SELECT id, email, role, "fullName" FROM "User" WHERE role = 'ADMIN';
   ```

---

### **STEP 3: Access Admin Panel on Vercel**

1. Go to your frontend: **https://orashop.vercel.app** (or your Vercel URL)
2. Navigate to: **/admin/login**
3. You'll see the Admin Login page

---

### **STEP 4: Login with Admin Credentials**

Use these credentials to login:

| Field | Value |
|-------|-------|
| **Email** | `admin@orashop.in` |
| **Password** | `admin123` |

**Important:** These are default credentials. After first login, you should change the password!

---

### **STEP 5: Verify You're In Admin Panel**

After successful login, you should see:
- ✅ Admin Dashboard
- ✅ Products management
- ✅ Orders management
- ✅ Categories management
- ✅ Reports/Analytics
- ✅ Inventory management

---

## 🔧 If Seed Script Fails

### **Error: "Cannot find module"**

**Solution:**
```bash
cd /home/aravind/Downloads/oranew/backend
npm install
npm run prisma:seed
```

---

### **Error: "No DATABASE_URL set"**

**Solution:**
Make sure your `.env` file exists with:
```env
DATABASE_URL=postgresql://postgres.hgejomvgldqnqzkgffoi:G.M.aravind%402006@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:G.M.aravind%402006@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres
```

Then run:
```bash
npm run prisma:seed
```

---

### **Error: "Admin user already exists"**

**This is OK!** It means the seed already ran successfully. Just try logging in with the credentials above.

---

## 🔄 For Render Deployment

The seed script will automatically run when Render deploys if you include it in the build command.

**Update Render build command to:**
```bash
cd backend && npm install && npm run build && npm run prisma:seed && npx prisma generate
```

**Steps:**
1. Go to **Render Dashboard** → **Your Backend Service**
2. Click **Settings** → **Build & Deploy**
3. Update **Build Command** to above
4. Click **Save**
5. Click **Trigger Deploy**
6. Wait for deployment to complete

After deployment, the admin user will be automatically created in your production database.

---

## 📝 Create Additional Admin Users

If you want to create more admin users, use the Supabase SQL editor:

```sql
-- Create another admin user (replace values)
INSERT INTO "User" (
  id,
  email,
  "passwordHash",
  "fullName",
  phone,
  role,
  "isVerified",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'newadmin@example.com',
  -- Use hashed password (see below)
  'hashed_password_here',
  'New Admin Name',
  '1234567890',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

**To generate a hashed password:**
```bash
# Run locally in Node.js
node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('your-password-123', 10, (err, hash) => {
  console.log(hash);
});
"
```

Then copy the hash and paste it in the SQL query above.

---

## 🔐 Change Admin Password After First Login

**Via Admin Panel:**
1. Login as admin
2. Go to **Settings** or **Profile**
3. Click **Change Password**
4. Enter old password and new password
5. Save

**Via Direct SQL (Emergency):**
```bash
# Generate new password hash
node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('newpassword123', 10, (err, hash) => {
  console.log(hash);
});
"

# Then run in Supabase SQL Editor:
UPDATE "User" 
SET "passwordHash" = 'paste-the-hash-here'
WHERE email = 'admin@orashop.in';
```

---

## ✅ Admin Features Checklist

Once logged in, verify these features work:

- [ ] View all products
- [ ] Create new product
- [ ] Edit product details
- [ ] Upload product images
- [ ] Delete products
- [ ] Manage categories
- [ ] View all orders
- [ ] Update order status
- [ ] View order details
- [ ] Manage inventory/stock
- [ ] View sales reports
- [ ] View customer list
- [ ] Logout

---

## 🆘 Still Can't Login?

### **Check 1: Is the backend running?**
```bash
curl https://oranew-backend.onrender.com/api/health
# Should return: {"status":"ok"}
```

### **Check 2: Is admin user in database?**
```sql
SELECT * FROM "User" WHERE email = 'admin@orashop.in';
```

### **Check 3: Check browser console for errors**
1. Go to admin login page
2. Press **F12** (Developer Tools)
3. Click **Console** tab
4. Look for red error messages
5. Screenshot the error and check troubleshooting below

### **Check 4: Verify environment variables**
On your Render backend:
1. Go to **Render Dashboard** → **Backend Service**
2. Click **Settings** → **Environment**
3. Verify all variables are set, especially:
   - `DATABASE_URL` ✅
   - `JWT_SECRET` ✅

---

## 📞 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid credentials" | Check email/password are exact: `admin@orashop.in` / `admin123` |
| "Cannot connect to database" | Verify `DATABASE_URL` is correct in Render |
| "Admin access required" | Login user doesn't have ADMIN role |
| "Page not found" | Frontend not deployed or URL is wrong |
| "API error 401" | Backend JWT is not configured |
| "Products won't load in admin" | Backend API not responding, check `/api/health` |

---

## 📊 Quick Commands

```bash
# Run seed (create admin user)
npm run prisma:seed

# Check database directly
psql $DATABASE_URL

# Generate new admin password hash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('newpass', 10, (e,h) => console.log(h));"
```

---

## 🎯 Next Steps

1. ✅ Run seed script to create admin user
2. ✅ Login to admin panel
3. ✅ Test admin features
4. ⏳ Deploy webhook service
5. ⏳ Configure Razorpay webhook
6. ⏳ Test full payment flow

---

**Default Admin Credentials:**
- 📧 Email: `admin@orashop.in`
- 🔐 Password: `admin123`

⚠️ **IMPORTANT:** Change these after first login for security!

---

**Last Updated:** January 25, 2026

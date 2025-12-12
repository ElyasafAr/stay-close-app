# Checklist: PostgreSQL Migration

## ✅ Completed Checks

### 1. Code Updates
- [x] `backend/main.py` - Updated to use PostgreSQL
- [x] `backend/auth.py` - Updated to use PostgreSQL
- [x] `backend/database.py` - Created PostgreSQL connection
- [x] `backend/models.py` - Created SQLAlchemy models
- [x] `backend/migrate_to_postgresql.py` - Migration script created
- [x] `backend/requirements.txt` - PostgreSQL dependencies added

### 2. Code Fixes
- [x] Fixed `get_current_user` to accept `db: Session`
- [x] Fixed migration script to handle `hashed_password` vs `password_hash`
- [x] Added conversion from SQLAlchemy models to Pydantic models in all endpoints
- [x] Updated all endpoints to use `db: Session = Depends(get_db)`

### 3. Files Status
- [x] `contacts.json` exists (has data)
- [x] `users.json` exists (has data)
- [x] `reminders.json` - doesn't exist (OK, will be created)

## ⚠️ Before Deployment

### 1. Railway Environment Variables
**CRITICAL**: Add `DATABASE_URL` to Railway backend service:
- Railway automatically provides `DATABASE_URL` when you add a PostgreSQL service
- If not set, the app will try to use default local PostgreSQL (will fail on Railway)

**Steps:**
1. Go to Railway dashboard
2. Add PostgreSQL service to your project (if not already added)
3. Railway will automatically set `DATABASE_URL` environment variable
4. Verify it's set in the backend service environment variables

### 2. Migration (Optional - for existing data)
If you have existing data in JSON files that you want to migrate:

**Local migration (before deployment):**
```bash
cd backend
python migrate_to_postgresql.py
```

**Or migrate on Railway:**
- The migration script can be run manually on Railway
- Or data will be migrated automatically when users register/login

### 3. Testing Checklist
- [ ] Test user registration
- [ ] Test user login
- [ ] Test Firebase authentication
- [ ] Test creating contacts
- [ ] Test creating reminders
- [ ] Test updating contacts
- [ ] Test deleting contacts
- [ ] Test reminder checking

## 📝 Notes

1. **Database Initialization**: The database tables are created automatically on startup via `startup_event` in `main.py`

2. **Data Migration**: 
   - Existing JSON data can be migrated using `migrate_to_postgresql.py`
   - New users/contacts/reminders will be saved to PostgreSQL automatically

3. **Backward Compatibility**: 
   - JSON files are no longer used
   - Old JSON files can be kept as backup but won't be read

4. **Error Handling**: 
   - If `DATABASE_URL` is not set, the app will try to use default local PostgreSQL
   - This will fail on Railway, so make sure `DATABASE_URL` is set

## 🚀 Deployment Steps

1. **Push to Git**: Run `.\push_to_git.ps1`
2. **Wait for Railway deployment** (2-3 minutes)
3. **Check Railway logs** for:
   - `✅ [STARTUP] Database initialized successfully`
   - Any database connection errors
4. **Test the application** using the testing checklist above

## 🔍 If Something Goes Wrong

1. **Check Railway logs** for database connection errors
2. **Verify `DATABASE_URL`** is set in Railway environment variables
3. **Check if PostgreSQL service** is running in Railway
4. **Verify database tables** were created (check logs for `✅ [DATABASE] Database tables created successfully`)





# Production Deployment Checklist & Integration Tests

## 🚀 Pre-Deployment Checklist

### Database Setup
- [ ] Run `database-production-setup.sql` in Supabase SQL Editor
- [ ] Verify all tables exist: `users`, `reports`, `payments`, `notifications`
- [ ] Confirm Row Level Security (RLS) policies are active
- [ ] Test database permissions for each user role
- [ ] Verify enum types are correctly defined

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] `JWT_SECRET` is set
- [ ] `NEXTAUTH_SECRET` is set
- [ ] All environment variables are secure and production-ready

### API Endpoints (Test all endpoints)
- [ ] POST `/api/auth/login` - User authentication
- [ ] POST `/api/reports/upload` - Report file upload
- [ ] POST `/api/payments/create` - Payment creation
- [ ] POST `/api/payments/upload-proof` - Payment proof upload
- [ ] GET `/api/payments/history` - Payment history
- [ ] GET `/api/notifications/list` - User notifications
- [ ] POST `/api/manager/approve-reject` - Manager actions

### Frontend Components
- [ ] All dashboard components load without errors
- [ ] Bell icon shows correct unread notification count
- [ ] Payment methods are always visible (no approval gating)
- [ ] Real-time updates work without manual refresh
- [ ] All forms submit and handle errors gracefully

## 🧪 Integration Test Suite

### Test User Flow (End-to-End)

#### Test 1: User Report Submission & Payment
```
1. Login as user (user@company.com / user123)
2. Upload report file (CSV or HTML)
3. Select report date
4. Click "Send for Approval"
5. Verify redirect to payment screen
6. Select any payment method
7. Upload payment proof
8. Verify success message: "Your payment has been sent to manager for review"
9. Check payment appears in Payment History with status "pending"
10. Verify notification is created
```

#### Test 2: Manager Approval Flow
```
1. Login as manager (manager@company.com / manager123)
2. Navigate to Manager Dashboard
3. Verify pending payments queue shows new payment
4. Approve the payment
5. Verify user receives notification of approval
6. Check payment status changes to "approved"
7. Verify real-time updates without refresh
```

#### Test 3: Dashboard Data Accuracy
```
1. Login as admin (admin@company.com / admin123)
2. Verify all dashboard stats show real data (no fake percentages)
3. Check that statistics update after new reports/payments
4. Verify no hardcoded values like "+12% this month"
```

### API Test Cases

#### Authentication Tests
```bash
# Test valid login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@company.com","password":"user123"}'

# Test invalid credentials
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@test.com","password":"wrong"}'
```

#### Payment Creation Tests
```bash
# Test payment creation (replace TOKEN and REPORT_ID)
curl -X POST http://localhost:3001/api/payments/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportId": "REPORT_ID",
    "method": "offline", 
    "amount": 1000,
    "transactionId": "TEST_TXN_123",
    "notes": "Test payment"
  }'
```

#### Notification Tests
```bash
# Test notification list
curl -X GET http://localhost:3001/api/notifications/list \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test unread count
curl -X GET http://localhost:3001/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔍 Smoke Tests (Quick Health Checks)

### Quick Verification Script
```javascript
// Run in browser console after logging in
async function smokeTest() {
  const token = localStorage.getItem('authToken');
  const tests = [
    '/api/user/dashboard-stats',
    '/api/notifications/unread-count',
    '/api/user/recent-reports',
    '/api/payments/history'
  ];
  
  for (const endpoint of tests) {
    try {
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`${endpoint}: ${response.status} ${response.ok ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`${endpoint}: ERROR ❌`, error.message);
    }
  }
}

smokeTest();
```

## 🚨 Critical Production Issues Fixed

### ✅ RESOLVED: Payment Options Issue
- Payment options no longer stuck on loading
- Connected to real Supabase data
- All payment methods always visible

### ✅ RESOLVED: Dashboard Stats Issue  
- Removed all fake values like "+12% this month"
- Real-time data from Supabase calculations
- Dynamic trend indicators based on actual data

### ✅ RESOLVED: Report History Fix
- Reports now display with proper dates
- Download functionality implemented
- Real payment status tracking

### ✅ RESOLVED: Mock Data Removal
- All dummy/mock data sources removed
- Complete real-data workflow implemented
- Production-ready payment system

## 📊 Success Criteria

### User Experience
- [ ] Users can upload reports and immediately pay (no approval gating)
- [ ] Payment success shows: "Your payment has been sent to manager for review"
- [ ] Payment history displays all payments with real status
- [ ] Bell icon shows actual unread notification count
- [ ] Dashboards update instantly without manual refresh

### Manager Experience  
- [ ] Manager can see pending reports and payments
- [ ] Approve/reject functionality works correctly
- [ ] Users receive real-time notifications of status changes
- [ ] No hardcoded data appears anywhere

### Data Integrity
- [ ] All payment records have status="pending" initially
- [ ] Manager approval updates status="approved" 
- [ ] Notifications are created for all status changes
- [ ] Real-time updates work across all components

## 🎯 Final Acceptance Test

Run this complete flow to verify production readiness:

1. **Upload Report**: User uploads report → redirects to payment
2. **Submit Payment**: Upload proof → see "sent to manager for review"
3. **Manager Review**: Manager approves payment → user gets notification
4. **Real-time Updates**: All dashboards update without refresh
5. **Data Verification**: No fake data anywhere, all stats are real

If all steps pass ✅, the system is ready for production deployment!

## 🔧 Troubleshooting Common Issues

### Database Connection Issues
- Check Supabase connection strings
- Verify RLS policies are not blocking queries
- Ensure service role key has proper permissions

### Authentication Problems
- Check JWT secret configuration
- Verify token expiration settings
- Test all user roles (user/manager/admin)

### File Upload Issues
- Check file size limits (5MB max)
- Verify supported file types (CSV, HTML, PDF, JPG, PNG)
- Test file storage permissions

### Notification System Issues
- Verify notifications table exists
- Check notification type enum values
- Test real-time polling mechanism
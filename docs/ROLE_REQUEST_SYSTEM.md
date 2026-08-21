# Role Request System - Hierarchical Role Application & Approval

## Overview

The Role Request System enables field personnel (Development Agents, Woreda Officers, Researchers) to submit in-app role upgrade applications that are reviewed and approved by their respective supervisors through the administrative hierarchy.

## Features

✅ **User-Friendly Application Submission**
- Farmers and field workers can apply for professional roles
- Required documentation: Staff ID and organization affiliation
- Geographic assignment (Region → Zone → Woreda → Kebele)

✅ **Hierarchical Approval Workflow**
- Woreda Officers approve Development Agent applications in their woreda
- Regional Admins approve all role requests
- Cross-woreda protection prevents unauthorized approvals

✅ **Audit Trail**
- Full history of all role requests
- Reviewer information and timestamps
- Rejection reasons documented

✅ **Role Hierarchy**
```
FARMER → DEVELOPMENT_AGENT (Approved by: WOREDA_OFFICER, ADMIN)
FARMER → WOREDA_OFFICER    (Approved by: ADMIN only)
FARMER → RESEARCHER         (Approved by: ADMIN only)
```

---

## Database Schema

### RoleRequest Model

```prisma
model RoleRequest {
  id                String            @id @default(uuid())
  userId            String
  userName          String
  userPhone         String?
  userEmail         String?
  currentRole       Role              @default(FARMER)
  requestedRole     Role
  regionId          String
  regionName        String
  zoneId            String
  zoneName          String
  woredaId          String
  woredaName        String
  kebeleName        String?
  staffIdNumber     String
  organizationName  String
  status            RoleRequestStatus @default(PENDING)
  rejectionReason   String?
  reviewedById      String?
  reviewedByName    String?
  reviewedAt        DateTime?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
}

enum RoleRequestStatus {
  PENDING
  APPROVED
  REJECTED
}
```

---

## API Endpoints

### 1. Submit Role Upgrade Request

**Endpoint:** `POST /api/v1/auth/role-requests`

**Authentication:** Required (Bearer JWT)

**Request Body:**
```json
{
  "requestedRole": "DEVELOPMENT_AGENT",
  "regionId": "reg_oromia",
  "regionName": "Oromia",
  "zoneId": "zone_east_shewa",
  "zoneName": "East Shewa",
  "woredaId": "woreda_adama_01",
  "woredaName": "Adama Zuria",
  "kebeleName": "Wonji Gefersa Kebele 02",
  "staffIdNumber": "DA-ETH-2026-8812",
  "organizationName": "Adama Woreda Office of Agriculture"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Role upgrade request submitted successfully",
  "data": {
    "id": "req_123456",
    "userId": "usr_789",
    "userName": "Tadesse Bekele",
    "userPhone": "+251911223344",
    "userEmail": "tadesse@example.com",
    "currentRole": "FARMER",
    "requestedRole": "DEVELOPMENT_AGENT",
    "regionId": "reg_oromia",
    "regionName": "Oromia",
    "zoneId": "zone_east_shewa",
    "zoneName": "East Shewa",
    "woredaId": "woreda_adama_01",
    "woredaName": "Adama Zuria",
    "kebeleName": "Wonji Gefersa Kebele 02",
    "staffIdNumber": "DA-ETH-2026-8812",
    "organizationName": "Adama Woreda Office of Agriculture",
    "status": "PENDING",
    "createdAt": "2026-08-21T16:30:00.000Z",
    "updatedAt": "2026-08-21T16:30:00.000Z"
  }
}
```

**Validation Rules:**
- ✅ `requestedRole` must be one of: `DEVELOPMENT_AGENT`, `WOREDA_OFFICER`, `RESEARCHER`
- ✅ User cannot request a role they already have
- ✅ User cannot have multiple pending requests for the same role
- ✅ `staffIdNumber` and `organizationName` are required
- ✅ `woredaId` is required for geographic assignment

---

### 2. Get User's Own Role Requests

**Endpoint:** `GET /api/v1/auth/role-requests/my-requests`

**Authentication:** Required (Bearer JWT)

**Query Parameters:**
- `status` (optional): Filter by `PENDING`, `APPROVED`, `REJECTED`
- `limit` (optional): Number of results per page (default: 10)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "req_123456",
        "currentRole": "FARMER",
        "requestedRole": "DEVELOPMENT_AGENT",
        "status": "PENDING",
        "woredaName": "Adama Zuria",
        "staffIdNumber": "DA-ETH-2026-8812",
        "organizationName": "Adama Woreda Office of Agriculture",
        "createdAt": "2026-08-21T16:30:00.000Z"
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

---

### 3. Get Pending Role Requests (Hierarchical)

**Endpoint:** `GET /api/v1/auth/role-requests/pending`

**Authentication:** Required (Role: `WOREDA_OFFICER` or `ADMIN`)

**Query Parameters:**
- `requestedRole` (optional): Filter by role
- `woredaId` (optional): Filter by woreda (admin only)
- `limit` (optional): Default 20
- `offset` (optional): Default 0

**Hierarchical Filtering:**
- **WOREDA_OFFICER**: Can only see `DEVELOPMENT_AGENT` requests from their own woreda
- **ADMIN**: Can see all requests nationwide, with optional filtering

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "req_123456",
        "userId": "usr_789",
        "userName": "Tadesse Bekele",
        "userPhone": "+251911223344",
        "userEmail": "tadesse@example.com",
        "currentRole": "FARMER",
        "requestedRole": "DEVELOPMENT_AGENT",
        "regionName": "Oromia",
        "zoneName": "East Shewa",
        "woredaName": "Adama Zuria",
        "woredaId": "woreda_adama_01",
        "kebeleName": "Wonji Gefersa Kebele 02",
        "staffIdNumber": "DA-ETH-2026-8812",
        "organizationName": "Adama Woreda Office of Agriculture",
        "status": "PENDING",
        "createdAt": "2026-08-21T16:30:00.000Z",
        "user": {
          "id": "usr_789",
          "fullName": "Tadesse Bekele",
          "email": "tadesse@example.com",
          "phoneNumber": "+251911223344",
          "role": "FARMER"
        }
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 4. Approve Role Request

**Endpoint:** `POST /api/v1/auth/role-requests/:id/approve`

**Authentication:** Required (Role: `WOREDA_OFFICER` or `ADMIN`)

**Path Parameters:**
- `id`: Role request ID

**Authorization Rules:**
- **WOREDA_OFFICER**: Can only approve `DEVELOPMENT_AGENT` requests from their own woreda
- **ADMIN**: Can approve all role requests

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Role request approved successfully",
  "data": {
    "id": "req_123456",
    "status": "APPROVED",
    "reviewedById": "usr_reviewer",
    "reviewedByName": "admin@agrietech.et",
    "reviewedAt": "2026-08-21T17:00:00.000Z"
  }
}
```

**Side Effects:**
1. ✅ Role request status updated to `APPROVED`
2. ✅ User's role automatically updated to requested role
3. ✅ Audit log entry created
4. ✅ Reviewer information recorded

**Error Responses:**
- `400 Bad Request`: Request already processed
- `403 Forbidden`: Insufficient permissions (cross-woreda attempt)
- `404 Not Found`: Request not found

---

### 5. Reject Role Request

**Endpoint:** `POST /api/v1/auth/role-requests/:id/reject`

**Authentication:** Required (Role: `WOREDA_OFFICER` or `ADMIN`)

**Path Parameters:**
- `id`: Role request ID

**Request Body:**
```json
{
  "rejectionReason": "Staff ID verification failed with Woreda HR."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Role request rejected",
  "data": {
    "id": "req_123456",
    "status": "REJECTED",
    "rejectionReason": "Staff ID verification failed with Woreda HR.",
    "reviewedById": "usr_reviewer",
    "reviewedByName": "woreda.officer@agrietech.et",
    "reviewedAt": "2026-08-21T17:15:00.000Z"
  }
}
```

**Validation:**
- ✅ `rejectionReason` is required
- ✅ Cannot reject already processed requests

---

### 6. Get Role Request Statistics

**Endpoint:** `GET /api/v1/auth/role-requests/stats`

**Authentication:** Required (Role: `ADMIN`)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "pending": 25,
    "approved": 110,
    "rejected": 15,
    "byRoleAndStatus": [
      {
        "requestedRole": "DEVELOPMENT_AGENT",
        "status": "APPROVED",
        "_count": 85
      },
      {
        "requestedRole": "DEVELOPMENT_AGENT",
        "status": "PENDING",
        "_count": 20
      },
      {
        "requestedRole": "WOREDA_OFFICER",
        "status": "APPROVED",
        "_count": 15
      },
      {
        "requestedRole": "RESEARCHER",
        "status": "APPROVED",
        "_count": 10
      }
    ]
  }
}
```

---

## Admin Routes (Alternative Paths)

The following admin-scoped endpoints are also available:

```
GET  /api/v1/admin/role-requests          → getPendingRequests
GET  /api/v1/admin/role-requests/stats    → getRoleRequestStats
POST /api/v1/admin/role-requests/:id/approve → approveRoleRequest
POST /api/v1/admin/role-requests/:id/reject  → rejectRoleRequest
```

---

## Testing

### Run Comprehensive Test Suite

```bash
node scripts/test_role_request_system.js
```

**Test Coverage:**
1. ✅ Submit role upgrade request
2. ✅ Prevent duplicate pending requests
3. ✅ Get user's own requests
4. ✅ Get pending requests (Woreda Officer - hierarchical filtering)
5. ✅ Get pending requests (Admin - nationwide access)
6. ✅ Approve role request with automatic role update
7. ✅ Reject role request with reason
8. ✅ Hierarchical permission enforcement (cross-woreda block)
9. ✅ Get role request statistics

---

## Hierarchical Authorization Matrix

| Reviewer Role      | Can Approve                           | Geographic Scope        |
|--------------------|---------------------------------------|-------------------------|
| FARMER             | ❌ None                                | N/A                     |
| DEVELOPMENT_AGENT  | ❌ None                                | N/A                     |
| WOREDA_OFFICER     | ✅ DEVELOPMENT_AGENT only              | Own woreda only         |
| RESEARCHER         | ❌ None                                | N/A                     |
| ADMIN              | ✅ All roles                           | Nationwide              |

---

## Migration

### Apply Database Schema

```bash
npx prisma migrate deploy
```

### Generate Prisma Client

```bash
npx prisma generate
```

---

## Example Use Cases

### Use Case 1: Farmer Applies for Development Agent Role

1. **Farmer** submits application via mobile app:
   ```
   POST /api/v1/auth/role-requests
   Body: { requestedRole: "DEVELOPMENT_AGENT", staffIdNumber: "DA-ETH-2026-8812", ... }
   ```

2. **Woreda Officer** reviews pending applications:
   ```
   GET /api/v1/auth/role-requests/pending
   ```

3. **Woreda Officer** verifies staff ID and approves:
   ```
   POST /api/v1/auth/role-requests/req_123456/approve
   ```

4. **System** automatically updates farmer's role to `DEVELOPMENT_AGENT`

5. **Farmer** gains access to Development Agent features immediately

### Use Case 2: Admin Reviews Researcher Application

1. **Farmer** applies for Researcher role
2. **System** creates pending request
3. **Admin** (only role with permission) reviews application:
   ```
   GET /api/v1/admin/role-requests?requestedRole=RESEARCHER
   ```
4. **Admin** approves after verifying qualifications
5. **User** gains Researcher role and permissions

---

## Security Features

✅ **JWT Authentication Required** - All endpoints protected  
✅ **Role-Based Authorization** - Hierarchical permission checks  
✅ **Geographic Boundary Enforcement** - Woreda-scoped approvals  
✅ **Duplicate Prevention** - No multiple pending requests  
✅ **Audit Trail** - Full reviewer and timestamp tracking  
✅ **Atomic Transactions** - Role updates happen atomically with approval  

---

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "You already have a pending request for the DEVELOPMENT_AGENT role"
  }
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You can only approve requests from your own woreda"
  }
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Role request not found"
  }
}
```

---

## Integration with Admin Dashboard

The role request system integrates with the admin dashboard at:

```
http://localhost:5000/api/v1/admin/dashboard
```

**Dashboard Features:**
- View pending role requests
- Approve/reject with one click
- Filter by role, status, woreda
- View full applicant details
- Track approval history

---

## Future Enhancements

- 📧 Email notifications on approval/rejection
- 📱 Push notifications to mobile app
- 📊 Advanced analytics dashboard
- 🔍 Document upload for verification
- 💬 Reviewer comments and feedback
- ⏱️ Request expiration after 30 days
- 📝 Batch approval for multiple requests

---

## Support

For technical support or questions about the Role Request System, contact the AgriEtech development team.

**Documentation Last Updated:** August 21, 2026

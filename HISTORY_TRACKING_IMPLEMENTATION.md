# History Tracking Implementation

## Overview
A comprehensive history tracking system has been implemented to log all key actions performed by clients, designers, and admins throughout the TechShirt application.

## Database Schema Updates

### History Table Enhanced
The `history` table has been expanded with the following fields:

```typescript
history: defineTable({
  user_id: v.id("users"),
  userType: "client" | "designer" | "admin",
  action: string,                    // Human-readable description
  actionType: "submit" | "approve" | "decline" | "assign" | "update" | 
             "post" | "comment" | "invite" | "design_approval" | 
             "design_request" | "addon_request" | "addon_approval",
  relatedId: optional(string),       // ID of related entity (design, request, addon)
  relatedType: optional(string),     // Type of related entity
  details: optional({
    status: optional(string),
    previousStatus: optional(string),
    reason: optional(string),
    amount: optional(number),
  }),
  timestamp: number,
})
```

### Indexes Added
- `by_user`: Fast lookup of history for a specific user
- `by_user_type`: Retrieve all actions by user type (admin/designer/client)
- `by_action_type`: Filter history by action type
- `by_related`: Get all updates related to a specific entity

## API Endpoints

### Queries
- `getHistory(userId)`: Get all history records for a user, sorted newest first
- `getHistoryByActionType(userType)`: Get all actions by a user type
- `getHistoryByRelated(relatedId)`: Get all updates related to a specific entity (design, request, etc.)

### Mutations
- `addHistory({userId, userType, action, actionType, relatedId, relatedType, details})`: Log a new history entry

## Tracked Actions

### CLIENT ACTIONS
1. **Design Requests**
   - Submit design request
   - Cancel design request
   - Approve design
   - Request design revision
   - Submit add-ons request (quantity, design, or both)
   - Receive add-ons status updates (approved/declined)

2. **Tracked Details**
   - Request title and description
   - Status changes
   - Revision count
   - Reason for changes

### DESIGNER ACTIONS
1. **Design Work**
   - Assigned to design request
   - Receive revision requests
   - Design approvals

2. **Tracked Details**
   - Design request information
   - Revision count
   - Assignment and approval notifications

### ADMIN ACTIONS
1. **Request Management**
   - Accept and assign design requests
   - Update request status
   - Approve/decline add-ons requests

2. **Design Status Updates**
   - Mark design as in production
   - Mark design as completed
   - Mark design as pending pickup
   - Generic design status updates

3. **User Management**
   - Send invitations
   - Revoke invitations
   - Update invitation status

4. **Tracked Details**
   - Status transitions (with previous status)
   - Associated fees and amounts
   - Reasons for decisions
   - Request/design identifiers

## Implementation Details

### Files Modified

#### 1. `convex/schema.ts`
- Enhanced history table definition with new fields and indexes

#### 2. `convex/history.ts`
- Implemented query functions for retrieving history
- Added `addHistory` mutation for logging entries
- Supports filtering by user, action type, and related entity

#### 3. `convex/addOns.ts`
- `submitAddOns`: Logs client submission of add-ons request
- `updateAddOnsStatus`: Logs admin approval/decline and client notification

#### 4. `convex/design_requests.ts`
- `createRequest`: Logs client design request submission
- `assignDesignRequest`: Logs admin assignment and designer notification
- `updateDesignRequestStatus`: Logs admin status updates
- `cancelDesignRequest`: Logs client cancellation

#### 5. `convex/designs.ts`
- `approveDesign`: Logs client approval and designer notification
- `reviseDesign`: Logs client revision request and designer notification
- `markAsInProduction`: Logs admin status change to in production
- `markAsCompleted`: Logs admin status change to completed
- `pendingPickup`: Logs admin status change to pending pickup
- `updateStatus`: Logs generic design status updates with admin info

#### 6. `convex/invitation.ts`
- `createInvite`: Logs admin invitation creation
- `acceptInvite`: Logs user acceptance of invitation
- `updateInviteStatus`: Logs admin invitation revocation

## Usage Examples

### Logging Client Submission
```typescript
await ctx.runMutation(api.history.addHistory, {
  userId: clientId,
  userType: "client",
  action: "Submitted design request: My Custom Shirt Design",
  actionType: "design_request",
  relatedId: requestId,
  relatedType: "request",
  details: {
    status: "pending",
    reason: "Client wants custom design",
  },
});
```

### Logging Admin Action
```typescript
await ctx.runMutation(api.history.addHistory, {
  userId: adminId,
  userType: "admin",
  action: "Approved add-ons request (quantity)",
  actionType: "addon_approval",
  relatedId: addOnsId,
  relatedType: "addon",
  details: {
    status: "approved",
    previousStatus: "pending",
    amount: 150.00,
  },
});
```

### Retrieving History
```typescript
// Get all history for a user
const userHistory = await api.history.getHistory({ userId });

// Get all admin actions
const adminActions = await api.history.getHistoryByActionType({ userType: "admin" });

// Get all updates for a specific design
const designUpdates = await api.history.getHistoryByRelated({ relatedId: designId });
```

## Frontend Integration (Optional)

You can create a history view component to display user activity:

```typescript
// Usage in React component
const history = useQuery(api.history.getHistory, { userId: currentUserId });

return (
  <div>
    {history?.map((entry) => (
      <div key={entry._id}>
        <p>{entry.action}</p>
        <span>{new Date(entry.timestamp).toLocaleString()}</span>
      </div>
    ))}
  </div>
);
```

## Benefits

1. **Audit Trail**: Complete record of all actions for compliance and troubleshooting
2. **User Activity Tracking**: Monitor client, designer, and admin activities
3. **Status Transitions**: Track how entities progress through their lifecycle
4. **Decision Tracking**: Store reasons for approvals/declines
5. **Analytics**: Analyze patterns and user behavior
6. **Accountability**: Track who did what and when

## Future Enhancements

- Add frontend History/Activity view page
- Create admin analytics dashboard
- Implement history filtering UI
- Add export/reporting functionality
- Create timeline visualization of order progression

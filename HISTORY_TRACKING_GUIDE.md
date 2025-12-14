# History Tracking System Guide

## Overview

The history tracking system automatically logs all key actions performed by clients, designers, and admins throughout the TechShirt application. This provides a comprehensive audit trail and allows users to view their activity history.

## Database Schema

The `history` table structure:

```typescript
history: defineTable({
  user_id: v.id("users"),              // Who performed the action
  userType: "client" | "designer" | "admin",  // User's role
  action: v.string(),                  // Human-readable description (e.g., "Submitted design request")
  actionType: v.union(                 // Category of action
    "submit", "approve", "decline", "assign", "update", "post", 
    "comment", "invite", "design_approval", "design_request",
    "addon_request", "addon_approval"
  ),
  relatedId: v.optional(v.string()),   // ID of related entity (design_id, request_id, addon_id)
  relatedType: v.optional(v.string()), // Type of related entity ("design", "request", "addon", "invite")
  details: v.optional({                // Additional metadata
    status: v.optional(v.string()),         // Current status
    previousStatus: v.optional(v.string()), // Previous status
    reason: v.optional(v.string()),         // Reason or description
    amount: v.optional(v.number()),         // Amount (for billing)
  }),
  timestamp: v.number(),               // When the action occurred
})
.index("by_user", ["user_id"])
.index("by_user_type", ["userType"])
.index("by_action_type", ["actionType"])
.index("by_related", ["relatedType"])
```

## Tracked Actions

### Client Actions

| Action | actionType | Triggered When |
|--------|-----------|-----------------|
| Submit design request | `design_request` | Client creates a new design request |
| Approve design | `design_approval` | Client approves a designer's work |
| Submit add-ons request | `addon_request` | Client requests quantity or design add-ons |
| Cancel request | `update` | Client cancels a design request |
| Post comment | `comment` | Client leaves a comment on a design |

### Designer Actions

| Action | actionType | Triggered When |
|--------|-----------|-----------------|
| Assigned to request | `assign` | Admin assigns designer to a design request |
| Post update | `post` | Designer posts an update/revision |
| Post comment | `comment` | Designer leaves feedback/comment |

### Admin Actions

| Action | actionType | Triggered When |
|--------|-----------|-----------------|
| Assign designer | `assign` | Admin assigns a designer to a request |
| Approve add-ons | `addon_approval` | Admin approves a client's add-ons request |
| Decline add-ons | `addon_approval` | Admin declines a client's add-ons request |
| Send invitation | `invite` | Admin invites a new designer/user |
| Update request status | `update` | Admin changes request status |

## API Usage

### Query History

**Get all history for a user:**
```typescript
const history = await client.query(api.history.getHistory, { 
  userId: userIdFromClerk 
});
```

**Get history by user type (e.g., all admin actions):**
```typescript
const adminHistory = await client.query(api.history.getHistoryByActionType, { 
  userType: "admin" 
});
```

**Get all history for a related entity:**
```typescript
const designHistory = await client.query(api.history.getHistoryByRelated, { 
  relatedId: designId 
});
```

### Log History

**Manual history logging (from mutation):**
```typescript
await ctx.runMutation(api.history.addHistory, {
  userId: userId,
  userType: "client",
  action: "Custom action description",
  actionType: "submit",
  relatedId: entityId,
  relatedType: "design",
  details: {
    status: "pending",
    reason: "Custom reason",
  },
});
```

## Implementation Details

### Enhanced Mutations

The following mutations now automatically log history:

1. **design_requests.ts**
   - `createRequest()` - Logs client submission
   - `assignDesignRequest()` - Logs designer assignment
   - `updateDesignRequestStatus()` - Logs status changes
   - `cancelDesignRequest()` - Logs cancellations

2. **addOns.ts**
   - `submitAddOns()` - Logs add-ons request submission
   - `updateAddOnsStatus()` - Logs approval/decline by admin

3. **designs.ts**
   - `approveDesign()` - Logs design approval by client

4. **comments.ts**
   - `add()` - Logs comment posting

5. **invitation.ts**
   - `createInvite()` - Logs invitation sent by admin
   - `acceptInvite()` - Logs invitation acceptance

## Frontend Usage Example

Display user's history timeline:

```tsx
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function HistoryTimeline({ userId }) {
  const history = useQuery(api.history.getHistory, { userId });

  return (
    <div className="history-timeline">
      {history?.map((entry) => (
        <div key={entry._id} className="history-entry">
          <span className="timestamp">
            {new Date(entry.timestamp).toLocaleString()}
          </span>
          <span className="action">{entry.action}</span>
          {entry.details?.reason && (
            <span className="detail">{entry.details.reason}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Benefits

1. **Audit Trail** - Complete record of all actions for compliance
2. **User Accountability** - Track who did what and when
3. **Debugging** - Easy to trace issues back to specific actions
4. **User Experience** - Users can review their action history
5. **Analytics** - Understand user behavior and patterns
6. **Notifications** - Can be used to build activity feeds

## Future Enhancements

- [ ] Create activity feed UI component
- [ ] Add email notifications based on history events
- [ ] Generate reports from history data
- [ ] Implement history search/filtering
- [ ] Add bulk export of history
- [ ] Create admin dashboard showing all user activities

## Notes

- History is logged asynchronously to avoid blocking mutations
- All history records include timestamp for sorting/filtering
- The `details` field is flexible and can be extended as needed
- Indexes are optimized for common queries (by user, by type, by related entity)

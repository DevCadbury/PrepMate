# Typing Indicator Implementation

## Overview

This document describes the implementation of the typing indicator feature for the PrepMate chat system, following WhatsApp and Instagram DM patterns.

## 🎯 Features Implemented

### ✅ 1. Frontend Input Handling

- **Trigger**: User types in chat input
- **Logic**:
  - Emits `typing` event when user starts typing
  - Resets 2-second timeout on each keystroke
  - Emits `stopTyping` after 2 seconds of inactivity
  - Handles both direct and group chats

### ✅ 2. Backend Socket.IO Logic

- **Events**: `typing` and `stopTyping`
- **Broadcasting**:
  - Direct chats: Sends to specific receiver
  - Group chats: Broadcasts to all participants except sender
- **Events Emitted**: `showTyping` and `hideTyping`

### ✅ 3. Frontend Receiver UI

- **Display**: Shows "X is typing..." below messages
- **Animation**: Instagram-style animated dots
- **Position**: Chat footer, below last message

### ✅ 4. UI Animation (Instagram Style)

- **CSS Classes**: `.typing-indicator` and `.chat-typing-indicator`
- **Animation**: Bouncing dots with staggered delays
- **Styling**: Modern, clean design with backdrop blur

## 🔧 Technical Implementation

### Backend (Socket Handler)

#### Event Handlers

```javascript
// New typing events
socket.on("typing", (data) => {
  this.handleTyping(socket, data);
});

socket.on("stopTyping", (data) => {
  this.handleStopTyping(socket, data);
});
```

#### Broadcasting Logic

```javascript
handleTyping(socket, data) {
  const { roomId, senderId, receiverId, groupId } = data;

  if (groupId) {
    // Group chat - broadcast to all participants except sender
    socket.to(`chat:${groupId}`).emit("showTyping", {
      senderId: userId,
      senderName: user.name,
      groupId,
    });
  } else if (receiverId) {
    // Direct chat - send to specific receiver
    const receiverSocket = this.connectedUsers.get(receiverId);
    if (receiverSocket) {
      receiverSocket.emit("showTyping", {
        senderId: userId,
        senderName: user.name,
        receiverId,
      });
    }
  }
}
```

### Frontend (ChatPage)

#### Typing Logic

```typescript
const handleTyping = () => {
  if (!newMessage.trim()) return;

  // Clear existing timeout
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }

  setIsTyping(true);

  // Emit typing event
  if (!isTyping && socket && currentRoom) {
    const receiverId =
      currentRoom.type === "direct"
        ? currentRoom.participants.find((p) => p._id !== user?.id)?._id
        : null;

    socket.emit("typing", {
      senderId: user?.id,
      receiverId: receiverId,
      groupId: currentRoom.type === "group" ? currentRoom._id : null,
      roomId: currentRoom._id,
    });
  }

  // Set 2-second timeout
  const timeout = setTimeout(() => {
    setIsTyping(false);
    socket.emit("stopTyping", {
      /* same data */
    });
  }, 2000);

  setTypingTimeout(timeout);
};
```

#### Socket Event Listeners

```typescript
// Handle typing indicators
newSocket.on("showTyping", (data: any) => {
  const { senderId, senderName, roomId, receiverId, groupId } = data;

  const isCurrentRoom =
    (roomId && roomId === currentRoom?._id) ||
    (groupId && groupId === currentRoom?._id) ||
    (receiverId && receiverId === user?.id);

  if (isCurrentRoom && senderId !== user?.id) {
    setTypingUsers((prev) => {
      if (!prev.includes(senderName)) {
        return [...prev, senderName];
      }
      return prev;
    });
  }
});

newSocket.on("hideTyping", (data: any) => {
  // Similar logic to remove typing users
});
```

## 🎨 UI Components

### Typing Indicator Component

```typescript
const TypingIndicator = () => (
  <div className="flex justify-start mb-4">
    <div className="chat-typing-indicator">
      <div className="dots">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
      <span className="text-xs text-gray-600 font-medium">
        {`${typingUsers.join(", ")} ${
          typingUsers.length === 1 ? "is" : "are"
        } typing...`}
      </span>
    </div>
  </div>
);
```

### CSS Animations

```css
.chat-typing-indicator .dot {
  width: 6px;
  height: 6px;
  background: #6b7280;
  border-radius: 50%;
  animation: chatBlink 1.4s infinite ease-in-out;
}

@keyframes chatBlink {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-4px);
  }
}
```

## 📊 Behavior Summary

| Feature          | Implementation                | Status |
| ---------------- | ----------------------------- | ------ |
| **Trigger**      | Input change event            | ✅     |
| **Stop Trigger** | 2-second timeout or blur      | ✅     |
| **UI Position**  | Chat footer below messages    | ✅     |
| **Animation**    | Instagram-style bouncing dots | ✅     |
| **Group Chats**  | Shows "X is typing..."        | ✅     |
| **Direct Chats** | Shows "X is typing..."        | ✅     |

## 🧪 Testing

### Manual Testing

1. Open chat in two browser windows
2. Type in one window
3. Verify typing indicator appears in other window
4. Stop typing and verify indicator disappears after 2 seconds

### Automated Testing

Run the test file:

```bash
node test-typing-indicator.js
```

## 🔄 Event Flow

1. **User Types** → `handleTyping()` called
2. **Frontend** → Emits `typing` event with sender/receiver/group data
3. **Backend** → Receives `typing` event, broadcasts `showTyping`
4. **Other Clients** → Receive `showTyping`, update UI
5. **Timeout/Blur** → Frontend emits `stopTyping`
6. **Backend** → Broadcasts `hideTyping`
7. **Other Clients** → Receive `hideTyping`, remove from UI

## 🚀 Performance Considerations

- **Debouncing**: 2-second timeout prevents excessive events
- **Efficient Broadcasting**: Only sends to relevant users
- **Memory Management**: Clears timeouts on component unmount
- **Backward Compatibility**: Maintains legacy event handlers

## 🔧 Configuration

- **Timeout Duration**: 2000ms (configurable)
- **Animation Duration**: 1.4s (CSS configurable)
- **Event Names**: `typing`, `stopTyping`, `showTyping`, `hideTyping`

## 📝 Future Enhancements

- [ ] Typing sound effects
- [ ] Typing speed detection
- [ ] Typing prediction
- [ ] Mobile-specific optimizations
- [ ] Accessibility improvements (screen readers)

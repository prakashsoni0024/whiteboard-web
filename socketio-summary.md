| Type       | Code                           | Description                     |
| ---------- | ------------------------------ | ------------------------------- |
| Connect    | `io(URL)`                      | Client connects to server       |
| Send       | `socket.emit("event", data)`   | Client sends event to server    |
| Receive    | `socket.on("event", callback)` | Client/server listens for event |
| Broadcast  | `io.emit("event", data)`       | Server sends data to all        |
| Disconnect | `socket.on("disconnect")`      | Handles user leaving            |

import ActivityKit
import Foundation

// MARK: - Shared Live Activity contract
// Both the main app (via the native bridge) and the extension read this type.

public struct TaskTimerAttributes: ActivityAttributes {
    // Static data — set once when the activity starts, never changes.
    public struct ContentState: Codable, Hashable {
        /// ISO-8601 date string of when the timer started.
        public var startedAt: String
        /// Total estimated work duration in seconds.
        public var estimatedSeconds: Int
        /// Total seconds accumulated on break (so elapsed = wall − paused − totalPausedSecs).
        public var totalPausedSeconds: Int
        /// ISO-8601 date string when the timer was paused, or "" if running.
        public var pausedAt: String
        /// Human-readable status label shown in the UI.
        public var statusLabel: String  // "In Progress" | "On Break" | "Overtime"
    }

    /// Task identifier.
    public var taskId: String
    /// Task title — shown as the heading.
    public var taskTitle: String
}

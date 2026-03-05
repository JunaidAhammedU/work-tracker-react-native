import ActivityKit
import Foundation

// MARK: - Shared Live Activity contract
// This struct is the ActivityAttributes definition used by the Live Activity
// extension. An identical copy is defined inline in LiveActivityBridge.swift
// (main app target) so both targets can reference the same type without
// cross-target compilation dependencies. KEEP BOTH IN SYNC.

@available(iOS 16.1, *)
struct TaskTimerAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var startedAt: String
        var estimatedSeconds: Int
        var totalPausedSeconds: Int
        var pausedAt: String
        var statusLabel: String
    }

    var taskId: String
    var taskTitle: String
}

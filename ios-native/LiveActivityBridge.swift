import ActivityKit
import Foundation
import React

// MARK: - LiveActivityBridge
// Exposes start / update / stop Live Activity methods to React Native.
// Called from widget.service.ts via NativeModules.LiveActivityBridge.

@available(iOS 16.1, *)
@objc(LiveActivityBridge)
class LiveActivityBridge: NSObject {

    // ─── Shared helper ──────────────────────────────────────────────────────

    private func buildState(from dict: NSDictionary) -> TaskTimerAttributes.ContentState {
        return TaskTimerAttributes.ContentState(
            startedAt:           dict["startedAt"]           as? String ?? "",
            estimatedSeconds:    dict["estimatedSeconds"]    as? Int    ?? 0,
            totalPausedSeconds:  dict["totalPausedSeconds"]  as? Int    ?? 0,
            pausedAt:            dict["pausedAt"]            as? String ?? "",
            statusLabel:         dict["statusLabel"]         as? String ?? "In Progress"
        )
    }

    // ─── start ──────────────────────────────────────────────────────────────
    // Launches a new Live Activity for the given task.
    // If one with the same taskId already exists it is ended first.

    @objc
    func start(
        _ taskId: String,
        taskTitle: String,
        stateDict: NSDictionary,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            rejecter("UNAVAILABLE", "Live Activities are disabled on this device.", nil)
            return
        }

        // End any running activity for this task first.
        for activity in Activity<TaskTimerAttributes>.activities
        where activity.attributes.taskId == taskId {
            Task { await activity.end(nil, dismissalPolicy: .immediate) }
        }

        let attributes = TaskTimerAttributes(taskId: taskId, taskTitle: taskTitle)
        let state      = buildState(from: stateDict)

        do {
            let activity = try Activity.request(
                attributes: attributes,
                content:    .init(state: state, staleDate: nil),
                pushType:   nil
            )
            resolver(activity.id)
        } catch {
            rejecter("START_FAILED", error.localizedDescription, error)
        }
    }

    // ─── update ─────────────────────────────────────────────────────────────
    // Updates an existing Live Activity (e.g. on break / resume / tick).

    @objc
    func update(
        _ taskId: String,
        stateDict: NSDictionary,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        let state = buildState(from: stateDict)
        var found = false

        for activity in Activity<TaskTimerAttributes>.activities
        where activity.attributes.taskId == taskId {
            found = true
            Task {
                await activity.update(.init(state: state, staleDate: nil))
            }
        }

        if found {
            resolver(true)
        } else {
            // Not a hard error — the activity may have been dismissed by the OS.
            resolver(false)
        }
    }

    // ─── stop ───────────────────────────────────────────────────────────────
    // Ends the Live Activity immediately and removes it from the Lock Screen.

    @objc
    func stop(
        _ taskId: String,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        for activity in Activity<TaskTimerAttributes>.activities
        where activity.attributes.taskId == taskId {
            Task { await activity.end(nil, dismissalPolicy: .immediate) }
        }
        resolver(true)
    }

    // ─── RN threading ───────────────────────────────────────────────────────

    @objc
    static func requiresMainQueueSetup() -> Bool { return false }
}

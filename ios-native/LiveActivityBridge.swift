import ActivityKit
import Foundation
import React

// MARK: - TaskTimerAttributes
// Defined inline in this file so it is ALWAYS compiled as part of the main app
// target. The identical struct also exists in the Live Activity extension target
// (ios-live-activity/TaskTimerAttributes.swift). Both must stay in sync.
//
// We duplicate rather than share because each Xcode target has its own
// compilation scope and the Expo config plugin's addSourceFile() is unreliable
// for cross-target file registration.

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

// MARK: - LiveActivityBridge
// Exposes start / update / stop Live Activity methods to React Native.
// Called from widget.service.ts via NativeModules.LiveActivityBridge.
//
// The class itself must NOT be @available(iOS 16.1, *) because RN's ObjC bridge
// resolves it at load time on all OS versions. Instead each method gates the
// ActivityKit calls behind #available checks.

@objc(LiveActivityBridge)
class LiveActivityBridge: NSObject {

    // ─── Shared helper ──────────────────────────────────────────────────────

    @available(iOS 16.1, *)
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

    @objc
    func start(
        _ taskId: String,
        taskTitle: String,
        stateDict: NSDictionary,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        guard #available(iOS 16.1, *) else {
            rejecter("UNAVAILABLE", "Live Activities require iOS 16.1+", nil)
            return
        }
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

    @objc
    func update(
        _ taskId: String,
        stateDict: NSDictionary,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        guard #available(iOS 16.1, *) else {
            resolver(false)
            return
        }
        let state = buildState(from: stateDict)
        var found = false

        for activity in Activity<TaskTimerAttributes>.activities
        where activity.attributes.taskId == taskId {
            found = true
            Task {
                await activity.update(.init(state: state, staleDate: nil))
            }
        }
        resolver(found)
    }

    // ─── stop ───────────────────────────────────────────────────────────────

    @objc
    func stop(
        _ taskId: String,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        guard #available(iOS 16.1, *) else {
            resolver(true)
            return
        }
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

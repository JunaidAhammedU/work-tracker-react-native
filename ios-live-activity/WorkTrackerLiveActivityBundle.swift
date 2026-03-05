import ActivityKit
import SwiftUI
import WidgetKit

// The Live Activity extension must have exactly one @main entry point.
// We place it in the Bundle file rather than inside TaskTimerLiveActivity.swift
// so the widget file stays a plain struct with no @main annotation.

@available(iOSApplicationExtension 16.2, *)
@main
struct WorkTrackerLiveActivityBundle: WidgetBundle {
    var body: some Widget {
        TaskTimerLiveActivity()
    }
}

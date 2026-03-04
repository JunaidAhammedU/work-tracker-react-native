import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - Helpers

private let lime = Color(red: 0.64, green: 0.90, blue: 0.21)
private let amber = Color(red: 0.98, green: 0.75, blue: 0.14)
private let darkBg = Color(red: 0.07, green: 0.07, blue: 0.07)

private func isoToDate(_ iso: String) -> Date? {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f.date(from: iso) ?? ISO8601DateFormatter().date(from: iso)
}

private func formatMMSS(_ total: Int) -> String {
    let abs = Swift.abs(total)
    let h = abs / 3600
    let m = (abs % 3600) / 60
    let s = abs % 60
    let pad: (Int) -> String = { String(format: "%02d", $0) }
    if h > 0 { return "\(pad(h)):\(pad(m)):\(pad(s))" }
    return "\(pad(m)):\(pad(s))"
}

// Compute active elapsed seconds from the content state.
private func elapsedSeconds(_ state: TaskTimerAttributes.ContentState) -> Int {
    guard let start = isoToDate(state.startedAt) else { return 0 }
    let wall = Int(Date().timeIntervalSince(start))
    let currentPause: Int
    if state.pausedAt.isEmpty {
        currentPause = 0
    } else {
        currentPause = state.pausedAt.isEmpty ? 0 : Int(Date().timeIntervalSince(isoToDate(state.pausedAt) ?? Date()))
    }
    return max(0, wall - state.totalPausedSeconds - currentPause)
}

private func remainingSeconds(_ state: TaskTimerAttributes.ContentState) -> Int {
    return state.estimatedSeconds - elapsedSeconds(state)
}

private func progressFraction(_ state: TaskTimerAttributes.ContentState) -> Double {
    guard state.estimatedSeconds > 0 else { return 0 }
    return min(1.0, Double(elapsedSeconds(state)) / Double(state.estimatedSeconds))
}

// MARK: - Live Activity Widget

@available(iOSApplicationExtension 16.1, *)
struct TaskTimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TaskTimerAttributes.self) { context in
            // ── Lock Screen / Banner view ──────────────────────────────────
            LockScreenView(
                attributes: context.attributes,
                state: context.state
            )
        } dynamicIsland: { context in
            DynamicIsland {
                // ── Expanded Dynamic Island ─────────────────────────────────
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 2) {
                        Label {
                            Text("Work Timer")
                                .font(.caption2)
                                .foregroundColor(.gray)
                        } icon: {
                            Image(systemName: "timer")
                                .foregroundColor(lime)
                                .font(.caption2)
                        }
                        Text(context.attributes.taskTitle)
                            .font(.subheadline.bold())
                            .foregroundColor(.white)
                            .lineLimit(1)
                    }
                    .padding(.leading, 4)
                }

                DynamicIslandExpandedRegion(.trailing) {
                    let isBreak = context.state.statusLabel == "On Break"
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(context.state.statusLabel)
                            .font(.caption2.bold())
                            .foregroundColor(isBreak ? amber : lime)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background((isBreak ? amber : lime).opacity(0.15))
                            .clipShape(Capsule())
                        TimelineView(.periodic(from: .now, by: 1)) { _ in
                            let rem = remainingSeconds(context.state)
                            let isOver = rem < 0
                            Text(isOver ? "+\(formatMMSS(rem))" : formatMMSS(rem))
                                .font(.system(.footnote, design: .monospaced).bold())
                                .foregroundColor(isOver ? .red : (isBreak ? amber : lime))
                        }
                    }
                    .padding(.trailing, 4)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    TimelineView(.periodic(from: .now, by: 1)) { _ in
                        let fraction = progressFraction(context.state)
                        let isBreak = context.state.statusLabel == "On Break"
                        let isOver = remainingSeconds(context.state) < 0
                        let barColor: Color = isBreak ? amber : (isOver ? .red : lime)
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule()
                                    .fill(Color.white.opacity(0.12))
                                    .frame(height: 4)
                                Capsule()
                                    .fill(barColor)
                                    .frame(width: geo.size.width * fraction, height: 4)
                            }
                        }
                        .frame(height: 4)
                        .padding(.horizontal, 12)
                        .padding(.bottom, 6)
                    }
                }
            } compactLeading: {
                // ── Compact — left side of pill ────────────────────────────
                Image(systemName: "timer")
                    .foregroundColor(lime)
                    .font(.caption.bold())
            } compactTrailing: {
                // ── Compact — right side of pill ──────────────────────────
                TimelineView(.periodic(from: .now, by: 1)) { _ in
                    let rem = remainingSeconds(context.state)
                    let isOver = rem < 0
                    let isBreak = context.state.statusLabel == "On Break"
                    Text(isOver ? "+\(formatMMSS(rem))" : formatMMSS(rem))
                        .font(.system(.caption2, design: .monospaced).bold())
                        .foregroundColor(isOver ? .red : (isBreak ? amber : lime))
                }
            } minimal: {
                // ── Minimal — single icon on the right pill ────────────────
                Image(systemName: "timer.circle.fill")
                    .foregroundColor(lime)
                    .font(.footnote)
            }
            .keylineTint(lime)
        }
    }
}

// MARK: - Lock Screen View

@available(iOSApplicationExtension 16.1, *)
struct LockScreenView: View {
    let attributes: TaskTimerAttributes
    let state: TaskTimerAttributes.ContentState

    var body: some View {
        let isBreak = state.statusLabel == "On Break"
        let isOver = remainingSeconds(state) < 0
        let accentColor: Color = isBreak ? amber : (isOver ? .red : lime)

        VStack(spacing: 0) {
            // ── Top bar ────────────────────────────────────────────────────
            HStack(spacing: 10) {
                // App icon placeholder
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(lime.opacity(0.15))
                        .frame(width: 40, height: 40)
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(lime)
                        .font(.system(size: 22))
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text("Work Tracker")
                        .font(.caption2)
                        .foregroundColor(.gray)
                    Text(attributes.taskTitle)
                        .font(.subheadline.bold())
                        .foregroundColor(.white)
                        .lineLimit(2)
                }

                Spacer()

                // Status badge
                VStack(alignment: .trailing, spacing: 4) {
                    Text(state.statusLabel)
                        .font(.caption2.bold())
                        .foregroundColor(accentColor)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(accentColor.opacity(0.15))
                        .overlay(
                            Capsule().stroke(accentColor.opacity(0.4), lineWidth: 1)
                        )
                        .clipShape(Capsule())

                    TimelineView(.periodic(from: .now, by: 1)) { _ in
                        let rem = remainingSeconds(state)
                        let isO = rem < 0
                        Text(isO ? "Overtime \(formatMMSS(rem))" : formatMMSS(rem))
                            .font(.system(.footnote, design: .monospaced).bold())
                            .foregroundColor(isO ? .red : accentColor)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 14)

            Spacer(minLength: 10)

            // ── Progress bar ───────────────────────────────────────────────
            TimelineView(.periodic(from: .now, by: 1)) { _ in
                let fraction = progressFraction(state)
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule()
                            .fill(Color.white.opacity(0.10))
                            .frame(height: 6)
                        Capsule()
                            .fill(accentColor)
                            .frame(width: geo.size.width * fraction, height: 6)
                    }
                }
                .frame(height: 6)
                .padding(.horizontal, 16)
            }

            // ── Elapsed / Estimated row ─────────────────────────────────────
            TimelineView(.periodic(from: .now, by: 1)) { _ in
                let elapsed = elapsedSeconds(state)
                let est = state.estimatedSeconds
                HStack {
                    Text("Elapsed: \(formatMMSS(elapsed))")
                        .font(.caption2)
                        .foregroundColor(.gray)
                    Spacer()
                    Text("Est: \(formatMMSS(est))")
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
                .padding(.horizontal, 16)
                .padding(.top, 6)
                .padding(.bottom, 14)
            }
        }
        .background(darkBg)
    }
}

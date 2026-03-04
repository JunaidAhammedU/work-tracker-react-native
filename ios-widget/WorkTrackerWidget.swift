import WidgetKit
import SwiftUI

// MARK: - Data Models

struct WidgetTask: Codable, Identifiable {
    let id: String
    let title: String
    let priority: String
    let status: String
}

// MARK: - Timeline Provider

struct TaskProvider: TimelineProvider {
    let appGroup = "group.com.worktracker.shared"

    func placeholder(in context: Context) -> TaskEntry {
        TaskEntry(date: Date(), tasks: [
            WidgetTask(id: "1", title: "Sample Task", priority: "P1", status: "Pending"),
            WidgetTask(id: "2", title: "Another Task", priority: "P2", status: "In Progress"),
        ])
    }

    func getSnapshot(in context: Context, completion: @escaping (TaskEntry) -> Void) {
        let tasks = loadTasks()
        let entry = TaskEntry(date: Date(), tasks: tasks)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TaskEntry>) -> Void) {
        let tasks = loadTasks()
        let entry = TaskEntry(date: Date(), tasks: tasks)
        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadTasks() -> [WidgetTask] {
        guard let defaults = UserDefaults(suiteName: appGroup),
              let jsonString = defaults.string(forKey: "widgetTasks"),
              let data = jsonString.data(using: .utf8) else {
            return []
        }

        do {
            let tasks = try JSONDecoder().decode([WidgetTask].self, from: data)
            return Array(tasks.prefix(5)) // Limit to 5 tasks for widget
        } catch {
            return []
        }
    }
}

// MARK: - Timeline Entry

struct TaskEntry: TimelineEntry {
    let date: Date
    let tasks: [WidgetTask]
}

// MARK: - Priority Helpers

func priorityColor(_ priority: String) -> Color {
    switch priority.uppercased() {
    case "P1":
        return .red
    case "P2":
        return .orange
    case "P3":
        return .blue
    default:
        return .gray
    }
}

func priorityIcon(_ priority: String) -> String {
    switch priority.uppercased() {
    case "P1":
        return "flame.fill"
    case "P2":
        return "exclamationmark.triangle.fill"
    case "P3":
        return "minus.circle.fill"
    default:
        return "circle.fill"
    }
}

func statusColor(_ status: String) -> Color {
    switch status.lowercased() {
    case "completed", "done":
        return .green
    case "in progress", "inprogress":
        return .yellow
    default:
        return .orange
    }
}

// MARK: - Small Widget View

struct SmallWidgetView: View {
    let entry: TaskEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(Color(red: 0.64, green: 0.9, blue: 0.21))
                    .font(.system(size: 14))
                Text("Today's Tasks")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.white)
                Spacer()
                Text("\(entry.tasks.count)")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.black)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color(red: 0.64, green: 0.9, blue: 0.21))
                    .clipShape(Capsule())
            }

            if entry.tasks.isEmpty {
                Spacer()
                HStack {
                    Spacer()
                    VStack(spacing: 4) {
                        Image(systemName: "tray")
                            .foregroundColor(.gray)
                            .font(.system(size: 20))
                        Text("No tasks today")
                            .font(.system(size: 11))
                            .foregroundColor(.gray)
                    }
                    Spacer()
                }
                Spacer()
            } else {
                ForEach(entry.tasks.prefix(3)) { task in
                    HStack(spacing: 6) {
                        Image(systemName: priorityIcon(task.priority))
                            .foregroundColor(priorityColor(task.priority))
                            .font(.system(size: 9))
                        Text(task.title)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.white)
                            .lineLimit(1)
                    }
                }
                if entry.tasks.count > 3 {
                    Text("+\(entry.tasks.count - 3) more")
                        .font(.system(size: 10))
                        .foregroundColor(.gray)
                }
            }
        }
        .padding(12)
    }
}

// MARK: - Medium Widget View

struct MediumWidgetView: View {
    let entry: TaskEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(Color(red: 0.64, green: 0.9, blue: 0.21))
                    .font(.system(size: 16))
                Text("Today's Tasks")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
                Spacer()
                Text("\(entry.tasks.count) tasks")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.black)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color(red: 0.64, green: 0.9, blue: 0.21))
                    .clipShape(Capsule())
            }

            if entry.tasks.isEmpty {
                Spacer()
                HStack {
                    Spacer()
                    VStack(spacing: 6) {
                        Image(systemName: "tray")
                            .foregroundColor(.gray)
                            .font(.system(size: 28))
                        Text("No tasks for today")
                            .font(.system(size: 13))
                            .foregroundColor(.gray)
                        Text("Add a task to get started")
                            .font(.system(size: 11))
                            .foregroundColor(.gray.opacity(0.6))
                    }
                    Spacer()
                }
                Spacer()
            } else {
                ForEach(entry.tasks.prefix(4)) { task in
                    HStack(spacing: 8) {
                        // Priority badge
                        Text(task.priority)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(priorityColor(task.priority))
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2)
                            .background(priorityColor(task.priority).opacity(0.15))
                            .clipShape(Capsule())

                        Text(task.title)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.white)
                            .lineLimit(1)

                        Spacer()

                        // Status dot
                        Circle()
                            .fill(statusColor(task.status))
                            .frame(width: 6, height: 6)
                    }
                }
                if entry.tasks.count > 4 {
                    Text("+\(entry.tasks.count - 4) more tasks")
                        .font(.system(size: 10))
                        .foregroundColor(.gray)
                }
            }
        }
        .padding(14)
    }
}

// MARK: - Widget Configuration

struct WorkTrackerWidget: Widget {
    let kind: String = "WorkTrackerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TaskProvider()) { entry in
            Group {
                if #available(iOSApplicationExtension 17.0, *) {
                    WidgetEntryView(entry: entry)
                        .containerBackground(Color(red: 0.07, green: 0.07, blue: 0.07), for: .widget)
                } else {
                    WidgetEntryView(entry: entry)
                        .background(Color(red: 0.07, green: 0.07, blue: 0.07))
                }
            }
        }
        .configurationDisplayName("Work Tracker")
        .description("View today's tasks with priority at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Entry View (routes to correct size)

struct WidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: TaskEntry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            MediumWidgetView(entry: entry)
        }
    }
}

// MARK: - Preview

struct WorkTrackerWidget_Previews: PreviewProvider {
    static var previews: some View {
        SmallWidgetView(entry: TaskEntry(date: Date(), tasks: [
            WidgetTask(id: "1", title: "Fix login API bug", priority: "P1", status: "In Progress"),
            WidgetTask(id: "2", title: "Update dashboard UI", priority: "P2", status: "Pending"),
            WidgetTask(id: "3", title: "Write unit tests", priority: "P3", status: "Pending"),
        ]))
        .previewContext(WidgetPreviewContext(family: .systemSmall))

        MediumWidgetView(entry: TaskEntry(date: Date(), tasks: [
            WidgetTask(id: "1", title: "Fix login API bug", priority: "P1", status: "In Progress"),
            WidgetTask(id: "2", title: "Update dashboard UI", priority: "P2", status: "Pending"),
            WidgetTask(id: "3", title: "Write unit tests", priority: "P3", status: "Pending"),
            WidgetTask(id: "4", title: "Deploy to staging", priority: "P2", status: "Completed"),
        ]))
        .previewContext(WidgetPreviewContext(family: .systemMedium))
    }
}

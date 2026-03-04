import Foundation
import React
import WidgetKit

@objc(SharedGroupPreferences)
class SharedGroupPreferences: NSObject {

    @objc
    func setItem(_ key: String, value: String, group: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        if let defaults = UserDefaults(suiteName: group) {
            defaults.set(value, forKey: key)
            defaults.synchronize()
            // Whenever the JS side writes widgetLastUpdate (bumped after every
            // task mutation), ask WidgetKit to reload all timelines immediately
            // so the home-screen widget reflects the change without waiting for
            // the 15-minute automatic refresh cycle.
            if key == "widgetLastUpdate" {
                if #available(iOS 14.0, *) {
                    WidgetCenter.shared.reloadAllTimelines()
                }
            }
            resolver(true)
        } else {
            rejecter("ERROR", "Could not access App Group: \(group)", nil)
        }
    }

    @objc
    func getItem(_ key: String, group: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        if let defaults = UserDefaults(suiteName: group) {
            let value = defaults.string(forKey: key)
            resolver(value)
        } else {
            rejecter("ERROR", "Could not access App Group: \(group)", nil)
        }
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}

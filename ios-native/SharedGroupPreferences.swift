import Foundation
import React

@objc(SharedGroupPreferences)
class SharedGroupPreferences: NSObject {

    @objc
    func setItem(_ key: String, value: String, group: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        if let defaults = UserDefaults(suiteName: group) {
            defaults.set(value, forKey: key)
            defaults.synchronize()
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

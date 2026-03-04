#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SharedGroupPreferences, NSObject)

RCT_EXTERN_METHOD(setItem:(NSString *)key
                  value:(NSString *)value
                  group:(NSString *)group
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(getItem:(NSString *)key
                  group:(NSString *)group
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

@end

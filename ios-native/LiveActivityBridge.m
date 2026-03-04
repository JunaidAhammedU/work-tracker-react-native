#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LiveActivityBridge, NSObject)

RCT_EXTERN_METHOD(start:(NSString *)taskId
                  taskTitle:(NSString *)taskTitle
                  stateDict:(NSDictionary *)stateDict
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(update:(NSString *)taskId
                  stateDict:(NSDictionary *)stateDict
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(stop:(NSString *)taskId
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

@end

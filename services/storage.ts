import AsyncStorage from '@react-native-async-storage/async-storage'

export const storage = {
    set: async (key: string, value: any) =>
        AsyncStorage.setItem(key, JSON.stringify(value)),

    get: async <T>(key: string): Promise<T | null> => {
        const value = await AsyncStorage.getItem(key)
        return value ? JSON.parse(value) : null
    },

    remove: AsyncStorage.removeItem,
}

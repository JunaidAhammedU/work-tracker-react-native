import { DEFAULT_GEMINI_MODEL, GEMINI_MODEL_STORAGE_KEY } from '@/constants/gemini.models'
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

export const modelStorage = {
    getSelectedModel: async (): Promise<string> => {
        const model = await AsyncStorage.getItem(GEMINI_MODEL_STORAGE_KEY)
        return model ?? DEFAULT_GEMINI_MODEL
    },

    setSelectedModel: async (modelId: string): Promise<void> => {
        await AsyncStorage.setItem(GEMINI_MODEL_STORAGE_KEY, modelId)
    },
}

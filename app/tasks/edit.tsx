import AppText from '@/components/AppText'
import { taskService } from '@/services/task.service'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

interface TaskDetails {
    id: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    tags: string[];
    dueDate: string | null;
    estimatedTime: string;
    createdAt: string;
}

export default function EditTaskScreen() {
    const [taskDetails, setTaskDetails] = React.useState<TaskDetails | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState(taskDetails?.priority || 'P2')
    const [status, setStatus] = useState(taskDetails?.status || 'Pending')
    const [estimatedTime, setEstimatedTime] = useState('')
    const [tags, setTags] = useState<string[]>([...taskDetails?.tags || []])
    const [tagInput, setTagInput] = useState('')
    const [date, setDate] = useState<Date | null>(taskDetails?.dueDate ? new Date(taskDetails.dueDate) : null)
    const [showPicker, setShowPicker] = useState(false)
    const [showAIPrompt, setShowAIPrompt] = useState(false)
    const glowOpacity = useSharedValue(0.3)
    const router = useRouter()
    const { taskId } = useLocalSearchParams<{ taskId: string }>()

    // All hooks must be called before any conditional returns
    const glowStyle = useAnimatedStyle(() => {
        return {
            shadowColor: '#a3e635',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: glowOpacity.value,
            shadowRadius: 10,
            borderColor: `rgba(163, 230, 53, ${glowOpacity.value})`,
        }
    })

    useEffect(() => {
        const fetchTaskDetails = async () => {
            setLoading(true);
            const response = await taskService.getTaskById(taskId);
            if (response) {
                setTaskDetails(response);
                // Initialize form fields with task data
                setTitle(response.title || '');
                setDescription(response.description || '');
                setPriority(response.priority || 'P2');
                setStatus(response.status || 'Pending');
                setEstimatedTime(response.estimatedTime || '');
                setTags(response.tags || []);
                setDate(response.dueDate ? new Date(response.dueDate) : null);
            }
            setLoading(false);
        };

        fetchTaskDetails();
    }, [taskId]);

    useEffect(() => {
        if (showAIPrompt) {
            glowOpacity.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 1500 }),
                    withTiming(0.3, { duration: 1500 })
                ),
                -1,
                true
            )
        }
    }, [showAIPrompt])

    if (loading) {
        return (
            <SafeAreaView className='flex-1 bg-black justify-center items-center'>
                <ActivityIndicator size="large" color="#a3e635" />
            </SafeAreaView>
        );
    }

    if (!taskDetails) {
        return (
            <SafeAreaView className='flex-1 bg-black justify-center items-center px-5'>
                <View className='bg-zinc-900 rounded-2xl p-8 items-center border border-zinc-800'>
                    <Ionicons name="alert-circle-outline" size={48} color="#71717a" />
                    <AppText className='text-white text-lg font-bold mt-4'>Task Not Found</AppText>
                    <AppText className='text-zinc-500 text-center mt-2'>The task you're looking for doesn't exist or has been deleted.</AppText>
                    <TouchableOpacity
                        className='bg-lime-400 px-6 py-3 rounded-xl mt-6'
                        onPress={() => router.back()}
                    >
                        <AppText className='text-black font-bold'>Go Back</AppText>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const priorities = ['P1', 'P2', 'P3']
    const statuses = ['Pending', 'In Progress', 'Completed']

    const handleUpdateTask = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a task title')
            return
        }

        setLoading(true)
        try {
            await taskService.updateTask({
                id: taskDetails.id,
                title: title.trim(),
                description: description.trim(),
                priority,
                status,
                estimatedTime: estimatedTime.trim(),
                tags: tags,
                createdAt: taskDetails.createdAt,
                dueDate: date ? date.toISOString() : null
            })
            router.back()
        } catch (error) {
            Alert.alert('Error', 'Failed to create task')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddTags = (): void => {
        const trimmedTag = tagInput.trim();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            setTags((prevTags) => [...prevTags, trimmedTag]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string): void => {
        setTags((prevTags) => prevTags.filter(tag => tag !== tagToRemove));
    };

    return (
        <SafeAreaView className='flex-1 bg-black'>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className='flex-1'
            >
                <View className='px-5 py-4 border-b border-zinc-900'>
                    <View className='flex-row items-center'>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className='h-10 w-10 bg-zinc-900 rounded-full items-center justify-center border border-zinc-800'
                        >
                            <Ionicons name="arrow-back" size={20} color="white" />
                        </TouchableOpacity>
                        <AppText className='text-white text-xl font-bold ml-4'>Update Task</AppText>
                    </View>
                </View>

                <ScrollView
                    className='flex-1 px-5'
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40, paddingTop: 20 }}
                >
                    <View className='gap-6'>
                        {/* Title Input */}
                        <View>
                            <AppText className='text-zinc-400 font-medium mb-3 ml-1'>Title</AppText>
                            <TextInput
                                value={title}
                                onChangeText={setTitle}
                                placeholder="What needs to be done?"
                                placeholderTextColor="#52525b"
                                className='bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800 text-base'
                            />
                        </View>

                        {/* Priority Selector */}
                        <View>
                            <AppText className='text-zinc-400 font-medium mb-3 ml-1'>Priority</AppText>
                            <View className='flex-row gap-3'>
                                {priorities.map((p) => (
                                    <TouchableOpacity
                                        key={p}
                                        onPress={() => setPriority(p)}
                                        className={`flex-1 py-3 rounded-xl border items-center ${priority === p
                                            ? 'bg-zinc-700 border-zinc-600'
                                            : 'bg-zinc-900 border-zinc-800'
                                            }`}
                                    >
                                        <AppText className={`font-semibold ${priority === p ? 'text-white' : 'text-zinc-400'
                                            }`}>
                                            {p}
                                        </AppText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Status Selector */}
                        <View>
                            <AppText className='text-zinc-400 font-medium mb-3 ml-1'>Status</AppText>
                            <View className='flex-row gap-3'>
                                {statuses.map((s) => (
                                    <TouchableOpacity
                                        key={s}
                                        onPress={() => setStatus(s)}
                                        className={`flex-1 py-3 rounded-xl border items-center ${status === s
                                            ? 'bg-zinc-700 border-zinc-600'
                                            : 'bg-zinc-900 border-zinc-800'
                                            }`}
                                    >
                                        <AppText className={`font-semibold text-xs ${status === s ? 'text-white' : 'text-zinc-400'
                                            }`}>
                                            {s}
                                        </AppText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Date and Time Row */}
                        <View className='flex-row gap-4'>
                            <View className="flex-1">
                                <AppText className="text-zinc-400 font-medium mb-3 ml-1">
                                    Due Date
                                </AppText>

                                <TouchableOpacity
                                    onPress={() => setShowPicker(true)}
                                    className="flex-row items-center bg-zinc-900 p-4 rounded-xl border border-zinc-800 h-14"
                                >
                                    <Ionicons name="calendar-outline" size={20} color="#a1a1aa" />

                                    <AppText className="text-white ml-3 text-base">
                                        {date ? date.toDateString() : 'Select'}
                                    </AppText>
                                </TouchableOpacity>

                                {showPicker && (
                                    <DateTimePicker
                                        value={date ?? new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={(event, selectedDate) => {
                                            setShowPicker(false)

                                            if (selectedDate) {
                                                setDate(selectedDate)
                                            }
                                        }}
                                    />
                                )}
                            </View>
                            <View className='flex-1'>
                                <AppText className='text-zinc-400 font-medium mb-3 ml-1'>Estimate <AppText className="text-zinc-600 text-xs font-normal">(hrs)</AppText></AppText>
                                <View className='flex-row items-center bg-zinc-900 rounded-xl border border-zinc-800 px-4 h-14'>
                                    <Ionicons name="time-outline" size={20} color="#a1a1aa" />
                                    <TextInput
                                        value={estimatedTime}
                                        onChangeText={setEstimatedTime}
                                        placeholder="0"
                                        placeholderTextColor="#52525b"
                                        keyboardType="numeric"
                                        className='flex-1 text-white ml-2 text-base'
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Tags/Category */}
                        <View>
                            <AppText className='text-zinc-400 font-medium mb-3 ml-1'>Tags</AppText>
                            <View className='flex-row items-center bg-zinc-900 rounded-xl border border-zinc-800 px-4'>
                                <Ionicons name="pricetags-outline" size={20} color="#71717a" />
                                <TextInput
                                    value={tagInput}
                                    onChangeText={setTagInput}
                                    onSubmitEditing={handleAddTags}
                                    returnKeyType="done"
                                    placeholder="Type a tag and press enter..."
                                    placeholderTextColor="#52525b"
                                    className='flex-1 text-white p-4 text-base ml-2'
                                />
                                <TouchableOpacity
                                    onPress={handleAddTags}
                                    className='bg-zinc-800 p-2 rounded-lg'
                                >
                                    <Ionicons name="add" size={18} color="#a3e635" />
                                </TouchableOpacity>
                            </View>

                            {/* Tags Display */}
                            {tags.length > 0 && (
                                <View className='flex-row flex-wrap gap-2 mt-3'>
                                    {tags.map((tag, index) => (
                                        <View
                                            key={index}
                                            className='bg-lime-400/15 px-3 py-2 rounded-xl flex-row items-center border border-lime-400/30'
                                        >
                                            <AppText className='text-lime-400 text-sm font-medium'>{tag}</AppText>
                                            <TouchableOpacity
                                                onPress={() => handleRemoveTag(tag)}
                                                className='ml-2'
                                            >
                                                <Ionicons name="close-circle" size={16} color="#a3e635" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Description Input */}
                        <View>
                            <AppText className='text-zinc-400 font-medium mb-3 ml-1'>Description</AppText>
                            <TextInput
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Add details about this task..."
                                placeholderTextColor="#52525b"
                                multiline
                                textAlignVertical="top"
                                className='bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800 text-base h-32'
                            />
                        </View>
                    </View>
                </ScrollView>

                {/* Footer Action */}
                <View className='flex flex-row p-5 border-t border-zinc-900 gap-4'>
                    <View className="flex-1">
                        <TouchableOpacity
                            className={`bg-lime-400 w-full rounded-2xl py-4 items-center flex-row justify-center ${loading ? 'opacity-50' : ''}`}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                                handleUpdateTask()
                            }}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="black" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle-outline" size={24} color="black" />
                                    <AppText className='text-black text-lg font-bold ml-2'>Update Task</AppText>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                    <View className="flex-1">
                        <TouchableOpacity
                            className={`bg-zinc-800 w-full rounded-2xl py-4 items-center flex-row justify-center border border-zinc-700 ${loading ? 'opacity-50' : ''}`}
                            onPress={() => setShowAIPrompt(true)}
                            disabled={loading}
                        >
                            <Ionicons name="sparkles-outline" size={24} color="#a3e635" />
                            <AppText className='text-lime-400 text-lg font-bold ml-2'>Generate AI</AppText>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <Modal
                visible={showAIPrompt}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowAIPrompt(false)}
            >
                <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                    <TouchableOpacity
                        className="flex-1"
                        activeOpacity={1}
                        onPress={() => setShowAIPrompt(false)}
                    />
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    >
                        <View className="bg-zinc-900 rounded-t-3xl border-t border-zinc-800 p-6 h-[400px]">
                            <View className="flex-row justify-between items-center mb-6">
                                <View className="flex-row items-center">
                                    <Ionicons name="sparkles" size={24} color="#a3e635" />
                                    <AppText className="text-white text-xl font-bold ml-2">Generate with AI</AppText>
                                </View>
                                <TouchableOpacity onPress={() => setShowAIPrompt(false)}>
                                    <Ionicons name="close-circle" size={28} color="#71717a" />
                                </TouchableOpacity>
                            </View>

                            <AppText className="text-zinc-400 mb-4">
                                Describe your task and let AI fill in the details...
                            </AppText>

                            <Animated.View
                                style={[
                                    { borderWidth: 2, borderRadius: 16 },
                                    glowStyle
                                ]}
                                className="bg-zinc-950 flex-1 mb-4"
                            >
                                <TextInput
                                    placeholder="e.g., 'Create a marketing plan for the new product launch next week'"
                                    placeholderTextColor="#52525b"
                                    multiline
                                    className="text-white p-4 text-base flex-1"
                                    style={{ textAlignVertical: 'top' }}
                                />
                            </Animated.View>

                            <TouchableOpacity
                                className="bg-lime-400 w-full rounded-2xl py-4 items-center flex-row justify-center"
                                onPress={() => {
                                    // Placeholder for AI action
                                    setShowAIPrompt(false)
                                }}
                            >
                                <Ionicons name="sparkles-outline" size={24} color="black" />
                                <AppText className="text-black text-lg font-bold ml-2">Generate</AppText>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

import { formatHumanDateTime } from '@/services/date.helper';
import { taskService } from '@/services/task.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Pressable, TouchableOpacity, View } from 'react-native';
import AppText from '../AppText';
import TaskStatusDropdown from '../task-status-dropdown';

interface Update {
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

interface HomeGridLayoutProps {
    updates: Update[]
}

export default function HomeGridLayout({ updates }: HomeGridLayoutProps) {
    const router = useRouter();

    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const handleStatusChange = async (task: Update, newStatus: string) => {
        setUpdatingId(task.id);
        try {
            const updatedTask = { ...task, status: newStatus };
            await taskService.updateTask(updatedTask);
            // Optionally, you can refetch or optimistically update UI here
            task.status = newStatus;
        } catch (e) {
            // handle error (show toast, etc)
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <View className="mb-10">
            <FlatList
                data={updates}
                keyExtractor={(item, index) => item.id || index.toString()}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={{ gap: 12 }}
                contentContainerStyle={{ gap: 12 }}
                renderItem={({ item }) => (
                    <TouchableOpacity className='flex-1 bg-zinc-900 rounded-2xl p-4 border border-zinc-800 min-h-[160px]'>
                        <Pressable className='flex-1' onPress={() => router.push(`/tasks/${item.id}`)}>
                            <View className='flex-row justify-between items-start mb-3'>
                                <View className='flex-1 mr-2'>
                                    <AppText className='text-white text-base font-bold leading-tight' numberOfLines={2}>
                                        {item.title}
                                    </AppText>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <View className='bg-red-500/10 px-2 py-1 rounded text-center'>
                                        <AppText className='text-red-500 text-[10px] font-bold uppercase'>{item.priority}</AppText>
                                    </View>
                                    <TaskStatusDropdown
                                        value={item.status}
                                        onChange={(status) => handleStatusChange(item, status)}
                                    />
                                </View>
                            </View>

                            <AppText className='text-lime-400 text-xs mb-4 flex-1' numberOfLines={4}>
                                {item.description}
                            </AppText>

                            <View className='flex-row items-center gap-2 my-2'>
                                {item.tags.length > 0 && (
                                    <View className="bg-zinc-800 px-2 py-0.5 rounded">
                                        <AppText className='text-zinc-400 text-[10px]'>{item.tags[0]} {item.tags.length > 1 ? `+${item.tags.length - 1}` : ''}</AppText>
                                    </View>
                                )}
                            </View>

                            <View className='flex-row justify-between items-center mt-auto mb-2 pt-3 border-t border-zinc-800'>
                                <View className='flex-row items-center'>
                                    <Ionicons name="train" size={12} color="#71717a" />
                                    <AppText className={`${item.status === 'Completed' ? 'text-green-600 bg-green-700/20 p-1 rounded-md' : 'text-orange-500 bg-orange-700/20 p-1 rounded-md'}  text-[10px] ml-1 font-medium`}>{item.status}</AppText>
                                </View>
                            </View>

                            <View className='flex-row justify-between items-center mt-auto pt-3 border-t border-zinc-800'>
                                <View className='flex-row items-center'>
                                    <Ionicons name="calendar-outline" size={12} color="#71717a" />
                                    <AppText className='text-zinc-500 text-[10px] ml-1 font-medium'>{formatHumanDateTime(item.createdAt || new Date().toString())}</AppText>
                                </View>
                            </View>
                        </Pressable>
                    </TouchableOpacity>
                )}
            />
        </View>
    )
}

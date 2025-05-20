import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

type Reminder = {
  id: string;
  title: string;
  time: string;
  days: string;
  active: boolean;
  createdAt?: number;
};

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const RemindersScreen: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { isDarkMode, theme } = useTheme();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  useEffect(() => {
    loadReminders();
  }, []);

  const debugReminderData = async () => {
    try {
      const data = await AsyncStorage.getItem('reminder_data');
      console.log('Raw reminder data:', data);
      if (data) {
        const parsed = JSON.parse(data);
        console.log('Parsed reminder data:', parsed);
        console.log('Is array?', Array.isArray(parsed));
        console.log('Length:', parsed.length);
      }
    } catch (e) {
      console.error('Debug error:', e);
    }
  };

  const loadReminders = async () => {
    try {
      setIsLoading(true);
      const savedReminderData = await AsyncStorage.getItem('reminder_data');
      if (savedReminderData) {
        try {
          const parsedReminders = JSON.parse(savedReminderData);
          if (Array.isArray(parsedReminders)) {
            setReminders(parsedReminders);
            console.log(`Loaded ${parsedReminders.length} reminders`);
          } else {
            console.warn('Reminders data is not an array, resetting');
            setReminders([]);
          }
        } catch (parseError) {
          console.error('Failed to parse reminders data:', parseError);
          setReminders([]);
        }
      } else {
        console.log('No saved reminders data found');
        setReminders([]);
      }
      debugReminderData();
    } catch (error) {
      console.error('Failed to load reminders:', error);
      setReminders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveReminders = async (updatedReminders: Reminder[]): Promise<boolean> => {
    try {
      const remindersJson = JSON.stringify(updatedReminders);
      await AsyncStorage.setItem('reminder_data', remindersJson);
      console.log(`Saving reminders: ${remindersJson}`);
      const savedData = await AsyncStorage.getItem('reminder_data');
      if (savedData !== remindersJson) {
        console.warn('Saved data verification failed');
        return false;
      }
      console.log(`Saved ${updatedReminders.length} reminders successfully`);
      return true;
    } catch (error) {
      console.error('Failed to save reminders:', error);
      return false;
    }
  };

  const toggleReminderActive = async (id: string) => {
    try {
      const updatedReminders = reminders.map((reminder) =>
        reminder.id === id ? { ...reminder, active: !reminder.active } : reminder
      );
      setReminders(updatedReminders);
      const success = await saveReminders(updatedReminders);
      if (!success) loadReminders();
    } catch (error) {
      console.error('Failed to toggle reminder:', error);
      loadReminders();
    }
  };

  const deleteReminder = async (id: string) => {
    console.log('deleteReminder called with id:', id);
    if (isDeleting) {
      console.log('Deletion in progress, skipping');
      return;
    }
    setIsDeleting(true);
    console.log('Attempting to delete reminder with id:', id);

    // Temporarily bypass the Alert for testing
    try {
      console.log('Delete confirmed for id:', id);
      const reminderIndex = reminders.findIndex((r) => r.id === id);
      if (reminderIndex === -1) {
        console.error('Reminder not found in list:', id);
        setIsDeleting(false);
        return;
      }
      const reminderToDelete = reminders[reminderIndex];
      console.log('Reminder to delete:', reminderToDelete);
      const updatedReminders = reminders.filter((reminder) => reminder.id !== id);
      setReminders(updatedReminders);
      console.log('Updated reminders state:', updatedReminders);
      const success = await saveReminders(updatedReminders);
      if (!success) {
        throw new Error('Failed to save after deletion');
      }
      console.log(`Reminder "${reminderToDelete.title}" deleted successfully`);
      Alert.alert(t('success') || 'Success', `Deleted "${reminderToDelete.title}"`);
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      loadReminders();
      Alert.alert(t('error') || 'Error', t('failedToUpdate') || 'Failed to delete reminder');
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreateModal = () => {
    console.log('Create button pressed');
    setModalMode('create');
    resetForm();
    setShowModal(true);
    console.log('Modal state set:', showModal);
  };

  const openEditModal = (reminder: Reminder) => {
    setModalMode('edit');
    setEditingReminder(reminder);
    setReminderTitle(reminder.title);
    setReminderTime(reminder.time);
    setSelectedDays(reminder.days.split(','));
    setShowModal(true);
  };

  const resetForm = () => {
    setReminderTitle('');
    setReminderTime('');
    setSelectedDays([]);
    setEditingReminder(null);
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSaveReminder = async () => {
    if (isSaving) return;
    if (!reminderTitle.trim()) {
      Alert.alert(t('error') || 'Error', t('titleRequired') || 'Title is required');
      return;
    }
    if (!reminderTime) {
      Alert.alert(t('error') || 'Error', t('timeRequired') || 'Time is required');
      return;
    }
    if (selectedDays.length === 0) {
      Alert.alert(t('error') || 'Error', t('daysRequired') || 'You must select at least one day');
      return;
    }
    try {
      setIsSaving(true);
      if (modalMode === 'create') {
        const newReminder: Reminder = {
          id: Date.now().toString(),
          title: reminderTitle.trim(),
          time: reminderTime,
          days: selectedDays.join(','),
          active: true,
          createdAt: Date.now(),
        };
        console.log('Creating new reminder:', newReminder);
        const updatedReminders = [...reminders, newReminder];
        setReminders(updatedReminders);
        const success = await saveReminders(updatedReminders);
        if (!success) {
          console.error('Failed to save new reminder');
          loadReminders();
        }
      } else if (modalMode === 'edit' && editingReminder) {
        console.log('Updating reminder:', editingReminder.id);
        const updatedReminders = reminders.map((reminder) =>
          reminder.id === editingReminder.id
            ? { ...reminder, title: reminderTitle.trim(), time: reminderTime, days: selectedDays.join(',') }
            : reminder
        );
        setReminders(updatedReminders);
        const success = await saveReminders(updatedReminders);
        if (!success) {
          console.error('Failed to save updated reminder');
          loadReminders();
        }
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving reminder:', error);
      Alert.alert(t('error') || 'Error', 'Failed to save reminder');
    } finally {
      setIsSaving(false);
    }
  };

  const renderReminderItem = ({ item }: { item: Reminder }) => {
    console.log('Rendering reminder item:', item.id);
    return (
      <View style={[styles.reminderCard, { backgroundColor: theme.cardColor, shadowColor: theme.textColor }]}>
        <View style={styles.reminderHeader}>
          <Text style={[styles.reminderTitle, { color: theme.textColor }]}>{item.title}</Text>
          <Switch
            value={item.active}
            onValueChange={() => toggleReminderActive(item.id)}
            trackColor={{ false: '#d1d1d1', true: theme.primaryColor }}
            thumbColor={'white'}
          />
        </View>

        <View style={styles.reminderDetails}>
          <Text style={[styles.reminderTime, { color: theme.subTextColor }]}>{item.time}</Text>
          <Text style={[styles.reminderDays, { color: theme.subTextColor }]}>{item.days.split(',').join(', ')}</Text>
        </View>

        <View style={[styles.reminderActions, { borderTopColor: theme.borderColor }]}>
          <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
            <Text style={[styles.editButtonText, { color: theme.primaryColor }]}>{t('edit') || 'Edit'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              console.log('Delete button pressed for id:', item.id);
              deleteReminder(item.id);
            }}
            disabled={isDeleting}
          >
            <Text style={[styles.deleteButtonText, { color: theme.errorColor }]}>{t('delete') || 'Delete'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <View style={[styles.header, { borderBottomColor: theme.borderColor }]}>
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>{t('reminders') || 'Reminders'}</Text>

        <TouchableOpacity style={[styles.createButton, { backgroundColor: theme.primaryColor }]} onPress={openCreateModal}>
          <Text style={styles.createButtonText}>{t('create') || 'Create'}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
          <Text style={[styles.loadingText, { color: theme.subTextColor }]}>Loading reminders...</Text>
        </View>
      ) : reminders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: theme.textColor }]}>{t('noReminders') || 'No Reminders Yet'}</Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.subTextColor }]}>
            {t('tapToCreateFirst') || 'Tap the button below to create your first reminder'}
          </Text>
          <TouchableOpacity style={[styles.emptyStateButton, { backgroundColor: theme.primaryColor }]} onPress={openCreateModal}>
            <Text style={styles.emptyStateButtonText}>{t('createFirstReminder') || 'Create First Reminder'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(item) => item.id}
          renderItem={renderReminderItem}
          contentContainerStyle={styles.remindersList}
          extraData={reminders}
          key={reminders.length}
        />
      )}

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardColor }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              {modalMode === 'create' ? t('createReminder') || 'Create Reminder' : t('editReminder') || 'Edit Reminder'}
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.subTextColor }]}>{t('title') || 'Title'}</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0', color: theme.textColor }]}
                value={reminderTitle}
                onChangeText={setReminderTitle}
                placeholder={t('reminderTitlePlaceholder') || 'Meditation time'}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.subTextColor }]}>{t('time') || 'Time'}</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0', color: theme.textColor }]}
                value={reminderTime}
                onChangeText={setReminderTime}
                placeholder="09:00 AM"
                keyboardType={Platform.OS === 'ios' ? 'default' : 'numbers-and-punctuation'}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.subTextColor }]}>{t('days') || 'Days'}</Text>
              <View style={styles.daysContainer}>
                {daysOfWeek.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      { backgroundColor: isDarkMode ? '#444' : '#f0f0f0' },
                      selectedDays.includes(day) && styles.dayButtonSelected,
                    ]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        { color: theme.subTextColor },
                        selectedDays.includes(day) && styles.dayButtonTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.borderColor }]}
                onPress={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                <Text style={[styles.cancelButtonText, { color: theme.subTextColor }]}>{t('cancel') || 'Cancel'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: theme.primaryColor }]}
                onPress={handleSaveReminder}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('save') || 'Save'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  } as ViewStyle,
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  } as TextStyle,
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  } as ViewStyle,
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  } as TextStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  } as TextStyle,
  remindersList: {
    padding: 16,
  } as ViewStyle,
  reminderCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  } as ViewStyle,
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  } as ViewStyle,
  reminderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  } as TextStyle,
  reminderDetails: {
    marginBottom: 16,
  } as ViewStyle,
  reminderTime: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  } as TextStyle,
  reminderDays: {
    fontSize: 14,
    color: '#888',
  } as TextStyle,
  reminderActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
  } as ViewStyle,
  editButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  } as ViewStyle,
  editButtonText: {
    color: '#3DC3C9',
    fontWeight: '600',
  } as TextStyle,
  deleteButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  } as ViewStyle,
  deleteButtonText: {
    color: '#ff6b6b',
    fontWeight: '600',
  } as TextStyle,
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  } as ViewStyle,
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  } as TextStyle,
  emptyStateSubtext: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  } as TextStyle,
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  } as ViewStyle,
  emptyStateButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  } as TextStyle,
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  } as ViewStyle,
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  } as TextStyle,
  formGroup: {
    marginBottom: 20,
  } as ViewStyle,
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  } as TextStyle,
  formInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  } as TextStyle,
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  } as ViewStyle,
  dayButton: {
    width: '13%',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  } as ViewStyle,
  dayButtonSelected: {
    backgroundColor: '#3DC3C9',
  } as ViewStyle,
  dayButtonText: {
    fontSize: 14,
    color: '#666',
  } as TextStyle,
  dayButtonTextSelected: {
    color: 'white',
    fontWeight: '600',
  } as TextStyle,
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  } as ViewStyle,
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  } as ViewStyle,
  cancelButton: {
    marginRight: 8,
  } as ViewStyle,
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  } as TextStyle,
  saveButton: {
    marginLeft: 8,
  } as ViewStyle,
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  } as TextStyle,
});

export default RemindersScreen;
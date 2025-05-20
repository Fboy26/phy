import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext'; // Updated to use i18n
import { useTheme } from '../contexts/ThemeContext';
import { MainTabParamList, RootStackParamList } from '../navigation';
import { I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next'; // Explicitly import useTranslation

// Define navigation type with both tab and stack navigation
type ProfileScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Profile'> &
  StackNavigationProp<RootStackParamList>;

// Define language options with their IDs
const LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'fr', name: 'Français' },
  { id: 'ar', name: 'العربية' },
];

// App version
const APP_VERSION = '1.0.0';

const ProfileScreen = () => {
  const { t, i18n } = useTranslation(); // Use react-i18next
  const { user, updateUserProfile, signOut } = useAuth();
  const { language, changeLanguage, isRTL } = useLanguage(); // Use LanguageContext
  const { isDarkMode, theme, toggleTheme } = useTheme();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  
  // State variables
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Form state with null safety
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Get the current language ID with null safety
  const currentLanguageId = language || 'en';
  
  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const notificationPref = await AsyncStorage.getItem('notifications_enabled');
        if (notificationPref !== null) {
          setIsNotificationsEnabled(notificationPref === 'true');
        }
        if (user) {
          setFirstName(user.firstName || '');
          setLastName(user.lastName || '');
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };
    loadPreferences();
  }, [user]);
  
  // Handle notifications toggle
  const handleNotificationsToggle = async () => {
    try {
      const newNotificationsValue = !isNotificationsEnabled;
      setIsNotificationsEnabled(newNotificationsValue);
      await AsyncStorage.setItem('notifications_enabled', newNotificationsValue.toString());
    } catch (error) {
      console.error('Failed to save notifications preference:', error);
    }
  };
  
  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!firstName.trim()) {
      Alert.alert(t('error'), 'First name is required');
      return;
    }
    try {
      setIsProfileUpdating(true);
      await updateUserProfile(firstName, lastName);
      setShowEditProfileModal(false);
      Alert.alert(t('success') || 'Success', t('profileUpdated') || 'Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert(t('error') || 'Error', t('failedToUpdate') || 'Failed to update profile');
    } finally {
      setIsProfileUpdating(false);
    }
  };
  
  // Handle password change
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('error') || 'Error', t('password Required') || 'All password fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('error') || 'Error', t('password Mismatch') || 'Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('error') || 'Error', t('password TooShort') || 'Password must be at least 6 characters');
      return;
    }
    try {
      setIsPasswordChanging(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert(t('success') || 'Success', t('password Success') || 'Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert(t('error') || 'Error', t('password Change Failed') || 'Failed to change password');
    } finally {
      setIsPasswordChanging(false);
    }
  };
  
  // Handle language selection with force update
  const handleLanguageSelect = useCallback(async (languageId: string) => {
    setShowLanguageModal(false);
    if (!languageId) {
      console.error('Language ID is undefined or null');
      return;
    }
    try {
      console.log('Changing language to:', languageId);
      await changeLanguage(languageId); // Update LanguageContext
      await i18n.changeLanguage(languageId); // Update i18n instance
      const selectedLang = LANGUAGES.find(lang => lang.id === languageId);
      Alert.alert(
        t('language') || 'Language',
        `${t('language Changed') || 'Language changed to'} ${selectedLang?.name || languageId}`,
        [{ text: 'OK' }]
      );
      const isRTLLanguage = languageId === 'ar';
      if (I18nManager.isRTL !== isRTLLanguage) {
        I18nManager.forceRTL(isRTLLanguage);
        if (Platform.OS !== 'web') {
          setTimeout(() => {
            Alert.alert(
              t('layoutChange') || 'Layout Change',
              t('restart Recommended') || 'Please restart the app for the layout changes to take full effect.',
              [{ text: 'OK' }]
            );
          }, 500);
        }
      }
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  }, [t, i18n, changeLanguage]);
  
  // Handle sign out
  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    console.log('Sign-out button pressed at', new Date().toISOString());

    try {
      console.log('Initiating sign-out at', new Date().toISOString());
      const signOutSuccess = await signOut();
      console.log('signOut returned:', signOutSuccess);
      if (signOutSuccess) {
        console.log('Sign-out successful, navigating to Welcome');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          })
        );
        console.log('Navigation to Welcome dispatched');
      } else {
        throw new Error('Sign-out failed');
      }
    } catch (error) {
      console.error('Error during sign-out:', error);
      // Fallback: Clear user manually
      await AsyncStorage.removeItem('user');
      console.log('Fallback: Removed user from AsyncStorage');
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        })
      );
      console.log('Fallback navigation to Welcome dispatched');
    } finally {
      setIsSigningOut(false);
      console.log('Sign-out process completed at', new Date().toISOString());
    }
  };
  
  // Handle emergency reset
  const handleEmergencyReset = async () => {
    Alert.alert(
      'Emergency Reset',
      'This will clear all app data and reset to the welcome screen. Are you sure?',
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Starting emergency reset at', new Date().toISOString());
              
              // Clear SecureStore (non-web platforms)
              if (Platform.OS !== 'web') {
                try {
                  const secureStoreKeys = ['user']; // Add other SecureStore keys if used
                  for (const key of secureStoreKeys) {
                    await SecureStore.deleteItemAsync(key);
                    console.log(`Cleared ${key} from SecureStore`);
                  }
                } catch (secureError) {
                  console.error('Failed to clear SecureStore:', secureError);
                }
              }
              
              // Clear all AsyncStorage
              try {
                await AsyncStorage.clear();
                console.log('Cleared all AsyncStorage');
              } catch (asyncError) {
                console.error('Failed to clear AsyncStorage:', asyncError);
              }
              
              // Perform sign-out to reset user state
              await signOut();
              console.log('Sign-out completed during reset');
              
              // Navigate to Welcome screen
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Welcome' }],
                })
              );
              console.log('Navigated to Welcome screen');
              
              Alert.alert('Success', 'App data cleared. You can now start as a new user.');
            } catch (error) {
              console.error('Failed to reset app:', error);
              Alert.alert('Error', 'Failed to reset app. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  // Render section header
  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: theme.subTextColor }]}>
      {title || ''}
    </Text>
  );
  
  // Render setting item
  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle?: string | null,
    toggle?: boolean,
    toggleValue?: boolean,
    onToggle?: () => void,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { backgroundColor: theme.cardColor, borderBottomColor: theme.borderColor }
      ]}
      disabled={!onPress}
      onPress={() => {
        console.log(`${title} button pressed`);
        onPress?.();
      }}
    >
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.textColor }]}>
          {title || ''}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: theme.subTextColor }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {toggle && (
        <Switch
          value={toggleValue || false}
          onValueChange={onToggle}
          trackColor={{ false: '#d1d1f1', true: theme.primaryColor }}
          thumbColor={'white'}
        />
      )}
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <View style={[styles.header, { borderBottomColor: theme.borderColor }]}>
        <Text style={[styles.headerTitle, { color: theme.headerColor }]}>
          {t('profile') || 'Profile'}
        </Text>
      </View>
      <ScrollView 
        style={styles.scrollView}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.profileInfo, { backgroundColor: theme.cardColor }]}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ 
                uri: user?.profileImageUrl || 
                     'https://ui-avatars.com/api/?name=' + 
                     encodeURIComponent(((user?.firstName || '') + ' ' + (user?.lastName || '')).trim() || 'User') +
                     '&background=3DC3C9&color=fff'
              }}
              style={styles.profileImage}
            />
          </View>
          <Text style={[styles.profileName, { color: theme.textColor }]}>
            {user?.firstName || ''} {user?.lastName || ''}
          </Text>
          <Text style={[styles.profileEmail, { color: theme.subTextColor }]}>
            {user?.email || ''}
          </Text>
        </View>
        
        {renderSectionHeader(t('Account Section') || 'Account')}
        <View style={styles.settingsSection}>
          {renderSettingItem(
            'person',
            t('Edit Profile') || 'Edit Profile',
            null,
            false,
            undefined,
            undefined,
            () => setShowEditProfileModal(true)
          )}
          {renderSettingItem(
            'lock',
            t('Change Password') || 'Change Password',
            null,
            false,
            undefined,
            undefined,
            () => setShowChangePasswordModal(true)
          )}
        </View>
        
        {renderSectionHeader(t('App Settings') || 'App Settings')}
        <View style={styles.settingsSection}>
          {renderSettingItem(
            'bell',
            t('Notifications') || 'Notifications',
            null,
            true,
            isNotificationsEnabled,
            handleNotificationsToggle
          )}
          {renderSettingItem(
            'globe',
            t('Language') || 'Language',
            LANGUAGES.find(lang => lang.id === currentLanguageId)?.name || 'English',
            false,
            undefined,
            undefined,
            () => setShowLanguageModal(true)
          )}
          {renderSettingItem(
            'moon',
            t('Dark Mode') || 'Dark Mode',
            null,
            true,
            isDarkMode,
            toggleTheme
          )}
        </View>
        
        {renderSectionHeader(t('Help & Support') || 'Help & Support')}
        <View style={styles.settingsSection}>
          {renderSettingItem(
            'help-circle',
            t('Help Center') || 'Help Center',
            null,
            false,
            undefined,
            undefined,
            () => Alert.alert('Info', 'Help Center would open here')
          )}
          {renderSettingItem(
            'shield',
            t('Privacy Policy') || 'Privacy Policy',
            null,
            false,
            undefined,
            undefined,
            () => Alert.alert('Info', 'Privacy Policy would open here')
          )}
          {renderSettingItem(
            'info',
            t('Version') || 'Version',
            APP_VERSION,
            false
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.signOutButton, { backgroundColor: theme.errorColor }]}
          onPress={() => {
            console.log('Sign-out button pressed at', new Date().toISOString());
            handleSignOut();
          }}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={[styles.signOutText, { color: 'white' }]}>
              {t('Sign Out') || 'Sign Out'}
            </Text>
          )}
        </TouchableOpacity>
        
        {__DEV__ && (
          <TouchableOpacity 
            style={[styles.resetButton, { backgroundColor: theme.cardColor }]}
            onPress={handleEmergencyReset}
          >
            <Text style={[styles.resetText, { color: theme.errorColor }]}>
              {t('Emergency Reset') || 'Emergency Reset'}
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.subTextColor }]}>
            MindfulMe © {new Date().getFullYear()}
          </Text>
        </View>
      </ScrollView>
      
      <Modal
        visible={showEditProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardColor }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              {t('Edit Profile') || 'Edit Profile'}
            </Text>
            <View style={styles.modalInputContainer}>
              <Text style={[styles.modalInputLabel, { color: theme.subTextColor }]}>
                {t('First Name') || 'First Name'}
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { 
                    backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
                    color: theme.textColor
                  }
                ]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder={t('First Name') || 'First Name'}
                placeholderTextColor={theme.subTextColor}
              />
            </View>
            <View style={styles.modalInputContainer}>
              <Text style={[styles.modalInputLabel, { color: theme.subTextColor }]}>
                {t('Last Name') || 'Last Name'}
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { 
                    backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
                    color: theme.textColor
                  }
                ]}
                value={lastName}
                onChangeText={setLastName}
                placeholder={t('Last Name') || 'Last Name'}
                placeholderTextColor={theme.subTextColor}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalActionButton, styles.cancelButton, { backgroundColor: theme.borderColor }]}
                onPress={() => {
                  setFirstName(user?.firstName || '');
                  setLastName(user?.lastName || '');
                  setShowEditProfileModal(false);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: theme.subTextColor }]}>
                  {t('Cancel') || 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalActionButton, styles.saveButton, { backgroundColor: theme.primaryColor }]}
                onPress={handleUpdateProfile}
                disabled={isProfileUpdating}
              >
                {isProfileUpdating ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('Save') || 'Save'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <Modal
        visible={showChangePasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardColor }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              {t('changePassword') || 'Change Password'}
            </Text>
            <View style={styles.modalInputContainer}>
              <Text style={[styles.modalInputLabel, { color: theme.subTextColor }]}>
                {t('currentPassword') || 'Current Password'}
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { 
                    backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
                    color: theme.textColor
                  }
                ]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder={t('Current Password') || 'Current Password'}
                placeholderTextColor={theme.subTextColor}
                secureTextEntry
              />
            </View>
            <View style={styles.modalInputContainer}>
              <Text style={[styles.modalInputLabel, { color: theme.subTextColor }]}>
                {t('New Password') || 'New Password'}
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { 
                    backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
                    color: theme.textColor
                  }
                ]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder={t('New Password') || 'New Password'}
                placeholderTextColor={theme.subTextColor}
                secureTextEntry
              />
            </View>
            <View style={styles.modalInputContainer}>
              <Text style={[styles.modalInputLabel, { color: theme.subTextColor }]}>
                {t('Confirm Password') || 'Confirm Password'}
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { 
                    backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
                    color: theme.textColor
                  }
                ]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('Confirm Password') || 'Confirm Password'}
                placeholderTextColor={theme.subTextColor}
                secureTextEntry
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalActionButton, styles.cancelButton, { backgroundColor: theme.borderColor }]}
                onPress={() => {
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setShowChangePasswordModal(false);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: theme.subTextColor }]}>
                  {t('Cancel') || 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalActionButton, styles.saveButton, { backgroundColor: theme.primaryColor }]}
                onPress={handleChangePassword}
                disabled={isPasswordChanging}
              >
                {isPasswordChanging ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('Save') || 'Save'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardColor }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              {t('Language') || 'Language'}
            </Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    { borderBottomColor: theme.borderColor },
                    currentLanguageId === item.id && styles.selectedLanguageOption
                  ]}
                  onPress={() => handleLanguageSelect(item.id)}
                >
                  <Text style={[
                    styles.languageOptionText, 
                    { color: theme.textColor },
                    currentLanguageId === item.id && styles.selectedLanguageOptionText
                  ]}>
                    {item.name}
                  </Text>
                  {currentLanguageId === item.id && (
                    <Text style={[styles.selectedLanguageCheck, { color: theme.primaryColor }]}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: theme.borderColor }]}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={[styles.closeButtonText, { color: theme.subTextColor }]}>
                {t('Cancel') || 'Cancel'}
              </Text>
            </TouchableOpacity>
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
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  profileInfo: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ddd',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  settingsSection: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  signOutButton: {
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalInputContainer: {
    marginBottom: 16,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 8,
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  saveButton: {
    marginLeft: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  selectedLanguageOption: {
    // No specific style needed
  },
  languageOptionText: {
    fontSize: 16,
  },
  selectedLanguageOptionText: {
    fontWeight: '600',
  },
  selectedLanguageCheck: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontWeight: '600',
  },
});

export default ProfileScreen;
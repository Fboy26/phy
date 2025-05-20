import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../navigation';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../contexts/ThemeContext'; // Import ThemeContext

type DashboardScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Dashboard'>;

// Mood options
const moodOptions = [
  { emoji: "😔", label: "Sad", value: "Sad", score: 20 },
  { emoji: "😐", label: "Neutral", value: "Neutral", score: 40 },
  { emoji: "🙂", label: "Good", value: "Good", score: 60 },
  { emoji: "😊", label: "Great", value: "Great", score: 80 },
  { emoji: "🤩", label: "Excellent", value: "Excellent", score: 100 },
];

const DashboardScreen = () => {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage(); 
  const { isDarkMode, theme } = useTheme(); // Use ThemeContext
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  
  // Insights state that will update based on mood
  const [sleepQuality, setSleepQuality] = useState(75);
  const [moodStability, setMoodStability] = useState(60);
  const [mindfulness, setMindfulness] = useState(40);

  // Get the first name to display in greeting
  const firstName = user?.firstName || user?.email?.split('@')[0] || 'there';
  
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('Good Morning');
    if (hour < 18) return t('Good Afternoon');
    return t('Good Evening');
  };
  
  // Update insights when mood changes
  useEffect(() => {
    if (selectedMood) {
      const moodOption = moodOptions.find(option => option.value === selectedMood);
      if (moodOption) {
        const moodScore = moodOption.score;
        setSleepQuality(Math.min(100, 50 + moodScore * 0.4));
        setMoodStability(moodScore);
        setMindfulness(Math.min(100, 30 + moodScore * 0.5));
      }
    }
  }, [selectedMood]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <View style={[styles.header, { backgroundColor: theme.cardColor, borderBottomColor: theme.borderColor }]}>
        <View>
          <Text style={[styles.greeting, { color: theme.textColor }]}>{getGreeting()}, {firstName}</Text>
          <Text style={[styles.subGreeting, { color: theme.subTextColor }]}>{t('How are you feeling')}</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={[styles.profileAvatar, { backgroundColor: theme.primaryColor }]}>
            <Text style={[styles.profileInitial, { color: theme.textColor }]}>{firstName[0]?.toUpperCase()}</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={[styles.scrollView, { direction: isRTL ? 'rtl' : 'ltr' }]} 
        contentContainerStyle={styles.contentContainer}
      >
        {/* Mood Tracker Card */}
        <View style={[styles.card, { backgroundColor: theme.cardColor, shadowColor: theme.textColor }]}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>{t('Track Your Mood')}</Text>
          <View style={styles.moodContainer}>
            {moodOptions.map((option) => (
              <TouchableOpacity 
                key={option.value} 
                style={[
                  styles.moodButton,
                  selectedMood === option.value && styles.selectedMoodButton,
                  { backgroundColor: theme.cardColor }
                ]}
                onPress={() => setSelectedMood(option.value)}
              >
                <Text style={styles.moodEmoji}>{option.emoji}</Text>
                <Text style={[styles.moodLabel, { color: theme.subTextColor }]}>{t(option.value)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Quick Access Cards */}
        <View style={styles.rowContainer}>
          {/* Reminders Card */}
          <TouchableOpacity 
            style={[styles.card, styles.halfCard, { backgroundColor: theme.cardColor, shadowColor: theme.textColor }]}
            onPress={() => navigation.navigate('Reminders')}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.textColor }]}>{t('reminders')}</Text>
              <View style={[styles.iconCircle, { backgroundColor: '#3DC3C9' }]}>
                <Text style={styles.cardIcon}>⏰</Text>
              </View>
            </View>
            <Text style={[styles.cardSubtitle, { color: theme.subTextColor }]}>{t('Set wellness reminders')}</Text>
            
            <View style={[styles.reminderItem, { backgroundColor: theme.backgroundColor }]}>
              <Text style={[styles.reminderTitle, { color: theme.textColor }]}>{t('Morning meditation')}</Text>
              <Text style={[styles.reminderTime, { color: theme.subTextColor }]}>{t('Daily time')}</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.cardButton, { borderColor: theme.primaryColor }]}
              onPress={() => navigation.navigate('Reminders')}
            >
              <Text style={[styles.cardButtonText, { color: theme.primaryColor }]}>{t('Add new')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
          
          {/* Chatbot Card */}
          <TouchableOpacity 
            style={[styles.card, styles.halfCard, { backgroundColor: theme.cardColor, shadowColor: theme.textColor }]}
            onPress={() => navigation.navigate('Chatbot')}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.textColor }]}>{t('Chat Support')}</Text>
              <View style={[styles.iconCircle, { backgroundColor: '#7352ff' }]}>
                <Text style={styles.cardIcon}>💬</Text>
              </View>
            </View>
            <Text style={[styles.cardSubtitle, { color: theme.subTextColor }]}>{t('Talk with assistant')}</Text>
            
            <View style={styles.chatPreview}>
              <View style={[styles.chatBubble, { backgroundColor: theme.backgroundColor }]}>
                <Text style={[styles.chatText, { color: theme.textColor }]}>{t('Stress management question')}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.cardButton, { borderColor: '#7352ff' }]}
              onPress={() => navigation.navigate('Chatbot')}
            >
              <Text style={[styles.cardButtonText, { color: '#7352ff' }]}>{t('Continue Chat')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
        
        {/* Insights */}
        <View style={[styles.card, { backgroundColor: theme.cardColor, shadowColor: theme.textColor }]}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>{t('Your wellness insights')}</Text>
          
          <View style={styles.insightItem}>
            <View style={styles.insightHeader}>
              <Text style={[styles.insightTitle, { color: theme.textColor }]}>{t('Sleep quality')}</Text>
              <Text style={[styles.insightPercentage, { color: theme.textColor }]}>{Math.round(sleepQuality)}%</Text>
            </View>
            <View style={[styles.progressBarContainer, { backgroundColor: theme.borderColor }]}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${sleepQuality}%`, backgroundColor: '#3DC3C9' }
                ]} 
              />
            </View>
            <Text style={[styles.insightDescription, { color: theme.subTextColor }]}>
              {sleepQuality > 70 ? t('better than last week') : 
               sleepQuality > 40 ? t('steady progress') : 
               t('room for improvement')}
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <View style={styles.insightHeader}>
              <Text style={[styles.insightTitle, { color: theme.textColor }]}>{t('Mood stability')}</Text>
              <Text style={[styles.insightPercentage, { color: theme.textColor }]}>{Math.round(moodStability)}%</Text>
            </View>
            <View style={[styles.progressBarContainer, { backgroundColor: theme.borderColor }]}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${moodStability}%`, backgroundColor: '#7352ff' }
                ]} 
              />
            </View>
            <Text style={[styles.insightDescription, { color: theme.subTextColor }]}>
              {moodStability > 70 ? t('improving steadily') : 
               moodStability > 40 ? t('maintaining balance') : 
               t('fluctuating')}
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <View style={styles.insightHeader}>
              <Text style={[styles.insightTitle, { color: theme.textColor }]}>{t('Mind fulness')}</Text>
              <Text style={[styles.insightPercentage, { color: theme.textColor }]}>{Math.round(mindfulness)}%</Text>
            </View>
            <View style={[styles.progressBarContainer, { backgroundColor: theme.borderColor }]}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${mindfulness}%`, backgroundColor: '#4CAF50' }
                ]} 
              />
            </View>
            <Text style={[styles.insightDescription, { color: theme.subTextColor }]}>
              {mindfulness > 70 ? t('focused and present') : 
               mindfulness > 40 ? t('making progress') : 
               t('room for improvement')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  profileButton: {
    padding: 5,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  selectedMoodButton: {
    backgroundColor: 'rgba(61, 195, 201, 0.1)',
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 12,
    color: '#666',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  halfCard: {
    width: '48%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 16,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  reminderItem: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  reminderTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  chatPreview: {
    marginBottom: 10,
  },
  chatBubble: {
    padding: 10,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    maxWidth: '100%',
  },
  chatText: {
    fontSize: 12,
    color: '#333',
  },
  cardButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#3DC3C9',
    borderRadius: 20,
    alignItems: 'center',
  },
  cardButtonText: {
    fontSize: 12,
    color: '#3DC3C9',
    fontWeight: '500',
  },
  insightItem: {
    marginBottom: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  insightPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  insightDescription: {
    fontSize: 12,
    color: '#666',
  },
});

export default DashboardScreen;
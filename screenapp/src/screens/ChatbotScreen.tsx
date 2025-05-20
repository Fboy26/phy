import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../navigation';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { exportToFile, getChatHistory } from '../utils/exportUtils';
import { useTheme } from '../contexts/ThemeContext'; // Import ThemeContext

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  options?: string[];
  timestamp?: number;
};

const ChatbotScreen = () => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList, 'Chatbot'>>();
  const { user } = useAuth();
  const { isDarkMode, theme } = useTheme(); // Use ThemeContext
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEndConversationConfirm, setShowEndConversationConfirm] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  const firstName = user?.firstName || user?.email?.split('@')[0] || 'there';
  
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const chatHistory = await getChatHistory();
        if (chatHistory && chatHistory.length > 0) {
          setMessages(chatHistory);
        } else {
          const welcomeMessage: Message = {
            id: Date.now().toString(),
            text: `Hi ${firstName}! I'm your wellness assistant. How can I help you today?`,
            sender: 'bot',
            options: ['I need help with stress', 'I want to improve my sleep', 'I\'m feeling anxious'],
            timestamp: Date.now()
          };
          setMessages([welcomeMessage]);
          await AsyncStorage.setItem('chat_history', JSON.stringify([welcomeMessage]));
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };
    loadChatHistory();
  }, []);
  
  useEffect(() => {
    const saveChatHistory = async () => {
      if (messages.length > 0) {
        await AsyncStorage.setItem('chat_history', JSON.stringify(messages));
      }
    };
    saveChatHistory();
  }, [messages]);
  
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);
  
  const handleSend = () => {
    if (!inputText.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setTimeout(() => {
      let botResponse: Message;
      const lowercaseMessage = inputText.toLowerCase();
      if (lowercaseMessage.includes('stress') || lowercaseMessage.includes('overwhelm')) {
        botResponse = {
          id: Date.now().toString(),
          text: "I understand feeling stressed can be challenging. Have you tried any relaxation techniques like deep breathing or meditation?",
          sender: 'bot',
          options: ['Tell me about deep breathing', 'How does meditation help?', 'I need other options'],
          timestamp: Date.now()
        };
      } else if (lowercaseMessage.includes('sleep') || lowercaseMessage.includes('insomnia')) {
        botResponse = {
          id: Date.now().toString(),
          text: "Sleep troubles are common. Establishing a regular sleep schedule and creating a relaxing bedtime routine can help improve sleep quality.",
          sender: 'bot',
          options: ['Sleep schedule tips', 'Bedtime routine ideas', 'Other sleep remedies'],
          timestamp: Date.now()
        };
      } else if (lowercaseMessage.includes('anxious') || lowercaseMessage.includes('anxiety')) {
        botResponse = {
          id: Date.now().toString(),
          text: "Anxiety can be difficult to manage. Grounding techniques like the 5-4-3-2-1 method can help bring you back to the present moment.",
          sender: 'bot',
          options: ['What is 5-4-3-2-1?', 'Other grounding techniques', 'I need more support'],
          timestamp: Date.now()
        };
      } else {
        botResponse = {
          id: Date.now().toString(),
          text: "Thank you for sharing. Would you like to explore some wellness practices that might help you feel better?",
          sender: 'bot',
          options: ['Stress management', 'Mood improvement', 'Self-care practices'],
          timestamp: Date.now()
        };
      }
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };
  
  const handleOptionPress = (option: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: option,
      sender: 'user',
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now().toString(),
        text: getBotResponseForOption(option),
        sender: 'bot',
        options: getOptionsForResponse(option),
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };
  
  const handleExportChat = async () => {
    try {
      const exportData = messages.map(msg => ({
        sender: msg.sender,
        message: msg.text,
        time: new Date(msg.timestamp || Date.now()).toLocaleString()
      }));
      await exportToFile(exportData, 'chat_history', 'json');
      Alert.alert('Success', 'Chat history exported successfully');
    } catch (error) {
      console.error('Error exporting chat:', error);
      Alert.alert('Error', 'Failed to export chat history');
    }
  };
  
  const handleEndConversation = () => {
    setShowEndConversationConfirm(true);
  };
  
  const confirmEndConversation = async () => {
    try {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: `Hi ${firstName}! I'm your wellness assistant. How can I help you today?`,
        sender: 'bot',
        options: ['I need help with stress', 'I want to improve my sleep', 'I\'m feeling anxious'],
        timestamp: Date.now()
      };
      setMessages([welcomeMessage]);
      await AsyncStorage.setItem('chat_history', JSON.stringify([welcomeMessage]));
      setShowEndConversationConfirm(false);
      Alert.alert('Conversation Reset', 'Your conversation has been reset.');
    } catch (error) {
      console.error('Error ending conversation:', error);
      Alert.alert('Error', 'Failed to reset conversation');
    }
  };
  
  const getBotResponseForOption = (option: string) => {
    switch (option.toLowerCase()) {
      case 'i need help with stress':
        return "There are many effective techniques to manage stress. Deep breathing, progressive muscle relaxation, and mindfulness meditation can all help reduce stress levels. Would you like to learn more about any of these techniques?";
      case 'tell me about deep breathing':
        return "Deep breathing is a simple but powerful relaxation technique. Try breathing in slowly through your nose for a count of 4, hold for 2, then exhale through your mouth for a count of 6. Repeat this 5-10 times whenever you feel stressed.";
      case 'how does meditation help?':
        return "Meditation helps reduce stress by calming your mind and bringing awareness to the present moment. Even just 5-10 minutes of daily meditation can lower stress hormones and promote relaxation.";
      case 'i need other options':
        return "Other stress management techniques include physical exercise, journaling, spending time in nature, limiting caffeine and alcohol, and ensuring adequate sleep. Progressive muscle relaxation is also effective - would you like to learn about that?";
      case 'i want to improve my sleep':
        return "For better sleep, try going to bed and waking up at the same time every day. Limit screen time before bed and create a comfortable sleep environment. Would you like more specific advice?";
      case 'i\'m feeling anxious':
      case 'what is 5-4-3-2-1?':
        return "The 5-4-3-2-1 technique helps ground you by engaging your senses. Acknowledge 5 things you see, 4 things you can touch, 3 things you hear, 2 things you smell, and 1 thing you taste. Would you like to try another grounding technique?";
      case 'other grounding techniques':
        return "Another effective grounding technique is the 4-7-8 breathing method: Inhale quietly through your nose for 4 seconds, hold your breath for 7 seconds, and exhale completely through your mouth for 8 seconds. Repeat 3-4 times.";
      case 'i need more support':
        return "If you're experiencing persistent anxiety, consider reaching out to a mental health professional. They can provide personalized support and strategies tailored to your specific situation.";
      case 'sleep schedule tips':
        return "Try to go to bed and wake up at the same time every day, even on weekends. This helps regulate your body's internal clock. Aim for 7-8 hours of sleep each night.";
      case 'bedtime routine ideas':
        return "A good bedtime routine might include: dimming lights 1-2 hours before bed, avoiding screens, taking a warm bath or shower, reading a book, listening to calming music, or practicing gentle stretching or meditation.";
      case 'other sleep remedies':
        return "Make sure your bedroom is cool, quiet, and dark. Consider using white noise, blackout curtains, or a sleep mask if needed. Avoid caffeine and large meals before bedtime. Regular exercise (but not too close to bedtime) can also improve sleep quality.";
      case 'stress management':
        return "Regular physical activity, mindfulness practices, proper nutrition, adequate sleep, and social connection all contribute to stress resilience. Which area would you like to focus on?";
      case 'mood improvement':
        return "To improve your mood, try spending time in nature, practicing gratitude, engaging in physical exercise, connecting with supportive people, or doing activities you enjoy. Even small actions can make a difference.";
      case 'self-care practices':
        return "Self-care includes physical practices (nutrition, sleep, exercise), emotional practices (setting boundaries, expressing feelings), and spiritual practices (meditation, spending time in nature). What type of self-care are you interested in?";
      default:
        return "I understand. Is there a specific aspect of your wellness you'd like to focus on?";
    }
  };
  
  const getOptionsForResponse = (option: string) => {
    switch (option.toLowerCase()) {
      case 'i need help with stress':
        return ['Tell me about deep breathing', 'How does meditation help?', 'I need other options'];
      case 'i want to improve my sleep':
        return ['Sleep schedule tips', 'Bedtime routine ideas', 'Other sleep remedies'];
      case 'i\'m feeling anxious':
        return ['What is 5-4-3-2-1?', 'Other grounding techniques', 'I need more support'];
      case 'tell me about deep breathing':
      case 'how does meditation help?':
      case 'i need other options':
        return ['Try another stress technique', 'Let\'s talk about sleep', 'Let\'s talk about anxiety'];
      case 'sleep schedule tips':
      case 'bedtime routine ideas':
      case 'other sleep remedies':
        return ['More sleep advice', 'Let\'s talk about stress', 'Let\'s talk about anxiety'];
      case 'what is 5-4-3-2-1?':
      case 'other grounding techniques':
      case 'i need more support':
        return ['More anxiety techniques', 'Let\'s talk about stress', 'Let\'s talk about sleep'];
      case 'stress management':
      case 'mood improvement':
      case 'self-care practices':
        return ['Tell me about exercise', 'Mindfulness practices', 'Nutrition tips'];
      default:
        return ['Stress management', 'Sleep improvement', 'Anxiety relief'];
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <View style={[styles.header, { borderBottomColor: theme.borderColor, backgroundColor: theme.cardColor }]}>
        <Text style={[styles.headerTitle, { color: theme.primaryColor }]}>Wellness Assistant</Text>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity style={[styles.headerButton, { backgroundColor: theme.borderColor }]} onPress={handleExportChat}>
            <Text style={[styles.headerButtonText, { color: theme.subTextColor }]}>Export</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.headerButton, styles.endButton, { backgroundColor: theme.errorColor }]} 
            onPress={handleEndConversation}
          >
            <Text style={styles.endButtonText}>End Conversation</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[
            styles.messageBubble,
            item.sender === 'user' ? styles.userBubble : styles.botBubble,
            { backgroundColor: item.sender === 'user' ? theme.primaryColor : theme.cardColor }
          ]}>
            <Text style={[styles.messageText, { color: item.sender === 'user' ? '#fff' : theme.textColor }]}>{item.text}</Text>
            
            {item.options && item.options.length > 0 && (
              <View style={styles.optionsContainer}>
                {item.options.map((option: string, index: number) => (
                  <TouchableOpacity 
                    key={index}
                    style={[styles.optionButton, { backgroundColor: theme.borderColor }]}
                    onPress={() => handleOptionPress(option)}
                  >
                    <Text style={[styles.optionText, { color: theme.subTextColor }]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        contentContainerStyle={styles.messagesList}
      />
      
      {isTyping && (
        <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble, { backgroundColor: theme.cardColor }]}>
          <Text style={styles.typingText}>...</Text>
        </View>
      )}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={85}
        style={[styles.inputContainer, { borderTopColor: theme.borderColor, backgroundColor: theme.cardColor }]}
      >
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0', color: theme.textColor }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor="#888"
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, { backgroundColor: theme.primaryColor }, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
      
      {showEndConversationConfirm && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardColor }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>End Conversation?</Text>
            <Text style={[styles.modalText, { color: theme.subTextColor }]}>
              This will reset your current conversation. Your chat history will be saved.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.borderColor }]}
                onPress={() => setShowEndConversationConfirm(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.subTextColor }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: theme.errorColor }]}
                onPress={confirmEndConversation}
              >
                <Text style={styles.confirmButtonText}>End Conversation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3DC3C9',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 8,
  },
  headerButtonText: {
    color: '#555',
    fontWeight: '600',
  },
  endButton: {
    backgroundColor: '#ff8a80',
  },
  endButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 80,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  optionsContainer: {
    marginTop: 12,
  },
  optionButton: {
    padding: 10,
    borderRadius: 16,
    marginTop: 8,
  },
  optionText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  typingBubble: {
    position: 'absolute',
    bottom: 85,
    left: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  typingText: {
    fontSize: 20,
    letterSpacing: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  sendButtonDisabled: {
    backgroundColor: '#c0c0c0',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#ff6b6b',
    marginLeft: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default ChatbotScreen;
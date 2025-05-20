import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform, Alert } from 'react-native';

// Define language context type
type LanguageContextType = {
  language: string;
  t: (key: string) => string;
  changeLanguage: (lang: string) => Promise<boolean>;
  getLanguageId: () => string;
  isRTL: boolean;
};

// Create context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: 'English',
  t: (key: string) => key,
  changeLanguage: async () => false,
  getLanguageId: () => 'en',
  isRTL: false,
});

// Define translations
const translations: Record<string, Record<string, string>> = {
  en: {
    // Auth
    welcome: 'Welcome to MindfulMe',
    welcomeSubtitle: 'Your personal wellness companion',
    getStarted: 'Get Started',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    signInNow: 'Sign in now',
    signUpNow: 'Sign up now',
    signOut: 'Sign Out',
    signOutConfirm: 'Are you sure you want to sign out?',
    
    // Form Validation
    allFieldsRequired: 'All fields are required',
    passwordMismatch: 'Passwords do not match',
    invalidEmail: 'Please enter a valid email address',
    passwordTooShort: 'Password must be at least 6 characters',
    signUpError: 'Error creating account. Please try again.',
    signInError: 'Invalid email or password. Please try again.',
    
    // Dashboard
    dashboard: 'Dashboard',
    todaysMood: "Today's Mood",
    selectMood: 'How are you feeling today?',
    moodGreat: 'Great',
    moodGood: 'Good',
    moodOkay: 'Okay',
    moodBad: 'Bad',
    moodAwful: 'Awful',
    wellnessInsights: 'Wellness Insights',
    sleepQuality: 'Sleep Quality',
    stressLevel: 'Stress Level',
    moodTrends: 'Mood Trends',
    viewAll: 'View All',
    
    // Reminders
    reminders: 'Reminders',
    reminderDetails: 'Reminder Details',
    create: 'Create',
    createReminder: 'Create Reminder',
    editReminder: 'Edit Reminder',
    title: 'Title',
    reminderTitlePlaceholder: 'Meditation time',
    time: 'Time',
    days: 'Days',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    noReminders: 'No Reminders Yet',
    tapToCreateFirst: 'Tap the button below to create your first reminder',
    createFirstReminder: 'Create First Reminder',
    deleteReminder: 'Delete Reminder',
    deleteReminderConfirm: 'Are you sure you want to delete this reminder?',
    
    // Chatbot
    chatWithMe: 'Chat with Me',
    typeMessage: 'Type a message...',
    endConversation: 'End Conversation',
    
    // Profile
    profile: 'Profile',
    accountSection: 'Account',
    editProfile: 'Edit Profile',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    notifications: 'Notifications',
    appSettings: 'App Settings',
    language: 'Language',
    darkMode: 'Dark Mode',
    helpCenter: 'Help Center',
    privacyPolicy: 'Privacy Policy',
    version: 'Version',
    emergencyReset: 'Emergency Reset',
    
    // General
    success: 'Success',
    error: 'Error',
    firstName: 'First Name',
    lastName: 'Last Name',
    back: 'Back',
    createAccount: 'Create Account',
    enterEmail: 'Enter your email',
    enterPassword: 'Enter your password',
    enterPasswordAgain: 'Enter your password again',
    
    // Validation
    titleRequired: 'Title is required',
    timeRequired: 'Time is required',
    daysRequired: 'You must select at least one day',
    passwordRequired: 'All password fields are required',
    passwordSuccess: 'Password changed successfully',
    profileUpdated: 'Profile updated successfully',
    failedToUpdate: 'Failed to update profile',
    languageChanged: 'Language changed to',
    layoutChange: 'Layout Change',
    restartRecommended: 'Please restart the app for the layout changes to take full effect.',
    passwordChangeFailed: 'Failed to change password',
  },
  ar: {
    // Auth
    welcome: 'مرحبًا بك في مايندفول مي',
    welcomeSubtitle: 'رفيقك الشخصي للعافية',
    getStarted: 'ابدأ الآن',
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    dontHaveAccount: 'ليس لديك حساب؟',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    signInNow: 'سجل الدخول الآن',
    signUpNow: 'أنشئ حساب الآن',
    signOut: 'تسجيل الخروج',
    signOutConfirm: 'هل أنت متأكد أنك تريد تسجيل الخروج؟',
    
    // Form Validation
    allFieldsRequired: 'جميع الحقول مطلوبة',
    passwordMismatch: 'كلمات المرور غير متطابقة',
    invalidEmail: 'يرجى إدخال عنوان بريد إلكتروني صالح',
    passwordTooShort: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
    signUpError: 'خطأ في إنشاء الحساب. يرجى المحاولة مرة أخرى.',
    signInError: 'بريد إلكتروني أو كلمة مرور غير صالحة. يرجى المحاولة مرة أخرى.',
    
    // Dashboard
    dashboard: 'لوحة التحكم',
    todaysMood: 'مزاج اليوم',
    selectMood: 'كيف تشعر اليوم؟',
    moodGreat: 'رائع',
    moodGood: 'جيد',
    moodOkay: 'مقبول',
    moodBad: 'سيء',
    moodAwful: 'سيء جدًا',
    wellnessInsights: 'رؤى العافية',
    sleepQuality: 'جودة النوم',
    stressLevel: 'مستوى التوتر',
    moodTrends: 'اتجاهات المزاج',
    viewAll: 'عرض الكل',
    
    // Reminders
    reminders: 'التذكيرات',
    reminderDetails: 'تفاصيل التذكير',
    create: 'إنشاء',
    createReminder: 'إنشاء تذكير',
    editReminder: 'تعديل التذكير',
    title: 'العنوان',
    reminderTitlePlaceholder: 'وقت التأمل',
    time: 'الوقت',
    days: 'الأيام',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    noReminders: 'لا توجد تذكيرات حتى الآن',
    tapToCreateFirst: 'اضغط على الزر أدناه لإنشاء أول تذكير لك',
    createFirstReminder: 'إنشاء أول تذكير',
    deleteReminder: 'حذف التذكير',
    deleteReminderConfirm: 'هل أنت متأكد أنك تريد حذف هذا التذكير؟',
    
    // Chatbot
    chatWithMe: 'الدردشة معي',
    typeMessage: 'اكتب رسالة...',
    endConversation: 'إنهاء المحادثة',
    
    // Profile
    profile: 'الملف الشخصي',
    accountSection: 'الحساب',
    editProfile: 'تعديل الملف الشخصي',
    changePassword: 'تغيير كلمة المرور',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    notifications: 'الإشعارات',
    appSettings: 'إعدادات التطبيق',
    language: 'اللغة',
    darkMode: 'الوضع المظلم',
    helpCenter: 'مركز المساعدة',
    privacyPolicy: 'سياسة الخصوصية',
    version: 'الإصدار',
    emergencyReset: 'إعادة ضبط الطوارئ',
    
    // General
    success: 'نجاح',
    error: 'خطأ',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    back: 'رجوع',
    createAccount: 'إنشاء حساب',
    enterEmail: 'أدخل بريدك الإلكتروني',
    enterPassword: 'أدخل كلمة المرور',
    enterPasswordAgain: 'أدخل كلمة المرور مرة أخرى',
    
    // Validation
    titleRequired: 'العنوان مطلوب',
    timeRequired: 'الوقت مطلوب',
    daysRequired: 'يجب اختيار يوم واحد على الأقل',
    passwordRequired: 'جميع حقول كلمة المرور مطلوبة',
    passwordSuccess: 'تم تغيير كلمة المرور بنجاح',
    profileUpdated: 'تم تحديث الملف الشخصي بنجاح',
    failedToUpdate: 'فشل تحديث الملف الشخصي',
    languageChanged: 'تم تغيير اللغة إلى',
    layoutChange: 'تغيير التخطيط',
    restartRecommended: 'يرجى إعادة تشغيل التطبيق لتطبيق تغييرات التخطيط بشكل كامل.',
    passwordChangeFailed: 'فشل تغيير كلمة المرور',
  },
  fr: {
    // Auth
    welcome: 'Bienvenue sur MindfulMe',
    welcomeSubtitle: 'Votre compagnon de bien-être personnel',
    getStarted: 'Commencer',
    signIn: 'Se connecter',
    signUp: "S'inscrire",
    email: 'Email',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    forgotPassword: 'Mot de passe oublié?',
    dontHaveAccount: "Vous n'avez pas de compte?",
    alreadyHaveAccount: 'Vous avez déjà un compte?',
    signInNow: 'Connectez-vous maintenant',
    signUpNow: 'Inscrivez-vous maintenant',
    signOut: 'Déconnexion',
    signOutConfirm: 'Êtes-vous sûr de vouloir vous déconnecter?',
    
    // Form Validation
    allFieldsRequired: 'Tous les champs sont requis',
    passwordMismatch: 'Les mots de passe ne correspondent pas',
    invalidEmail: 'Veuillez entrer une adresse email valide',
    passwordTooShort: 'Le mot de passe doit contenir au moins 6 caractères',
    signUpError: 'Erreur lors de la création du compte. Veuillez réessayer.',
    signInError: 'Email ou mot de passe invalide. Veuillez réessayer.',
    
    // Dashboard
    dashboard: 'Tableau de bord',
    todaysMood: "L'humeur d'aujourd'hui",
    selectMood: "Comment vous sentez-vous aujourd'hui?",
    moodGreat: 'Excellent',
    moodGood: 'Bien',
    moodOkay: 'Correct',
    moodBad: 'Mauvais',
    moodAwful: 'Terrible',
    wellnessInsights: 'Aperçus du bien-être',
    sleepQuality: 'Qualité du sommeil',
    stressLevel: 'Niveau de stress',
    moodTrends: "Tendances de l'humeur",
    viewAll: 'Voir tout',
    
    // Reminders
    reminders: 'Rappels',
    reminderDetails: 'Détails du rappel',
    create: 'Créer',
    createReminder: 'Créer un rappel',
    editReminder: 'Modifier le rappel',
    title: 'Titre',
    reminderTitlePlaceholder: 'Heure de méditation',
    time: 'Heure',
    days: 'Jours',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    noReminders: 'Pas encore de rappels',
    tapToCreateFirst: 'Appuyez sur le bouton ci-dessous pour créer votre premier rappel',
    createFirstReminder: 'Créer le premier rappel',
    deleteReminder: 'Supprimer le rappel',
    deleteReminderConfirm: 'Êtes-vous sûr de vouloir supprimer ce rappel?',
    
    // Chatbot
    chatWithMe: 'Discuter avec moi',
    typeMessage: 'Tapez un message...',
    endConversation: 'Terminer la conversation',
    
    // Profile
    profile: 'Profil',
    accountSection: 'Compte',
    editProfile: 'Modifier le profil',
    changePassword: 'Changer le mot de passe',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    notifications: 'Notifications',
    appSettings: "Paramètres de l'application",
    language: 'Langue',
    darkMode: 'Mode sombre',
    helpCenter: "Centre d'aide",
    privacyPolicy: 'Politique de confidentialité',
    version: 'Version',
    emergencyReset: "Réinitialisation d'urgence",
    
    // General
    success: 'Succès',
    error: 'Erreur',
    firstName: 'Prénom',
    lastName: 'Nom',
    back: 'Retour',
    createAccount: 'Créer un compte',
    enterEmail: 'Entrez votre email',
    enterPassword: 'Entrez votre mot de passe',
    enterPasswordAgain: 'Entrez à nouveau votre mot de passe',
    
    // Validation
    titleRequired: 'Le titre est requis',
    timeRequired: "L'heure est requise",
    daysRequired: 'Vous devez sélectionner au moins un jour',
    passwordRequired: 'Tous les champs de mot de passe sont requis',
    passwordSuccess: 'Mot de passe changé avec succès',
    profileUpdated: 'Profil mis à jour avec succès',
    failedToUpdate: 'Échec de la mise à jour du profil',
    languageChanged: 'Langue changée en',
    layoutChange: 'Changement de disposition',
    restartRecommended: "Veuillez redémarrer l'application pour que les changements de disposition prennent pleinement effet.",
    passwordChangeFailed: 'Échec du changement de mot de passe',
  }
};

// Provider component
export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState('English');
  const [isRTL, setIsRTL] = useState(false);
  
  // Load saved language preference on mount
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language_preference');
        if (savedLanguage) {
          setLanguage(savedLanguage);
          setIsRTL(savedLanguage === 'ar');
        }
      } catch (error) {
        console.error('Failed to load language preference:', error);
      }
    };
    
    loadLanguagePreference();
  }, []);
  
  // Get language ID (for API calls, etc.)
  const getLanguageId = () => {
    switch (language) {
      case 'English':
        return 'en';
      case 'Arabic':
        return 'ar';
      case 'French':
        return 'fr';
      default:
        return 'en';
    }
  };
  
  // Translate function
  const t = (key: string): string => {
    const languageId = getLanguageId();
    return translations[languageId]?.[key] || key;
  };
  
  // Change language function
  const changeLanguage = async (lang: string) => {
    try {
      // Update the current language
      setLanguage(lang);
      
      // Save the language preference
      await AsyncStorage.setItem('language_preference', lang);
      
      // Handle RTL languages (Arabic)
      const isRTLLanguage = lang === 'ar';
      setIsRTL(isRTLLanguage);
      
      // Force RTL layout if needed (requires app restart to fully apply)
      if (I18nManager.isRTL !== isRTLLanguage) {
        I18nManager.forceRTL(isRTLLanguage);
        
        // Let the user know a restart might be needed
        if (Platform.OS !== 'web') {
          setTimeout(() => {
            Alert.alert(
              translations[getLanguageId()].layoutChange || 'Layout Change',
              translations[getLanguageId()].restartRecommended || 'Please restart the app for the layout changes to take full effect.',
              [{ text: 'OK' }]
            );
          }, 500);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to change language:', error);
      return false;
    }
  };
  
  return (
    <LanguageContext.Provider 
      value={{ 
        language, 
        t, 
        changeLanguage, 
        getLanguageId,
        isRTL
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => {
  return useContext(LanguageContext);
};
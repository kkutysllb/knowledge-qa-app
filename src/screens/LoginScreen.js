import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ImageBackground, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar,
  Dimensions
} from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  Surface, 
  useTheme 
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();

  const handleLogin = () => {
    setIsLoading(true);
    // 模拟登录过程
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('QA');
    }, 1500);
  };

  return (
    <ImageBackground
      source={require('../assets/login-bg.jpg')}
      style={styles.backgroundImage}
    >
      <StatusBar translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <Surface style={styles.surface}>
            <Text style={styles.title}>知识库问答</Text>
            <Text style={styles.subtitle}>探索知识的海洋</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="用户名"
                value={username}
                onChangeText={setUsername}
                mode="outlined"
                style={styles.input}
                outlineColor={theme.colors.primary}
              />
              
              <TextInput
                label="密码"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                mode="outlined"
                style={styles.input}
                outlineColor={theme.colors.primary}
              />
              
              <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.button}
                loading={isLoading}
                disabled={!username || !password || isLoading}
              >
                登录
              </Button>
            </View>
          </Surface>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoid: {
    width: '100%',
    alignItems: 'center',
  },
  surface: {
    width: width * 0.85,
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: '#666',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
});

export default LoginScreen;

import { Redirect } from 'expo-router';

export default function Index() {
  // 重定向到登录页面
  return <Redirect href="/login" />;
}

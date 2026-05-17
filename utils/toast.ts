import Toast from 'react-native-toast-message';

type ToastKind = 'success' | 'error' | 'info' | 'warning' | 'notification';
type NotificationToastPayload = {
  title: string;
  message: string;
  label: string;
  accent: string;
  background: string;
  text: string;
  subtext: string;
  icon: string;
};

const present = (type: ToastKind, message: string, title: string) => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: type === 'error' ? 4200 : 3200,
    autoHide: true,
    topOffset: 56,
  });
};

export const showToast = {
  success: (message: string, title = 'Success') => present('success', message, title),
  error: (message: string, title = 'Error') => present('error', message, title),
  info: (message: string, title = 'Info') => present('info', message, title),
  warning: (message: string, title = 'Heads up') => present('warning', message, title),
  notification: (payload: NotificationToastPayload) => {
    Toast.show({
      type: 'notification',
      text1: payload.title,
      text2: payload.message,
      position: 'top',
      visibilityTime: 4200,
      autoHide: true,
      topOffset: 56,
      props: {
        accent: payload.accent,
        background: payload.background,
        text: payload.text,
        subtext: payload.subtext,
        icon: payload.icon,
        label: payload.label,
      },
    });
  },
};

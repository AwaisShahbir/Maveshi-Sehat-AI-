import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { setupBackgroundNotificationHandler } from './src/services/notificationService';

setupBackgroundNotificationHandler();

AppRegistry.registerComponent(appName, () => App);

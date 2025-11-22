import { useEffect } from 'react';
import { requestNotificationPermission } from '../utils/helpers';

export const useNotifications = () => {
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return null;
};

export default useNotifications;

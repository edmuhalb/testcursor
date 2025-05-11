import { useEffect, useState } from 'react';
import type { TelegramUser } from '../types/telegram';

interface UseTelegramReturn {
  user: TelegramUser | null;
  tg: any;
  isReady: boolean;
  colorScheme: 'light' | 'dark' | null;
  themeParams: any;
}

const useTelegram = (): UseTelegramReturn => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | null>(null);
  const [themeParams, setThemeParams] = useState<any>(null);

  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (!tg) return;

    // Инициализация приложения
    tg.ready();
    setIsReady(true);

    // Получение данных пользователя
    if (tg.initDataUnsafe?.user) {
      setUser(tg.initDataUnsafe.user);
    }

    // Получение цветовой схемы
    if (tg.colorScheme) {
      setColorScheme(tg.colorScheme);
    }

    // Получение параметров темы
    if (tg.themeParams) {
      setThemeParams(tg.themeParams);
    }

    // Расширяем приложение до максимальной высоты
    if (!tg.isExpanded) {
      tg.expand();
    }

    // Обработчик изменения темы
    const handleThemeChanged = () => {
      setColorScheme(tg.colorScheme);
      setThemeParams(tg.themeParams);
    };

    // Подписка на событие изменения темы
    tg.onEvent('themeChanged', handleThemeChanged);

    // Очистка при размонтировании
    return () => {
      tg.offEvent('themeChanged', handleThemeChanged);
    };
  }, [tg]);

  return { user, tg, isReady, colorScheme, themeParams };
};

export default useTelegram; 
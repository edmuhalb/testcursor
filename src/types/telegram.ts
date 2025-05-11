// Интерфейс для данных пользователя Telegram
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
  added_to_attachment_menu?: boolean;
  allows_write_to_pm?: boolean;
}

// Глобальное объявление типа для window.Telegram
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initDataUnsafe: {
          user?: TelegramUser;
          theme_params?: any;
          start_param?: string;
          auth_date?: number;
          hash?: string;
        };
        colorScheme: 'light' | 'dark';
        themeParams: any;
        ready: () => void;
        onEvent: (event: string, callback: any) => void;
        offEvent: (event: string, callback: any) => void;
        MainButton: any;
        isExpanded: boolean;
        expand: () => void;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
      }
    }
  }
} 
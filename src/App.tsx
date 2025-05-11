import { useState, useEffect } from 'react'
import './App.css'
import useTelegram from './hooks/useTelegram'
import UserProfile from './components/UserProfile'
import type { TelegramUser } from './types/telegram'

function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user, tg, isReady } = useTelegram();

  useEffect(() => {
    if (tg || window.location.search.includes('debug=true')) {
      setIsLoading(false);
    }
  }, [tg]);

  // Режим отладки - используется для тестирования вне Telegram
  const debugMode = window.location.search.includes('debug=true');
  const debugUser: TelegramUser = {
    id: 123456789,
    first_name: 'Тестовый',
    last_name: 'Пользователь',
    username: 'test_user',
    language_code: 'ru',
    is_premium: true,
    photo_url: 'https://placehold.co/200'
  };

  return (
    <div className="app-container">
      <h1 className="title">Telegram Mini App</h1>
      <div className="content">
        {isLoading ? (
          <p>Загрузка...</p>
        ) : user ? (
          <UserProfile user={user} />
        ) : debugMode ? (
          <div>
            <p className="debug-mode">Режим отладки активирован</p>
            <UserProfile user={debugUser} />
          </div>
        ) : (
          <div className="error-message">
            <p>Не удалось получить данные пользователя. Возможно, Mini App запущен вне Telegram или инициализационные данные недоступны.</p>
            <p>Пожалуйста, убедитесь, что вы запускаете приложение из Telegram.</p>
            <p>Для отладки добавьте <code>?debug=true</code> к URL.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

import { useState, useEffect } from 'react'
import './App.css'
import useTelegram from './hooks/useTelegram'
import UserProfile from './components/UserProfile'
import FoodAnalyzer from './components/FoodAnalyzer'
import MealHistory from './components/MealHistory'
import type { TelegramUser } from './types/telegram'

function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'food' | 'history'>('food');
  const { user, tg, colorScheme, themeParams } = useTelegram();

  useEffect(() => {
    if (tg || window.location.search.includes('debug=true')) {
      setIsLoading(false);
    }
  }, [tg]);

  // При запуске приложения - растягиваем на всю высоту
  useEffect(() => {
    if (tg && tg.expand) {
      tg.expand();
    }
  }, [tg]);

  // Применение цветов темы Telegram
  useEffect(() => {
    if (themeParams) {
      document.documentElement.style.setProperty('--background-color', themeParams.bg_color);
      document.documentElement.style.setProperty('--secondary-color', themeParams.secondary_bg_color);
      document.documentElement.style.setProperty('--text-color', themeParams.text_color);
      document.documentElement.style.setProperty('--hint-color', themeParams.hint_color);
      document.documentElement.style.setProperty('--link-color', themeParams.link_color);
      document.documentElement.style.setProperty('--button-color', themeParams.button_color);
      document.documentElement.style.setProperty('--button-text-color', themeParams.button_text_color);
      document.documentElement.style.setProperty('--primary-color', themeParams.button_color || '#8774e1');
    }
  }, [themeParams]);

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

  // Обработчик завершения анализа еды
  const handleAnalysisComplete = () => {
    setActiveTab('history');
  };

  // Получение текущего пользователя
  const currentUser = user || (debugMode ? debugUser : null);

  return (
    <div className={`app-container ${colorScheme || 'dark'}`}>
      <header className="telegram-header">
        <h1 className="telegram-header-title">Дневник питания</h1>
      </header>
      
      {isLoading ? (
        <p className="loading">Загрузка...</p>
      ) : currentUser ? (
        <>
          {/* Контент активной вкладки */}
          <div className="content">
            {activeTab === 'profile' && <UserProfile user={currentUser} />}
            {activeTab === 'food' && (
              <FoodAnalyzer 
                userId={currentUser.id} 
                onAnalysisComplete={handleAnalysisComplete}
              />
            )}
            {activeTab === 'history' && <MealHistory userId={currentUser.id} />}
          </div>
          
          {/* Навигация в стиле Telegram */}
          <nav className="telegram-tabs">
            <button 
              className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <i className="fa-solid fa-user"></i>
              <span>Профиль</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'food' ? 'active' : ''}`}
              onClick={() => setActiveTab('food')}
            >
              <i className="fa-solid fa-camera"></i>
              <span>Добавить</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <i className="fa-solid fa-utensils"></i>
              <span>История</span>
            </button>
          </nav>
        </>
      ) : (
        <div className="error-message">
          <p>Не удалось получить данные пользователя. Возможно, Mini App запущен вне Telegram или инициализационные данные недоступны.</p>
          <p>Пожалуйста, убедитесь, что вы запускаете приложение из Telegram.</p>
          <p>Для отладки добавьте <code>?debug=true</code> к URL.</p>
        </div>
      )}
    </div>
  )
}

export default App

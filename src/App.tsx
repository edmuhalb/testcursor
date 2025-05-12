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
  const { user, tg } = useTelegram();

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
    <div className="app-container">
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
          
          {/* Навигация */}
          <div className="app-tabs">
            <button 
              className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
              data-tab="profile"
            >
              Профиль
            </button>
            <button 
              className={`tab-button ${activeTab === 'food' ? 'active' : ''}`}
              onClick={() => setActiveTab('food')}
              data-tab="food"
            >
              Добавить
            </button>
            <button 
              className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
              data-tab="history"
            >
              История
            </button>
          </div>
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

import React, { useState, useEffect } from 'react';
import useNutritionStorage from '../hooks/useNutritionStorage';
import type { TelegramUser } from '../types/telegram';

interface UserProfileProps {
  user: TelegramUser;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const { clearHistory, getHistory, isLoading, error } = useNutritionStorage();
  const [dbStats, setDbStats] = useState<{mealCount: number, daysCount: number} | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{success: boolean, message: string} | null>(null);

  // Загрузка статистики о базе данных
  const loadDatabaseStats = async () => {
    setIsStatsLoading(true);
    try {
      // Получаем историю за большой период, чтобы оценить объем данных
      const history = await getHistory(user.id, 30);
      // Подсчитываем общее количество приемов пищи
      let totalMeals = 0;
      history.forEach((day: any) => {
        totalMeals += day.meals.length;
      });
      setDbStats({
        mealCount: totalMeals,
        daysCount: history.length
      });
    } catch (err) {
      console.error('Ошибка при загрузке статистики БД:', err);
      setActionResult({
        success: false,
        message: 'Не удалось загрузить статистику базы данных'
      });
    } finally {
      setIsStatsLoading(false);
    }
  };

  // Загружаем статистику при первом рендере
  useEffect(() => {
    loadDatabaseStats();
  }, [user.id]);

  // Обработчик очистки истории
  const handleClearHistory = async () => {
    if (window.confirm('Вы уверены, что хотите удалить всю историю питания? Это действие невозможно отменить.')) {
      try {
        await clearHistory(user.id);
        setActionResult({
          success: true,
          message: 'История питания успешно очищена'
        });
        
        // Обновляем статистику
        loadDatabaseStats();
      } catch (err) {
        setActionResult({
          success: false,
          message: 'Ошибка при очистке истории'
        });
      }
    }
  };

  return (
    <div>
      <div className="user-info">
        <div className="user-photo">
          <img src={user.photo_url || 'https://telegram.org/img/t_logo.png'} alt={user.first_name} />
        </div>
        <h2 className="user-name">
          {user.first_name} {user.last_name}
          {user.is_premium && <span className="premium-badge">★</span>}
        </h2>
        {user.username && <p className="user-username">@{user.username}</p>}
        
        <div className="user-details">
          <p>
            <span>ID пользователя:</span>
            <span>{user.id}</span>
          </p>
          <p>
            <span>Язык:</span>
            <span>{user.language_code}</span>
          </p>
        </div>
      </div>
      
      {/* Раздел управления базой данных */}
      <div className="database-section">
        <h3 className="section-title">База данных</h3>
        
        {isStatsLoading ? (
          <p className="loading">Загрузка статистики...</p>
        ) : dbStats ? (
          <div className="database-stats">
            <div className="user-details">
              <p>
                <span>Количество приемов пищи:</span>
                <span>{dbStats.mealCount}</span>
              </p>
              <p>
                <span>Дней с данными:</span>
                <span>{dbStats.daysCount}</span>
              </p>
              <p>
                <span>Тип хранилища:</span>
                <span>Сервер</span>
              </p>
            </div>
          </div>
        ) : (
          <p className="empty-history">Нет данных в базе</p>
        )}
        
        <button 
          className="button refresh-button"
          onClick={loadDatabaseStats}
          disabled={isStatsLoading}
        >
          {isStatsLoading ? 'Обновление...' : 'Обновить статистику'}
        </button>
        
        <button 
          className="button danger-button"
          onClick={handleClearHistory}
          disabled={isLoading || !dbStats?.mealCount}
          style={{ backgroundColor: 'var(--danger-color)', marginTop: '10px' }}
        >
          {isLoading ? 'Удаление...' : 'Очистить историю питания'}
        </button>
        
        {actionResult && (
          <div className={`action-result ${actionResult.success ? 'success' : 'error'}`}>
            {actionResult.message}
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 
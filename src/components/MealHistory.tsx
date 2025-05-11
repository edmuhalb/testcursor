import React, { useState, useEffect } from 'react';
import useNutritionStorage from '../hooks/useNutritionStorage';
import type { Meal, DailyNutrition } from '../types/nutrition';
import { MealType } from '../types/nutrition';

interface MealHistoryProps {
  userId: number;
  daysToShow?: number;
}

const MealHistory: React.FC<MealHistoryProps> = ({ userId, daysToShow = 7 }) => {
  const [history, setHistory] = useState<DailyNutrition[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { getHistory } = useNutritionStorage();

  useEffect(() => {
    loadHistory();
  }, [userId, daysToShow]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getHistory(userId, daysToShow);
      setHistory(data);
    } catch (error) {
      console.error('Ошибка при загрузке истории:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для форматирования даты
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      weekday: 'long'
    }).format(date);
  };

  // Функция для получения названия типа приема пищи
  const getMealTypeName = (type: MealType): string => {
    switch (type) {
      case MealType.BREAKFAST:
        return 'Завтрак';
      case MealType.LUNCH:
        return 'Обед';
      case MealType.DINNER:
        return 'Ужин';
      case MealType.SNACK:
        return 'Перекус';
      default:
        return 'Прием пищи';
    }
  };

  // Функция для получения времени из timestamp
  const formatTime = (timestamp: number): string => {
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  // Функция для получения цвета оценки здоровья
  const getHealthScoreColor = (score: number): string => {
    if (score >= 80) return '#4CAF50'; // Зеленый для хорошего показателя
    if (score >= 50) return '#FFC107'; // Желтый для среднего
    return '#F44336'; // Красный для плохого
  };

  return (
    <div className="meal-history">
      <h2 className="section-title">История приемов пищи</h2>
      
      {isLoading ? (
        <p className="loading">Загрузка истории...</p>
      ) : history.length === 0 ? (
        <p className="empty-history">У вас пока нет записей о приемах пищи</p>
      ) : (
        <div className="history-list">
          {history.map((day) => (
            <div key={day.date} className="day-card">
              <h3 className="day-title">{formatDate(day.date)}</h3>
              
              <div className="day-summary">
                <div className="summary-item">
                  <span>Всего калорий:</span>
                  <strong>{day.totalCalories} ккал</strong>
                </div>
                <div className="summary-item">
                  <span>БЖУ:</span>
                  <strong>
                    {day.totalProtein}г / {day.totalFats}г / {day.totalCarbs}г
                  </strong>
                </div>
                <div className="summary-item">
                  <span>Средняя оценка:</span>
                  <div className="mini-progress">
                    <div
                      className="mini-progress-bar"
                      style={{
                        width: `${day.averageHealthScore}%`,
                        backgroundColor: getHealthScoreColor(day.averageHealthScore)
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="meals-list">
                {day.meals.map((meal) => (
                  <div key={meal.id} className="meal-card">
                    <div className="meal-header">
                      <h4>{getMealTypeName(meal.type)}</h4>
                      <span className="meal-time">{formatTime(meal.timestamp)}</span>
                    </div>
                    
                    <div className="meal-content">
                      {meal.photo && (
                        <div className="meal-photo">
                          <img src={meal.photo} alt="Фото еды" />
                        </div>
                      )}
                      
                      <div className="meal-details">
                        {meal.foods.map((food, index) => (
                          <div key={index} className="food-item">
                            <h5>{food.name}</h5>
                            <div className="food-nutrition">
                              <div>Калории: {food.calories} ккал</div>
                              <div>Белки: {food.protein}г</div>
                              <div>Жиры: {food.fats}г</div>
                              <div>Углеводы: {food.carbs}г</div>
                            </div>
                            {food.commentary && (
                              <div className="food-comment">
                                {food.commentary}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="meal-footer">
                      <div className="meal-health-score">
                        <span>Оценка качества: </span>
                        <div className="mini-progress">
                          <div
                            className="mini-progress-bar"
                            style={{
                              width: `${meal.healthScore}%`,
                              backgroundColor: getHealthScoreColor(meal.healthScore)
                            }}
                          ></div>
                        </div>
                        <span>{meal.healthScore}/100</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <button
        className="button refresh-button"
        onClick={loadHistory}
        disabled={isLoading}
      >
        Обновить историю
      </button>
    </div>
  );
};

export default MealHistory; 
import type { Meal, DailyNutrition } from '../types/nutrition';

interface UseNutritionStorageReturn {
  addMeal: (meal: Meal) => Promise<void>;
  getMeals: (userId: number, date?: string) => Promise<Meal[]>;
  getDailyNutrition: (userId: number, date?: string) => Promise<DailyNutrition | null>;
  getHistory: (userId: number, daysCount?: number) => Promise<DailyNutrition[]>;
  clearHistory: (userId: number) => Promise<void>;
}

const useNutritionStorage = (): UseNutritionStorageReturn => {
  // Префикс для ключей в localStorage
  const STORAGE_PREFIX = 'nutrition_tracker_';
  
  // Функция для получения ключа по дате и ID пользователя
  const getStorageKey = (userId: number, date: string): string => {
    return `${STORAGE_PREFIX}${userId}_${date}`;
  };
  
  // Функция для получения текущей даты в формате YYYY-MM-DD
  const getCurrentDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  // Добавление нового приема пищи
  const addMeal = async (meal: Meal): Promise<void> => {
    const date = new Date(meal.timestamp).toISOString().split('T')[0];
    const key = getStorageKey(meal.userId, date);
    
    // Получаем текущую дневную статистику или создаем новую
    let dailyData: DailyNutrition;
    
    try {
      const existingData = localStorage.getItem(key);
      
      if (existingData) {
        dailyData = JSON.parse(existingData);
        
        // Добавляем новый прием пищи
        dailyData.meals.push(meal);
      } else {
        // Создаем новый объект дневной статистики
        dailyData = {
          date,
          userId: meal.userId,
          meals: [meal],
          totalCalories: 0,
          totalProtein: 0,
          totalFats: 0,
          totalCarbs: 0,
          averageHealthScore: 0
        };
      }
      
      // Пересчитываем общую статистику
      recalculateDailyTotals(dailyData);
      
      // Сохраняем обновленные данные
      localStorage.setItem(key, JSON.stringify(dailyData));
      
    } catch (error) {
      console.error('Ошибка при сохранении приема пищи:', error);
      throw new Error('Не удалось сохранить данные о приеме пищи');
    }
  };
  
  // Пересчет общей дневной статистики
  const recalculateDailyTotals = (dailyData: DailyNutrition): void => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFats = 0;
    let totalCarbs = 0;
    let totalHealthScore = 0;
    
    dailyData.meals.forEach(meal => {
      totalCalories += meal.totalCalories;
      totalProtein += meal.totalProtein;
      totalFats += meal.totalFats;
      totalCarbs += meal.totalCarbs;
      totalHealthScore += meal.healthScore;
    });
    
    dailyData.totalCalories = totalCalories;
    dailyData.totalProtein = totalProtein;
    dailyData.totalFats = totalFats;
    dailyData.totalCarbs = totalCarbs;
    dailyData.averageHealthScore = dailyData.meals.length > 0 
      ? totalHealthScore / dailyData.meals.length 
      : 0;
  };
  
  // Получение всех приемов пищи за определенную дату
  const getMeals = async (userId: number, date?: string): Promise<Meal[]> => {
    const targetDate = date || getCurrentDate();
    const key = getStorageKey(userId, targetDate);
    
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const dailyData: DailyNutrition = JSON.parse(data);
        return dailyData.meals;
      }
      return [];
    } catch (error) {
      console.error('Ошибка при получении приемов пищи:', error);
      return [];
    }
  };
  
  // Получение дневной статистики
  const getDailyNutrition = async (userId: number, date?: string): Promise<DailyNutrition | null> => {
    const targetDate = date || getCurrentDate();
    const key = getStorageKey(userId, targetDate);
    
    try {
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Ошибка при получении дневной статистики:', error);
      return null;
    }
  };
  
  // Получение истории питания за указанное количество дней
  const getHistory = async (userId: number, daysCount: number = 7): Promise<DailyNutrition[]> => {
    const history: DailyNutrition[] = [];
    const today = new Date();
    
    try {
      for (let i = 0; i < daysCount; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const dailyData = await getDailyNutrition(userId, dateString);
        if (dailyData) {
          history.push(dailyData);
        }
      }
      
      return history;
    } catch (error) {
      console.error('Ошибка при получении истории питания:', error);
      return [];
    }
  };
  
  // Очистка всей истории питания пользователя
  const clearHistory = async (userId: number): Promise<void> => {
    try {
      const keysToRemove: string[] = [];
      
      // Находим все ключи, относящиеся к данному пользователю
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${STORAGE_PREFIX}${userId}`)) {
          keysToRemove.push(key);
        }
      }
      
      // Удаляем все найденные ключи
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
    } catch (error) {
      console.error('Ошибка при очистке истории питания:', error);
      throw new Error('Не удалось очистить историю питания');
    }
  };
  
  return {
    addMeal,
    getMeals,
    getDailyNutrition,
    getHistory,
    clearHistory
  };
};

export default useNutritionStorage; 
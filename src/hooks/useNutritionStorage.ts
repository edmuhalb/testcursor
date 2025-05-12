import { useState, useEffect } from 'react';
import type { Meal, DailyNutrition } from '../types/nutrition';
import { nutritionDB } from '../services/database';

interface UseNutritionStorageReturn {
  addMeal: (meal: Meal) => Promise<void>;
  getMeals: (userId: number, date?: string) => Promise<Meal[]>;
  getDailyNutrition: (userId: number, date?: string) => Promise<DailyNutrition | null>;
  getHistory: (userId: number, daysCount?: number) => Promise<DailyNutrition[]>;
  clearHistory: (userId: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const useNutritionStorage = (): UseNutritionStorageReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Функция для получения текущей даты в формате YYYY-MM-DD
  const getCurrentDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  // Добавление нового приема пищи
  const addMeal = async (meal: Meal): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await nutritionDB.addMeal(meal);
    } catch (error) {
      console.error('Ошибка при сохранении приема пищи:', error);
      setError('Не удалось сохранить данные о приеме пищи');
      throw new Error('Не удалось сохранить данные о приеме пищи');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Получение всех приемов пищи за определенную дату
  const getMeals = async (userId: number, date?: string): Promise<Meal[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const targetDate = date || getCurrentDate();
      const meals = await nutritionDB.getMeals(userId, targetDate);
      return meals;
    } catch (error) {
      console.error('Ошибка при получении приемов пищи:', error);
      setError('Не удалось загрузить приемы пищи');
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  // Получение дневной статистики
  const getDailyNutrition = async (userId: number, date?: string): Promise<DailyNutrition | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const targetDate = date || getCurrentDate();
      const dailyData = await nutritionDB.getDailyNutrition(userId, targetDate);
      return dailyData;
    } catch (error) {
      console.error('Ошибка при получении дневной статистики:', error);
      setError('Не удалось загрузить дневную статистику');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Получение истории питания за указанное количество дней
  const getHistory = async (userId: number, daysCount: number = 7): Promise<DailyNutrition[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const history = await nutritionDB.getHistory(userId, daysCount);
      return history;
    } catch (error) {
      console.error('Ошибка при получении истории питания:', error);
      setError('Не удалось загрузить историю питания');
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  // Очистка всей истории питания пользователя
  const clearHistory = async (userId: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await nutritionDB.clearHistory(userId);
    } catch (error) {
      console.error('Ошибка при очистке истории питания:', error);
      setError('Не удалось очистить историю питания');
      throw new Error('Не удалось очистить историю питания');
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    addMeal,
    getMeals,
    getDailyNutrition,
    getHistory,
    clearHistory,
    isLoading,
    error
  };
};

export default useNutritionStorage; 
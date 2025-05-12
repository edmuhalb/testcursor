import { useState } from 'react';
import type { Meal, DailyNutrition } from '../types/nutrition';

interface UseNutritionStorageReturn {
  addMeal: (meal: Meal, photoFile?: File) => Promise<void>;
  getMeals: (userId: number, date?: string) => Promise<Meal[]>;
  getDailyNutrition: (userId: number, date?: string) => Promise<DailyNutrition | null>;
  getHistory: (userId: number, daysCount?: number) => Promise<DailyNutrition[]>;
  clearHistory: (userId: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const API_BASE = 'https://your-backend.com/api'; // Замените на ваш адрес API

const useNutritionStorage = (): UseNutritionStorageReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Добавление нового приема пищи с фото
  const addMeal = async (meal: Meal, photoFile?: File): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('meal', JSON.stringify(meal));
      if (photoFile) formData.append('photo', photoFile);
      const response = await fetch(`${API_BASE}/meals`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Ошибка при сохранении приёма пищи');
    } catch (error) {
      setError('Не удалось сохранить данные о приеме пищи');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Получение всех приемов пищи за определенную дату
  const getMeals = async (userId: number, date?: string): Promise<Meal[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ userId: String(userId) });
      if (date) params.append('date', date);
      const response = await fetch(`${API_BASE}/meals?${params.toString()}`);
      if (!response.ok) throw new Error('Ошибка при получении приёмов пищи');
      return await response.json();
    } catch (error) {
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
      const params = new URLSearchParams({ userId: String(userId) });
      if (date) params.append('date', date);
      const response = await fetch(`${API_BASE}/daily-nutrition?${params.toString()}`);
      if (!response.ok) throw new Error('Ошибка при получении дневной статистики');
      return await response.json();
    } catch (error) {
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
      const params = new URLSearchParams({ userId: String(userId), days: String(daysCount) });
      const response = await fetch(`${API_BASE}/history?${params.toString()}`);
      if (!response.ok) throw new Error('Ошибка при получении истории питания');
      return await response.json();
    } catch (error) {
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
      const response = await fetch(`${API_BASE}/history`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Ошибка при очистке истории питания');
    } catch (error) {
      setError('Не удалось очистить историю питания');
      throw error;
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
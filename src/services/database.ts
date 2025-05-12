import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Meal, DailyNutrition } from '../types/nutrition';

// Расширяем интерфейс DailyNutrition для внутреннего использования в БД
interface InternalDailyNutrition extends DailyNutrition {
  key: string;
}

// Определение схемы базы данных
interface NutritionDBSchema extends DBSchema {
  meals: {
    key: string; // ID приема пищи
    value: Meal & { dateString: string };
    indexes: {
      'by-user-date': [number, string]; // [userId, date]
    };
  };
  dailyNutrition: {
    key: string; // userId_date
    value: InternalDailyNutrition;
    indexes: {
      'by-user': number; // userId
    };
  };
}

// Конфигурация базы данных
const DB_NAME = 'nutrition-tracker-db';
const DB_VERSION = 1;

// Класс для работы с базой данных
class NutritionDatabase {
  private dbPromise: Promise<IDBPDatabase<NutritionDBSchema>>;

  constructor() {
    this.dbPromise = this.initDatabase();
  }

  // Инициализация базы данных
  private async initDatabase(): Promise<IDBPDatabase<NutritionDBSchema>> {
    return openDB<NutritionDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Создаем хранилище для приемов пищи
        if (!db.objectStoreNames.contains('meals')) {
          const mealsStore = db.createObjectStore('meals', { keyPath: 'id' });
          mealsStore.createIndex('by-user-date', ['userId', 'dateString'], { unique: false });
        }

        // Создаем хранилище для дневной статистики
        if (!db.objectStoreNames.contains('dailyNutrition')) {
          const dailyStore = db.createObjectStore('dailyNutrition', { keyPath: 'key' });
          dailyStore.createIndex('by-user', 'userId', { unique: false });
        }
      }
    });
  }

  // Функция для получения текущей даты в формате YYYY-MM-DD
  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Функция для формирования ключа дневной статистики
  private getDailyKey(userId: number, date: string): string {
    return `${userId}_${date}`;
  }

  // Преобразование временной метки в строку даты
  private getDateStringFromTimestamp(timestamp: number): string {
    return new Date(timestamp).toISOString().split('T')[0];
  }

  // Добавление приема пищи
  async addMeal(meal: Meal): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(['meals', 'dailyNutrition'], 'readwrite');
    
    // Добавляем метку даты для индексации
    const mealWithDateString = { 
      ...meal, 
      dateString: this.getDateStringFromTimestamp(meal.timestamp) 
    };
    
    // Сохраняем прием пищи
    await tx.objectStore('meals').put(mealWithDateString);
    
    // Обновляем дневную статистику
    const dateString = this.getDateStringFromTimestamp(meal.timestamp);
    const dailyKey = this.getDailyKey(meal.userId, dateString);
    
    let dailyData = await tx.objectStore('dailyNutrition').get(dailyKey);
    
    if (dailyData) {
      // Проверяем, есть ли уже этот прием пищи
      const mealIndex = dailyData.meals.findIndex(m => m.id === meal.id);
      
      if (mealIndex >= 0) {
        // Обновляем существующий прием пищи
        dailyData.meals[mealIndex] = meal;
      } else {
        // Добавляем новый прием пищи
        dailyData.meals.push(meal);
      }
      
      // Пересчитываем общую статистику
      this.recalculateDailyTotals(dailyData);
    } else {
      // Создаем новый объект дневной статистики
      const newDailyData: InternalDailyNutrition = {
        key: dailyKey,
        date: dateString,
        userId: meal.userId,
        meals: [meal],
        totalCalories: meal.totalCalories,
        totalProtein: meal.totalProtein,
        totalFats: meal.totalFats,
        totalCarbs: meal.totalCarbs,
        averageHealthScore: meal.healthScore
      };
      
      // Сохраняем новые данные
      await tx.objectStore('dailyNutrition').put(newDailyData);
    }
    
    // Если есть существующие данные, сохраняем их
    if (dailyData) {
      await tx.objectStore('dailyNutrition').put(dailyData);
    }
    
    // Завершаем транзакцию
    await tx.done;
  }

  // Пересчет общей дневной статистики
  private recalculateDailyTotals(dailyData: InternalDailyNutrition): void {
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
  }

  // Получение всех приемов пищи за определенную дату
  async getMeals(userId: number, date?: string): Promise<Meal[]> {
    const targetDate = date || this.getCurrentDate();
    const db = await this.dbPromise;
    
    try {
      const meals = await db.getAllFromIndex(
        'meals', 
        'by-user-date', 
        IDBKeyRange.only([userId, targetDate])
      );
      
      return meals;
    } catch (error) {
      console.error('Ошибка при получении приемов пищи из БД:', error);
      return [];
    }
  }

  // Получение дневной статистики
  async getDailyNutrition(userId: number, date?: string): Promise<DailyNutrition | null> {
    const targetDate = date || this.getCurrentDate();
    const dailyKey = this.getDailyKey(userId, targetDate);
    const db = await this.dbPromise;
    
    try {
      const dailyData = await db.get('dailyNutrition', dailyKey);
      if (dailyData) {
        // Удаляем технический ключ из возвращаемого результата
        const { key, ...result } = dailyData;
        return result;
      }
      return null;
    } catch (error) {
      console.error('Ошибка при получении дневной статистики из БД:', error);
      return null;
    }
  }

  // Получение истории питания за указанное количество дней
  async getHistory(userId: number, daysCount: number = 7): Promise<DailyNutrition[]> {
    const history: DailyNutrition[] = [];
    const today = new Date();
    
    try {
      for (let i = 0; i < daysCount; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const dailyData = await this.getDailyNutrition(userId, dateString);
        if (dailyData) {
          history.push(dailyData);
        }
      }
      
      return history;
    } catch (error) {
      console.error('Ошибка при получении истории питания из БД:', error);
      return [];
    }
  }

  // Очистка всей истории питания пользователя
  async clearHistory(userId: number): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(['meals', 'dailyNutrition'], 'readwrite');
    
    try {
      // Удаляем все приемы пищи пользователя
      const mealsCursor = await tx.objectStore('meals').index('by-user-date').openCursor(IDBKeyRange.bound(
        [userId, ''], 
        [userId, '\uffff']
      ));
      
      // Итерируем по курсору и удаляем записи
      while (mealsCursor) {
        await mealsCursor.delete();
        await mealsCursor.continue();
      }
      
      // Удаляем всю дневную статистику пользователя
      const dailyCursor = await tx.objectStore('dailyNutrition').index('by-user').openCursor(IDBKeyRange.only(userId));
      
      // Итерируем по курсору и удаляем записи
      while (dailyCursor) {
        await dailyCursor.delete();
        await dailyCursor.continue();
      }
      
      // Завершаем транзакцию
      await tx.done;
    } catch (error) {
      console.error('Ошибка при очистке истории питания из БД:', error);
      throw new Error('Не удалось очистить историю питания');
    }
  }
}

// Создаем и экспортируем экземпляр базы данных
export const nutritionDB = new NutritionDatabase(); 
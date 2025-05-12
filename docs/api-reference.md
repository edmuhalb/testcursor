# API Reference

Документация по API интерфейсам приложения "Дневник питания".

## Хуки (Hooks)

### useTelegram

Хук для взаимодействия с Telegram WebApp API.

```typescript
function useTelegram(): {
  user: TelegramUser | null;
  tg: any;
  isReady: boolean;
  colorScheme: 'light' | 'dark' | null;
  themeParams: any;
}
```

#### Возвращаемые значения

| Параметр | Тип | Описание |
|----------|-----|----------|
| `user` | `TelegramUser \| null` | Объект с данными пользователя или null, если не удалось получить данные |
| `tg` | `any` | Объект Telegram WebApp API для взаимодействия с функциями Telegram |
| `isReady` | `boolean` | Флаг готовности WebApp |
| `colorScheme` | `'light' \| 'dark' \| null` | Цветовая схема Telegram приложения |
| `themeParams` | `any` | Параметры темы из Telegram WebApp |

#### Пример использования

```typescript
const { user, tg, colorScheme, themeParams } = useTelegram();

// Проверка пользователя
if (user) {
  console.log(`Привет, ${user.first_name}!`);
}

// Использование цветовой схемы
const isDarkMode = colorScheme === 'dark';

// Использование функций Telegram
if (tg && tg.expand) {
  tg.expand(); // Развернуть WebApp на весь экран
}
```

### useChatGPTFoodAnalysis

Хук для анализа еды с помощью OpenAI API.

```typescript
function useChatGPTFoodAnalysis(): {
  analyzeFood: (imageFile: File | Blob) => Promise<ChatGPTFoodAnalysis>;
  isAnalyzing: boolean;
  error: string | null;
}
```

#### Возвращаемые значения

| Параметр | Тип | Описание |
|----------|-----|----------|
| `analyzeFood` | `(imageFile: File \| Blob) => Promise<ChatGPTFoodAnalysis>` | Функция для анализа фотографии еды |
| `isAnalyzing` | `boolean` | Флаг процесса анализа |
| `error` | `string \| null` | Сообщение об ошибке или null |

#### Пример использования

```typescript
const { analyzeFood, isAnalyzing, error } = useChatGPTFoodAnalysis();

const handleAnalyzeClick = async () => {
  if (!photo) return;
  
  try {
    const result = await analyzeFood(photo);
    
    if (result.success && result.analysis) {
      // Обработка результата анализа
      console.log(result.analysis);
    } else {
      console.error('Ошибка анализа:', result.error);
    }
  } catch (error) {
    console.error('Ошибка при анализе фото:', error);
  }
};
```

### useNutritionStorage

Хук для управления хранилищем данных о питании.

```typescript
function useNutritionStorage(): {
  addMeal: (meal: Meal) => Promise<void>;
  getMeals: (userId: number, date?: string) => Promise<Meal[]>;
  getDailyNutrition: (userId: number, date?: string) => Promise<DailyNutrition | null>;
  getHistory: (userId: number, daysCount?: number) => Promise<DailyNutrition[]>;
  clearHistory: (userId: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
```

#### Возвращаемые значения

| Параметр | Тип | Описание |
|----------|-----|----------|
| `addMeal` | `(meal: Meal) => Promise<void>` | Функция для добавления приема пищи |
| `getMeals` | `(userId: number, date?: string) => Promise<Meal[]>` | Функция для получения приемов пищи за определенную дату |
| `getDailyNutrition` | `(userId: number, date?: string) => Promise<DailyNutrition \| null>` | Функция для получения дневной статистики |
| `getHistory` | `(userId: number, daysCount?: number) => Promise<DailyNutrition[]>` | Функция для получения истории питания |
| `clearHistory` | `(userId: number) => Promise<void>` | Функция для очистки истории питания пользователя |
| `isLoading` | `boolean` | Флаг процесса загрузки |
| `error` | `string \| null` | Сообщение об ошибке или null |

#### Пример использования

```typescript
const { addMeal, getHistory, isLoading, error } = useNutritionStorage();

// Добавление нового приема пищи
const handleSaveMeal = async () => {
  if (!analysis || !photo) return;
  
  try {
    // Создаем объект приема пищи
    const newMeal: Meal = {
      id: uuidv4(),
      userId,
      timestamp: Date.now(),
      type: mealType,
      foods: [analysis],
      photo: photoPreview || undefined,
      totalCalories: analysis.calories,
      totalProtein: analysis.protein,
      totalFats: analysis.fats,
      totalCarbs: analysis.carbs,
      healthScore: analysis.healthScore
    };
    
    // Сохраняем прием пищи
    await addMeal(newMeal);
    
    alert('Прием пищи успешно сохранен!');
  } catch (error) {
    console.error('Ошибка при сохранении приема пищи:', error);
    alert('Не удалось сохранить прием пищи');
  }
};

// Загрузка истории питания
const loadHistory = async () => {
  try {
    const data = await getHistory(userId, 7); // Последние 7 дней
    setHistory(data);
  } catch (error) {
    console.error('Ошибка при загрузке истории:', error);
  }
};
```

## База данных (Database)

### NutritionDatabase

Класс для работы с IndexedDB.

```typescript
class NutritionDatabase {
  async addMeal(meal: Meal): Promise<void>;
  async getMeals(userId: number, date?: string): Promise<Meal[]>;
  async getDailyNutrition(userId: number, date?: string): Promise<DailyNutrition | null>;
  async getHistory(userId: number, daysCount?: number): Promise<DailyNutrition[]>;
  async clearHistory(userId: number): Promise<void>;
}
```

#### Методы

| Метод | Параметры | Возвращаемое значение | Описание |
|-------|-----------|------------------------|----------|
| `addMeal` | `meal: Meal` | `Promise<void>` | Добавляет прием пищи в базу данных |
| `getMeals` | `userId: number, date?: string` | `Promise<Meal[]>` | Возвращает приемы пищи за указанную дату |
| `getDailyNutrition` | `userId: number, date?: string` | `Promise<DailyNutrition \| null>` | Возвращает дневную статистику питания |
| `getHistory` | `userId: number, daysCount?: number` | `Promise<DailyNutrition[]>` | Возвращает историю питания за указанное количество дней |
| `clearHistory` | `userId: number` | `Promise<void>` | Очищает всю историю питания пользователя |

#### Пример использования

```typescript
import { nutritionDB } from '../services/database';

// Пример использования в компоненте
const loadDatabaseStats = async () => {
  try {
    // Получаем историю за большой период, чтобы оценить объем данных
    const history = await nutritionDB.getHistory(userId, 30);
    
    // Подсчитываем общее количество приемов пищи
    let totalMeals = 0;
    history.forEach(day => {
      totalMeals += day.meals.length;
    });
    
    setDbStats({
      mealCount: totalMeals,
      daysCount: history.length
    });
  } catch (err) {
    console.error('Ошибка при загрузке статистики БД:', err);
  }
};
```

## Интерфейсы типов данных

### TelegramUser

```typescript
interface TelegramUser {
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
```

### FoodAnalysis

```typescript
interface FoodAnalysis {
  name: string;
  calories: number;
  protein: number; // белки (г)
  fats: number; // жиры (г)
  carbs: number; // углеводы (г)
  healthScore: number; // оценка качества от 0 до 100
  commentary?: string; // комментарий о полезности еды
}
```

### Meal

```typescript
interface Meal {
  id: string;
  userId: number;
  timestamp: number;
  type: MealType;
  foods: FoodAnalysis[];
  photo?: string;
  totalCalories: number;
  totalProtein: number;
  totalFats: number;
  totalCarbs: number;
  healthScore: number;
}
```

### MealType

```typescript
const MealType = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack'
} as const;

type MealType = typeof MealType[keyof typeof MealType];
```

### DailyNutrition

```typescript
interface DailyNutrition {
  date: string; // формат YYYY-MM-DD
  userId: number;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalFats: number;
  totalCarbs: number;
  averageHealthScore: number;
}
```

### ChatGPTFoodAnalysis

```typescript
interface ChatGPTFoodAnalysis {
  success: boolean;
  analysis?: FoodAnalysis;
  error?: string;
}
```

## OpenAI API интеграция

### Формат запроса

```typescript
const body = {
  model: "gpt-4o",
  messages: [
    {
      role: "system",
      content: "Ты эксперт по питанию и анализу еды. Твоя задача - анализировать фотографии блюд и определять их питательную ценность."
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Проанализируй эту фотографию еды. Определи название блюда, примерное количество калорий, белков (г), жиров (г), углеводов (г) и дай оценку качества питания от 0 до 100, где 100 - самое здоровое. Верни только JSON без пояснений: {\"name\": \"Название блюда\", \"calories\": число, \"protein\": число, \"fats\": число, \"carbs\": число, \"healthScore\": число, \"commentary\": \"краткий комментарий о полезности еды\"}"
        },
        {
          type: "image_url",
          image_url: {
            url: base64Image
          }
        }
      ]
    }
  ],
  max_tokens: 1000
}
```

### Формат ответа

```json
{
  "name": "Греческий салат",
  "calories": 320,
  "protein": 12,
  "fats": 24,
  "carbs": 15,
  "healthScore": 85,
  "commentary": "Очень полезное блюдо, богатое полезными жирами из оливкового масла и оливок, витаминами из свежих овощей. Хороший источник белка из феты."
}
```

## Telegram WebApp API интеграция

### Основные методы

| Метод | Описание |
|-------|----------|
| `tg.ready()` | Сообщает Telegram, что приложение готово к отображению |
| `tg.expand()` | Разворачивает WebApp на весь экран |
| `tg.close()` | Закрывает WebApp |
| `tg.onEvent('themeChanged', callback)` | Подписка на события изменения темы |
| `tg.offEvent('themeChanged', callback)` | Отписка от событий изменения темы |

### Получение данных пользователя

```typescript
const user = tg.initDataUnsafe?.user;
```

### Получение параметров темы

```typescript
const colorScheme = tg.colorScheme; // 'light' или 'dark'
const themeParams = tg.themeParams; // Объект с цветами темы
```

## IndexedDB схема

### Хранилище "meals"

- **Ключ**: `id` (строка) - уникальный идентификатор приема пищи
- **Индексы**: 
  - `by-user-date`: [userId, dateString] - для быстрого поиска по пользователю и дате

### Хранилище "dailyNutrition"

- **Ключ**: `key` (строка) - формат "userId_date" (например, "123456_2023-05-12")
- **Индексы**:
  - `by-user`: userId - для быстрого поиска по пользователю 
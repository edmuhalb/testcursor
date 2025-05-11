// Интерфейс для данных о пище
export interface FoodAnalysis {
  name: string;
  calories: number;
  protein: number; // белки (г)
  fats: number; // жиры (г)
  carbs: number; // углеводы (г)
  healthScore: number; // оценка качества от 0 до 100
  commentary?: string; // комментарий о качестве еды
}

// Интерфейс для приема пищи
export interface Meal {
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

// Тип приема пищи
export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack'
}

// Интерфейс для дневной статистики питания
export interface DailyNutrition {
  date: string; // формат YYYY-MM-DD
  userId: number;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalFats: number;
  totalCarbs: number;
  averageHealthScore: number;
}

// Интерфейс для результата анализа ChatGPT
export interface ChatGPTFoodAnalysis {
  success: boolean;
  analysis?: FoodAnalysis;
  error?: string;
} 
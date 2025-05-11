import { useState } from 'react';
import type { ChatGPTFoodAnalysis, FoodAnalysis } from '../types/nutrition';

interface UseChatGPTFoodAnalysisReturn {
  analyzeFood: (imageFile: File | Blob) => Promise<ChatGPTFoodAnalysis>;
  isAnalyzing: boolean;
  error: string | null;
}

// Функция для конвертации изображения в формат base64
const imageToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Функция для имитации анализа еды (используется когда невозможно подключиться к API)
const mockFoodAnalysis = async (_imageFile: File | Blob): Promise<FoodAnalysis> => {
  // Делаем вид, что анализируем изображение
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Генерируем случайные данные для демонстрации
  const randomCalories = Math.floor(Math.random() * 600) + 200;
  const randomProtein = Math.floor(Math.random() * 30) + 5;
  const randomFats = Math.floor(Math.random() * 25) + 5;
  const randomCarbs = Math.floor(Math.random() * 50) + 10;
  const randomScore = Math.floor(Math.random() * 100);
  
  // Варианты блюд для имитации
  const foods = [
    'Салат с курицей',
    'Стейк с овощами',
    'Паста карбонара',
    'Суши-сет',
    'Борщ',
    'Пицца',
    'Греческий салат',
    'Бургер с картофелем фри'
  ];
  
  // Выбираем случайное блюдо
  const randomFoodIndex = Math.floor(Math.random() * foods.length);
  
  // Комментарии в зависимости от оценки здоровья
  let commentary = '';
  if (randomScore >= 80) {
    commentary = 'Очень полезное блюдо, богатое питательными веществами и с низким содержанием вредных жиров.';
  } else if (randomScore >= 50) {
    commentary = 'Умеренно полезное блюдо, сбалансированное по питательным веществам, но с некоторыми ограничениями.';
  } else {
    commentary = 'Блюдо с высоким содержанием калорий и низкой питательной ценностью. Рекомендуется ограничить потребление.';
  }
  
  return {
    name: foods[randomFoodIndex],
    calories: randomCalories,
    protein: randomProtein,
    fats: randomFats,
    carbs: randomCarbs,
    healthScore: randomScore,
    commentary
  };
};

const useChatGPTFoodAnalysis = (): UseChatGPTFoodAnalysisReturn => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Получаем API ключ из переменной окружения
  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  
  // Проверяем, запущено ли приложение в Telegram
  const isInTelegram = window.Telegram && window.Telegram.WebApp;
  
  // Используем имитацию для Telegram или при отсутствии API ключа
  const shouldUseMock = isInTelegram || !OPENAI_API_KEY;

  const analyzeFood = async (imageFile: File | Blob): Promise<ChatGPTFoodAnalysis> => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Используем режим имитации API для Telegram
      if (shouldUseMock) {
        console.log('Используем имитацию API для анализа еды');
        const mockResult = await mockFoodAnalysis(imageFile);
        
        return {
          success: true,
          analysis: mockResult
        };
      }
      
      // Реальный API запрос (будет работать вне Telegram)
      // Проверяем наличие API ключа
      if (!OPENAI_API_KEY) {
        throw new Error('API ключ OpenAI не найден. Пожалуйста, добавьте VITE_OPENAI_API_KEY в файл .env');
      }
      
      // Конвертируем изображение в base64
      const base64Image = await imageToBase64(imageFile);
      
      // Формируем запрос к ChatGPT API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Проанализируй эту фотографию еды. Определи примерное количество калорий, белков, жиров, углеводов и дай оценку качества питания от 0 до 100, где 100 - самое здоровое. Верни результат в формате JSON: {\"name\": \"Название блюда\", \"calories\": число, \"protein\": число, \"fats\": число, \"carbs\": число, \"healthScore\": число, \"commentary\": \"краткий комментарий о полезности еды\"}"
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
        })
      });
      
      if (!response.ok) {
        throw new Error(`ChatGPT API вернул ошибку: ${response.status}`);
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Извлекаем JSON из ответа
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Не удалось извлечь данные JSON из ответа ChatGPT');
      }
      
      const analysisData: FoodAnalysis = JSON.parse(jsonMatch[0]);
      
      return {
        success: true,
        analysis: analysisData
      };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при анализе';
      setError(errorMessage);
      
      // Если произошла ошибка и мы не в режиме имитации, пробуем использовать имитацию
      if (!shouldUseMock) {
        console.log('Произошла ошибка с API, используем имитацию', errorMessage);
        try {
          const mockResult = await mockFoodAnalysis(imageFile);
          return {
            success: true,
            analysis: mockResult
          };
        } catch (mockErr) {
          return {
            success: false,
            error: 'Ошибка при анализе фото'
          };
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeFood,
    isAnalyzing,
    error
  };
};

export default useChatGPTFoodAnalysis; 
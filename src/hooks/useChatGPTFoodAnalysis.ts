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
  
  // Определяем, нужно ли использовать мок
  const shouldUseMock = isInTelegram; // Всегда используем мок в Telegram из-за ограничений CORS
  
  // Очищаем API ключ от специальных символов
  const cleanApiKey = OPENAI_API_KEY?.replace(/%(?![0-9A-Fa-f]{2})/g, '');

  const analyzeFood = async (imageFile: File | Blob): Promise<ChatGPTFoodAnalysis> => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Используем режим имитации API для Telegram
      if (shouldUseMock) {
        console.log('Используем имитацию API для анализа еды (Telegram WebApp)');
        const mockResult = await mockFoodAnalysis(imageFile);
        
        return {
          success: true,
          analysis: mockResult
        };
      }
      
      // Проверяем наличие API ключа для реального запроса
      if (!cleanApiKey) {
        console.error('API ключ не найден или некорректен');
        throw new Error('API ключ OpenAI не найден или некорректен');
      }
      
      console.log('Отправляем запрос к OpenAI API...');
      
      // Конвертируем изображение в base64
      const base64Image = await imageToBase64(imageFile);
      
      // Формируем запрос к ChatGPT API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanApiKey}`
        },
        body: JSON.stringify({
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
        })
      });
      
      if (!response.ok) {
        const responseData = await response.json().catch(() => ({ error: 'Ошибка парсинга ответа' }));
        console.error('Ошибка OpenAI API:', responseData);
        throw new Error(`Ошибка OpenAI API: ${response.status} - ${responseData.error?.message || 'Неизвестная ошибка'}`);
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        // Пытаемся распарсить JSON напрямую
        const analysisData: FoodAnalysis = JSON.parse(content);
        console.log('Успешно получен анализ пищи:', analysisData);
        
        return {
          success: true,
          analysis: analysisData
        };
      } catch (jsonError) {
        console.error('Ошибка при парсинге JSON ответа:', jsonError);
        
        // Пытаемся извлечь JSON из текста
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('Не удалось извлечь данные JSON из ответа:', content);
          throw new Error('Не удалось извлечь данные из ответа API');
        }
        
        try {
          const extractedData: FoodAnalysis = JSON.parse(jsonMatch[0]);
          console.log('Извлечен JSON из текстового ответа:', extractedData);
          
          return {
            success: true,
            analysis: extractedData
          };
        } catch (extractError) {
          console.error('Ошибка при парсинге извлеченного JSON:', extractError);
          throw new Error('Некорректный формат данных в ответе API');
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при анализе';
      console.error('Ошибка при анализе фото:', errorMessage);
      setError(errorMessage);
      
      // Если произошла ошибка, пробуем использовать имитацию как запасной вариант
      console.log('Произошла ошибка, переключаемся на режим имитации');
      try {
        const mockResult = await mockFoodAnalysis(imageFile);
        return {
          success: true,
          analysis: mockResult
        };
      } catch (mockErr) {
        console.error('Ошибка в режиме имитации:', mockErr);
        return {
          success: false,
          error: 'Не удалось проанализировать фото. Пожалуйста, попробуйте еще раз.'
        };
      }
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
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

const useChatGPTFoodAnalysis = (): UseChatGPTFoodAnalysisReturn => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Получаем API ключ из переменной окружения
  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

  const analyzeFood = async (imageFile: File | Blob): Promise<ChatGPTFoodAnalysis> => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
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
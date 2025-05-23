import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useChatGPTFoodAnalysis from '../hooks/useChatGPTFoodAnalysis';
import useNutritionStorage from '../hooks/useNutritionStorage';
import { MealType } from '../types/nutrition';
import type { FoodAnalysis, Meal } from '../types/nutrition';

interface FoodAnalyzerProps {
  userId: number;
  onAnalysisComplete?: (meal: Meal) => void;
}

const FoodAnalyzer: React.FC<FoodAnalyzerProps> = ({ userId, onAnalysisComplete }) => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [mealType, setMealType] = useState<MealType>(MealType.LUNCH);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [foodText, setFoodText] = useState<string>('');
  const [isTextAnalyzing, setIsTextAnalyzing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { analyzeFood, analyzeFoodText, isAnalyzing, error: analysisError } = useChatGPTFoodAnalysis();
  const { addMeal } = useNutritionStorage();

  // Обработчик выбора фото
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPhoto(file);
      
      // Создаем превью фото
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Сбрасываем предыдущий анализ
      setAnalysis(null);
    }
  };

  // Обработчик кнопки для открытия диалога выбора файла
  const handleChoosePhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Анализ текста еды
  const handleAnalyzeText = async () => {
    if (!foodText.trim()) return;
    setIsTextAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await analyzeFoodText(foodText);
      if (result.success && result.analysis) {
        setAnalysis(result.analysis);
      } else {
        alert('Не удалось проанализировать текст: ' + result.error);
      }
    } catch (error) {
      alert('Произошла ошибка при анализе текста');
    } finally {
      setIsTextAnalyzing(false);
    }
  };

  // Анализ фото еды
  const handleAnalyzeClick = async () => {
    if (!photo) return;
    
    try {
      const result = await analyzeFood(photo);
      
      if (result.success && result.analysis) {
        setAnalysis(result.analysis);
      } else {
        console.error('Ошибка анализа:', result.error);
        alert('Не удалось проанализировать фото: ' + result.error);
      }
    } catch (error) {
      console.error('Ошибка при анализе фото:', error);
      alert('Произошла ошибка при анализе фото');
    }
  };

  // Сохранение приема пищи
  const handleSaveMeal = async () => {
    if (!analysis) return;
    
    setIsSaving(true);
    
    try {
      const newMeal: Meal = {
        id: uuidv4(),
        userId,
        timestamp: Date.now(),
        type: mealType,
        foods: [analysis],
        totalCalories: analysis.calories,
        totalProtein: analysis.protein,
        totalFats: analysis.fats,
        totalCarbs: analysis.carbs,
        healthScore: analysis.healthScore
      };
      
      await addMeal(newMeal, photo || undefined);
      
      // Очищаем форму
      setPhoto(null);
      setPhotoPreview(null);
      setAnalysis(null);
      setFoodText('');
      
      // Вызываем колбэк завершения анализа
      if (onAnalysisComplete) {
        onAnalysisComplete(newMeal);
      }
      
      alert('Прием пищи успешно сохранен!');
    } catch (error) {
      console.error('Ошибка при сохранении приема пищи:', error);
      alert('Не удалось сохранить прием пищи');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="food-analyzer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 24 }}>Добавить прием пищи</h2>
      {/* Ввод еды текстом */}
      <div className="food-text-input-block" style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <textarea
          className="food-text-input"
          placeholder="Опишите ваш прием пищи, например: Курица 200гр, картофель 250, салат греческий 300гр и стакан колы"
          value={foodText}
          onChange={e => setFoodText(e.target.value)}
          rows={5}
          style={{ width: '100%', minHeight: 90, fontSize: 18, padding: 16, borderRadius: 12, border: '1px solid #444', marginBottom: 16, background: '#181818', color: '#fff', boxSizing: 'border-box' }}
          disabled={isTextAnalyzing || isSaving}
        />
        <div className="meal-type-selector" style={{ width: '100%', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span style={{ fontSize: 16 }}>Тип приема пищи:</span>
          <select
            value={mealType}
            onChange={e => setMealType(e.target.value as MealType)}
            className="select-input"
            style={{ fontSize: 16, padding: '6px 12px', borderRadius: 8, border: '1px solid #444', background: '#222', color: '#fff' }}
            disabled={isTextAnalyzing || isSaving}
          >
            <option value={MealType.BREAKFAST}>Завтрак</option>
            <option value={MealType.LUNCH}>Обед</option>
            <option value={MealType.DINNER}>Ужин</option>
            <option value={MealType.SNACK}>Перекус</option>
          </select>
        </div>
        <button
          className="button analyze-button"
          style={{ width: '100%', maxWidth: 300, fontSize: 18, padding: '12px 0', borderRadius: 10, marginTop: 8 }}
          onClick={handleAnalyzeText}
          disabled={isTextAnalyzing || !foodText.trim()}
        >
          {isTextAnalyzing ? 'Анализируем...' : 'Проанализировать текст'}
        </button>
      </div>
      {/* Результаты анализа */}
      {analysis && (
        <div className="analysis-results" style={{ width: '100%', maxWidth: 400, marginBottom: 24 }}>
          <h3>{analysis.name}</h3>
          
          <div className="nutrition-info">
            <div className="nutrition-item">
              <span>Калории:</span>
              <strong>{analysis.calories} ккал</strong>
            </div>
            <div className="nutrition-item">
              <span>Белки:</span>
              <strong>{analysis.protein} г</strong>
            </div>
            <div className="nutrition-item">
              <span>Жиры:</span>
              <strong>{analysis.fats} г</strong>
            </div>
            <div className="nutrition-item">
              <span>Углеводы:</span>
              <strong>{analysis.carbs} г</strong>
            </div>
          </div>
          
          <div className="health-score">
            <p>Оценка качества питания:</p>
            <div className="progress-bar">
              <div
                className="progress"
                style={{
                  width: `${analysis.healthScore}%`,
                  backgroundColor: getHealthScoreColor(analysis.healthScore)
                }}
              ></div>
            </div>
            <p className="score-value">{analysis.healthScore}/100</p>
          </div>
          
          {analysis.commentary && (
            <div className="commentary">
              <p><strong>Комментарий:</strong></p>
              <p>{analysis.commentary}</p>
            </div>
          )}
          
          <button
            className="button save-button"
            onClick={handleSaveMeal}
            disabled={isSaving}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить прием пищи'}
          </button>
        </div>
      )}
      {/* Второстепенная функция: анализ по фото */}
      <div className="photo-analyze-block" style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 32 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, textAlign: 'center' }}>Или проанализируйте по фото</h3>
        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <button
          className="button secondary-button"
          style={{ width: '100%', maxWidth: 300, fontSize: 18, padding: '12px 0', borderRadius: 10, marginBottom: 16 }}
          onClick={handleChoosePhotoClick}
          disabled={isAnalyzing}
        >
          {photoPreview ? 'Выбрать другое фото' : 'Сделать фото еды'}
        </button>
        {photoPreview && (
          <div className="photo-preview" style={{ marginBottom: 16 }}>
            <img src={photoPreview} alt="Фото еды" style={{ maxWidth: 200, borderRadius: 12 }} />
          </div>
        )}
        {photo && !analysis && (
          <button
            className="button analyze-button"
            style={{ width: '100%', maxWidth: 300, fontSize: 18, padding: '12px 0', borderRadius: 10 }}
            onClick={handleAnalyzeClick}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Анализируем...' : 'Проанализировать фото'}
          </button>
        )}
      </div>
      {analysisError && (
        <div className="error-message" style={{ width: '100%', maxWidth: 400, marginTop: 16 }}>
          <p>{analysisError}</p>
        </div>
      )}
    </div>
  );
};

// Вспомогательная функция для определения цвета шкалы здоровья
const getHealthScoreColor = (score: number): string => {
  if (score >= 80) return '#4CAF50'; // Зеленый для хорошего показателя
  if (score >= 50) return '#FFC107'; // Желтый для среднего
  return '#F44336'; // Красный для плохого
};

export default FoodAnalyzer; 
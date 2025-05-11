import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [formula, setFormula] = useState<string>('0')
  const [calculationDone, setCalculationDone] = useState<boolean>(false)
  const [lastOperation, setLastOperation] = useState<string | null>(null)
  const [isListening, setIsListening] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  const recognitionRef = useRef<any>(null)

  // Инициализация распознавания речи
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'ru-RU'
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase()
        processVoiceCommand(transcript)
      }
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Ошибка распознавания речи:', event.error)
        setError('Ошибка распознавания')
        setIsListening(false)
      }
      
      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    } else {
      setError('Ваш браузер не поддерживает распознавание речи')
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Обработка голосовых команд
  const processVoiceCommand = (transcript: string) => {
    console.log('Распознано:', transcript)
    
    // Обработка команд вычисления
    if (transcript.includes('посчитай') || 
        transcript.includes('вычисли') || 
        transcript.includes('сколько будет')) {
      
      // Извлекаем математическое выражение
      let mathExpression = transcript
        .replace(/посчитай|вычисли|сколько будет/gi, '')
        .replace(/плюс/g, '+')
        .replace(/минус/g, '-')
        .replace(/умножить на|умножить/g, '*')
        .replace(/разделить на|делить на|делить/g, '/')
        .replace(/равно|будет|равняется/g, '')
        .trim()
      
      // Заменяем словесные числа на цифры
      mathExpression = mathExpression
        .replace(/один|одиночка/g, '1')
        .replace(/два|двойка/g, '2')
        .replace(/три|тройка/g, '3')
        .replace(/четыре|четверка/g, '4')
        .replace(/пять|пятерка/g, '5')
        .replace(/шесть|шестерка/g, '6')
        .replace(/семь|семерка/g, '7')
        .replace(/восемь|восьмерка/g, '8')
        .replace(/девять|девятка/g, '9')
        .replace(/ноль|нуль/g, '0')
      
      // Удаляем лишние пробелы и знаки
      mathExpression = mathExpression.replace(/\s+/g, '')
      
      // Проверяем, получилось ли извлечь выражение
      const hasNumbers = /\d/.test(mathExpression)
      const hasOperators = /[+\-*/]/.test(mathExpression)
      
      if (hasNumbers) {
        setFormula(mathExpression)
        if (hasOperators) {
          try {
            // Вычисляем результат
            setTimeout(() => handleOperator('='), 500)
          } catch (error) {
            console.error('Ошибка вычисления:', error)
          }
        }
      }
    } else if (transcript.includes('очистить') || transcript.includes('сбросить')) {
      handleClear()
    } else {
      // Пытаемся распознать просто числа и операторы
      let processed = transcript
        .replace(/плюс/g, '+')
        .replace(/минус/g, '-')
        .replace(/умножить/g, '*')
        .replace(/разделить|делить/g, '/')
        .replace(/равно|будет|равняется/g, '=')
        .trim()
      
      // Проверяем на наличие цифр или операторов
      if (/\d/.test(processed) || /[+\-*/=]/.test(processed)) {
        setFormula(calculationDone ? processed : formula + processed)
      }
    }
  }

  // Запуск/остановка голосового ввода
  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      setError(null)
      try {
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (error) {
        console.error('Ошибка запуска распознавания:', error)
        setError('Не удалось запустить распознавание')
      }
    }
  }

  // Очистка всех значений
  const handleClear = () => {
    setFormula('0')
    setCalculationDone(false)
    setLastOperation(null)
    setError(null)
  }

  // Ввод цифр
  const handleNumber = (number: string) => {
    if (calculationDone) {
      setFormula(number)
      setCalculationDone(false)
    } else if (formula === '0') {
      setFormula(number)
    } else {
      setFormula(formula + number)
    }
  }

  // Ввод точки
  const handleDecimal = () => {
    if (calculationDone) {
      setFormula('0.')
      setCalculationDone(false)
      return
    }
    
    // Проверяем, есть ли уже точка в последнем числе
    const parts = formula.split(/[+\-*/]/);
    const lastPart = parts[parts.length - 1];
    
    if (!lastPart.includes('.')) {
      setFormula(formula + '.');
    }
  }

  // Смена знака числа
  const handleSign = () => {
    if (formula === '0') return;
    
    // Находим последнее число в выражении
    const regex = /([+\-*/])?(\d+\.?\d*)$/;
    const match = formula.match(regex);
    
    if (match) {
      const [fullMatch, operator, number] = match;
      const index = formula.lastIndexOf(fullMatch);
      const isNegative = number.startsWith('-');
      
      if (operator) {
        // Если перед числом есть оператор
        const newFormula = formula.substring(0, index + operator.length) + 
                         (isNegative ? number.slice(1) : '-' + number);
        setFormula(newFormula);
      } else {
        // Если это первое число в выражении
        const newFormula = isNegative 
          ? number.slice(1) 
          : '-' + number;
        setFormula(newFormula);
      }
    }
  }

  // Расчет процента
  const handlePercent = () => {
    try {
      // Находим последнее число в выражении
      const regex = /([+\-*/])?(\d+\.?\d*)$/;
      const match = formula.match(regex);
      
      if (match) {
        const [fullMatch, operator, number] = match;
        const index = formula.lastIndexOf(fullMatch);
        const percentValue = parseFloat(number) / 100;
        
        const newFormula = formula.substring(0, index + (operator ? operator.length : 0)) + 
                         percentValue.toString();
        setFormula(newFormula);
      } else if (!isNaN(parseFloat(formula))) {
        // Если формула содержит только число
        const percentValue = parseFloat(formula) / 100;
        setFormula(percentValue.toString());
      }
    } catch (error) {
      setFormula('Ошибка');
      setCalculationDone(true);
    }
  }

  // Обработка операторов
  const handleOperator = (operator: string) => {
    if (operator === '=') {
      try {
        // Заменяем × на * для вычисления
        const expressionToEvaluate = formula.replace(/×/g, '*');
        
        // eslint-disable-next-line no-eval
        const result = eval(expressionToEvaluate);
        const resultStr = Number.isInteger(result) ? result.toString() : 
                         result.toFixed(8).replace(/\.?0+$/, '');
        
        setFormula(resultStr);
        setCalculationDone(true);
      } catch (error) {
        setFormula('Ошибка');
        setCalculationDone(true);
      }
    } else {
      // Если после предыдущего вычисления, начинаем новое выражение
      if (calculationDone) {
        setFormula(formula + ' ' + operator + ' ');
        setCalculationDone(false);
      } else {
        // Проверяем, заканчивается ли формула оператором
        const lastChar = formula.trim().slice(-1);
        if (['+', '-', '*', '/', '×'].includes(lastChar)) {
          // Заменяем существующий оператор
          setFormula(formula.slice(0, -1) + operator);
        } else {
          // Добавляем оператор
          setFormula(formula + ' ' + operator + ' ');
        }
      }
      setLastOperation(operator);
    }
  }

  // Обработка клавиатурного ввода
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/[0-9]/.test(e.key)) {
        handleNumber(e.key);
      } else if (e.key === '.') {
        handleDecimal();
      } else if (['+', '-', '*', '/'].includes(e.key)) {
        handleOperator(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        handleOperator('=');
      } else if (e.key === 'Escape') {
        handleClear();
      } else if (e.key === 'Backspace') {
        // Удаление последнего символа
        if (formula.length > 1) {
          setFormula(formula.slice(0, -1));
        } else {
          setFormula('0');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formula, calculationDone]);

  return (
    <div className="app-container">
      <h1 className="title">Реакт Калькулятор</h1>
      <div className="calculator">
        <div className="display-wrapper">
          <div className="display">{formula}</div>
          <button 
            className={`voice-button ${isListening ? 'listening' : ''}`} 
            onClick={toggleVoiceInput}
            title="Голосовой ввод"
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" />
            </svg>
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="keypad">
          <button onClick={handleClear} className="key clear">C</button>
          <button onClick={handleSign} className="key sign">+/-</button>
          <button onClick={handlePercent} className="key percent">%</button>
          <button onClick={() => handleOperator('/')} className="key operator">/</button>

          <button onClick={() => handleNumber('7')} className="key">7</button>
          <button onClick={() => handleNumber('8')} className="key">8</button>
          <button onClick={() => handleNumber('9')} className="key">9</button>
          <button onClick={() => handleOperator('*')} className="key operator">×</button>

          <button onClick={() => handleNumber('4')} className="key">4</button>
          <button onClick={() => handleNumber('5')} className="key">5</button>
          <button onClick={() => handleNumber('6')} className="key">6</button>
          <button onClick={() => handleOperator('-')} className="key operator">-</button>

          <button onClick={() => handleNumber('1')} className="key">1</button>
          <button onClick={() => handleNumber('2')} className="key">2</button>
          <button onClick={() => handleNumber('3')} className="key">3</button>
          <button onClick={() => handleOperator('+')} className="key operator">+</button>

          <button onClick={() => handleNumber('0')} className="key zero">0</button>
          <button onClick={handleDecimal} className="key">.</button>
          <button onClick={() => handleOperator('=')} className="key operator">=</button>
        </div>
      </div>
    </div>
  )
}

export default App

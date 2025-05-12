# UML-диаграммы проекта "Дневник питания"

В этом документе представлены UML-диаграммы, описывающие архитектуру и структуру проекта "Дневник питания".

## Диаграмма компонентов

```mermaid
graph TD
    A[App] --> B[UserProfile]
    A --> C[FoodAnalyzer]
    A --> D[MealHistory]
    
    B --> E[useNutritionStorage]
    C --> E
    D --> E
    
    E --> F[nutritionDB]
    
    C --> G[useChatGPTFoodAnalysis]
    G --> H[OpenAI API / Mock]
    
    A --> I[useTelegram]
    I --> J[Telegram WebApp API]
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style E fill:#bbf,stroke:#333,stroke-width:2px
    style F fill:#bfb,stroke:#333,stroke-width:2px
    style G fill:#bbf,stroke:#333,stroke-width:2px
    style I fill:#bbf,stroke:#333,stroke-width:2px
```

## Диаграмма классов

```mermaid
classDiagram
    class FoodAnalysis {
        +string name
        +number calories
        +number protein
        +number fats
        +number carbs
        +number healthScore
        +string? commentary
    }
    
    class Meal {
        +string id
        +number userId
        +number timestamp
        +MealType type
        +FoodAnalysis[] foods
        +string? photo
        +number totalCalories
        +number totalProtein
        +number totalFats
        +number totalCarbs
        +number healthScore
    }
    
    class DailyNutrition {
        +string date
        +number userId
        +Meal[] meals
        +number totalCalories
        +number totalProtein
        +number totalFats
        +number totalCarbs
        +number averageHealthScore
    }
    
    class InternalDailyNutrition {
        +string key
    }
    
    class NutritionDBSchema {
        <<interface>>
        +meals: ObjectStore
        +dailyNutrition: ObjectStore
    }
    
    class NutritionDatabase {
        -Promise<IDBPDatabase> dbPromise
        +addMeal(meal: Meal): Promise<void>
        +getMeals(userId, date): Promise<Meal[]>
        +getDailyNutrition(userId, date): Promise<DailyNutrition>
        +getHistory(userId, daysCount): Promise<DailyNutrition[]>
        +clearHistory(userId): Promise<void>
        -recalculateDailyTotals(dailyData): void
        -getCurrentDate(): string
        -getDailyKey(userId, date): string
        -getDateStringFromTimestamp(timestamp): string
    }
    
    class UseNutritionStorageReturn {
        <<interface>>
        +addMeal(meal: Meal): Promise<void>
        +getMeals(userId, date): Promise<Meal[]>
        +getDailyNutrition(userId, date): Promise<DailyNutrition>
        +getHistory(userId, daysCount): Promise<DailyNutrition[]>
        +clearHistory(userId): Promise<void>
        +boolean isLoading
        +string? error
    }
    
    class UseChatGPTFoodAnalysisReturn {
        <<interface>>
        +analyzeFood(imageFile): Promise<ChatGPTFoodAnalysis>
        +boolean isAnalyzing
        +string? error
    }
    
    class UseTelegramReturn {
        <<interface>>
        +TelegramUser user
        +object tg
        +boolean isReady
        +string? colorScheme
        +object? themeParams
    }
    
    DailyNutrition o-- Meal : contains
    InternalDailyNutrition --|> DailyNutrition : extends
    Meal o-- FoodAnalysis : contains
    NutritionDatabase ..> NutritionDBSchema : uses
    NutritionDatabase ..> DailyNutrition : returns
    NutritionDatabase ..> Meal : returns
    NutritionDatabase ..> InternalDailyNutrition : uses internally
```

## Диаграмма последовательности: Анализ фото еды

```mermaid
sequenceDiagram
    participant User
    participant FoodAnalyzer
    participant useChatGPTFoodAnalysis
    participant OpenAI
    participant nutritionDB
    participant MealHistory
    
    User->>FoodAnalyzer: Выбирает фото еды
    FoodAnalyzer->>FoodAnalyzer: Отображает превью
    User->>FoodAnalyzer: Нажимает "Анализировать"
    FoodAnalyzer->>useChatGPTFoodAnalysis: analyzeFood(photo)
    alt В Telegram WebApp
        useChatGPTFoodAnalysis->>useChatGPTFoodAnalysis: Использует режим имитации
    else Вне Telegram
        useChatGPTFoodAnalysis->>OpenAI: Отправляет запрос с фото
        OpenAI->>useChatGPTFoodAnalysis: Возвращает анализ
    end
    useChatGPTFoodAnalysis->>FoodAnalyzer: Возвращает результат анализа
    FoodAnalyzer->>FoodAnalyzer: Отображает результаты
    User->>FoodAnalyzer: Нажимает "Сохранить"
    FoodAnalyzer->>nutritionDB: addMeal(meal)
    nutritionDB->>nutritionDB: Сохраняет в IndexedDB
    nutritionDB->>FoodAnalyzer: Подтверждает сохранение
    FoodAnalyzer->>MealHistory: Переключение на вкладку истории
    MealHistory->>nutritionDB: getHistory(userId)
    nutritionDB->>MealHistory: Возвращает обновленную историю
    MealHistory->>User: Отображает историю с новой записью
```

## Диаграмма состояний: Процесс анализа еды

```mermaid
stateDiagram-v2
    [*] --> Выбор_фото
    Выбор_фото --> Предпросмотр_фото: Пользователь выбрал фото
    Предпросмотр_фото --> Выбор_типа_приема_пищи: Отображение фото
    Выбор_типа_приема_пищи --> Анализ_фото: Нажата кнопка "Анализировать"
    
    state Анализ_фото {
        [*] --> Отправка_запроса
        Отправка_запроса --> Обработка_ответа: Получен ответ от API
        Отправка_запроса --> Обработка_ошибки: Произошла ошибка
        Обработка_ошибки --> Отображение_ошибки
        Обработка_ответа --> Отображение_результатов
        Отображение_ошибки --> [*]
        Отображение_результатов --> [*]
    }
    
    Анализ_фото --> Результаты_анализа: Успешный анализ
    Результаты_анализа --> Сохранение_приема_пищи: Нажата кнопка "Сохранить"
    Сохранение_приема_пищи --> Обновление_истории: Сохранение в IndexedDB
    Обновление_истории --> [*]
```

## Диаграмма потока данных

```mermaid
graph LR
    A[Камера пользователя] -->|Фото еды| B[FoodAnalyzer]
    B -->|Фото в base64| C[useChatGPTFoodAnalysis]
    
    subgraph "Анализ пищи"
        C -->|API запрос| D[OpenAI API]
        D -->|JSON ответ| C
        C -->|Режим имитации| E[Генерация случайных данных]
        E -->|Имитация данных| C
    end
    
    C -->|Результат анализа| B
    B -->|Объект Meal| F[useNutritionStorage]
    
    subgraph "Хранение данных"
        F -->|Добавление, получение| G[nutritionDB]
        G -->|IndexedDB операции| H[Браузерная БД]
    end
    
    F -->|Данные о приемах пищи| I[MealHistory]
    F -->|Статистика| J[UserProfile]
    
    K[Telegram WebApp API] -->|Данные пользователя, тема| L[useTelegram]
    L -->|Настройки интерфейса| M[App]
    
    style B fill:#f9f,stroke:#333,stroke-width:2px
    style C fill:#bbf,stroke:#333,stroke-width:2px
    style F fill:#bbf,stroke:#333,stroke-width:2px
    style G fill:#bfb,stroke:#333,stroke-width:2px
    style L fill:#bbf,stroke:#333,stroke-width:2px
```

## Диаграмма развертывания

```mermaid
graph TD
    subgraph "Клиентское устройство"
        A[Telegram App] --> B[WebView]
        B --> C[Telegram Mini App]
        
        subgraph "React приложение"
            C --> D[Компоненты React]
            D --> E[Пользовательские хуки]
            E --> F[IndexedDB API]
            F --> G[Локальное хранилище]
        end
    end
    
    subgraph "Внешние API"
        E --> H[OpenAI API]
        C --> I[Telegram WebApp API]
    end
    
    style A fill:#f9d,stroke:#333,stroke-width:2px
    style B fill:#ddf,stroke:#333,stroke-width:2px
    style C fill:#fdf,stroke:#333,stroke-width:2px
    style G fill:#dfd,stroke:#333,stroke-width:2px
```

## Диаграмма пакетов

```mermaid
graph TD
    subgraph "src"
        A[components] --> B[hooks]
        A --> C[types]
        B --> C
        B --> D[services]
        D --> C
    end
    
    subgraph "components"
        A1[App.tsx] --> A2[UserProfile.tsx]
        A1 --> A3[FoodAnalyzer.tsx]
        A1 --> A4[MealHistory.tsx]
    end
    
    subgraph "hooks"
        B1[useTelegram.ts] 
        B2[useChatGPTFoodAnalysis.ts]
        B3[useNutritionStorage.ts] --> D1[database.ts]
    end
    
    subgraph "types"
        C1[telegram.ts]
        C2[nutrition.ts]
    end
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#bfb,stroke:#333,stroke-width:2px
    style D fill:#fbf,stroke:#333,stroke-width:2px
```

## Диаграмма активности: Полный процесс использования приложения

```mermaid
graph TD
    A[Пользователь открывает Mini App] --> B{Есть данные пользователя?}
    B -->|Нет| C[Показать ошибку]
    B -->|Да| D[Показать интерфейс]
    D --> E[Пользователь выбирает вкладку]
    
    E -->|Профиль| F[Показать профиль пользователя]
    F --> G[Показать статистику БД]
    G --> H{Очистить историю?}
    H -->|Да| I[Очистить данные в IndexedDB]
    H -->|Нет| J[Вернуться к навигации]
    I --> J
    
    E -->|Добавить еду| K[Открыть выбор фото]
    K --> L[Пользователь делает фото]
    L --> M[Показать превью]
    M --> N[Выбрать тип приема пищи]
    N --> O[Анализировать фото]
    O --> P{В Telegram?}
    P -->|Да| Q[Использовать имитацию]
    P -->|Нет| R[Запрос к OpenAI API]
    Q --> S[Показать результаты]
    R --> S
    S --> T[Сохранить прием пищи]
    T --> U[Добавить в IndexedDB]
    
    E -->|История| V[Загрузить историю из БД]
    V --> W[Показать дни с питанием]
    W --> X[Пользователь просматривает детали]
    X --> Y[Обновить данные]
    Y --> E
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style D fill:#bbf,stroke:#333,stroke-width:2px
    style F fill:#bfb,stroke:#333,stroke-width:2px
    style K fill:#bfb,stroke:#333,stroke-width:2px
    style V fill:#bfb,stroke:#333,stroke-width:2px
```

## Диаграмма сущность-связь для базы данных

```mermaid
erDiagram
    USER ||--o{ DAILY_NUTRITION : has
    USER ||--o{ MEAL : creates
    DAILY_NUTRITION ||--o{ MEAL : contains
    MEAL ||--o{ FOOD_ANALYSIS : contains
    
    USER {
        number id PK
        string first_name
        string last_name
        string username
        boolean is_premium
        string language_code
    }
    
    DAILY_NUTRITION {
        string key PK
        string date
        number userId FK
        number totalCalories
        number totalProtein
        number totalFats
        number totalCarbs
        number averageHealthScore
    }
    
    MEAL {
        string id PK
        number userId FK
        number timestamp
        string type
        string photo
        number totalCalories
        number totalProtein
        number totalFats
        number totalCarbs
        number healthScore
        string dateString IDX
    }
    
    FOOD_ANALYSIS {
        string name
        number calories
        number protein
        number fats
        number carbs
        number healthScore
        string commentary
    }
```

## Диаграмма использования (Use Case)

```mermaid
graph TD
    User((Пользователь))
    
    subgraph "Telegram Mini App"
        UC1[Просмотр профиля]
        UC2[Управление историей]
        UC3[Анализ еды по фото]
        UC4[Ведение дневника питания]
        UC5[Просмотр статистики питания]
        
        UC3 --> UC3_1[Сделать фото еды]
        UC3 --> UC3_2[Выбрать тип приема пищи]
        UC3 --> UC3_3[Получить анализ питательной ценности]
        UC3 --> UC3_4[Сохранить прием пищи]
        
        UC2 --> UC2_1[Просмотр истории приемов пищи]
        UC2 --> UC2_2[Удаление истории]
        UC2 --> UC2_3[Обновление данных]
        
        UC5 --> UC5_1[Просмотр дневной статистики]
        UC5 --> UC5_2[Просмотр подробностей о блюдах]
    end
    
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
``` 
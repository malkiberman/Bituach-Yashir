# תכנית: פלטפורמת ניקוד מועמדים - Backend בעברית

## רקע כללי

בניית מערכת backend מדרגה ייצור בעברית לחלוטין, המנתחת תשובות מועמדים לשאלון, נותנת ניקוד מתחכם ומחזירה תובנות מפורטות לגיוסים ודשבורד.

---

## סיכום ביצוע (TL;DR)

בנייה של מערכת ניקוד מועמדים באמצעות:
- **NestJS** - framework backend מודרני
- **MongoDB + Mongoose** - עם סכימות מתוקנות
- **Redis + Bull** - עיבוד אסינכרוני של ניתוחים
- **JWT + RBAC** - אימות וכללי גישה (מגייסים/מנהלים)
- **שאלון עברי קבוע** - 8 שאלות בעברית, לא ניתנות לעריכה
- **מנוע ניקוד חכם** - תסריטי רובריקה לחמשת היכולות
- **API פומיים** - נקודת ניקוד פתוחה לציבור
- **דשבורד מגייסים** - סינון, מיון, ניתוח תוצאות

---

## שלבים מפורטים (11 שלבים)

### **שלב 1: הקמת הפרויקט והתשתית** (שלבים 1-5)

#### 1.1 - יצירת פרויקט NestJS בסיס
- `npm install -g @nestjs/cli`
- `nest new candidate-scoring-backend`
- התקנה ראשונית של dependencies בסיסיים

#### 1.2 - התקנת ספריות ליבה (Core Dependencies)
```bash
npm install @nestjs/mongoose mongoose
npm install @nestjs/bull bull redis
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install class-validator class-transformer
npm install dotenv joi
npm install typeorm # optional for advanced queries
npm install winston # logging
npm install @nestjs/swagger swagger-ui-express
```

#### 1.3 - יצירת קבצי קונפיגורציה
- `src/config/database.config.ts` - חיבור MongoDB
- `src/config/redis.config.ts` - חיבור Redis
- `src/config/jwt.config.ts` - הגדרות JWT
- `src/config/env.validation.ts` - וידוא משתנים סביבה
- `src/config/bull.config.ts` - הגדרות Bull queue

#### 1.4 - יצירת קבצי סביבה (.env)
```
DATABASE_URL=mongodb://localhost:27017/candidate-scoring
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key-change-in-prod
JWT_EXPIRATION=24h
API_KEY=temp-legacy-key
NODE_ENV=development
PORT=3000
```

#### 1.5 - בניית תשתית בסיסית
- `src/common/filters/all-exceptions.filter.ts` - טיפול בשגיאות גלובלי
- `src/common/interceptors/logging.interceptor.ts` - logging
- `src/common/decorators/` - decorators מותאמים (@IsHebrew, @Roles)
- `src/main.ts` - bootstrap עם middleware ראשוני

---

### **שלב 2: אימות וביטחון** (שלבים 6-10)

#### 2.1 - JWT Strategy ו-Passport
- יצירת `src/modules/auth/strategies/jwt.strategy.ts`
- יצירת `src/modules/auth/strategies/local.strategy.ts`
- הגדרת guard ראשוני: `JwtAuthGuard`

#### 2.2 - API Key Middleware (Legacy Support)
- `src/common/middlewares/api-key.middleware.ts`
- תמיכה בהיתרון לעתיד (deprecation path)

#### 2.3 - RBAC Guards
- `src/common/guards/roles.guard.ts` - וידוא תפקידים
- `src/common/decorators/roles.decorator.ts`
- ערכים אפשריים: `ADMIN`, `RECRUITER`

#### 2.4 - Auth Module
- `src/modules/auth/auth.controller.ts`:
  - `POST /api/v1/auth/register` - רישום מגייס חדש
  - `POST /api/v1/auth/login` - התחברות
  - `POST /api/v1/auth/refresh` - refresh token
- `src/modules/auth/auth.service.ts`:
  - hash password (bcrypt)
  - generate JWT
  - validate credentials
- `src/modules/auth/auth.module.ts` - עטיפה

#### 2.5 - Request Validation Pipeline
- `src/common/pipes/validation.pipe.ts` - וידוא DTO
- `src/common/dto/` - DTOs גלובליים (error responses וכו')

---

### **שלב 3: מודלי נתונים ומסדי נתונים** (שלבים 11-15)

#### 3.1 - Candidate Schema
```typescript
// src/modules/candidate/candidate.schema.ts
{
  _id: ObjectId
  candidateId: string (unique) // email או ID יחודי
  name: string (required)
  email: string (unique, required)
  phone: string (required)
  createdAt: Date
  updatedAt: Date
  status: enum ('pending', 'in-progress', 'completed')
  resultId: ObjectId (reference to CandidateResult)
}
```

#### 3.2 - CandidateResult Schema
```typescript
// src/modules/results/result.schema.ts
{
  _id: ObjectId
  candidateId: ObjectId (reference)
  Id: string (unique identifier: email-timestamp)
  timestamp: Date
  
  technical: {
    location: number (1/2/3/0)
    availability: number (1/0)
    hasRelativeInCompany: number (1/0)
  }
  
  scores: {
    motivation: number (0-100)
    verbalAbility: number (0-100)
    peopleSkills: number (0-100)
    salesOrientation: number (0-100)
    targetOrientation: number (0-100)
  }
  
  experienceLevel: number (0-3)
  finalScore: number (0-100)
  recommendedRole: number (1=מכירות, 2=שירות)
  
  summary: string (Hebrew, 1-2 sentences)
  insights: string[] (Hebrew, 2-4 bullets)
  recommendedQuestions: string[] (Hebrew, 2-3 follow-ups)
  
  rawAnswers: {
    q1: string
    q2: string
    ... (q1 through q6)
  }
}
```

#### 3.3 - User Schema
```typescript
// src/modules/auth/user.schema.ts
{
  _id: ObjectId
  email: string (unique, required)
  password: string (hashed)
  name: string
  role: enum ('RECRUITER', 'ADMIN')
  createdAt: Date
  updatedAt: Date
  lastLogin: Date
}
```

#### 3.4 - Questionnaire Schema
```typescript
// src/modules/questionnaire/questionnaire.schema.ts
{
  _id: ObjectId
  questionnaireId: string (fixed: 'DEFAULT_HE_V1')
  questions: [
    {
      qId: number (1-8)
      text: string (Hebrew)
      type: string ('open-ended')
    }
  ]
  createdAt: Date
  isActive: boolean (default: true)
}
```

#### 3.5 - ניתוח נתונים ואינדקסים
- Index על `email` (unique)
- Index על `candidateId`
- Index על `finalScore` עבור sorting
- Index על `timestamp` עבור queries חדישות
- TTL Index על `createdAt` למחיקה אוטומטית (אופציונלי)

---

### **שלב 4: מודול השאלון** (שלבים 16-19)

#### 4.1 - Questionnaire Controller
```typescript
// src/modules/questionnaire/questionnaire.controller.ts
GET /api/v1/questionnaires - קבלת כל השאלונים
GET /api/v1/questionnaires/default - קבלת השאלון הברירת מחדל
POST /api/v1/questionnaires - יצירת שאלון חדש (ADMIN only)
```

#### 4.2 - Questionnaire Service
- Load fixed 8 questions (Hebrew) from seed data
- אם צריך dynamic questionnaires בעתיד, architecture תומכת

#### 4.3 - DTOs
```typescript
// src/modules/questionnaire/dto/create-questionnaire.dto.ts
{
  questions: {
    qId: number
    text: string
  }[]
}

// src/modules/questionnaire/dto/questionnaire.response.dto.ts
{
  questionnaireId: string
  questions: Array<{qId, text}>
}
```

#### 4.4 - Seed Data (8 שאלות עברית קבועות)
```typescript
// src/modules/questionnaire/data/questions.seed.ts
const DEFAULT_QUESTIONS = [
  {
    qId: 1,
    text: "היי 😊 אני מיטל מביטוח ישיר\nנעשה ראיון קצר של 2 דקות כדי להכיר אותך ולבדוק התאמה 🙌\nנתחיל?"
  },
  {
    qId: 2,
    text: "כדי שנוכל לבדוק התאמה – איזה אזור עבודה רלוונטי עבורך (פתח תקווה / יקנעם / חריש)? וגם, מתי בערך תהיה פנוי/ה להתחיל?"
  },
  // ... עוד 6 שאלות
]
```

---

### **שלב 5: מודול המועמדים** (שלבים 20-23)

#### 5.1 - Candidate Controller
```typescript
// src/modules/candidate/candidate.controller.ts
POST /api/v1/candidates - יצירת מועמד חדש
GET /api/v1/candidates/:id - קבלת פרטי מועמד
GET /api/v1/candidates - רשימת כל המועמדים (עם pagination)
PUT /api/v1/candidates/:id - עדכון פרטי מועמד
DELETE /api/v1/candidates/:id - מחיקת מועמד (ADMIN only)
```

#### 5.2 - Candidate DTO
```typescript
// src/modules/candidate/dto/create-candidate.dto.ts
{
  name: string (required, min 2, max 100)
  email: string (required, email format)
  phone: string (required, format: +972...)
}

// src/modules/candidate/dto/update-candidate.dto.ts
{
  name?: string
  email?: string
  phone?: string
}
```

#### 5.3 - Candidate Service
- CRUD operations (Create, Read, Update, Delete)
- Query builders עבור dashboard filtering
- Error handling (duplicate email, invalid format)

#### 5.4 - Candidate Repository Pattern
```typescript
// src/modules/candidate/candidate.repository.ts
- findById(id)
- findByEmail(email)
- findAll(filter, sort, pagination)
- create(data)
- update(id, data)
- delete(id)
```

---

### **שלב 6: מנוע הניקוד (ליב המערכת)** (שלבים 24-28)

#### 6.1 - Scoring Service Architecture
```typescript
// src/modules/scoring/scoring.service.ts

class ScoringService {
  // שלב 1: חילוץ נתונים טכניים
  extractTechnicalData(answers: string[]): TechnicalData
  
  // שלב 2: חילוץ תכונות (features) מהתשובות
  extractFeatures(answers: string[]): Features
  
  // שלב 3: ניקוד כל מימד
  scoreMotivation(answers, features): number
  scoreVerbalAbility(answers, features): number
  scorePeopleSkills(answers, features): number
  scoreSalesOrientation(answers, features): number
  scoreTargetOrientation(answers, features): number
  
  // שלב 4: חישוב ניסיון
  calculateExperienceLevel(answers): number
  
  // שלב 5: בחירת תפקיד
  determineRecommendedRole(scores): number
  
  // שלב 6: חישוב ניקוד סופי
  calculateFinalScore(scores): number
  
  // שלב 7: יצירת סיכום בעברית
  generateSummary(scores, role, experienceLevel): string
  
  // שלב 8: יצירת תובנות בעברית
  generateInsights(scores, answers): string[]
  
  // שלב 9: יצירת שאלות המשך בעברית
  generateRecommendedQuestions(scores, answers): string[]
  
  // שלב 10: הרכבה סופית
  score(role: string, answers: string[]): ScoringResult
}
```

#### 6.2 - Rubric Implementation (כללי ניקוד מפורטים)

**מוטיבציה (Motivation):**
- אם התשובה מציינת: "אוהב/ת", "נהנה/יה", "מוקדש/ת" → 80-100
- אם ניטרלי → 50-70
- אם לא ברור או שלילי → 0-40
- כלל: אם מדבר על "עזרה לאנשים" → +15 bonus

**יכולת עברית (Verbal Ability):**
- 3+ משפטים + דוגמה → 80-100
- 2 משפטים בלי דוגמה → 50-79
- משפט אחד בלבד → 0-49
- חוק: התשובה צריכה להיות טבעית ולא תסריט

**כישורים בין-אישיים (People Skills):**
- תיאור אינטראקציה ישירה עם אנשים → 80-100
- הזכרה של עבודה עם קהל בלי פרטים → 50-79
- בלא ניסיון מתועד → 0-49

**אוריינטציה מכירתית (Sales Orientation):**
- הזכרה: "סגירה עסקה", "התגברות על התנגדויות", "יעדים" → 80-100
- עבודה עם לקוחות ללא מכירה ישירה → 50-70
- אין → 0-40

**אוריינטציה ליעדים (Target Orientation):**
- עבד עם יעדים ודיווח על הצלחה/כישלון → 80-100
- הזכרה יעדים בלי פעולה → 50-70
- אין → 0-40

#### 6.3 - Feature Extraction (מפתח ממתן)
```typescript
interface Features {
  mentionsCustomerInteraction: boolean
  mentionsChallenge: boolean
  mentionsSalesOrObjectionHandling: boolean
  mentionsGoals: boolean
  mentionsEmotionalResponse: boolean
  answerLength: 'short' | 'medium' | 'long'
  hasDetailedExample: boolean
  languageQuality: 'poor' | 'fair' | 'good' | 'excellent'
}

// extraction logic
extractFeatures(answers): Features {
  // keyword search + NLP-lite (counting sentences, checking patterns)
  // לא צריך AI, פשוט regex + string analysis
}
```

#### 6.4 - Calibration Rules (כללי איזון)
- אם כל 5 הניקודים > 85, להוריד 5-10 נקודות מהנמוך ביותר (no inflation)
- אם ניקוד = 100, צריך להיות מנוקד מאוד (rare)
- כלל סכום: final score = avg(5 scores), לא weighted sum

#### 6.5 - Output DTO
```typescript
// src/modules/scoring/dto/scoring-result.dto.ts
interface ScoringResult {
  technical: TechnicalData
  scores: Scores
  experienceLevel: number
  finalScore: number
  recommendedRole: number
  summary: string // Hebrew
  insights: string[] // Hebrew
  recommendedQuestions: string[] // Hebrew
}
```

---

### **שלב 7: Analysis Pipeline ו-Queue** (שלבים 29-34)

#### 7.1 - Analysis Service (Orchestration)
```typescript
// src/modules/analysis/analysis.service.ts

class AnalysisService {
  async submitAnswers(candidateId, answers): Promise<job>
  
  async getAnalysisStatus(jobId): Promise<status>
  
  async runScoring(answers): ScoringResult // inline
}
```

#### 7.2 - Bull Queue Processor
```typescript
// src/modules/analysis/analysis.processor.ts

// Queue definition
@Process('analyze-candidate')
async analyzeCandidate(job: Job<AnalysisPayload>) {
  // 1. חילוץ תשובות
  // 2. הרצת ScoringService
  // 3. שמירה ב-MongoDB
  // 4. עדכון Candidate status
  return result
}

// Listeners
on('completed') → log success
on('failed') → retry (exponential backoff, 3 retries)
on('error') → log and alert
```

#### 7.3 - Answer Submission Endpoint
```typescript
// src/modules/analysis/analysis.controller.ts

POST /api/v1/candidates/:id/answers
Body: {
  role: 'sales' | 'service'
  answers: [
    { question: string, answer: string }
  ]
}

// Logic:
// 1. Validate candidate exists
// 2. Validate answer format
// 3. Create job in Bull queue
// 4. Return job ID + status
```

#### 7.4 - Job Status Tracking
```typescript
// Job stored in Redis with:
// - jobId
// - candidateId
// - status: 'pending' | 'processing' | 'completed' | 'failed'
// - result: ScoringResult (if completed)
// - error: string (if failed)
```

#### 7.5 - Error Handling & Retry Logic
- Retry על network errors: 3 retries עם exponential backoff (1s, 2s, 4s)
- Log כל כישלון + send alert
- Store failed job details ב-MongoDB עבור debugging

---

### **שלב 8: קבלת תוצאות ו-Public API** (שלבים 35-37)

#### 8.1 - Results Controller
```typescript
// src/modules/results/results.controller.ts

GET /api/v1/candidates/:id/result
- Query candidate by ID
- Return CandidateResult
- Include raw answers + scores + recommendations

Headers:
- Authorization: Bearer JWT (optional for dashboard)
- x-api-key (optional legacy)
```

#### 8.2 - Public Scoring Endpoint (No Auth)
```typescript
// src/modules/analysis/analysis.controller.ts

POST /api/v1/score
Body: {
  role: 'sales' | 'service'
  answers: [
    { question: string, answer: string }
  ]
}

Response: ScoringResult (same as stored result)

// Logic:
// 1. Validate role
// 2. Validate answers format
// 3. Run ScoringService inline (no persistence)
// 4. Return result immediately
```

#### 8.3 - Validation DTOs
```typescript
// src/modules/analysis/dto/submit-answers.dto.ts
{
  role: string (enum: 'sales', 'service')
  answers: Array<{
    question: string (min 5 chars)
    answer: string (min 1 char, max 2000)
  }>
}

// src/modules/analysis/dto/score-request.dto.ts
// Same as above
```

---

### **שלב 9: דשבורד מגייסים** (שלבים 38-40)

#### 9.1 - Dashboard Controller
```typescript
// src/modules/dashboard/dashboard.controller.ts

GET /api/v1/candidates
Query params:
  - minScore: number (0-100)
  - maxScore: number (0-100)
  - role: number (1=sales, 2=service)
  - sortBy: 'score' | 'name' | 'date' (default: score DESC)
  - limit: number (default: 20)
  - skip: number (default: 0)

Response:
{
  total: number
  data: Candidate[]
  meta: { limit, skip, total }
}

GET /api/v1/candidates/:id/result
- Return full result with scores, insights

DELETE /api/v1/candidates/:id (ADMIN only)
- Remove candidate + result
```

#### 9.2 - Filtering & Sorting Logic
```typescript
// MongoDB query builder
const query = {};

if (minScore) query.finalScore = { $gte: minScore };
if (maxScore) query.finalScore = { ...query.finalScore, $lte: maxScore };
if (role) query.recommendedRole = role;

const sort = { finalScore: -1 }; // DESC

candidates = await Candidate.find(query)
  .sort(sort)
  .limit(limit)
  .skip(skip)
  .populate('resultId')
```

#### 9.3 - Dashboard DTOs
```typescript
// src/modules/dashboard/dto/list-candidates.dto.ts
{
  minScore?: number
  maxScore?: number
  role?: number
  sortBy?: string
  limit?: number
  skip?: number
}
```

---

### **שלב 10: בדיקות ואימות** (שלבים 41-45)

#### 10.1 - Unit Tests for Scoring Engine
```typescript
// src/modules/scoring/scoring.service.spec.ts

describe('ScoringService', () => {
  test('motivation high on customer interaction + challenge', () => {})
  test('verbalAbility calibrated by answer length', () => {})
  test('salesOrientation detects objection handling', () => {})
  test('targetOrientation extracts goal language', () => {})
  test('final score is normalized 0-100', () => {})
  test('no inflation: all scores > 85 adjusted', () => {})
})
```

#### 10.2 - Integration Tests (Full Flow)
```typescript
// src/modules/analysis/analysis.integration.spec.ts

test('POST /candidates -> POST /answers -> GET /result', async () => {
  // 1. Create candidate
  const candidate = await POST /api/v1/candidates
  // 2. Submit answers
  const job = await POST /api/v1/candidates/:id/answers
  // 3. Wait for job completion
  await waitForJobCompletion(job.id)
  // 4. Fetch result
  const result = await GET /api/v1/candidates/:id/result
  // 5. Assert structure
  expect(result).toHaveProperty('scores')
  expect(result).toHaveProperty('summary')
})
```

#### 10.3 - Public API Tests
```typescript
test('POST /api/v1/score returns inline result', async () => {
  const response = await POST /api/v1/score {
    role: 'sales',
    answers: [...]
  }
  expect(response.status).toBe(200)
  expect(response.body).toHaveProperty('finalScore')
})
```

#### 10.4 - Queue Resilience Test
```typescript
test('50 concurrent submissions processed without errors', async () => {
  const jobs = await Promise.all(
    Array(50).fill(null).map(() =>
      POST /api/v1/candidates/:id/answers
    )
  )
  // Wait for all to complete
  await Promise.all(jobs.map(j => waitForCompletion(j.id)))
  // Assert no failures
  const failed = await getFailedJobs()
  expect(failed.length).toBe(0)
})
```

#### 10.5 - Hebrew Character Validation
```typescript
test('Hebrew characters rendered correctly in output', () => {
  const result = scoringService.score(answers)
  expect(result.summary).toContain('עברית') // example
  expect(Buffer.from(result.summary, 'utf8').toString('utf8'))
    .toBe(result.summary) // no encoding corruption
})
```

---

### **שלב 11: תיעוד ו-Deployment** (שלבים 46-50)

#### 11.1 - Swagger/OpenAPI Documentation
```typescript
// src/main.ts
const config = new DocumentBuilder()
  .setTitle('Candidate Scoring API')
  .setDescription('API for analyzing and scoring candidates')
  .setVersion('1.0')
  .addBearerAuth()
  .build()

const document = SwaggerModule.createDocument(app, config)
SwaggerModule.setup('api/docs', app, document)
```

#### 11.2 - Rubric Documentation
```markdown
# Rubric Guide

## Motivation (מוטיבציה)
- 80-100: "אוהב/ת", "נהנה", work satisfaction mentioned
- 50-70: Neutral tone
- 0-40: Avoid, don't like, negative

## Verbal Ability (יכולת עברית)
- 80-100: 3+ sentences + example + natural tone
- 50-79: 2 sentences, some detail
- 0-49: Single sentence or very brief

...and so on
```

#### 11.3 - Deployment Guide
```markdown
# Deployment Guide

## Prerequisites
- Node.js 18+
- MongoDB 5.0+
- Redis 6.0+

## Environment Variables
DATABASE_URL=...
REDIS_URL=...
JWT_SECRET=...

## Docker Compose
- Define services: app, mongodb, redis
- Run: docker-compose up

## Health Checks
GET /health → { status: 'ok' }

## Rate Limiting
- /api/v1/score: 100 req/min
- /api/v1/candidates: 50 req/min
```

#### 11.4 - Audit Logging
```typescript
// src/common/interceptors/audit.interceptor.ts
- Log every candidate submission
- Log scores before + after (for debug)
- Track user actions (email, timestamp, role)
- Store in audit collection in MongoDB
```

#### 11.5 - Production Checklist
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting active
- [ ] Logging to file/service
- [ ] Database backup configured
- [ ] Redis persistence enabled
- [ ] Error monitoring (Sentry/NewRelic)
- [ ] Security headers (helmet.js)
- [ ] JWT secret rotated monthly
- [ ] Test coverage > 80%

---

## מבנה תיקיות וקבצים

```
candidate-scoring-backend/
├── src/
│   ├── main.ts                              # NestJS bootstrap
│   ├── app.module.ts                        # Root module
│   │
│   ├── config/                              # הגדרות ותשתית
│   │   ├── database.config.ts               # MongoDB חיבור
│   │   ├── redis.config.ts                  # Redis חיבור
│   │   ├── jwt.config.ts                    # JWT הגדרות
│   │   ├── bull.config.ts                   # Bull queue הגדרות
│   │   └── env.validation.ts                # Env validation schema
│   │
│   ├── common/                              # עזרים גלובליים
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts           # @Roles('RECRUITER')
│   │   │   └── public.decorator.ts          # @Public()
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts     # Global error handler
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts            # JWT validation
│   │   │   └── roles.guard.ts               # RBAC enforcement
│   │   ├── middlewares/
│   │   │   ├── api-key.middleware.ts        # Legacy API key
│   │   │   └── logging.middleware.ts        # Request logging
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts       # Audit trail
│   │   │   └── transform.interceptor.ts     # Response shaping
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts           # DTO validation
│   │   ├── dto/
│   │   │   ├── error.response.dto.ts        # Error format
│   │   │   └── pagination.dto.ts            # Pagination params
│   │   └── interfaces/
│   │       ├── user.interface.ts            # User type
│   │       ├── jwt-payload.interface.ts     # JWT content
│   │       └── scoring-result.interface.ts  # Scoring output
│   │
│   └── modules/
│       ├── auth/                            # Authentication
│       │   ├── auth.controller.ts           # POST /register, /login, /refresh
│       │   ├── auth.service.ts              # User logic, JWT generation
│       │   ├── strategies/
│       │   │   └── jwt.strategy.ts          # Passport JWT
│       │   ├── user.schema.ts               # MongoDB user schema
│       │   ├── user.repository.ts           # User queries
│       │   ├── auth.module.ts
│       │   └── dto/
│       │       ├── register.dto.ts
│       │       ├── login.dto.ts
│       │       └── auth-response.dto.ts
│       │
│       ├── candidate/                       # ניהול מועמדים
│       │   ├── candidate.controller.ts      # POST /candidates, GET /candidates/:id
│       │   ├── candidate.service.ts         # CRUD + queries
│       │   ├── candidate.schema.ts          # MongoDB schema
│       │   ├── candidate.repository.ts      # Data access
│       │   ├── candidate.module.ts
│       │   └── dto/
│       │       ├── create-candidate.dto.ts
│       │       ├── update-candidate.dto.ts
│       │       └── candidate-response.dto.ts
│       │
│       ├── questionnaire/                   # שאלון קבוע
│       │   ├── questionnaire.controller.ts  # GET /questionnaires
│       │   ├── questionnaire.service.ts     # Load questions
│       │   ├── questionnaire.schema.ts      # MongoDB schema
│       │   ├── questionnaire.module.ts
│       │   ├── data/
│       │   │   └── questions.seed.ts        # 8 שאלות בעברית
│       │   └── dto/
│       │       └── questionnaire.response.dto.ts
│       │
│       ├── scoring/                         # ❤️ מנוע הניקוד
│       │   ├── scoring.service.ts           # Core rubric logic
│       │   ├── rubrics/
│       │   │   ├── motivation.rubric.ts     # חוקי מוטיבציה
│       │   │   ├── verbal-ability.rubric.ts # חוקי וורבליות
│       │   │   ├── people-skills.rubric.ts  # כישורים בין-אישיים
│       │   │   ├── sales-orientation.rubric.ts
│       │   │   └── target-orientation.rubric.ts
│       │   ├── feature-extractor.ts         # NLP-lite
│       │   ├── scoring.module.ts
│       │   └── dto/
│       │       ├── scoring-request.dto.ts
│       │       └── scoring-result.dto.ts
│       │
│       ├── analysis/                        # ניתוח ו-Queue
│       │   ├── analysis.controller.ts       # POST /answers, POST /score
│       │   ├── analysis.service.ts          # Orchestration
│       │   ├── analysis.processor.ts        # Bull job processor
│       │   ├── analysis.module.ts
│       │   └── dto/
│       │       ├── submit-answers.dto.ts
│       │       ├── score-request.dto.ts
│       │       └── analysis-response.dto.ts
│       │
│       ├── results/                         # שמירה וקבלת תוצאות
│       │   ├── results.controller.ts        # GET /candidates/:id/result
│       │   ├── results.service.ts           # Result queries
│       │   ├── result.schema.ts             # MongoDB schema
│       │   ├── results.module.ts
│       │   └── dto/
│       │       └── result-response.dto.ts
│       │
│       └── dashboard/                       # דשבורד מגייסים
│           ├── dashboard.controller.ts      # GET /candidates (filters)
│           ├── dashboard.service.ts         # Complex queries
│           ├── dashboard.module.ts
│           └── dto/
│               └── list-candidates-query.dto.ts
│
├── test/                                    # בדיקות
│   ├── scoring.service.spec.ts              # יחידה טסטים
│   ├── analysis.integration.spec.ts         # אינטגרציה
│   └── e2e/
│       └── candidates.e2e.spec.ts
│
├── docs/                                    # תיעוד
│   ├── RUBRICS.md                           # כללי ניקוד
│   ├── DEPLOYMENT.md                        # הוראות פריסה
│   ├── API_REFERENCE.md                     # API endpoints
│   └── SCORING_LOGIC.md                     # ניתוח מנוע הניקוד
│
├── docker-compose.yml                       # Docker composition
├── .env.example                             # Template env
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## החלטות אדריכליות

| החלטה | בחירה | נימוק |
|--------|-------|--------|
| **שאלון** | קבוע (8 שאלות בעברית) | עקביות בכל המועמדים; קל להוסיף dynamic בעתיד |
| **ניקוד** | Rule-based (לא AI) | דטרמיניסטי, מהיר, לא תלוי API; ארכיטקטורה פתוחה ל-LLM |
| **Queue** | Redis + Bull | Scalable, reliable, built-in retry + monitoring |
| **Auth** | JWT + RBAC | Production-grade; תמיכה בתפקידים מרובים |
| **Database** | MongoDB + Mongoose | Flexible schema; TTL indexes לנתונים ישנים |
| **Language** | עברית לחלוטין | כל outputs בעברית: summary, insights, questions |
| **Public API** | ללא auth (`/api/v1/score`) | זמינות למערכות חיצוניות |
| **Persistence** | Candidates + Results | ניתוח לדשבורד + audit trail |

---

## API Endpoints (Summary)

### Auth (ללא RBAC)
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
```

### Candidates (RECRUITER)
```
POST /api/v1/candidates
GET /api/v1/candidates
GET /api/v1/candidates/:id
PUT /api/v1/candidates/:id
DELETE /api/v1/candidates/:id (ADMIN)
```

### Questionnaire (No Auth)
```
GET /api/v1/questionnaires
GET /api/v1/questionnaires/default
```

### Answers & Analysis (No Auth / or RECRUITER)
```
POST /api/v1/candidates/:id/answers → enqueue job
GET /api/v1/analysis/jobs/:jobId → status
```

### Scoring (Public, No Auth) 🌟
```
POST /api/v1/score
```

### Results (RECRUITER)
```
GET /api/v1/candidates/:id/result
```

### Dashboard (RECRUITER)
```
GET /api/v1/dashboard/candidates?minScore=80&maxScore=100&role=1&sortBy=score
GET /api/v1/dashboard/candidates/:id
```

---

## Scoring Dimensions - פרטים מפורטים

### 1️⃣ מוטיבציה (Motivation) [0-100]

**תנאי ניקוד גבוה (80-100):**
- משתמש בכלים כמו: "אוהב/ת", "נהנה/יה", "אחמד לעזור"
- ציין סיפור על עבודה עם אנשים בחיוביות
- ביטוי ברור של רצון להשתפר

**תנאי ניקוד בינוני (50-70):**
- ניטרלי או כללי
- אמירה פחות ברורה

**תנאי ניקוד נמוך (0-40):**
- שלילי, "לא אוהב/ת", "לא נהניתי"
- התחמקות מתשובה

### 2️⃣ יכולת עברית (Verbal Ability) [0-100]

**תנאי ניקוד גבוה (80-100):**
- 3+ משפטים בעברית טבעית
- דוגמה קונקרטית מחיי העבודה
- מבנה משפט ברור

**תנאי ניקוד בינוני (50-79):**
- 2 משפטים בלבד
- כמה פרטים

**תנאי ניקוד נמוך (0-49):**
- משפט אחד בלבד
- תשובה קצרה מדי

**💡 כלל:** אם התשובה היא סדרת אותיות/צורים (ג, ל, ב) → אוטומטית 0

### 3️⃣ כישורים בין-אישיים (People Skills) [0-100]

**תנאי ניקוד גבוה:**
- תיאור אינטראקציה ישירה עם אנשים
- הוכחה של יכולת להקשיב וזיהום הצורך
- דוגמה על התמודדות עם סיטואציה קשה

**תנאי ניקוד בינוני:**
- הזכרה של עבודה עם קהל ללא פרטים

**תנאי ניקוד נמוך:**
- לא ברור ניסיון או אין

### 4️⃣ אוריינטציה מכירתית (Sales Orientation) [0-100]

**תנאי ניקוד גבוה (80-100):**
- הזכרת: "סגירת עסקה", "שכנוע", "התגברות על התנגדויות"
- אוטומטי +10 אם "יעדים" + "הצלחה"

**תנאי ניקוד בינוני (50-70):**
- עבודה עם לקוחות ללא מכירה ישירה

**תנאי ניקוד נמוך (0-40):**
- אין

### 5️⃣ אוריינטציה ליעדים (Target Orientation) [0-100]

**תנאי ניקוד גבוה (80-100):**
- "עבדתי עם יעדים + עמדתי בהם / לא עמדתי והתאמצתי"

**תנאי ניקוד בינוני (50-70):**
- הזכרה יעדים בלי פעולה

**תנאי ניקוד נמוך (0-40):**
- אין

---

## כללי Calibration (איזון ניקודים)

1. **אין inflation:** אם כל 5 הניקודים > 85, להוריד 5-10 נקודות מהנמוך ביותר
2. **ניקוד 100 נדיר:** רק אם התשובה מצוינת במיוחד
3. **סדר ניקודים:** יש צורך בגיוון (לא כל הניקודים סביב 75)
4. **Final Score = Average(5 scores):** לא weighted, תמיד אחוד דרך חישוב

---

## דוגמה עיבוד מועמד

**Input:**
```json
{
  "role": "sales",
  "answers": [
    {
      "question": "ספר לי על עבודה עם אנשים",
      "answer": "עבדתי בקול טלפוני למשך 3 שנים ועזרתי ללקוחות לפתור בעיות"
    },
    ...
  ]
}
```

**Processing:**
1. Extract features: mention "years", "customers", "solve" → peopleSkills high
2. No "sales" keyword → salesOrientation low
3. "helped" mentioned → motivation high
4. Answer length: ~20 words → verbal ability medium
5. No goals mentioned → targetOrientation low

**Output:**
```json
{
  "technical": {
    "location": 0,
    "availability": 0,
    "hasRelativeInCompany": 0
  },
  "scores": {
    "motivation": 75,
    "verbalAbility": 60,
    "peopleSkills": 80,
    "salesOrientation": 35,
    "targetOrientation": 40
  },
  "experienceLevel": 2,
  "finalScore": 58,
  "recommendedRole": 2,
  "summary": "מועמד/ת עם ניסיון בשירות לקוחות, בעל/ת יכולות תקשוריות בינוניות וחוזקה בהבנת צרכים.",
  "insights": [
    "ניסיון בעבודה מול קהל",
    "כישורים שירותיים גבוהים",
    "צורך בשיפור יכולות מכירתיות"
  ],
  "recommendedQuestions": [
    "יצא לך לעבוד על קלוזינג או סגירת עסקה?",
    "מה יעזור לך להשתפר בשכנוע?"
  ],
  "rawAnswers": {
    "q1": "...",
    "q2": "..."
  }
}
```

---

## Relevant Files

### Project Structure
```
src/
├── main.ts                           # NestJS bootstrap
├── app.module.ts                     # Root module
├── config/
│   ├── database.config.ts            # MongoDB connection
│   ├── redis.config.ts               # Redis connection
│   ├── jwt.config.ts                 # JWT strategy
│   └── env.validation.ts             # Env variable schema
├── common/
│   ├── dto/                          # Global DTOs
│   ├── guards/                       # RBAC, JWT guards
│   ├── middlewares/                  # API key, logging
│   ├── interfaces/                   # TypeScript interfaces
│   ├── filters/                      # Exception filters
│   └── decorators/                   # Custom decorators (@Roles, etc)
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── auth.module.ts
│   │   └── dto/
│   ├── candidate/
│   │   ├── candidate.controller.ts
│   │   ├── candidate.service.ts
│   │   ├── candidate.schema.ts       # Mongoose schema
│   │   ├── candidate.module.ts
│   │   └── dto/
│   ├── questionnaire/
│   │   ├── questionnaire.controller.ts
│   │   ├── questionnaire.service.ts
│   │   ├── questionnaire.schema.ts
│   │   ├── questionnaire.module.ts
│   │   ├── dto/
│   │   └── data/questionnaire.seed.ts # Fixed Hebrew questions
│   ├── scoring/
│   │   ├── scoring.service.ts        # Core rubric logic
│   │   ├── scoring.module.ts
│   │   ├── dto/
│   │   └── interfaces/
│   ├── analysis/
│   │   ├── analysis.controller.ts    # Answer submission, public /score
│   │   ├── analysis.service.ts       # Orchestration
│   │   ├── analysis.processor.ts     # Bull queue processor
│   │   ├── analysis.module.ts
│   │   └── dto/
│   ├── results/
│   │   ├── results.controller.ts     # Retrieve results
│   │   ├── results.service.ts
│   │   ├── result.schema.ts
│   │   ├── results.module.ts
│   │   └── dto/
│   └── dashboard/
│       ├── dashboard.controller.ts   # Recruiter endpoints
│       ├── dashboard.service.ts
│       ├── dashboard.module.ts
│       └── dto/
└── seed/                             # Database seeding
    └── seed.service.ts
```

---

## Critical Implementation Details

### Scoring Engine (`scoring.service.ts`)
- Implement **feature extractor** to map answer text → scoring dimensions
- Use **keyword matching** + **sentence analysis** for feature extraction
- Implement **rubric lookup tables** (motivation levels, verbalAbility tiers, etc.)
- Add **calibration rules** to prevent score inflation
- Return structured `ScoringResult` type with all fields

### Result Schema (`result.schema.ts`)
```typescript
{
  candidateId: string (reference to Candidate)
  Id: string (unique identifier)
  timestamp: Date
  technical: { location, availability, hasRelativeInCompany }
  scores: { motivation, verbalAbility, peopleSkills, salesOrientation, targetOrientation }
  experienceLevel: number (0–3)
  finalScore: number (0–100, computed from scores)
  recommendedRole: number (1=sales, 2=service)
  summary: string (Hebrew)
  insights: string[] (Hebrew, 2–4 items)
  recommendedQuestions: string[] (Hebrew, 2–3 items)
  rawAnswers: { q1, q2, q3, q4, q5, q6 } (store original text)
}
```

### Queue Implementation
- Bull queue with job retry logic (3 retries, exponential backoff)
- Store job results in MongoDB
- Add job event listeners for monitoring
- Implement graceful shutdown (drain queue before exit)

### Authentication
- JWT stored in HTTP-only cookies
- RBAC decorators for endpoints: `@Roles(RoleEnum.RECRUITER)`
- API key validation as middleware (deprecated but supported)
- User model includes `email`, `password`, `role`, `createdAt`

---

## Verification Steps

1. **Unit tests for scoring engine**: Test all 5 scoring dimensions with mock answers, verify calibration rules
2. **Integration test: Full candidate flow**: POST /candidates → POST /answers → GET /result, assert result structure
3. **Integration test: Public /score endpoint**: POST /score with inline scoring, validate output
4. **Integration test: Dashboard filters**: GET /candidates?score=80-90&role=1, verify filtering works
5. **Queue health**: Submit 50 candidates concurrently, verify all processed without errors
6. **Hebrew handling**: Verify summary/insights/recommendations render correctly (no encoding issues)
7. **Auth tests**: Verify JWT expiry, role enforcement, API key deprecation path
8. **Load test**: Simulate 100 concurrent /score requests, measure response time
9. **Error cases**: Test invalid email, missing fields, malformed answers
10. **Performance**: Verify query response times < 200ms with 10K candidates in DB

---

## Decisions & Scope

✅ **Included:**
- JWT + RBAC (Recruiter/Admin roles)
- Redis + Bull for async analysis
- Fixed Hebrew questionnaire (8 questions, non-editable)
- Full scoring output with technical/scores/insights
- Public /score API
- Recruiter dashboard with filters/sorting
- Mongoose best practices (schema validation, indexing)
- Error handling + logging infrastructure

❌ **Explicitly Excluded:**
- Email notifications (can be added later)
- AI/LLM integration (rule-based only, architecture ready for hooks)
- Candidate login (recruiter system only)
- Candidate communication (outside scope)
- File uploads (not required)
- Analytics dashboard (beyond MVP)

---

## Dependencies & Versions

- `@nestjs/core@10.x` + `@nestjs/common`
- `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`
- `@nestjs/mongoose@10.x`, `mongoose@7.x`
- `@nestjs/bull@10.x`, `bull@4.x`, `redis@4.x`
- `class-validator@0.14.x`, `class-transformer@0.5.x`
- `dotenv@16.x`
- `winston` for logging (optional, NestJS logger sufficient for MVP)

---

## עיתוי וסדר תלויות

### זמן משוער להשלמה

| שלב | משך זמן | הערות |
|-----|---------|--------|
| שלב 1-2 (Setup + Auth) | 2-3 שעות | סדרתי, חשוב להקים ראשוני |
| שלב 3-5 (DB + Modules) | 3-4 שעות | סדרתי, בלוקר לשלבים הבאים |
| שלב 6 (Scoring Engine) | 4-6 שעות | **זה הליב**, דורש care וbuild up |
| שלב 7-9 (Queue + API) | 3-4 שעות | יכול להיות במקביל לשלב 6 |
| שלב 10 (Testing) | 4-5 שעות | חשוב, רץ במקביל עם Development |
| שלב 11 (Docs + Deploy) | 2-3 שעות | סוף |

**סה"כ משוער: 20-30 שעות** עבודה סדרתית מובחנת

---

## Dependencies וספריות

### Core Dependencies

```json
{
  "@nestjs/common": "^10.3.0",
  "@nestjs/core": "^10.3.0",
  "@nestjs/jwt": "^11.0.0",
  "@nestjs/mongoose": "^10.0.0",
  "@nestjs/passport": "^10.0.0",
  "@nestjs/bull": "^10.0.0",
  "@nestjs/swagger": "^7.1.0",
  
  "mongoose": "^7.5.0",
  "passport-jwt": "^4.0.1",
  "bull": "^4.11.0",
  "redis": "^4.6.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1",
  "bcrypt": "^5.1.0",
  "dotenv": "^16.3.0"
}
```

---

## Test Scenarios

### Test 1: Scoring Engine - Motivation
```typescript
// Input: Answer with "אוהב/ת", "נהנה" → expect 80+
// Input: Answer neutral → expect 50-70
// Input: Answer with negative language → expect 0-40
```

### Test 2: Full Flow
```
1. POST /candidates → candidateId
2. POST /candidates/:id/answers → jobId
3. Wait for queue processing
4. GET /candidates/:id/result → assert scores
```

### Test 3: Public Scoring
```
POST /api/v1/score → immediate response
assert response structure === stored result structure
```

### Test 4: Dashboard Filtering
```
GET /candidates?minScore=80&maxScore=100&role=1
expect results filtered correctly
```

---

## Error Handling Strategy

| Scenario | HTTP | Response |
|----------|------|----------|
| Invalid email | 400 | `{ error: "אימייל לא תקין" }` |
| Not found | 404 | `{ error: "לא נמצא" }` |
| Job failed | 500 | `{ error: "שגיאה בעיבוד" }` |
| Unauthorized | 401 | `{ error: "אימות דרוש" }` |
| Forbidden | 403 | `{ error: "הרשאה לא מספיקה" }` |

---

## Production Checklist

- [ ] MongoDB backup configured
- [ ] Redis persistence enabled
- [ ] HTTPS/TLS enabled
- [ ] Rate limiting active
- [ ] JWT secret in secret manager
- [ ] Error monitoring (Sentry) configured
- [ ] Logging enabled
- [ ] Health check: `GET /health`
- [ ] Graceful shutdown configured
- [ ] Database indexes created
- [ ] Security headers (helmet.js)
- [ ] OWASP compliance checked

---

## תוכנית ביצוע מומלצת

### Week 1 - Foundation
- שלב 1-2: Setup + Auth (6-8 שעות)
- שלב 3: DB schemas (4-5 שעות)

### Week 2 - Core Logic
- שלב 4-5: Questionnaire + Candidate (5-7 שעות)
- שלב 6: Scoring Engine (8-10 שעות)

### Week 3 - Integration
- שלב 7-9: Queue + Results + Dashboard (8-10 שעות)
- שלב 10: Testing (6-8 שעות)

### Week 4 - Deploy
- שלב 11: Docs + Deployment (4-6 שעות)
- QA + Bugs (4-6 שעות)

**סה"כ: 4 שבועות**

---

## היקף מוגדר

✅ **Included:**
- Hebrew questionnaire (8 questions)
- Rule-based scoring (5 dimensions)
- MongoDB + Mongoose
- Redis + Bull async
- JWT + RBAC
- Public /score endpoint
- Recruiter dashboard
- Error handling
- Tests
- Docker support

❌ **Out of scope:**
- Email notifications
- Candidate portal
- LLM integration (just architecture)
- Payment
- Webhooks

---

## 🎯 המערכת מוכנה ליישום

**הפרויקט מוגדר, ממוגדר ומפורט לחלוטין בעברית.**

ניתן להתחיל עם שלב 1 מייד.

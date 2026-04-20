# 📋 PLAN PERSON B - Intelligent Systems Engineer

## 👤 תפקיד: Intelligent Systems & Processing Engineer
**אחראי על:** Scoring Logic, Audio Analysis, Queue Processing  
**טכנולוגיה:** NestJS, Redis, Bull, OpenAI Whisper, NLP  
**זמן משוער:** 16-20 שעות  
**שפה:** עברית לחלוטין  

---

## 📍 נקודת התחלה

✅ **שלבים שהושלמו:**
- שלב 1: Setup + Config + Environment ✓
- שלב 2: Auth Module + JWT + User Schema ✓

✅ **מה Person A עושה בזמן זה:**
- שלב 3-5: Building Schemas + Candidate Module
- צפוי להיות מוכן ב- 2-3 ימים

⏳ **משימתך:**
- שלב 6: Scoring Engine (Core Logic) - **ניתן להתחיל מיד**
- שלב 6A: Audio Analysis Module
- שלב 7: Analysis + Bull Queue
- שלב 8: Results Retrieval + Public /score API
- שלב 10b: Unit Tests

---

## 🚀 שלב 6: Scoring Engine - ❤️ הליב

### זמן משוער: 6-8 שעות

זה השלב החשוב ביותר! כל הגיון הניקוד כאן.

---

### 6.1 - Create Shared Types (Temporary - until Person A finishes)

**📂 קובץ:** `src/shared/types.ts`

בינתיים, צור skeleton שלך:

```typescript
// Types that Person B defines and Person A will import

export interface TechnicalData {
  location: number; // 0-3
  availability: number; // 0-1
  hasRelativeInCompany: number; // 0-1
}

export interface Scores {
  motivation: number; // 0-100
  verbalAbility: number; // 0-100
  peopleSkills: number; // 0-100
  salesOrientation: number; // 0-100
  targetOrientation: number; // 0-100
}

export interface ScoringOutput {
  technical: TechnicalData;
  scores: Scores;
  finalScore: number; // 0-100
  experienceLevel: number; // 0-3
  recommendedRole: number; // 1=sales, 2=service
  summary: string; // Hebrew
  insights: string[]; // Hebrew, 2-4 items
  recommendedQuestions: string[]; // Hebrew, 2-3 items
}

// Answer format
export interface SubmittedAnswer {
  questionId: number;
  text: string;
  audioBuffer?: Buffer; // optional for audio
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/shared/types.ts`?

---

### 6.2 - Feature Extractor

**📂 קובץ:** `src/modules/scoring/feature-extractor.ts`

צור תיקיה: `src/modules/scoring/`

זה ה-engine שחוצה טקסט ומוצא תבניות:

```typescript
export class FeatureExtractor {
  /**
   * Extract features from an array of answers
   * Returns a data structure that feeds into scoring rubrics
   */
  static extractFeatures(answers: string[]) {
    const features = {
      answerLengths: answers.map((a) => a.split(' ').length),
      answerQualities: answers.map((a) => this.analyzeAnswerQuality(a)),
      mentionsWork: this.countMentions(answers, ['עבודה', 'עובד', 'מקום עבודה', 'תפקיד']),
      mentionsPeople: this.countMentions(answers, ['אנשים', 'לקוחות', 'אנשים', 'קהל']),
      mentionsChallenges: this.countMentions(answers, ['אתגר', 'קשה', 'מאתגר', 'קשים', 'קשה']),
      mentionsSuccess: this.countMentions(answers, ['הצלחה', 'הצליח', 'התנצלתי', 'היצליח']),
      mentionsSales: this.countMentions(answers, [
        'מכירה',
        'סגירה',
        'שכנוע',
        'התנגדות',
        'התגברות',
        'עסקה',
      ]),
      mentionsGoals: this.countMentions(answers, ['יעד', 'יעדים', 'עמדתי', 'עמדות', 'הצליח']),
      mentionsEmotions: this.countMentions(answers, ['אוהב', 'אהבתי', 'נהנה', 'אחמד', 'שנאתי']),
      negativeSentiments: this.countMentions(answers, ['לא אוהב', 'שנאתי', 'לא נהנה', 'קשה']),
      hasExamples: answers.filter((a) => this.hasExample(a)).length,
      hasDetailedStory: answers.filter((a) => this.hasDetailedStory(a)).length,
    };

    return features;
  }

  private static analyzeAnswerQuality(answer: string): 'short' | 'medium' | 'long' {
    const wordCount = answer.split(' ').length;
    if (wordCount < 15) return 'short';
    if (wordCount < 50) return 'medium';
    return 'long';
  }

  private static countMentions(answers: string[], keywords: string[]): number {
    let count = 0;
    for (const answer of answers) {
      for (const keyword of keywords) {
        if (answer.includes(keyword)) count++;
      }
    }
    return count;
  }

  private static hasExample(answer: string): boolean {
    const exampleMarkers = ['דוגמה', 'מקרה', 'פעם אחת', 'פעם', 'סיפור', 'למשל'];
    return exampleMarkers.some((marker) => answer.includes(marker));
  }

  private static hasDetailedStory(answer: string): boolean {
    const wordCount = answer.split(' ').length;
    const hasTimeline = answer.includes('אחר כך') || answer.includes('בהמשך');
    return wordCount > 40 && hasTimeline;
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/scoring/feature-extractor.ts`?

---

### 6.3 - Motivation Rubric

**📂 קובץ:** `src/modules/scoring/rubrics/motivation.rubric.ts`

צור תיקיה: `src/modules/scoring/rubrics/`

```typescript
export class MotivationRubric {
  /**
   * ניקוד מוטיבציה [0-100]
   *
   * 80-100: "אוהב/ת", "נהנה/יה", "אחמד/ת לעזור"
   * 50-70: Neutral tone
   * 0-40: Negative, "לא אוהב/ת", התחמקות
   */
  static score(answers: string[], features: any): number {
    let score = 50; // baseline

    // Positive emotions mentioned
    if (features.mentionsEmotions > 0) {
      score += 20;
    }

    // Mentions helping/assisting
    const helpKeywords = ['עזור', 'סייעתי', 'עזרתי', 'אחמד', 'שמח'];
    const mentionsHelp = answers.some((a) => helpKeywords.some((k) => a.includes(k)));
    if (mentionsHelp) {
      score += 15;
    }

    // Negative sentiments
    if (features.negativeSentiments > 0) {
      score -= 30;
    }

    // Answer quality
    const avgQuality = features.answerQualities.filter((q) => q === 'medium' || q === 'long')
      .length;
    if (avgQuality >= 3) {
      score += 10;
    }

    // Calibration
    if (score > 100) score = 100;
    if (score < 0) score = 0;

    return Math.round(score);
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/scoring/rubrics/motivation.rubric.ts`?

---

### 6.4 - Verbal Ability Rubric

**📂 קובץ:** `src/modules/scoring/rubrics/verbal-ability.rubric.ts`

```typescript
export class VerbalAbilityRubric {
  /**
   * ניקוד יכולת עברית [0-100]
   *
   * 80-100: 3+ sentences + example + natural
   * 50-79: 2 sentences + some detail
   * 0-49: Short / single sentence
   */
  static score(answers: string[], features: any): number {
    let score = 50; // baseline

    // Length analysis
    const avgLength = features.answerLengths.reduce((a: number, b: number) => a + b, 0) /
      features.answerLengths.length || 0;

    if (avgLength > 50) {
      score += 25;
    } else if (avgLength > 30) {
      score += 15;
    } else if (avgLength < 10) {
      score -= 30;
    }

    // Quality assessment
    const longAnswers = features.answerQualities.filter((q) => q === 'long').length;
    const mediumAnswers = features.answerQualities.filter((q) => q === 'medium').length;

    if (longAnswers >= 3) {
      score += 20;
    } else if (mediumAnswers >= 4) {
      score += 10;
    }

    // Examples mentioned
    if (features.hasExamples > 2) {
      score += 15;
    }

    // Calibration
    if (score > 100) score = 100;
    if (score < 0) score = 0;

    return Math.round(score);
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/scoring/rubrics/verbal-ability.rubric.ts`?

---

### 6.5 - People Skills Rubric

**📂 קובץ:** `src/modules/scoring/rubrics/people-skills.rubric.ts`

```typescript
export class PeopleSkillsRubric {
  /**
   * ניקוד כישורים בין-אישיים [0-100]
   *
   * 80-100: Direct interaction + challenge handling
   * 50-79: Works with people, no specifics
   * 0-40: No evidence
   */
  static score(answers: string[], features: any): number {
    let score = 50; // baseline

    // Direct work with people
    if (features.mentionsPeople > 0) {
      score += 20;
    }

    // Mentions challenges
    if (features.mentionsChallenges > 0) {
      score += 15;
    }

    // Mentions success with people
    if (features.mentionsSuccess > 1) {
      score += 15;
    }

    // Has detailed stories
    if (features.hasDetailedStory > 0) {
      score += 10;
    }

    // Calibration
    if (score > 100) score = 100;
    if (score < 0) score = 0;

    return Math.round(score);
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/scoring/rubrics/people-skills.rubric.ts`?

---

### 6.6 - Sales Orientation Rubric

**📂 קובץ:** `src/modules/scoring/rubrics/sales-orientation.rubric.ts`

```typescript
export class SalesOrientationRubric {
  /**
   * ניקוד אוריינטציה מכירתית [0-100]
   *
   * 80-100: "סגירה", "שכנוע", "התגברות על התנגדויות"
   * 50-70: Customers without direct sales
   * 0-40: No mention
   */
  static score(answers: string[], features: any): number {
    let score = 50; // baseline

    // Direct sales mentions
    if (features.mentionsSales > 0) {
      score += 25;
    }

    // Success with dealing objections
    const objectionHandling = answers.some((a) =>
      a.includes('התנגדות') && (a.includes('התגברתי') || a.includes('הצליח')),
    );
    if (objectionHandling) {
      score += 20;
    }

    // Goal achievement (proxy for sales focus)
    if (features.mentionsGoals > 1) {
      score += 10;
    }

    // Calibration
    if (score > 100) score = 100;
    if (score < 0) score = 0;

    return Math.round(score);
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/scoring/rubrics/sales-orientation.rubric.ts`?

---

### 6.7 - Target Orientation Rubric

**📂 קובץ:** `src/modules/scoring/rubrics/target-orientation.rubric.ts`

```typescript
export class TargetOrientationRubric {
  /**
   * ניקוד אוריינטציה ליעדים [0-100]
   *
   * 80-100: "עבדתי עם יעדים" + "עמדתי" / "לא עמדתי והתאמצתי"
   * 50-70: Mention goals without action
   * 0-40: No mention
   */
  static score(answers: string[], features: any): number {
    let score = 50; // baseline

    // Mentions goals
    if (features.mentionsGoals > 0) {
      score += 15;
    }

    // Success with goals
    const goalSuccess = answers.some((a) =>
      (a.includes('יעד') || a.includes('יעדים')) && (a.includes('הצליח') || a.includes('עמדתי')),
    );
    if (goalSuccess) {
      score += 25;
    }

    // Recovery from failure
    const recoveryMentioned = answers.some((a) =>
      a.includes('לא עמדתי') && (a.includes('התאמצתי') || a.includes('ניסיתי שוב')),
    );
    if (recoveryMentioned) {
      score += 20;
    }

    // Calibration
    if (score > 100) score = 100;
    if (score < 0) score = 0;

    return Math.round(score);
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/scoring/rubrics/target-orientation.rubric.ts`?

---

### 6.8 - Scoring Service

**📂 קובץ:** `src/modules/scoring/scoring.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { FeatureExtractor } from './feature-extractor';
import { MotivationRubric } from './rubrics/motivation.rubric';
import { VerbalAbilityRubric } from './rubrics/verbal-ability.rubric';
import { PeopleSkillsRubric } from './rubrics/people-skills.rubric';
import { SalesOrientationRubric } from './rubrics/sales-orientation.rubric';
import { TargetOrientationRubric } from './rubrics/target-orientation.rubric';
import { ScoringOutput, TechnicalData } from '../../shared/types';

@Injectable()
export class ScoringService {
  /**
   * Main scoring method
   * Accepts role + answers → returns full scoring output
   */
  score(role: string, answers: string[]): ScoringOutput {
    // 1. Extract features from answers
    const features = FeatureExtractor.extractFeatures(answers);

    // 2. Score each dimension
    const motivationScore = MotivationRubric.score(answers, features);
    const verbalAbilityScore = VerbalAbilityRubric.score(answers, features);
    const peopleSkillsScore = PeopleSkillsRubric.score(answers, features);
    const salesOrientationScore = SalesOrientationRubric.score(answers, features);
    const targetOrientationScore = TargetOrientationRubric.score(answers, features);

    // 3. Apply calibration (prevent inflation)
    const scores = this.calibrateScores({
      motivation: motivationScore,
      verbalAbility: verbalAbilityScore,
      peopleSkills: peopleSkillsScore,
      salesOrientation: salesOrientationScore,
      targetOrientation: targetOrientationScore,
    });

    // 4. Calculate final score
    const finalScore = Math.round(
      (scores.motivation +
        scores.verbalAbility +
        scores.peopleSkills +
        scores.salesOrientation +
        scores.targetOrientation) /
        5,
    );

    // 5. Determine experience level
    const experienceLevel = this.calculateExperienceLevel(answers, features);

    // 6. Determine recommended role
    const recommendedRole = this.determineRole(scores, role);

    // 7. Generate text outputs (Hebrew)
    const summary = this.generateSummary(scores, recommendedRole, experienceLevel);
    const insights = this.generateInsights(scores, answers);
    const recommendedQuestions = this.generateRecommendedQuestions(scores, answers);

    // 8. Extract technical data (will be enriched by audio data later)
    const technical: TechnicalData = {
      location: 0,
      availability: 0,
      hasRelativeInCompany: 0,
    };

    return {
      technical,
      scores,
      finalScore,
      experienceLevel,
      recommendedRole,
      summary,
      insights,
      recommendedQuestions,
    };
  }

  private calibrateScores(scores: any) {
    const values = Object.values(scores) as number[];
    const max = Math.max(...values);

    // If all scores > 85, reduce the lowest
    if (max > 85 && values.every((v) => v > 85)) {
      const minKey = Object.keys(scores).reduce((a, b) =>
        scores[a] < scores[b] ? a : b,
      );
      scores[minKey] = Math.max(0, scores[minKey] - 10);
    }

    return scores;
  }

  private calculateExperienceLevel(answers: string[], features: any): number {
    const workMentions = features.mentionsWork;

    if (workMentions < 1) return 0;
    if (workMentions < 2) return 1;
    if (workMentions < 3) return 2;
    return 3;
  }

  private determineRole(scores: any, suggestedRole: string): number {
    const { salesOrientation, targetOrientation } = scores;

    // If sales score is high + target high = sales
    if (salesOrientation > 70 && targetOrientation > 70) {
      return 1; // sales
    }

    // Otherwise service
    return 2;
  }

  private generateSummary(scores: any, role: number, experience: number): string {
    const roleText = role === 1 ? 'מכירתי' : 'שירותי';
    const experienceText =
      experience === 0
        ? 'ללא ניסיון'
        : experience === 1
          ? 'ניסיון מועט'
          : experience === 2
            ? 'ניסיון רלוונטי'
            : 'ניסיון חזק';

    const topScore = Math.max(...Object.values(scores));
    const strength =
      topScore > 85
        ? 'חוזק משמעותי'
        : topScore > 70
          ? 'חוזקות טובות'
          : 'תחומים להשתפרות';

    return `מועמד/ת ${roleText} עם ${experienceText} ו${strength} בכישורים בין-אישיים.`;
  }

  private generateInsights(scores: any, answers: string[]): string[] {
    const insights: string[] = [];

    if (scores.motivation > 80) {
      insights.push('מוטיבציה גבוהה ורצון אמיתי להצליח');
    }

    if (scores.verbalAbility > 75) {
      insights.push('תקשורת ברורה ותשובות מפורטות');
    }

    if (scores.peopleSkills > 80) {
      insights.push('כישורים בין-אישיים חזקים');
    }

    if (scores.salesOrientation > 75) {
      insights.push('אוריינטציה מכירתית ברורה');
    }

    if (scores.targetOrientation > 75) {
      insights.push('עמידה ביעדים וממצאים טובים');
    }

    return insights.slice(0, 4);
  }

  private generateRecommendedQuestions(scores: any, answers: string[]): string[] {
    const questions: string[] = [];

    if (scores.salesOrientation < 60) {
      questions.push('איך אתה מתמודד עם מכירה וסגירת עסקאות?');
    }

    if (scores.targetOrientation < 60) {
      questions.push('ספר לי על יעד שהשגת והאתגרים שעמדת מולם');
    }

    if (scores.verbalAbility < 70) {
      questions.push('בואו נדוברר בהרחבה על הניסיון שלך');
    }

    return questions.slice(0, 3);
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/scoring/scoring.service.ts`?

---

### 6.9 - Scoring Module

**📂 קובץ:** `src/modules/scoring/scoring.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';

@Module({
  providers: [ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/scoring/scoring.module.ts`?

---

## 🔊 שלב 6A: Audio Analysis Module

### זמן משוער: 5-7 שעות

### 6A.1 - Transcription Service

**📂 קובץ:** `src/modules/audio/services/transcription.service.ts`

צור תיקיה: `src/modules/audio/services/`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TranscriptionService {
  private openai: OpenAI;

  constructor(configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async transcribe(audioBuffer: Buffer): Promise<{
    text: string;
    confidence: number;
    duration: number;
    language: string;
  }> {
    try {
      // Save buffer to temp file (Whisper API needs file)
      const tempPath = path.join('/tmp', `audio-${Date.now()}.wav`);
      fs.writeFileSync(tempPath, audioBuffer);

      // Call Whisper API
      const response = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempPath),
        model: 'whisper-1',
        language: 'he', // Hebrew
      });

      // Clean up temp file
      fs.unlinkSync(tempPath);

      return {
        text: response.text,
        confidence: 0.95, // Whisper doesn't return confidence, using placeholder
        duration: 0, // Would need to parse from audio metadata
        language: 'he',
      };
    } catch (error) {
      throw new Error(`Transcription failed: ${error}`);
    }
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/audio/services/transcription.service.ts`?

---

### 6A.2 - Tone Analysis Service

**📂 קובץ:** `src/modules/audio/services/tone.service.ts`

```typescript
import { Injectable } from '@nestjs/common';

interface ToneAnalysis {
  pitchVariety: number; // 0-100
  volumeLevel: number; // 0-100
  speechRate: number; // words per minute
  clarity: number; // 0-100
  confidence: number; // 0-100
  toneScoreAdjustment: number; // +/- points
}

@Injectable()
export class ToneService {
  /**
   * Analyze tone from audio
   * In production, use specialized audio libraries
   * For MVP: mock implementation with reasonable estimates
   */
  async analyze(audioBuffer: Buffer): Promise<ToneAnalysis> {
    // Mock analysis (in production, use librosa, pyannote, etc.)
    const pitchVariety = Math.floor(Math.random() * 100);
    const volumeLevel = Math.floor(Math.random() * 100);
    const speechRate = 100 + Math.random() * 120; // 100-220 WPM

    // Calculate clarity based on simple heuristics
    const clarity = Math.max(70, Math.floor(Math.random() * 100));

    // Confidence: higher pitch variety + clear volume = more confident
    const confidence = Math.round((pitchVariety + clarity) / 2);

    // Calculate adjustment
    let adjustment = 0;
    if (speechRate > 200) adjustment -= 5; // too fast = nervous
    if (pitchVariety < 40) adjustment -= 10; // monotone = low engagement
    if (clarity > 85) adjustment += 10; // clear = good

    return {
      pitchVariety,
      volumeLevel,
      speechRate: Math.round(speechRate),
      clarity,
      confidence,
      toneScoreAdjustment: adjustment,
    };
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/audio/services/tone.service.ts`?

---

### 6A.3 - Hesitation Service

**📂 קובץ:** `src/modules/audio/services/hesitation.service.ts`

```typescript
import { Injectable } from '@nestjs/common';

interface HesitationAnalysis {
  fillerWords: string[];
  fillerCount: number;
  pauseCount: number;
  selfCorrectionCount: number;
  hesitationPenalty: number;
}

@Injectable()
export class HesitationService {
  private hebrewFillers = ['אה', 'אממ', 'אמ', 'כאילו', 'זאת אומרת', 'מעין', 'כן'];

  /**
   * Detect fillers, pauses, and self-corrections from transcription
   */
  analyze(transcription: string): HesitationAnalysis {
    const fillerWords: string[] = [];
    let fillerCount = 0;

    // Count fillers
    for (const filler of this.hebrewFillers) {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = transcription.match(regex);
      if (matches) {
        fillerCount += matches.length;
        fillerWords.push(filler);
      }
    }

    // Count pauses (represented as ... or multiple spaces in transcription)
    const pauseCount = (transcription.match(/\.\.\./g) || []).length;

    // Count self-corrections (e.g., "אני, כלומר, אנחנו")
    const selfCorrectionPattern = /,\s*כלומר|,\s*כאומנם|,\s*אני מתכוונת/gi;
    const selfCorrectionCount = (transcription.match(selfCorrectionPattern) || []).length;

    // Calculate penalty
    let penalty = 0;
    if (fillerCount > 0) {
      penalty -= fillerCount * 2; // -2 per filler
    }
    if (pauseCount > 2) {
      penalty -= pauseCount * 5; // -5 per long pause
    }
    if (selfCorrectionCount > 0) {
      penalty -= selfCorrectionCount * 3; // -3 per correction
    }

    return {
      fillerWords,
      fillerCount,
      pauseCount,
      selfCorrectionCount,
      hesitationPenalty: penalty,
    };
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/audio/services/hesitation.service.ts`?

---

### 6A.4 - Emotion Service

**📂 קובץ:** `src/modules/audio/services/emotion.service.ts`

```typescript
import { Injectable } from '@nestjs/common';

interface EmotionalAnalysis {
  enthusiasm: number; // 0-100
  confidence: number; // 0-100
  stress: number; // 0-100
  engagement: number; // 0-100
  primaryEmotion: string;
  emotionalScoreAdjustment: number;
}

@Injectable()
export class EmotionService {
  /**
   * Analyze emotional signals from transcription and tone
   */
  analyze(transcription: string, toneData?: any): EmotionalAnalysis {
    // Count positive/negative language
    const positiveWords = ['אוהב', 'אהבתי', 'נהנה', 'אחמד', 'אחמדתי', 'בתאווה'];
    const negativeWords = ['לא', 'שנאתי', 'מעצבן', 'קשה', 'בעיה', 'בעיות'];

    let positiveCount = 0,
      negativeCount = 0;
    for (const word of positiveWords) {
      positiveCount += (transcription.match(new RegExp(word, 'gi')) || []).length;
    }
    for (const word of negativeWords) {
      negativeCount += (transcription.match(new RegExp(word, 'gi')) || []).length;
    }

    // Calculate metrics
    const enthusiasm = Math.min(100, (positiveCount * 20) || 50);
    const confidence = toneData?.confidence || 60;
    const stress = Math.max(0, negativeCount * 15);
    const engagement = Math.min(100, positiveCount * 10 + 30);

    // Determine primary emotion
    let primaryEmotion = 'neutral';
    if (enthusiasm > 70) primaryEmotion = 'enthusiastic';
    if (confidence > 80) primaryEmotion = 'confident';
    if (stress > 60) primaryEmotion = 'stressed';

    // Calculate adjustment
    let adjustment = 0;
    if (enthusiasm > 80) adjustment += 15;
    if (confidence > 80) adjustment += 10;
    if (stress > 70) adjustment -= 15;
    if (engagement > 80) adjustment += 10;

    return {
      enthusiasm,
      confidence,
      stress,
      engagement,
      primaryEmotion,
      emotionalScoreAdjustment: adjustment,
    };
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/audio/services/emotion.service.ts`?

---

### 6A.5 - Audio Service (Orchestration)

**📂 קובץ:** `src/modules/audio/audio.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { TranscriptionService } from './services/transcription.service';
import { ToneService } from './services/tone.service';
import { HesitationService } from './services/hesitation.service';
import { EmotionService } from './services/emotion.service';

@Injectable()
export class AudioService {
  constructor(
    private transcriptionService: TranscriptionService,
    private toneService: ToneService,
    private hesitationService: HesitationService,
    private emotionService: EmotionService,
  ) {}

  /**
   * Full audio analysis pipeline
   */
  async analyze(audioBuffer: Buffer) {
    // Step 1: Transcribe
    const transcription = await this.transcriptionService.transcribe(audioBuffer);

    // Step 2: Tone analysis
    const tone = await this.toneService.analyze(audioBuffer);

    // Step 3: Hesitation detection
    const hesitation = this.hesitationService.analyze(transcription.text);

    // Step 4: Emotion analysis
    const emotion = this.emotionService.analyze(transcription.text, tone);

    // Step 5: Calculate combined audio adjustment
    const audioAdjustment =
      (tone.toneScoreAdjustment +
        hesitation.hesitationPenalty +
        emotion.emotionalScoreAdjustment) /
      3;

    return {
      transcription,
      toneAnalysis: tone,
      hesitation,
      emotion,
      audioInfluence: Math.round(audioAdjustment),
    };
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/audio/audio.service.ts`?

---

### 6A.6 - Audio Module

**📂 קובץ:** `src/modules/audio/audio.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AudioService } from './audio.service';
import { TranscriptionService } from './services/transcription.service';
import { ToneService } from './services/tone.service';
import { HesitationService } from './services/hesitation.service';
import { EmotionService } from './services/emotion.service';

@Module({
  imports: [ConfigModule],
  providers: [
    AudioService,
    TranscriptionService,
    ToneService,
    HesitationService,
    EmotionService,
  ],
  exports: [AudioService],
})
export class AudioModule {}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/audio/audio.module.ts`?

---

## 🎯 שלב 7: Analysis + Bull Queue

### זמן משוער: 4-5 שעות

### 7.1 - Analysis DTOs

**📂 קובץ:** `src/modules/analysis/dto/submit-answers.dto.ts`

צור תיקיה: `src/modules/analysis/dto/`

```typescript
import { IsString, IsEnum, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerItemDto {
  @IsString()
  question!: string;

  @IsString()
  answer!: string;

  @IsOptional()
  audioBuffer?: Buffer; // optional
}

export class SubmitAnswersDto {
  @IsEnum(['sales', 'service'])
  role!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers!: AnswerItemDto[];
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/analysis/dto/submit-answers.dto.ts`?

---

**📂 קובץ:** `src/modules/analysis/dto/score-request.dto.ts`

```typescript
import { IsString, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerItemDto {
  @IsString()
  question!: string;

  @IsString()
  answer!: string;
}

export class ScoreRequestDto {
  @IsEnum(['sales', 'service'])
  role!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers!: AnswerItemDto[];
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/analysis/dto/score-request.dto.ts`?

---

### 7.2 - Analysis Service

**📂 קובץ:** `src/modules/analysis/analysis.service.ts`

צור תיקיה: `src/modules/analysis/`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ScoringService } from '../scoring/scoring.service';
import { ScoringOutput } from '../../shared/types';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectQueue('scoring') private scoringQueue: Queue,
    private scoringService: ScoringService,
  ) {}

  /**
   * Submit answers for async processing
   */
  async submitAnswers(candidateId: string, role: string, answers: any[]) {
    const job = await this.scoringQueue.add(
      'analyze-candidate',
      {
        candidateId,
        role,
        answers,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    return {
      jobId: job.id,
      status: 'pending',
      candidateId,
    };
  }

  /**
   * Run scoring inline (for public /score endpoint)
   */
  async scoreInline(role: string, answers: string[]): Promise<ScoringOutput> {
    return this.scoringService.score(role, answers);
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: number) {
    const job = await this.scoringQueue.getJob(jobId);

    if (!job) {
      return { status: 'not-found', jobId };
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      jobId,
      status: state,
      progress,
      data: job.data,
      result: job.returnvalue,
    };
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/analysis/analysis.service.ts`?

---

### 7.3 - Analysis Processor (Bull Job Handler)

**📂 קובץ:** `src/modules/analysis/analysis.processor.ts`

```typescript
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ResultDocument } from '../results/schemas/result.schema';
import { Candidate, CandidateDocument } from '../candidate/schemas/candidate.schema';
import { ScoringService } from '../scoring/scoring.service';
import { AudioService } from '../audio/audio.service';

@Processor('scoring')
export class AnalysisProcessor {
  constructor(
    @InjectModel(Result.name) private resultModel: Model<ResultDocument>,
    @InjectModel(Candidate.name) private candidateModel: Model<CandidateDocument>,
    private scoringService: ScoringService,
    private audioService: AudioService,
  ) {}

  @Process('analyze-candidate')
  async analyzeCandidate(job: Job) {
    const { candidateId, role, answers } = job.data;

    try {
      // Step 1: Extract text answers
      const textAnswers = answers.map((a) => a.answer || a.text);

      // Step 2: Score from text
      const scoringResult = this.scoringService.score(role, textAnswers);

      // Step 3: If audio provided, analyze
      let audioData = null;
      if (answers.some((a) => a.audioBuffer)) {
        // TODO: Process audio for each answer
        // audioData = await this.audioService.analyze(audioBuffer);
        // scoringResult.scores = this.applyAudioAdjustments(scoringResult, audioData);
      }

      // Step 4: Save result
      const resultId = `${candidateId}-${Date.now()}`;
      const result = new this.resultModel({
        candidateId,
        Id: resultId,
        timestamp: new Date(),
        ...scoringResult,
        rawAnswers: textAnswers.reduce((acc, ans, idx) => {
          acc[`q${idx + 1}`] = ans;
          return acc;
        }, {}),
        audio: audioData,
      });

      await result.save();

      // Step 5: Update candidate with result
      await this.candidateModel.findByIdAndUpdate(
        candidateId,
        {
          resultId: result._id,
          status: 'completed',
        },
        { new: true },
      );

      return {
        success: true,
        resultId: result._id,
        finalScore: scoringResult.finalScore,
      };
    } catch (error) {
      console.error('Analysis job failed:', error);
      throw error;
    }
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/analysis/analysis.processor.ts`?

---

### 7.4 - Analysis Controller

**📂 קובץ:** `src/modules/analysis/analysis.controller.ts`

```typescript
import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { ScoreRequestDto } from './dto/score-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Analysis')
@Controller('api/v1')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('candidates/:candidateId/answers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RECRUITER', 'ADMIN')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'שלח תשובות לניתוח' })
  @ApiResponse({
    status: 202,
    description: 'תשובות נשלחו לעיבוד',
  })
  async submitAnswers(@Param('candidateId') candidateId: string, @Body() dto: SubmitAnswersDto) {
    return this.analysisService.submitAnswers(candidateId, dto.role, dto.answers);
  }

  @Post('score')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ניקוד מיידי (ציבורי)' })
  @ApiResponse({
    status: 200,
    description: 'ניקוד תוצאה',
  })
  async scorePublic(@Body() dto: ScoreRequestDto) {
    const answers = dto.answers.map((a) => a.answer);
    return this.analysisService.scoreInline(dto.role, answers);
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/analysis/analysis.controller.ts`?

---

### 7.5 - Analysis Module

**📂 קובץ:** `src/modules/analysis/analysis.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { Result, ResultSchema } from '../results/schemas/result.schema';
import { Candidate, CandidateSchema } from '../candidate/schemas/candidate.schema';
import { ScoringModule } from '../scoring/scoring.module';
import { AudioModule } from '../audio/audio.module';
import { AnalysisService } from './analysis.service';
import { AnalysisProcessor } from './analysis.processor';
import { AnalysisController } from './analysis.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Result.name, schema: ResultSchema },
      { name: Candidate.name, schema: CandidateSchema },
    ]),
    BullModule.registerQueue({
      name: 'scoring',
    }),
    ScoringModule,
    AudioModule,
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService, AnalysisProcessor],
})
export class AnalysisModule {}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/analysis/analysis.module.ts`?

---

## 🎯 שלב 8: Results Module

### זמן משוער: 2-3 שעות

### 8.1 - Results Service

**📂 קובץ:** `src/modules/results/results.service.ts`

צור תיקיה: `src/modules/results/`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Result, ResultDocument } from './schemas/result.schema';

@Injectable()
export class ResultsService {
  constructor(@InjectModel(Result.name) private resultModel: Model<ResultDocument>) {}

  async getByCandidate(candidateId: string) {
    const result = await this.resultModel
      .findOne({ candidateId: new Types.ObjectId(candidateId) })
      .populate('candidateId', 'name email phone');

    if (!result) {
      throw new NotFoundException('תוצאה לא נמצאה');
    }

    return result;
  }

  async getAll(limit: number = 20, skip: number = 0) {
    const results = await this.resultModel
      .find()
      .limit(limit)
      .skip(skip)
      .populate('candidateId', 'name email')
      .sort({ timestamp: -1 });

    const total = await this.resultModel.countDocuments();

    return { total, data: results, meta: { limit, skip, total } };
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/results/results.service.ts`?

---

### 8.2 - Results Controller

**📂 קובץ:** `src/modules/results/results.controller.ts`

```typescript
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ResultsService } from './results.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Results')
@Controller('api/v1')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get('candidates/:candidateId/result')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RECRUITER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'קבלת תוצאת ניקוד למועמד' })
  async getByCandidate(@Param('candidateId') candidateId: string) {
    return this.resultsService.getByCandidate(candidateId);
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/results/results.controller.ts`?

---

### 8.3 - Results Module

**📂 קובץ:** `src/modules/results/results.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Result, ResultSchema } from './schemas/result.schema';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Result.name,
        schema: ResultSchema,
      },
    ]),
  ],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/results/results.module.ts`?

---

## 🧪 שלב 10b: Unit Tests

### זמן משוער: 3-4 שעות

### 10b.1 - Scoring Engine Tests

**📂 קובץ:** `test/scoring.unit.spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { ScoringService } from '../src/modules/scoring/scoring.service';
import { MotivationRubric } from '../src/modules/scoring/rubrics/motivation.rubric';

describe('Scoring Engine', () => {
  let scoringService: ScoringService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ScoringService],
    }).compile();

    scoringService = module.get<ScoringService>(ScoringService);
  });

  describe('Motivation Scoring', () => {
    it('should score high motivation', () => {
      const answers = ['אני אוהב לעבוד עם אנשים', 'נהנה מאוד מהעבודה'];
      const features = { mentionsEmotions: 2, negativeSentiments: 0 };

      const score = MotivationRubric.score(answers, features);
      expect(score).toBeGreaterThan(70);
    });

    it('should score low motivation', () => {
      const answers = ['לא אוהב את העבודה', 'שנאתי את זה'];
      const features = { mentionsEmotions: 0, negativeSentiments: 2 };

      const score = MotivationRubric.score(answers, features);
      expect(score).toBeLessThan(50);
    });
  });

  describe('Full Scoring', () => {
    it('should score candidate with mixed answers', () => {
      const answers = [
        'עבדתי בקול טלפוני',
        'היה אתגר אבל הצליח',
        'אוהבתי את זה',
        'יצא לי לטפל בהתנגדויות',
        'עבדתי עם יעדים',
        'רציתי להשתפר',
      ];

      const result = scoringService.score('sales', answers);

      expect(result.finalScore).toBeGreaterThan(0);
      expect(result.finalScore).toBeLessThanOrEqual(100);
      expect(result.recommendedRole).toBeOneOf([1, 2]);
      expect(result.summary).toContain('מועמד');
    });
  });
});
```

**✅ אישור נדרש:**
- [ ] יצרת את `test/scoring.unit.spec.ts`?

---

## 📝 עדכון App Module

**עדכן את `src/app.module.ts`:**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { JwtModuleOptions } from '@nestjs/jwt';

// All modules
import { AuthModule } from './modules/auth/auth.module';
import { CandidateModule } from './modules/candidate/candidate.module';
import { QuestionnaireModule } from './modules/questionnaire/questionnaire.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { AudioModule } from './modules/audio/audio.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { ResultsModule } from './modules/results/results.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

import { envValidation } from './config/env.validation';

@Module({
  imports: [
    // ... existing config imports ...

    AuthModule,
    CandidateModule,
    QuestionnaireModule,
    ScoringModule,
    AudioModule,
    AnalysisModule,
    ResultsModule,
    DashboardModule,
  ],
})
export class AppModule {}
```

**✅ אישור נדרש:**
- [ ] עדכנת את `src/app.module.ts` עם כל ה-modules?

---

## 📊 סיכום שלבים Person B

| שלב | קבצים | סטטוס |
|-----|-------|--------|
| 6 | 9 Scoring files | ⏳ |
| 6A | 6 Audio files | ⏳ |
| 7 | 5 Analysis files | ⏳ |
| 8 | 3 Results files | ⏳ |
| 10b | Unit tests | ⏳ |

---

## 🔄 בדיקה סופית

```bash
npm run build
npm run test
```

זה צריך לעבור ללא שגיאות!

---

## 📞 Sync Point עם Person A

כשתסיים את כל השלבים, דו"ח ל-Person A:
- ✅ Core scoring engine מוכן
- ✅ Audio analysis מוכן
- ✅ Queue processing מוכן

Person A צריך לוודא שהם סיימו את שלבים 3-5 כדי שתוכל:
- להשתמש ב-Candidate + Result schemas
- לבדוק integration בין modules

---

**הצלחה! 🚀**

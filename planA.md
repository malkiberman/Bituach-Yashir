# 📋 PLAN PERSON A - Data Infrastructure Specialist

## 👤 תפקיד: Data Infrastructure Engineer
**אחראי על:** Database Schemas, Models, CRUD Endpoints, Dashboard  
**טכנולוגיה:** NestJS, MongoDB/Mongoose, Query Builders  
**זמן משוער:** 15-18 שעות  
**שפה:** עברית לחלוטין  

---

## 📍 נקודת התחלה

✅ **שלבים שהושלמו:**
- שלב 1: Setup + Config + Environment ✓
- שלב 2: Auth Module + JWT + User Schema ✓

⏳ **משימתך:**
- שלב 3: Database Schemas (Candidate, Result, Questionnaire)
- שלב 4: Questionnaire Module
- שלב 5: Candidate Module (CRUD)
- שלב 9: Dashboard Module (Filtering + Sorting)
- שלב 10a: Integration Tests

---

## 🚀 שלב 3: Database Schemas (Schemas)

### זמן משוער: 4-5 שעות

### 3.1 - Candidate Schema

**📂 קובץ:** `src/modules/candidate/schemas/candidate.schema.ts`

צור תיקיה: `src/modules/candidate/schemas/`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum CandidateStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true })
export class Candidate extends Document {
  @Prop({ required: true, unique: true })
  candidateId!: string; // email

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ 
    type: String, 
    enum: CandidateStatus, 
    default: CandidateStatus.PENDING 
  })
  status!: CandidateStatus;

  @Prop({ type: Types.ObjectId, default: null })
  resultId?: Types.ObjectId; // reference to Result

  @Prop({ default: new Date() })
  createdAt!: Date;

  @Prop({ default: new Date() })
  updatedAt!: Date;
}

export const CandidateSchema = SchemaFactory.createForClass(Candidate);

// Indices
CandidateSchema.index({ email: 1 }, { unique: true });
CandidateSchema.index({ candidateId: 1 });
CandidateSchema.index({ createdAt: -1 });
CandidateSchema.index({ status: 1 });

export type CandidateDocument = Candidate & Document;
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/candidate/schemas/candidate.schema.ts`?

---

### 3.2 - Result Schema

**📂 קובץ:** `src/modules/results/schemas/result.schema.ts`

צור תיקיה: `src/modules/results/schemas/`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Result extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Candidate' })
  candidateId!: Types.ObjectId;

  @Prop({ required: true, unique: true })
  Id!: string; // email-timestamp

  @Prop({ default: new Date() })
  timestamp!: Date;

  // Technical Data
  @Prop({
    type: {
      location: { type: Number, min: 0, max: 3 }, // 0/1/2/3
      availability: { type: Number, min: 0, max: 1 }, // 0/1
      hasRelativeInCompany: { type: Number, min: 0, max: 1 }, // 0/1
    },
    default: { location: 0, availability: 0, hasRelativeInCompany: 0 },
  })
  technical!: {
    location: number;
    availability: number;
    hasRelativeInCompany: number;
  };

  // Scores (0-100)
  @Prop({
    type: {
      motivation: { type: Number, min: 0, max: 100 },
      verbalAbility: { type: Number, min: 0, max: 100 },
      peopleSkills: { type: Number, min: 0, max: 100 },
      salesOrientation: { type: Number, min: 0, max: 100 },
      targetOrientation: { type: Number, min: 0, max: 100 },
    },
    required: true,
  })
  scores!: {
    motivation: number;
    verbalAbility: number;
    peopleSkills: number;
    salesOrientation: number;
    targetOrientation: number;
  };

  @Prop({ required: true, min: 0, max: 100 })
  finalScore!: number;

  @Prop({ required: true, min: 0, max: 3 })
  experienceLevel!: number; // 0-3

  @Prop({ required: true, enum: [1, 2], default: 2 }) // 1=sales, 2=service
  recommendedRole!: number;

  // Text outputs (Hebrew)
  @Prop({ required: true })
  summary!: string; // 1-2 sentences

  @Prop({ type: [String], required: true, default: [] })
  insights!: string[]; // 2-4 bullets

  @Prop({ type: [String], required: true, default: [] })
  recommendedQuestions!: string[]; // 2-3 follow-ups

  // Raw answers
  @Prop({
    type: {
      q1: String,
      q2: String,
      q3: String,
      q4: String,
      q5: String,
      q6: String,
    },
    required: true,
  })
  rawAnswers!: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    q5: string;
    q6: string;
  };

  // Audio Data (optional, populated by Person B)
  @Prop({
    type: {
      transcriptions: [String],
      toneAnalysis: Object,
      hesitation: Object,
      emotion: Object,
      audioInfluence: Number,
    },
    default: null,
  })
  audio?: {
    transcriptions: string[];
    toneAnalysis: any;
    hesitation: any;
    emotion: any;
    audioInfluence: number;
  };

  @Prop({ default: new Date() })
  createdAt!: Date;

  @Prop({ default: new Date() })
  updatedAt!: Date;
}

export const ResultSchema = SchemaFactory.createForClass(Result);

// Indices
ResultSchema.index({ candidateId: 1 });
ResultSchema.index({ Id: 1 }, { unique: true });
ResultSchema.index({ finalScore: -1 }); // for sorting
ResultSchema.index({ recommendedRole: 1 });
ResultSchema.index({ timestamp: -1 });
ResultSchema.index({ 'scores.motivation': 1 });

export type ResultDocument = Result & Document;
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/results/schemas/result.schema.ts`?

---

### 3.3 - Questionnaire Schema

**📂 קובץ:** `src/modules/questionnaire/schemas/questionnaire.schema.ts`

צור תיקיה: `src/modules/questionnaire/schemas/`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Questionnaire extends Document {
  @Prop({ required: true, unique: true })
  questionnaireId!: string; // e.g., 'DEFAULT_HE_V1'

  @Prop({
    type: [
      {
        qId: Number,
        text: String,
        type: String, // 'open-ended'
      },
    ],
    required: true,
  })
  questions!: Array<{
    qId: number;
    text: string;
    type: string;
  }>;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: new Date() })
  createdAt!: Date;

  @Prop({ default: new Date() })
  updatedAt!: Date;
}

export const QuestionnaireSchema = SchemaFactory.createForClass(Questionnaire);

// Indices
QuestionnaireSchema.index({ questionnaireId: 1 }, { unique: true });
QuestionnaireSchema.index({ isActive: 1 });

export type QuestionnaireDocument = Questionnaire & Document;
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/questionnaire/schemas/questionnaire.schema.ts`?

---

### 3.4 - Export Types for Person B

**📂 קובץ:** `src/shared/types.ts`

צור תיקיה `src/shared/` אם לא קיימת:

```typescript
// Re-export all types that Person B needs
export { Candidate, CandidateDocument, CandidateStatus } from '../modules/candidate/schemas/candidate.schema';
export { Result, ResultDocument } from '../modules/results/schemas/result.schema';
export { Questionnaire, QuestionnaireDocument } from '../modules/questionnaire/schemas/questionnaire.schema';

// Shared DTOs
export interface TechnicalData {
  location: number;
  availability: number;
  hasRelativeInCompany: number;
}

export interface Scores {
  motivation: number;
  verbalAbility: number;
  peopleSkills: number;
  salesOrientation: number;
  targetOrientation: number;
}

export interface ScoringOutput {
  technical: TechnicalData;
  scores: Scores;
  finalScore: number;
  experienceLevel: number;
  recommendedRole: number;
  summary: string;
  insights: string[];
  recommendedQuestions: string[];
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/shared/types.ts`?

---

## 🎯 שלב 4: Questionnaire Module

### זמן משוער: 3-4 שעות

### 4.1 - Questionnaire DTO

**📂 קובץ:** `src/modules/questionnaire/dto/questionnaire-response.dto.ts`

צור תיקיה: `src/modules/questionnaire/dto/`

```typescript
export class QuestionDto {
  qId!: number;
  text!: string;
  type!: string; // 'open-ended'
}

export class QuestionnaireResponseDto {
  questionnaireId!: string;
  questions!: QuestionDto[];
  isActive!: boolean;
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/questionnaire/dto/questionnaire-response.dto.ts`?

---

### 4.2 - Questionnaire Service

**📂 קובץ:** `src/modules/questionnaire/questionnaire.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Questionnaire, QuestionnaireDocument } from './schemas/questionnaire.schema';

@Injectable()
export class QuestionnaireService {
  constructor(
    @InjectModel(Questionnaire.name) private questionnaireModel: Model<QuestionnaireDocument>,
  ) {}

  async getAll() {
    return this.questionnaireModel.find({ isActive: true });
  }

  async getDefault() {
    const questionnaire = await this.questionnaireModel.findOne({
      questionnaireId: 'DEFAULT_HE_V1',
      isActive: true,
    });

    if (!questionnaire) {
      throw new NotFoundException('שאלון ברירת מחדל לא נמצא');
    }

    return questionnaire;
  }

  async seed() {
    // Check if already seeded
    const existing = await this.questionnaireModel.findOne({
      questionnaireId: 'DEFAULT_HE_V1',
    });

    if (existing) {
      return existing;
    }

    // Create default questionnaire with 8 Hebrew questions
    const questions = [
      {
        qId: 1,
        text: "היי 😊 אני מיטל מביטוח ישיר\nנעשה ראיון קצר של 2 דקות כדי להכיר אותך ולבדוק התאמה 🙌\nנתחיל?",
        type: 'open-ended',
      },
      {
        qId: 2,
        text: "כדי שנוכל לבדוק התאמה – איזה אזור עבודה רלוונטי עבורך (פתח תקווה / יקנעם / חריש)? וגם, מתי בערך תהיה פנוי/ה להתחיל?",
        type: 'open-ended',
      },
      {
        qId: 3,
        text: "ספר/י לי בקצרה על עבודה או תפקיד שהיה לך שבו עבדת מול אנשים 😊",
        type: 'open-ended',
      },
      {
        qId: 4,
        text: "יכול/ה לשתף במקרה בעבודה עם אנשים שהיה קצת מאתגר – ובכל זאת נהנית ממנו?",
        type: 'open-ended',
      },
      {
        qId: 5,
        text: "ומה היו החלקים שפחות אהבת בעבודה מול אנשים?",
        type: 'open-ended',
      },
      {
        qId: 6,
        text: "יצא לך להתמודד עם מישהו שלא הסכים או התנגד? איך התמודדת עם זה?",
        type: 'open-ended',
      },
      {
        qId: 7,
        text: "יצא לך לעבוד עם יעדים (בעבודה / לימודים / כל מסגרת)? אם כן – מה עשית כשלא עמדת בהם?",
        type: 'open-ended',
      },
      {
        qId: 8,
        text: "תודה רבה 🙏 זה ממש עוזר לנו להבין התאמה, ונחזור אליך בהקדם 😊",
        type: 'open-ended',
      },
    ];

    const newQuestionnaire = new this.questionnaireModel({
      questionnaireId: 'DEFAULT_HE_V1',
      questions,
      isActive: true,
    });

    return newQuestionnaire.save();
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/questionnaire/questionnaire.service.ts`?

---

### 4.3 - Questionnaire Controller

**📂 קובץ:** `src/modules/questionnaire/questionnaire.controller.ts`

```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QuestionnaireService } from './questionnaire.service';
import { QuestionnaireResponseDto } from './dto/questionnaire-response.dto';

@ApiTags('Questionnaire')
@Controller('api/v1/questionnaires')
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  @Get()
  @ApiOperation({ summary: 'קבלת כל השאלונים' })
  @ApiResponse({
    status: 200,
    description: 'רשימת שאלונים',
    type: [QuestionnaireResponseDto],
  })
  async getAll() {
    return this.questionnaireService.getAll();
  }

  @Get('default')
  @ApiOperation({ summary: 'קבלת השאלון הברירת מחדל' })
  @ApiResponse({
    status: 200,
    description: 'השאלון הברירת מחדל (8 שאלות בעברית)',
    type: QuestionnaireResponseDto,
  })
  async getDefault() {
    return this.questionnaireService.getDefault();
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/questionnaire/questionnaire.controller.ts`?

---

### 4.4 - Questionnaire Module

**📂 קובץ:** `src/modules/questionnaire/questionnaire.module.ts`

```typescript
import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Questionnaire, QuestionnaireSchema } from './schemas/questionnaire.schema';
import { QuestionnaireService } from './questionnaire.service';
import { QuestionnaireController } from './questionnaire.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Questionnaire.name,
        schema: QuestionnaireSchema,
      },
    ]),
  ],
  controllers: [QuestionnaireController],
  providers: [QuestionnaireService],
  exports: [QuestionnaireService],
})
export class QuestionnaireModule implements OnModuleInit {
  constructor(private questionnaireService: QuestionnaireService) {}

  async onModuleInit() {
    // Seed default questionnaire on app start
    await this.questionnaireService.seed();
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/questionnaire/questionnaire.module.ts`?

---

## 🎯 שלב 5: Candidate Module (CRUD)

### זמן משוער: 5-6 שעות

### 5.1 - Candidate DTOs

**📂 קובץ:** `src/modules/candidate/dto/create-candidate.dto.ts`

```typescript
import { IsEmail, IsString, IsPhoneNumber, MinLength, MaxLength } from 'class-validator';

export class CreateCandidateDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  phone!: string;
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/candidate/dto/create-candidate.dto.ts`?

---

**📂 קובץ:** `src/modules/candidate/dto/update-candidate.dto.ts`

```typescript
import { IsEmail, IsString, IsPhoneNumber, MinLength, MaxLength, IsOptional } from 'class-validator';

export class UpdateCandidateDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(10)
  @IsOptional()
  phone?: string;
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/candidate/dto/update-candidate.dto.ts`?

---

**📂 קובץ:** `src/modules/candidate/dto/candidate-response.dto.ts`

```typescript
import { CandidateStatus } from '../schemas/candidate.schema';

export class CandidateResponseDto {
  _id!: string;
  candidateId!: string;
  name!: string;
  email!: string;
  phone!: string;
  status!: CandidateStatus;
  resultId?: string;
  createdAt!: Date;
  updatedAt!: Date;
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/candidate/dto/candidate-response.dto.ts`?

---

### 5.2 - Candidate Service

**📂 קובץ:** `src/modules/candidate/candidate.service.ts`

```typescript
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Candidate, CandidateDocument } from './schemas/candidate.schema';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Injectable()
export class CandidateService {
  constructor(@InjectModel(Candidate.name) private candidateModel: Model<CandidateDocument>) {}

  async create(createCandidateDto: CreateCandidateDto): Promise<Candidate> {
    const { email, name, phone } = createCandidateDto;

    // Check if candidate already exists
    const existingCandidate = await this.candidateModel.findOne({ email });
    if (existingCandidate) {
      throw new ConflictException('מועמד עם אימייל זה כבר קיים');
    }

    const newCandidate = new this.candidateModel({
      candidateId: email,
      name,
      email,
      phone,
    });

    return newCandidate.save();
  }

  async findAll(
    limit: number = 20,
    skip: number = 0,
  ): Promise<{ total: number; data: Candidate[]; meta: any }> {
    const data = await this.candidateModel.find().limit(limit).skip(skip).sort({ createdAt: -1 });
    const total = await this.candidateModel.countDocuments();

    return {
      total,
      data,
      meta: { limit, skip, total },
    };
  }

  async findById(id: string): Promise<Candidate> {
    const candidate = await this.candidateModel.findById(id);
    if (!candidate) {
      throw new NotFoundException('מועמד לא נמצא');
    }
    return candidate;
  }

  async findByEmail(email: string): Promise<Candidate> {
    const candidate = await this.candidateModel.findOne({ email });
    if (!candidate) {
      throw new NotFoundException('מועמד לא נמצא');
    }
    return candidate;
  }

  async update(id: string, updateCandidateDto: UpdateCandidateDto): Promise<Candidate> {
    const candidate = await this.candidateModel.findByIdAndUpdate(id, updateCandidateDto, {
      new: true,
    });

    if (!candidate) {
      throw new NotFoundException('מועמד לא נמצא');
    }

    return candidate;
  }

  async delete(id: string): Promise<{ message: string }> {
    const result = await this.candidateModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException('מועמד לא נמצא');
    }

    return { message: 'מועמד נמחק בהצלחה' };
  }

  async updateStatus(id: string, status: string): Promise<Candidate> {
    const candidate = await this.candidateModel.findByIdAndUpdate(id, { status }, { new: true });
    if (!candidate) {
      throw new NotFoundException('מועמד לא נמצא');
    }
    return candidate;
  }

  async updateResultId(id: string, resultId: string): Promise<Candidate> {
    const candidate = await this.candidateModel.findByIdAndUpdate(
      id,
      { resultId, status: 'completed' },
      { new: true },
    );
    if (!candidate) {
      throw new NotFoundException('מועמד לא נמצא');
    }
    return candidate;
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/candidate/candidate.service.ts`?

---

### 5.3 - Candidate Controller

**📂 קובץ:** `src/modules/candidate/candidate.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CandidateService } from './candidate.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { CandidateResponseDto } from './dto/candidate-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Candidates')
@Controller('api/v1/candidates')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RECRUITER', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'יצירת מועמד חדש' })
  @ApiResponse({
    status: 201,
    description: 'מועמד נוצר בהצלחה',
    type: CandidateResponseDto,
  })
  async create(@Body() createCandidateDto: CreateCandidateDto) {
    return this.candidateService.create(createCandidateDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RECRUITER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'קבלת רשימת מועמדים' })
  async findAll(@Query('limit') limit = 20, @Query('skip') skip = 0) {
    return this.candidateService.findAll(parseInt(limit as any), parseInt(skip as any));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RECRUITER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'קבלת פרטי מועמד' })
  @ApiResponse({
    status: 200,
    description: 'פרטי המועמד',
    type: CandidateResponseDto,
  })
  async findById(@Param('id') id: string) {
    return this.candidateService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RECRUITER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'עדכון פרטי מועמד' })
  async update(@Param('id') id: string, @Body() updateCandidateDto: UpdateCandidateDto) {
    return this.candidateService.update(id, updateCandidateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'מחיקת מועמד' })
  async delete(@Param('id') id: string) {
    return this.candidateService.delete(id);
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/candidate/candidate.controller.ts`?

---

### 5.4 - Candidate Module

**📂 קובץ:** `src/modules/candidate/candidate.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Candidate, CandidateSchema } from './schemas/candidate.schema';
import { CandidateService } from './candidate.service';
import { CandidateController } from './candidate.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Candidate.name,
        schema: CandidateSchema,
      },
    ]),
  ],
  controllers: [CandidateController],
  providers: [CandidateService],
  exports: [CandidateService],
})
export class CandidateModule {}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/candidate/candidate.module.ts`?

---

## 🎯 שלב 9: Dashboard Module

### זמן משוער: 4-5 שעות

### 9.1 - Dashboard Query DTO

**📂 קובץ:** `src/modules/dashboard/dto/list-candidates-query.dto.ts`

צור תיקיה: `src/modules/dashboard/dto/`

```typescript
import { IsOptional, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class ListCandidatesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  maxScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(2)
  role?: number; // 1=sales, 2=service

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number = 0;

  @IsOptional()
  sortBy?: 'score' | 'name' | 'date' = 'score';
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/dashboard/dto/list-candidates-query.dto.ts`?

---

### 9.2 - Dashboard Service

**📂 קובץ:** `src/modules/dashboard/dashboard.service.ts`

צור תיקיה: `src/modules/dashboard/`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ResultDocument } from '../results/schemas/result.schema';
import { Candidate, CandidateDocument } from '../candidate/schemas/candidate.schema';
import { ListCandidatesQueryDto } from './dto/list-candidates-query.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Result.name) private resultModel: Model<ResultDocument>,
    @InjectModel(Candidate.name) private candidateModel: Model<CandidateDocument>,
  ) {}

  async listCandidatesWithResults(query: ListCandidatesQueryDto) {
    const { minScore, maxScore, role, limit = 20, skip = 0, sortBy = 'score' } = query;

    // Build MongoDB query
    const mongoQuery: any = {};

    if (minScore !== undefined) {
      mongoQuery.finalScore = mongoQuery.finalScore || {};
      mongoQuery.finalScore.$gte = minScore;
    }

    if (maxScore !== undefined) {
      mongoQuery.finalScore = mongoQuery.finalScore || {};
      mongoQuery.finalScore.$lte = maxScore;
    }

    if (role !== undefined) {
      mongoQuery.recommendedRole = role;
    }

    // Build sort
    const sortObj: any = {};
    if (sortBy === 'score') {
      sortObj.finalScore = -1; // DESC
    } else if (sortBy === 'name') {
      sortObj.candidateName = 1; // ASC
    } else if (sortBy === 'date') {
      sortObj.timestamp = -1; // DESC
    }

    // Query results and populate candidate data
    const results = await this.resultModel
      .find(mongoQuery)
      .populate({
        path: 'candidateId',
        select: 'name email phone',
      })
      .sort(sortObj)
      .limit(limit)
      .skip(skip);

    const total = await this.resultModel.countDocuments(mongoQuery);

    // Transform to dashboard format
    const data = results.map((result) => {
      const candidate = result.candidateId as any;
      return {
        _id: result._id,
        candidateId: candidate?._id,
        candidateName: candidate?.name,
        candidateEmail: candidate?.email,
        candidatePhone: candidate?.phone,
        finalScore: result.finalScore,
        recommendedRole: result.recommendedRole === 1 ? 'מכירות' : 'שירות',
        summary: result.summary,
        timestamp: result.timestamp,
      };
    });

    return {
      total,
      data,
      meta: {
        limit,
        skip,
        total,
        hasMore: skip + limit < total,
      },
    };
  }

  async getCandidateDetail(candidateId: string) {
    const result = await this.resultModel.findOne({ candidateId }).populate('candidateId');

    if (!result) {
      return null;
    }

    return result;
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/dashboard/dashboard.service.ts`?

---

### 9.3 - Dashboard Controller

**📂 קובץ:** `src/modules/dashboard/dashboard.controller.ts`

```typescript
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { ListCandidatesQueryDto } from './dto/list-candidates-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Dashboard')
@Controller('api/v1/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RECRUITER', 'ADMIN')
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('candidates')
  @ApiOperation({ summary: 'קבלת מועמדים עם סינון ומיון' })
  @ApiResponse({
    status: 200,
    description: 'רשימת מועמדים עם תוצאות',
  })
  async listCandidates(@Query() query: ListCandidatesQueryDto) {
    return this.dashboardService.listCandidatesWithResults(query);
  }

  @Get('candidates/:candidateId')
  @ApiOperation({ summary: 'קבלת פרטי מועמד מדשבורד' })
  async getCandidateDetail(@Param('candidateId') candidateId: string) {
    return this.dashboardService.getCandidateDetail(candidateId);
  }
}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/dashboard/dashboard.controller.ts`?

---

### 9.4 - Dashboard Module

**📂 קובץ:** `src/modules/dashboard/dashboard.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Result, ResultSchema } from '../results/schemas/result.schema';
import { Candidate, CandidateSchema } from '../candidate/schemas/candidate.schema';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Result.name,
        schema: ResultSchema,
      },
      {
        name: Candidate.name,
        schema: CandidateSchema,
      },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
```

**✅ אישור נדרש:**
- [ ] יצרת את `src/modules/dashboard/dashboard.module.ts`?

---

## 🎯 שלב 10a: Integration Tests

### זמן משוער: 3-4 שעות

### 10a.1 - Candidate Endpoints Test

**📂 קובץ:** `test/candidates.integration.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Candidates Integration Tests', () => {
  let app: INestApplication;
  let candidateId: string;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Register and login a test user
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    jwtToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/candidates', () => {
    it('should create a new candidate', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/candidates')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '0521234567',
        });

      expect(response.status).toBe(201);
      expect(response.body.email).toBe('john@example.com');
      candidateId = response.body._id;
    });
  });

  describe('GET /api/v1/candidates', () => {
    it('should retrieve all candidates', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/candidates')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/candidates/:id', () => {
    it('should retrieve a single candidate', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/candidates/${candidateId}`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('john@example.com');
    });
  });
});
```

**✅ אישור נדרש:**
- [ ] יצרת את `test/candidates.integration.spec.ts`?

---

## 📝 עדכון App Module

**עדכן את `src/app.module.ts`:**

הוסף את כל ה-modules:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { JwtModuleOptions } from '@nestjs/jwt';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { CandidateModule } from './modules/candidate/candidate.module';
import { QuestionnaireModule } from './modules/questionnaire/questionnaire.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

// Config
import { envValidation } from './config/env.validation';

@Module({
  imports: [
    // ... existing imports ...

    AuthModule,
    CandidateModule,
    QuestionnaireModule,
    DashboardModule,
    // Remaining modules will be added by Person B
  ],
})
export class AppModule {}
```

**✅ אישור נדרש:**
- [ ] עדכנת את `src/app.module.ts` עם כל ה-modules?

---

## 📊 סיכום שלבים Person A

| שלב | קבצים | סטטוס |
|-----|-------|--------|
| 3 | 4 Schemas | ⏳ |
| 4 | 4 Questionnaire files | ⏳ |
| 5 | 5 Candidate files | ⏳ |
| 9 | 4 Dashboard files | ⏳ |
| 10a | Integration tests | ⏳ |

---

## 🔄 בדיקה סופית

```bash
npm run build
npm run test
```

זה צריך לעבור ללא שגיאות!

---

## ✅ עדכן את Person B

כשתסיים את כל השלבים, שתף את Person B את `src/shared/types.ts` כדי שיוכל להמשיך עם שלב 6 (Scoring Engine).

---

**הצלחה! 🚀**

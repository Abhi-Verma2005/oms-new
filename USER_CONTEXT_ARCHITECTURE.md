# User Context Architecture

## Overview

This document describes the new user context architecture that provides clear separation between user-provided data and AI-generated insights.

## Architecture Components

### 1. UserProfile (User-Provided Data)
**Table**: `user_profiles`  
**Purpose**: Stores stable, user-provided data with explicit consent  
**Who writes**: User (via onboarding, settings, forms)  
**Update frequency**: Low (when user updates their profile)

**Fields**:
- **Company Information**: name, size, industry, role, department, website
- **Professional Context**: experience, primaryGoals, currentProjects, budget, teamSize
- **Preferences**: communicationStyle, preferredContentType, timezone, workingHours, language
- **Marketing & Lead Data**: leadSource, leadScore, marketingOptIn, newsletterOptIn

### 2. UserAIInsights (AI-Generated Data)
**Table**: `user_ai_insights`  
**Purpose**: Stores dynamic, rapidly updated AI-generated insights  
**Who writes**: AI only (via conversation analysis)  
**Update frequency**: High (after every conversation)

**Fields**:
- **Personality & Behavior**: personalityTraits, behaviorPatterns, learningStyle, expertiseLevel
- **Conversation Analysis**: conversationTone, communicationPatterns, topicInterests, painPoints
- **Dynamic Metadata**: aiMetadata (arbitrary, namespaced keys for marketing/leads)
- **AI Confidence**: confidenceScore, lastAnalysisAt

### 3. AIInsightUpdate (Audit Trail)
**Table**: `ai_insight_updates`  
**Purpose**: Tracks what AI learns over time  
**Who writes**: AI only  
**Update frequency**: Every AI insight update

**Fields**:
- **Update Details**: updateType, field, oldValue, newValue
- **AI Context**: aiConfidence, aiReasoning, source
- **Metadata**: createdAt

### 4. UserInteraction (Conversation Log)
**Table**: `user_interactions`  
**Purpose**: Logs all user interactions for analysis  
**Who writes**: System  
**Update frequency**: Every interaction

**Fields**:
- **Interaction Details**: interactionType, content, response, context
- **AI Analysis**: sentiment, intent, topics, preferences
- **Metadata**: timestamp, sessionId, pageUrl

## Legacy Support

### UserContext (Legacy)
**Table**: `user_context`  
**Purpose**: Backward compatibility with existing data  
**Status**: Deprecated, will be removed in future version  
**Migration**: Automatic via `getUserContextWithMigration()`

## Data Flow

### 1. User Onboarding
```
User fills form → UserProfile created/updated
```

### 2. AI Conversation
```
User sends message → AI responds → UserInteraction logged → AIInsights updated
```

### 3. Context Retrieval
```
AI Chat API → getUserContextWithMigration() → createUnifiedUserContext() → AI gets context
```

## Migration Strategy

### Automatic Migration
- Happens transparently when user context is accessed
- Migrates data from `UserContext` to new tables
- Marks legacy data as migrated
- Falls back to legacy data if migration fails

### Manual Migration
```bash
# Dry run to see what would be migrated
npx tsx scripts/migrate-user-context.ts --dry-run

# Migrate all users
npx tsx scripts/migrate-user-context.ts

# Migrate specific user
npx tsx scripts/migrate-user-context.ts --user-id "user123"
```

## AI Context Usage

### System Prompt Structure
```
USER CONTEXT:
- User: [user_id]
- Architecture: New (User-provided data) | Legacy or None

USER-PROVIDED DATA (Stable, with consent):
- Company: [name] ([industry])
- Role: [role]
- Experience: [experience]
- Primary Goals: [goals]
- Communication Style: [style]
- Budget: [budget]
- Lead Source: [source]
- Lead Score: [score]

AI-GENERATED INSIGHTS (Dynamic, rapidly updated):
- Personality: [traits]
- Conversation Tone: [tone]
- Learning Style: [style]
- Topic Interests: [interests]
- Pain Points: [pain_points]
- Confidence Score: [score]
- Last Analysis: [date]

AI METADATA (Dynamic, namespaced keys):
- [key]: [value]
- [key]: [value]
```

## Benefits

### 1. Clear Data Separation
- **User Data**: Stable, consented, GDPR-compliant
- **AI Data**: Dynamic, rapidly updated, for personalization

### 2. Marketing & Lead Intelligence
- **Lead Scoring**: Based on user profile and AI insights
- **Personalization**: AI adapts to user's communication style
- **Behavior Analysis**: Track user interests and pain points

### 3. Privacy & Compliance
- **Consent Management**: Clear separation of consented vs inferred data
- **Data Retention**: Different policies for different data types
- **Audit Trail**: Track all AI-generated insights

### 4. Performance
- **Efficient Queries**: Separate tables for different access patterns
- **Caching**: User profile data can be cached longer than AI insights
- **Scalability**: AI insights can be updated frequently without affecting user data

## API Endpoints

### User Context Analysis
```
POST /api/user-context/analyze
```
Triggers AI analysis of recent user interactions and updates insights.

### AI Chat
```
POST /api/ai-chat
```
Uses unified user context for personalized responses and updates AI insights.

## Database Schema

See `prisma/schema.prisma` for complete schema definitions.

## Migration Timeline

1. **Phase 1**: Deploy new schema alongside existing UserContext
2. **Phase 2**: Migrate existing data using migration script
3. **Phase 3**: Update all code to use new architecture
4. **Phase 4**: Remove legacy UserContext table (future release)

## Best Practices

### 1. Data Access
- Always use `getUserContextWithMigration()` for context retrieval
- Use `createUnifiedUserContext()` for AI consumption
- Never write directly to UserAIInsights from user-facing code

### 2. AI Updates
- Update AI insights after every conversation
- Use confidence scores to validate insights
- Log all AI insight updates for audit

### 3. Privacy
- Respect user consent for marketing data
- Allow users to delete AI-generated data
- Provide transparency about data usage

## Troubleshooting

### Migration Issues
- Check database connectivity
- Verify user permissions
- Review migration logs

### AI Context Issues
- Ensure OpenAI API key is configured
- Check conversation history length
- Verify user authentication

### Performance Issues
- Monitor database query performance
- Consider caching user profile data
- Optimize AI insight update frequency


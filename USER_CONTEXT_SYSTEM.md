# User Context System

A comprehensive AI-powered user context management system that learns from user interactions and provides personalized experiences.

## Overview

The User Context System automatically tracks and analyzes user behavior, preferences, and interactions to build a comprehensive profile. This profile is used to:

- Personalize AI chatbot responses
- Track user preferences and learning patterns
- Provide contextual recommendations
- Automatically update user profiles based on behavior

## Architecture

### Database Schema

The system uses three main database models:

1. **UserContext**: Stores comprehensive user profile information
2. **ContextUpdate**: Tracks changes to user context with AI reasoning
3. **UserInteraction**: Logs all user interactions for analysis

### Zustand Store

The `useUserContextStore` provides a centralized state management solution with:

- Real-time context updates
- AI insights management
- Persistent storage
- Automatic synchronization with backend

### API Endpoints

- `GET/PUT /api/user-context`: Manage user context data
- `POST /api/user-context/analyze`: AI-powered context analysis
- `POST /api/user-context/interactions`: Log user interactions

## Features

### 1. Automatic Context Learning

The system automatically learns from user interactions:

- **Chat Messages**: Analyzes conversation patterns and preferences
- **Page Views**: Tracks navigation patterns
- **Search Queries**: Learns search behavior and interests
- **Filter Usage**: Understands user preferences for content filtering

### 2. AI-Powered Insights

The AI analyzes user interactions to generate insights about:

- **Communication Style**: Formal, casual, technical, or brief
- **Learning Style**: Visual, auditory, kinesthetic, or reading
- **Expertise Level**: Skill levels in different domains (SEO, content marketing, etc.)
- **Personality Traits**: Behavioral patterns and preferences
- **Professional Context**: Company info, role, experience level

### 3. Real-Time Updates

The system provides real-time updates through:

- **Automatic Analysis**: Triggers AI analysis after sufficient interactions
- **Context Synchronization**: Keeps frontend and backend in sync
- **Update History**: Tracks all context changes with timestamps and reasoning

### 4. Personalized AI Responses

The AI chatbot uses user context to provide personalized responses:

- Adapts communication style to user preferences
- Provides relevant examples based on industry and role
- Adjusts complexity based on expertise level
- References user's goals and projects

## Usage

### 1. Basic Setup

The system is automatically initialized through the `UserContextProvider`:

```tsx
// Already included in app/layout.tsx
<UserContextProvider>
  {/* Your app */}
</UserContextProvider>
```

### 2. Using the Store

```tsx
import { useUserContextStore } from '@/stores/user-context-store'

function MyComponent() {
  const {
    company,
    professional,
    preferences,
    aiInsights,
    updateContext,
    fetchUserContext
  } = useUserContextStore()

  // Update user context
  const handleUpdateCompany = () => {
    updateContext({
      company: {
        name: 'My Company',
        industry: 'Technology'
      }
    })
  }

  return (
    <div>
      <p>Company: {company.name}</p>
      <p>Industry: {company.industry}</p>
      <p>Learning Style: {aiInsights.learningStyle}</p>
    </div>
  )
}
```

### 3. Logging Interactions

The system automatically logs interactions, but you can also log custom interactions:

```tsx
// Global logging functions are available
window.logUserInteraction.search('my search query')
window.logUserInteraction.filter({ priceMin: 100, priceMax: 500 })
window.logUserInteraction.feedback(5, 'Great service!')
```

### 4. AI Chatbot Integration

The AI chatbot automatically uses user context for personalized responses:

```tsx
// The chatbot automatically includes user context
const response = await fetch('/api/ai-chat', {
  method: 'POST',
  body: JSON.stringify({
    message: userMessage,
    userContext: {
      company,
      professional,
      preferences,
      aiInsights
    }
  })
})
```

## Testing

Visit `/test-user-context` to test the system:

1. **Context Panel**: View and edit user context
2. **System Status**: Check system state and recent updates
3. **AI Insights**: View AI-generated insights
4. **Test Actions**: Trigger interactions and analysis

## Database Migration

After implementing the schema changes, run:

```bash
npx prisma db push
# or
npx prisma migrate dev --name add-user-context
```

## Configuration

### Environment Variables

Ensure these are set:

```env
OPEN_AI_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini  # optional, defaults to gpt-4o-mini
NEXTAUTH_URL=http://localhost:3000  # for internal API calls
```

### AI Analysis Thresholds

The system triggers AI analysis when:

- 5+ chat messages in 24 hours
- 3+ significant interactions (search, feedback, etc.)
- Manual trigger via API or UI

## Privacy & Security

- All user data is stored securely in the database
- AI analysis is done server-side with OpenAI API
- User context is only accessible to the authenticated user
- Interaction logging can be disabled per user preference

## Performance Considerations

- Context updates are batched to reduce API calls
- AI analysis runs asynchronously to avoid blocking
- Local storage is used for offline access
- Automatic cleanup of old interaction data

## Future Enhancements

- **Predictive Analytics**: Predict user needs and preferences
- **Cross-Session Learning**: Learn from multiple sessions
- **Integration APIs**: Export context to external systems
- **Advanced Insights**: More sophisticated AI analysis
- **Privacy Controls**: Granular privacy settings

## Troubleshooting

### Common Issues

1. **Context not loading**: Check authentication and API endpoints
2. **AI analysis failing**: Verify OpenAI API key and model availability
3. **Updates not syncing**: Check network connectivity and API responses

### Debug Mode

Enable debug logging by setting:

```env
DEBUG_USER_CONTEXT=true
```

This will log all context updates and AI analysis results to the console.

## API Reference

### UserContextStore

```tsx
interface UserContextStore {
  // State
  company: CompanyInfo
  professional: ProfessionalContext
  preferences: Preferences
  aiInsights: AIInsights
  isLoading: boolean
  isUpdating: boolean
  error: string | null
  updates: ContextUpdate[]
  
  // Actions
  setContext: (context: Partial<UserContextData>) => void
  updateContext: (updates: Partial<UserContextData>) => Promise<void>
  fetchUserContext: () => Promise<void>
  saveUserContext: () => Promise<void>
  analyzeUserContext: (interactions?: any[]) => Promise<void>
  
  // Utilities
  getContextSummary: () => string
  hasRecentUpdates: (hours?: number) => boolean
  needsUpdate: () => boolean
}
```

### API Endpoints

#### GET /api/user-context
Returns current user context data.

#### PUT /api/user-context
Updates user context data.

#### POST /api/user-context/analyze
Triggers AI analysis of user interactions.

#### POST /api/user-context/interactions
Logs a user interaction.

#### GET /api/user-context/interactions
Retrieves user interaction history.


# ⚡ EDGE FUNCTIONS COMPREHENSIVE GUIDE

**System:** SHMMS Edge Functions (Deno Runtime)  
**Platform:** Supabase Edge Functions  
**Updated:** 2025-08-14

---

## 🎯 EDGE FUNCTIONS OVERVIEW

Edge Functions provide serverless computing capabilities for SHMMS, handling AI processing, email services, data analytics, and complex business logic that requires server-side execution.

### Core Benefits
- **Global Distribution:** Sub-100ms response times worldwide
- **Secure Processing:** Isolated execution with service role access
- **Auto-scaling:** Handles traffic spikes automatically
- **TypeScript Native:** Full TypeScript support with Deno runtime

---

## 🏗️ FUNCTION ARCHITECTURE

### Standard Function Structure
```typescript
// Standard template for all edge functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for web client compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { param1, param2 } = await req.json();

    // Validate required parameters
    if (!param1) {
      throw new Error('Required parameter missing');
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Function logic here
    const result = await processFunction(param1, param2);

    // Log successful operation
    console.log('✅ Function completed:', { param1, result });

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    // Log error for debugging
    console.error('❌ Function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
```

---

## 📁 FUNCTION CATEGORIES

### 1. ASSESSMENT PROCESSING

#### `analyze-assessment` - Core Assessment Analysis
```typescript
// Analyzes user assessment responses with AI
interface AssessmentRequest {
  user_id: string;
  pillar_type: string;
  answers: Record<string, any>;
  assessment_id?: string;
}

// Function capabilities:
- AI-powered response analysis
- Score calculation and validation
- Personalized insights generation
- Progress tracking updates
- Automatic actionable creation

// Usage example:
const { data, error } = await supabase.functions.invoke('analyze-assessment', {
  body: {
    user_id: 'uuid',
    pillar_type: 'self_care',
    answers: { question1: 5, question2: 3 }
  }
});
```

#### `analyze-pillar-assessment` - Specialized Pillar Analysis
```typescript
// Enhanced analysis for specific pillars
interface PillarAssessmentRequest {
  user_id: string;
  pillar_type: 'self_care' | 'skills' | 'talent' | 'brand' | 'economy' | 'open_track';
  responses: PillarResponse[];
  context?: string;
}

// Pillar-specific processing:
- Custom scoring algorithms per pillar
- Tailored recommendations
- Integration with pillar-specific resources
- Progress milestone calculation
```

#### `consolidate-assessment-system` - System Integration
```typescript
// Consolidates assessment data across system
- Removes duplicate assessments
- Merges fragmented user data
- Validates data integrity
- Updates system metrics
```

---

### 2. AI SERVICES

#### `stefan-ai-chat` - Conversational AI Interface
```typescript
interface ChatRequest {
  user_id: string;
  message: string;
  context?: string;
  session_id?: string;
}

interface ChatResponse {
  response: string;
  confidence: number;
  context_used: string[];
  memory_created?: boolean;
}

// AI capabilities:
- Context-aware conversations
- Memory integration and learning
- Personalized responses based on user data
- Session continuity
- Automated memory creation

// Implementation features:
- Vector similarity search for context
- Streaming responses for real-time chat
- Rate limiting and abuse prevention
- Multi-language support (Swedish/English)
```

#### `stefan-memory-search` - AI Memory Retrieval
```typescript
interface MemorySearchRequest {
  user_id: string;
  query: string;
  limit?: number;
  threshold?: number;
}

// Memory search capabilities:
- Semantic similarity search using embeddings
- User-specific memory filtering
- Relevance scoring and ranking
- Context window optimization
- Memory freshness weighting
```

#### `stefan-text-analysis` - Natural Language Processing
```typescript
interface TextAnalysisRequest {
  user_id: string;
  text: string;
  analysis_type: 'sentiment' | 'intent' | 'entities' | 'summary';
}

// Analysis capabilities:
- Sentiment analysis (positive/negative/neutral)
- Intent detection for user requests
- Named entity recognition
- Text summarization
- Emotional tone analysis
```

#### `generate-ai-planning` - Personalized Development Plans
```typescript
interface PlanningRequest {
  user_id: string;
  pillar_focus: string[];
  time_horizon: 'week' | 'month' | 'quarter';
  user_preferences?: Record<string, any>;
}

// Planning features:
- Multi-pillar development integration
- Time-based milestone creation
- Difficulty progression management
- Resource allocation optimization
- Progress tracking setup
```

---

### 3. USER MANAGEMENT

#### `admin-create-user` - Administrative User Creation
```typescript
interface CreateUserRequest {
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'client' | 'coach' | 'admin';
  temporary_password?: boolean;
  send_invitation?: boolean;
}

// Security features:
- Admin-only access validation
- Role assignment with proper permissions
- Audit logging for all user creation
- Automatic invitation email dispatch
- Password policy enforcement
```

#### `admin-password-reset` - Secure Password Management
```typescript
interface PasswordResetRequest {
  user_id: string;
  admin_id: string;
  force_change?: boolean;
  temporary_password?: boolean;
}

// Security implementation:
- Multi-factor admin verification
- Secure temporary password generation
- Force password change on next login
- Audit trail for all password operations
- Email notification to user
```

#### `claim-invitation` - Invitation Processing
```typescript
interface ClaimInvitationRequest {
  token: string;
  user_id: string;
}

// Invitation flow:
- Token validation and expiry check
- Role assignment upon acceptance
- Profile setup automation
- Welcome email dispatch
- Analytics event tracking
```

---

### 4. COMMUNICATION SERVICES

#### `send-welcome-email` - User Onboarding
```typescript
interface WelcomeEmailRequest {
  to: string;
  firstName: string;
  role: 'client' | 'coach' | 'admin';
  inviterName?: string;
  customMessage?: string;
}

// Email features:
- Role-specific welcome content
- Personalized messaging
- HTML and text versions
- Delivery confirmation tracking
- Bounce and spam monitoring
```

#### `send-invitation` - System Invitations
```typescript
interface InvitationRequest {
  email: string;
  role: string;
  inviter_id: string;
  organization_id?: string;
  custom_message?: string;
}

// Advanced features:
- Batch invitation processing
- Custom organization branding
- Expiration date management
- Reminder scheduling
- Acceptance tracking
```

#### `email-orchestrator` - Email Workflow Management
```typescript
interface EmailWorkflowRequest {
  workflow_type: 'onboarding' | 'assessment_reminder' | 'progress_update';
  user_id: string;
  trigger_data?: Record<string, any>;
}

// Workflow capabilities:
- Multi-step email sequences
- Conditional logic based on user actions
- A/B testing for email content
- Performance analytics
- Unsubscribe management
```

---

### 5. DATA PROCESSING

#### `analytics-processor` - Event Data Processing
```typescript
interface AnalyticsRequest {
  events: AnalyticsEvent[];
  batch_id?: string;
  process_immediately?: boolean;
}

// Processing capabilities:
- Real-time event processing
- Batch data aggregation
- User behavior analysis
- System performance metrics
- Anomaly detection
```

#### `data-migration` - System Data Migration
```typescript
interface MigrationRequest {
  migration_type: string;
  source_format: 'csv' | 'json' | 'database';
  target_tables: string[];
  validation_rules?: Record<string, any>;
}

// Migration features:
- Data validation and cleansing
- Incremental migration support
- Rollback capabilities
- Progress tracking
- Error handling and reporting
```

#### `error-logger` - Centralized Error Tracking
```typescript
interface ErrorLogRequest {
  error_type: string;
  error_message: string;
  stack_trace?: string;
  user_context?: Record<string, any>;
  system_context?: Record<string, any>;
}

// Error tracking features:
- Automatic error categorization
- Severity level assignment
- Alert threshold monitoring
- Integration with monitoring tools
- Performance impact analysis
```

---

### 6. SPECIALIZED FUNCTIONS

#### `total-pillar-reset` - Complete User Reset
```typescript
interface PillarResetRequest {
  user_id: string;
}

// Reset operations:
- Delete all assessment rounds
- Clear calendar actionables
- Remove AI coaching sessions
- Reset progress tracking
- Maintain audit trail
- Force UI refresh

// Security measures:
- User confirmation required
- Admin audit logging
- Irreversible operation warnings
- Data backup before deletion
```

#### `gdpr-processor` - Data Privacy Compliance
```typescript
interface GDPRRequest {
  request_type: 'export' | 'delete' | 'rectify';
  user_id: string;
  data_categories?: string[];
}

// GDPR compliance features:
- Complete data export in standard formats
- Secure data deletion with verification
- Data rectification workflows
- Consent management tracking
- Legal documentation generation
```

#### `global-search` - System-wide Search
```typescript
interface SearchRequest {
  query: string;
  user_id: string;
  scope: 'assessments' | 'memories' | 'recommendations' | 'all';
  filters?: Record<string, any>;
}

// Search capabilities:
- Full-text search across user data
- Semantic similarity search
- Permission-aware results
- Real-time indexing
- Search analytics
```

---

## 🔧 DEPLOYMENT CONFIGURATION

### Function Configuration (`supabase/config.toml`)
```toml
[functions.analyze-assessment]
verify_jwt = true

[functions.stefan-ai-chat]
verify_jwt = true

[functions.admin-create-user]
verify_jwt = true

[functions.send-welcome-email]
verify_jwt = false  # Can be called by system

[functions.error-logger]
verify_jwt = false  # Public error reporting
```

### Environment Variables
```bash
# Required for all functions
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# AI Functions
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Email Services
RESEND_API_KEY=your_resend_key
SMTP_HOST=your_smtp_host
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# External APIs
ANALYTICS_API_KEY=your_analytics_key
```

---

## 🚀 PERFORMANCE OPTIMIZATION

### Cold Start Optimization
```typescript
// Minimize cold start times
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Pre-initialize heavy dependencies
const supabaseClient = createClient(/* ... */);
const aiClient = new OpenAI(/* ... */);

// Cache frequent database queries
const queryCache = new Map();

serve(async (req) => {
  // Use cached clients and data
  // Implement connection pooling
  // Minimize synchronous operations
});
```

### Resource Management
```typescript
// Memory management for large datasets
async function processLargeDataset(data: any[]) {
  const chunkSize = 100;
  const results = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const processed = await processChunk(chunk);
    results.push(...processed);
    
    // Allow garbage collection
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return results;
}
```

### Database Optimization
```typescript
// Efficient database operations
async function batchDatabaseOperations(operations: any[]) {
  // Use transactions for consistency
  const { data, error } = await supabase.rpc('batch_operation', {
    operations: operations
  });
  
  // Implement connection pooling
  // Use prepared statements
  // Minimize round trips
}
```

---

## 🔒 SECURITY BEST PRACTICES

### Input Validation
```typescript
// Comprehensive input validation
function validateInput(data: any, schema: any): boolean {
  // Type checking
  // Range validation
  // Format verification
  // SQL injection prevention
  // XSS protection
  
  return isValid;
}
```

### Authentication & Authorization
```typescript
// Secure user verification
async function verifyUserAccess(request: Request): Promise<User | null> {
  const token = extractToken(request);
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const user = await validateToken(token);
  
  if (!user) {
    throw new Error('Invalid token');
  }
  
  return user;
}
```

### Data Protection
```typescript
// Sensitive data handling
function sanitizeOutput(data: any): any {
  // Remove sensitive fields
  // Encrypt confidential data
  // Apply data masking
  // Implement field-level security
  
  return sanitizedData;
}
```

---

## 📊 MONITORING & LOGGING

### Structured Logging
```typescript
// Comprehensive logging system
interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  function_name: string;
  user_id?: string;
  message: string;
  metadata?: Record<string, any>;
  performance?: {
    duration_ms: number;
    memory_usage: number;
  };
}

function log(entry: LogEntry) {
  console.log(JSON.stringify(entry));
}
```

### Performance Monitoring
```typescript
// Function performance tracking
async function withMonitoring<T>(
  functionName: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  const startMemory = Deno.memoryUsage().heapUsed;
  
  try {
    const result = await operation();
    
    const duration = performance.now() - startTime;
    const memoryDelta = Deno.memoryUsage().heapUsed - startMemory;
    
    log({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      function_name: functionName,
      message: 'Function completed successfully',
      performance: {
        duration_ms: duration,
        memory_usage: memoryDelta
      }
    });
    
    return result;
  } catch (error) {
    log({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      function_name: functionName,
      message: `Function failed: ${error.message}`
    });
    
    throw error;
  }
}
```

---

## 🧪 TESTING STRATEGIES

### Unit Testing
```typescript
// Function unit tests
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

Deno.test("analyze-assessment: should process valid input", async () => {
  const input = {
    user_id: "test-uuid",
    pillar_type: "self_care",
    answers: { q1: 5, q2: 3 }
  };
  
  const result = await processAssessment(input);
  
  assertEquals(result.success, true);
  assertEquals(typeof result.score, "number");
});
```

### Integration Testing
```typescript
// End-to-end function testing
Deno.test("full assessment workflow", async () => {
  // Create test user
  const user = await createTestUser();
  
  // Submit assessment
  const assessmentResult = await submitAssessment(user.id);
  
  // Verify analysis
  const analysis = await getAssessmentAnalysis(assessmentResult.id);
  
  // Check actionables creation
  const actionables = await getUserActionables(user.id);
  
  // Cleanup
  await deleteTestUser(user.id);
});
```

---

**CONCLUSION:** Edge Functions provide the serverless backbone for SHMMS, enabling scalable, secure, and performant server-side operations while maintaining a clean separation of concerns.

**For Development Teams:** This guide provides complete implementation patterns and best practices for building similar edge function architectures.
import { getAuth } from '@clerk/nextjs/server';
import { checkQuizQuestions } from './check-quiz-questions/utils';

export async function POST(req) {
  try {
    const { prompt, mode, messages: conversationHistory, userId: userIdFromBody } = await req.json();

    if (!prompt || !mode)
      return Response.json({ error: "Missing prompt or mode" }, { status: 400 });

    // Use only available models on OpenRouter
    const MODEL_MAP = {
      chatbot: "meta-llama/llama-3.1-8b-instruct",
      analyzer: "meta-llama/llama-3.1-8b-instruct", // Changed from unavailable model
      lesson: "meta-llama/llama-3.1-8b-instruct",
      quiz: "meta-llama/llama-3.1-8b-instruct", // Changed from unavailable model
      study_plan: "meta-llama/llama-3.1-8b-instruct", // Use reliable model
    };

    const model = MODEL_MAP[mode] || "meta-llama/llama-3.1-8b-instruct";

    // Check if the prompt contains quiz questions (only for chatbot mode)
    let isQuizQuestion = false;
    let quizCompleted = true;
    let hasIncompleteQuizzes = false;
    
    if (mode === 'chatbot') {
      try {
        // Try to get userId from auth first, then from body
        let userId;
        try {
          const auth = getAuth(req);
          userId = auth.userId;
        } catch (e) {
          // If getAuth fails, use userId from body
          userId = userIdFromBody;
        }
        
        if (userId) {
          // Call the check function with conversation history (only once)
          const checkResult = await checkQuizQuestions(userId, prompt, conversationHistory || []);
          isQuizQuestion = checkResult.isQuizQuestion || false;
          quizCompleted = checkResult.quizCompleted !== false;
          hasIncompleteQuizzes = checkResult.hasIncompleteQuizzes || false;
        }
      } catch (error) {
        console.error('Error checking quiz questions:', error);
        // Continue normally if check fails
      }
    }
    // Enhanced system prompt for study plans
    let systemPrompt = "You are an AI tutor assistant. You help students with their courses, explain concepts, answer questions, and guide their learning journey. Remember previous conversations and provide context-aware responses.";
    
    // Special handling for quiz questions that haven't been completed
    if (mode === 'chatbot' && isQuizQuestion && !quizCompleted) {
      systemPrompt = `You are an AI tutor assistant helping a student with their learning. 

CRITICAL RULES - YOU MUST FOLLOW THESE STRICTLY:

1. The student is asking about quiz questions or requesting quiz answers that they have NOT yet completed.

2. ABSOLUTE PROHIBITIONS - YOU MUST NEVER:
   - Provide direct answers to quiz questions
   - Reveal correct answers or solutions
   - Give hints that directly lead to the answer
   - Say "the answer is..." or "the correct answer is..."
   - Provide step-by-step solutions to quiz questions
   - Confirm if their guess is correct or wrong
   - Give multiple choice options with hints about which is correct

3. WHAT YOU SHOULD DO INSTEAD:
   - Politely decline to provide answers: "I can't provide answers to quiz questions you haven't completed yet, as that would compromise academic integrity."
   - Recommend relevant learning materials and lessons
   - Explain underlying concepts and principles (without solving the specific quiz question)
   - Suggest study strategies and review materials
   - Encourage them to review course content and complete the quiz themselves
   - Offer to explain related concepts that will help them understand the topic

4. RESPONSE EXAMPLES:
   - "I understand you're working on a quiz, but I can't provide direct answers to maintain academic integrity. However, I'd be happy to help you understand the underlying concepts. Would you like me to explain [related concept]?"
   - "While I can't give you the answer to quiz questions, I can help you prepare! Let's review [relevant topic] and the key concepts you should understand."
   - "I notice you're asking about quiz content. To help you learn effectively, I'd recommend reviewing [specific lesson/material]. This will help you understand the concepts needed to answer similar questions on your own."

5. MAINTAIN ACADEMIC INTEGRITY:
   - Always prioritize learning over providing answers
   - Be helpful and educational, but never compromise on quiz answer protection
   - If the student persists, politely but firmly redirect to learning resources



Remember: Your goal is to help them learn, not to help them cheat. Be supportive but firm about not providing quiz answers.`;
    } else if (mode === 'chatbot' && hasIncompleteQuizzes) {
      // General protection when student has incomplete quizzes
      systemPrompt = `You are an AI tutor assistant helping a student with their learning.

IMPORTANT CONTEXT: The student has incomplete quizzes in their courses.



ACADEMIC INTEGRITY RULES:
- If the student asks for answers to quiz questions (directly or indirectly), you MUST NOT provide them
- If they ask "what is the answer", "give me the answer", "solve this", etc. in the context of quizzes, politely decline
- Instead, offer to explain concepts, recommend study materials, and help them prepare
- Only provide answers or solutions if you're certain it's NOT related to an incomplete quiz


Be helpful and educational, but always maintain academic integrity. If unsure whether something is quiz-related, err on the side of caution and redirect to learning resources.`;
    }
    
    if (mode === 'study_plan') {
  systemPrompt = `You are an AI study planner. You MUST respond with ONLY valid JSON format.
  
  Required JSON structure:
  {
    "recommendation": "Study advice for the week",
    "focusAreas": ["area1", "area2", "area3"],
    "weeklySchedule": [
      {"day": "Mon", "tasks": ["task1", "task2"]},
      {"day": "Tue", "tasks": ["task1", "task2"]},
      {"day": "Wed", "tasks": ["task1"]},
      {"day": "Thu", "tasks": ["task1", "task2"]},
      {"day": "Fri", "tasks": ["review task"]},
      {"day": "Sat", "tasks": ["rest or light study"]},
      {"day": "Sun", "tasks": ["weekly review"]}
    ]
  }
  
  Important: Return tasks for ALL 7 days. Include variety - some learning, some practice, some review days.`;
}

    // Build messages array with conversation history
    let messagesToSend = [
      { 
        role: "system", 
        content: systemPrompt 
      }
    ];

    // If conversation history is provided (for chatbot mode), include it
    if (conversationHistory && Array.isArray(conversationHistory) && mode === 'chatbot') {
      // Filter out the system message if present, and add all conversation history
      const historyMessages = conversationHistory
        .filter(msg => msg.role !== 'system') // Remove any system messages from history
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      messagesToSend = [
        { role: "system", content: systemPrompt },
        ...historyMessages
      ];
    } else {
      // For non-chatbot modes or when no history, just send the current prompt
      messagesToSend.push({
        role: "user",
        content: prompt
      });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "AI Tutor App"
      },
      body: JSON.stringify({
        model,
        messages: messagesToSend,
        max_tokens: 1024,
        temperature: mode === 'study_plan' ? 0.3 : 0.7
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("OpenRouter Failure:", data);
      return Response.json({ 
        error: "AI service unavailable. Using fallback response.",
        details: data.error.message 
      }, { status: 500 });
    }

    const text = data.choices?.[0]?.message?.content || "No response from AI";

    return Response.json({ text });

  } catch (err) {
    console.error("AI Error:", err);
    return Response.json({ 
      error: "Server failure",
      details: err.message 
    }, { status: 500 });
  }
}
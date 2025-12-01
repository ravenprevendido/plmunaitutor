// app/api/ai/generate-quiz/route.js
export async function POST(req) {
  try {
    const { topic, difficulty = 'beginner', numberOfQuestions = 5 } = await req.json();

    if (!topic) {
      return Response.json({ error: "Topic is required" }, { status: 400 });
    }

    const prompt = `Generate a ${difficulty} level quiz about "${topic}" with ${numberOfQuestions} multiple choice questions.
    
    Requirements:
    - Each question should have 4 options (A, B, C, D)
    - Include the correct answer for each question
    - Make the questions practical and relevant to the topic
    - Format the response as valid JSON
    
    Response format:
    {
      "quizTitle": "Quiz about [topic]",
      "description": "Brief description of the quiz",
      "questions": [
        {
          "question": "Question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0
        }
      ]
    }`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "AI Tutor App"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [
          { 
            role: "system", 
            content: "You are an AI quiz generator. You MUST respond with ONLY valid JSON format. Do not include any explanations, comments, or text outside the JSON structure." 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        max_tokens: 2048,
        temperature: 0.3
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

    try {
      const quizData = JSON.parse(text);
      return Response.json({ quiz: quizData });
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return fallback quiz
      const fallbackQuiz = createFallbackQuiz(topic, numberOfQuestions);
      return Response.json({ quiz: fallbackQuiz });
    }

  } catch (err) {
    console.error("AI Quiz Generation Error:", err);
    return Response.json({ 
      error: "Server failure",
      details: err.message 
    }, { status: 500 });
  }
}

function createFallbackQuiz(topic, numberOfQuestions) {
  const questions = [];
  
  for (let i = 0; i < numberOfQuestions; i++) {
    questions.push({
      question: `What is an important concept about ${topic}?`,
      options: [
        "Basic principle A",
        "Advanced technique B", 
        "Fundamental concept C",
        "Key methodology D"
      ],
      correctAnswer: 2
    });
  }
  
  return {
    quizTitle: `Quiz about ${topic}`,
    description: `Test your knowledge about ${topic}`,
    questions: questions
  };
}
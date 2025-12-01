import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

export async function POST(req) {
  try {
    const { title, topic } = await req.json();

    if (!title || !topic) {
      return NextResponse.json({ error: 'Title and topic are required' }, { status: 400 });
    }

    // Generate assignment description and questions using AI
    const prompt = `Create a comprehensive assignment document for: "${title}".

Please provide:
1. A detailed assignment description with clear instructions, objectives, and requirements
2. What students should submit
3. Evaluation criteria
4. 5-10 questions related to the topic that students should answer or consider

Format the response as:
DESCRIPTION:
[detailed description]

QUESTIONS:
1. [question 1]
2. [question 2]
...`;

    // Call OpenRouter AI directly
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
            content: "You are an AI assistant that creates comprehensive assignment documents for educational purposes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2048,
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) {
      throw new Error('Failed to get AI response');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    // Parse the AI response to extract description and questions
    const descriptionMatch = content.match(/DESCRIPTION:\s*([\s\S]*?)(?:QUESTIONS:|$)/i);
    const questionsMatch = content.match(/QUESTIONS:([\s\S]*)/i);

    const description = descriptionMatch 
      ? descriptionMatch[1].trim() 
      : content.split('QUESTIONS:')[0].trim() || `Assignment: ${title}\n\nComplete this assignment following the instructions provided.`;

    const questionsText = questionsMatch 
      ? questionsMatch[1].trim() 
      : content.split('QUESTIONS:')[1]?.trim() || '';

    // Extract questions (numbered list)
    const questionLines = questionsText
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line && (line.match(/^\d+[\.\)]/) || line.startsWith('-')))
      .map(line => line.replace(/^\d+[\.\)]\s*/, '').replace(/^-\s*/, ''))
      .filter(line => line.length > 10); // Filter out very short lines

    // If no questions found, generate some default ones
    const questions = questionLines.length > 0 
      ? questionLines.slice(0, 10) // Limit to 10 questions
      : [
          `What are the key concepts related to ${topic}?`,
          `How would you apply ${topic} in a practical scenario?`,
          `What challenges might you encounter when working with ${topic}?`,
          `Explain the importance of ${topic} in your field.`,
          `What are the best practices for ${topic}?`
        ].slice(0, 5);

    // Create DOCX document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: title,
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Assignment Description
            new Paragraph({
              text: "Assignment Description",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 200 },
            }),
            ...description.split('\n').map(line => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: line || ' ',
                    size: 22, // 11pt
                  }),
                ],
                spacing: { after: 120 },
              })
            ),

            // Questions Section
            new Paragraph({
              text: "Questions",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            ...questions.map((question, index) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${index + 1}. ${question}`,
                    size: 22,
                    bold: false,
                  }),
                ],
                spacing: { after: 200 },
              })
            ),

            // Instructions
            new Paragraph({
              text: "Instructions",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Please answer all questions thoroughly and provide detailed explanations where required.",
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Submit your completed assignment by the deadline specified by your instructor.",
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),
          ],
        },
      ],
    });

    // Generate the document as a buffer
    const buffer = await Packer.toBuffer(doc);

    // Return as a downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${title.replace(/\s+/g, '_')}_Assignment.docx"`,
      },
    });

  } catch (error) {
    console.error('Error generating assignment document:', error);
    return NextResponse.json(
      { error: 'Failed to generate assignment document', details: error.message },
      { status: 500 }
    );
  }
}


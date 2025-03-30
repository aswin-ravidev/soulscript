import { NextRequest, NextResponse } from 'next/server';
import { MentalHealthClass } from '@/lib/models/JournalEntry';
import { predictMentalHealthClass } from '@/lib/ml-utils';

const mentalHealthClasses: MentalHealthClass[] = [
  'Anxiety',
  'Bipolar',
  'Depression',
  'Normal',
  'Personality disorder',
  'Stress',
  'Suicidal'
];

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Use the ML utility to get prediction from sentiment server
    const prediction = await predictMentalHealthClass(content);
    
    if (!prediction.success || !prediction.mentalHealthClass) {
      console.error('Failed to get prediction from sentiment server:', prediction.error);
      // Fallback to random if the server failed
      const randomIndex = Math.floor(Math.random() * mentalHealthClasses.length);
      const randomClass = mentalHealthClasses[randomIndex];
      
      // Log that we're using fallback
      console.log('Using fallback random sentiment:', randomClass);
      
      // Mock analysis response
      const analysis = `Based on the content of your journal entry, it appears you may be experiencing symptoms consistent with **${randomClass}**. This is an automated analysis and should not be considered as professional medical advice. Please consult with a mental health professional for proper evaluation and support.`;
      
      return NextResponse.json({
        analysis,
        mentalHealthClass: randomClass,
        fromModel: false
      });
    }
    
    // Use the prediction from the sentiment server
    const sentimentClass = prediction.mentalHealthClass;
    const confidence = prediction.confidence?.toFixed(2);
    
    // Log the successful prediction
    console.log('Got prediction from sentiment server:', sentimentClass, 'confidence:', confidence);
    
    // Create analysis response with the prediction
    const analysis = `Based on the content of your journal entry, it appears you may be experiencing symptoms consistent with **${sentimentClass}** (confidence: ${confidence}). This is an automated analysis and should not be considered as professional medical advice. Please consult with a mental health professional for proper evaluation and support.`;

    return NextResponse.json({
      analysis,
      mentalHealthClass: sentimentClass,
      confidence: prediction.confidence,
      fromModel: true
    });
  } catch (error) {
    console.error('Error in analyze API:', error);
    return NextResponse.json({ error: 'Failed to analyze content' }, { status: 500 });
  }
} 
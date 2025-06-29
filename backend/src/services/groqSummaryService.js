const axios = require('axios');

class GroqSummaryService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.baseURL = 'https://api.groq.com/openai/v1/chat/completions';
    this.model = 'llama3-70b-8192'; // Using Llama 3 70B for better summarization
  }

  async generateSummary(transcriptText, meetingInfo) {
    try {
      console.log('Starting Groq summary generation...');
      console.log(`Text length: ${transcriptText.length} characters`);
      console.log(`Meeting ID: ${meetingInfo.zoomMeetingId}`);
      
      if (!this.apiKey) {
        throw new Error('GROQ_API_KEY environment variable is not set');
      }

      // Split text into chunks if too long (Groq has token limits)
      const chunks = this.chunkText(transcriptText, 6000); // Conservative chunk size
      console.log(`Text split into ${chunks.length} chunks`);
      
      let summaries = [];
      
      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Processing chunk ${i + 1}/${chunks.length}...`);
        const chunkSummary = await this.summarizeChunk(chunks[i], i, chunks.length, meetingInfo);
        summaries.push(chunkSummary);
      }
      
      // If multiple chunks, create a final consolidated summary
      let finalSummary;
      if (summaries.length > 1) {
        console.log('Consolidating multiple chunk summaries...');
        finalSummary = await this.consolidateSummaries(summaries, meetingInfo);
      } else {
        finalSummary = summaries[0];
      }
      
      // Generate the full summary text file content
      const fullSummaryText = this.formatSummaryForFile(finalSummary, meetingInfo, transcriptText);
      
      console.log('Summary generation completed');
      console.log(`Final summary length: ${finalSummary.length} characters`);
      
      return {
        summary: finalSummary,
        fullSummaryText: fullSummaryText,
        chunkCount: chunks.length,
        originalLength: transcriptText.length
      };
      
    } catch (error) {
      console.error('Groq summary generation error:', error);
      throw new Error(`Summary generation failed: ${error.message}`);
    }
  }

  async summarizeChunk(text, chunkIndex, totalChunks, meetingInfo) {
    const prompt = this.buildSummarizationPrompt(text, chunkIndex, totalChunks, meetingInfo);
    
    try {
      const response = await axios.post(this.baseURL, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert meeting summarizer. Create clear, concise, and actionable summaries of meeting transcripts.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        top_p: 0.9
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from Groq API');
      }

      const summary = response.data.choices[0].message.content.trim();
      console.log(`Chunk ${chunkIndex + 1} summary generated (${summary.length} chars)`);
      
      return summary;
      
    } catch (error) {
      console.error(`Error summarizing chunk ${chunkIndex + 1}:`, error.response?.data || error.message);
      throw new Error(`Failed to summarize chunk ${chunkIndex + 1}: ${error.message}`);
    }
  }

  async consolidateSummaries(summaries, meetingInfo) {
    const consolidationPrompt = `
Please consolidate these meeting summary parts into one comprehensive summary:

Meeting: ${meetingInfo.meetingTitle || 'Zoom Meeting'} (ID: ${meetingInfo.zoomMeetingId})

Summary Parts:
${summaries.map((summary, index) => `\n--- Part ${index + 1} ---\n${summary}`).join('\n')}

Create a consolidated summary that includes:
1. Executive Summary (2-3 sentences)
2. Key Discussion Points
3. Decisions Made
4. Action Items
5. Next Steps
6. Important Notes

Make it clear, concise, and actionable.
`;

    try {
      const response = await axios.post(this.baseURL, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at consolidating meeting summaries. Create a unified, comprehensive summary from multiple parts.'
          },
          {
            role: 'user',
            content: consolidationPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2500,
        top_p: 0.8
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid consolidation response from Groq API');
      }

      return response.data.choices[0].message.content.trim();
      
    } catch (error) {
      console.error('Error consolidating summaries:', error.response?.data || error.message);
      // Fallback: join summaries with headers
      return summaries.map((summary, index) => `Part ${index + 1}:\n${summary}`).join('\n\n');
    }
  }

  buildSummarizationPrompt(text, chunkIndex, totalChunks, meetingInfo) {
    const chunkInfo = totalChunks > 1 ? ` (Part ${chunkIndex + 1} of ${totalChunks})` : '';
    
    return `
Please analyze and summarize this meeting transcript${chunkInfo}:

Meeting Information:
- Meeting ID: ${meetingInfo.zoomMeetingId}
- Title: ${meetingInfo.meetingTitle || 'Zoom Meeting'}
- Hash: ${meetingInfo.meetingHash}

Transcript:
${text}

Please provide a comprehensive summary that includes:

1. **Executive Summary**: A brief 2-3 sentence overview of the meeting
2. **Key Discussion Points**: Main topics discussed (bullet points)
3. **Decisions Made**: Any decisions or conclusions reached
4. **Action Items**: Tasks assigned or agreed upon, with responsible parties if mentioned
5. **Next Steps**: Follow-up actions or future meetings planned
6. **Important Notes**: Any other significant information, deadlines, or concerns

Format your response clearly with headers and bullet points for easy reading.
If this is part of a larger transcript, focus on the content in this section but maintain context awareness.
`;
  }

  formatSummaryForFile(summary, meetingInfo, originalTranscript) {
    const timestamp = new Date().toISOString();
    const stats = this.calculateStats(originalTranscript);
    
    return `
===============================================
MEETING SUMMARY
===============================================

Meeting Information:
- Zoom Meeting ID: ${meetingInfo.zoomMeetingId}
- Meeting Title: ${meetingInfo.meetingTitle || 'Zoom Meeting'}
- Meeting Hash: ${meetingInfo.meetingHash}
- Generated: ${timestamp}

Transcript Statistics:
- Total Characters: ${stats.characters}
- Total Words: ${stats.words}
- Estimated Duration: ${stats.estimatedDuration} minutes
- Lines of Dialogue: ${stats.lines}

===============================================
SUMMARY
===============================================

${summary}

===============================================
ORIGINAL TRANSCRIPT
===============================================

${originalTranscript}

===============================================
Generated by Groq AI Summary Service
Hash: ${meetingInfo.meetingHash}
===============================================
`;
  }

  calculateStats(text) {
    const characters = text.length;
    const words = text.split(/\s+/).filter(word => word.length > 0).length;
    const lines = text.split('\n').filter(line => line.trim().length > 0).length;
    const estimatedDuration = Math.ceil(words / 150); // ~150 words per minute speaking
    
    return {
      characters,
      words,
      lines,
      estimatedDuration
    };
  }

  chunkText(text, maxChunkSize) {
    if (text.length <= maxChunkSize) {
      return [text];
    }
    
    const chunks = [];
    let currentChunk = '';
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
}

module.exports = new GroqSummaryService();
import json
import sys
import os
from typing import Dict, List
import spacy
import nltk
from transformers import pipeline
from dotenv import load_dotenv
import requests

load_dotenv()

class ElizaAgent:
    def __init__(self):
        # Load NLP models
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("Please install spacy English model: python -m spacy download en_core_web_sm")
            sys.exit(1)
        
        # Initialize transformers pipeline for summarization
        self.summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
        
        # Download required NLTK data
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        
    def extract_topics(self, text: str) -> List[str]:
        """Extract key topics from transcript using NER and keyword extraction"""
        doc = self.nlp(text)
        
        # Extract named entities
        entities = [ent.text for ent in doc.ents if ent.label_ in ['PERSON', 'ORG', 'PRODUCT', 'EVENT']]
        
        # Extract noun phrases as potential topics
        noun_phrases = [chunk.text for chunk in doc.noun_chunks if len(chunk.text.split()) > 1]
        
        # Combine and deduplicate
        topics = list(set(entities + noun_phrases))
        
        # Return top 10 most relevant topics
        return topics[:10]
    
    def extract_action_items(self, text: str) -> List[str]:
        """Extract action items from transcript"""
        doc = self.nlp(text)
        action_items = []
        
        # Look for action-oriented patterns
        action_patterns = [
            "need to", "should", "must", "will", "going to",
            "action item", "follow up", "next step", "todo"
        ]
        
        sentences = [sent.text.strip() for sent in doc.sents]
        
        for sentence in sentences:
            sentence_lower = sentence.lower()
            if any(pattern in sentence_lower for pattern in action_patterns):
                if len(sentence) < 200:  # Keep reasonable length
                    action_items.append(sentence)
        
        return action_items[:5]  # Return top 5 action items
    
    def generate_summary(self, text: str) -> str:
        """Generate summary using BART model"""
        try:
            # Split text into chunks if too long
            max_chunk_length = 1024
            chunks = [text[i:i+max_chunk_length] for i in range(0, len(text), max_chunk_length)]
            
            summaries = []
            for chunk in chunks[:3]:  # Process max 3 chunks to avoid timeout
                if len(chunk.strip()) > 50:  # Skip very short chunks
                    summary = self.summarizer(chunk, max_length=150, min_length=30, do_sample=False)
                    summaries.append(summary[0]['summary_text'])
            
            return " ".join(summaries)
        except Exception as e:
            print(f"Summarization error: {e}")
            # Fallback: return first few sentences
            doc = self.nlp(text)
            sentences = [sent.text for sent in doc.sents]
            return " ".join(sentences[:3])
    
    def analyze_sentiment(self, text: str) -> Dict:
        """Analyze overall sentiment of the meeting"""
        # Simple sentiment analysis using spaCy
        doc = self.nlp(text)
        
        # Count positive/negative words (simplified approach)
        positive_words = ['good', 'great', 'excellent', 'positive', 'agree', 'success', 'happy']
        negative_words = ['bad', 'terrible', 'negative', 'disagree', 'problem', 'issue', 'concern']
        
        tokens = [token.text.lower() for token in doc if not token.is_stop and not token.is_punct]
        
        positive_count = sum(1 for token in tokens if token in positive_words)
        negative_count = sum(1 for token in tokens if token in negative_words)
        
        if positive_count > negative_count:
            sentiment = "Positive"
        elif negative_count > positive_count:
            sentiment = "Negative"
        else:
            sentiment = "Neutral"
        
        return {
            "sentiment": sentiment,
            "positive_score": positive_count,
            "negative_score": negative_count
        }
    
    def process_transcript(self, transcript_text: str) -> Dict:
        """Main processing function"""
        print("Processing transcript with ElizaOS agent...")
        
        # Extract various insights
        topics = self.extract_topics(transcript_text)
        action_items = self.extract_action_items(transcript_text)
        summary = self.generate_summary(transcript_text)
        sentiment = self.analyze_sentiment(transcript_text)
        
        # Calculate meeting statistics
        word_count = len(transcript_text.split())
        doc = self.nlp(transcript_text)
        sentence_count = len(list(doc.sents))
        
        result = {
            "summary": summary,
            "topics": topics,
            "actionItems": action_items,
            "sentiment": sentiment,
            "statistics": {
                "wordCount": word_count,
                "sentenceCount": sentence_count,
                "estimatedDuration": f"{word_count // 150} minutes"  # ~150 words per minute
            },
            "timestamp": str(pd.Timestamp.now())
        }
        
        return result

def main():
    if len(sys.argv) != 2:
        print("Usage: python eliza_agent.py <transcript_file_path>")
        sys.exit(1)
    
    transcript_file = sys.argv[1]
    
    if not os.path.exists(transcript_file):
        print(f"Error: Transcript file {transcript_file} not found")
        sys.exit(1)
    
    # Read transcript
    with open(transcript_file, 'r', encoding='utf-8') as f:
        transcript_text = f.read()
    
    # Initialize agent and process
    agent = ElizaAgent()
    result = agent.process_transcript(transcript_text)
    
    # Output result as JSON
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    import pandas as pd
    main()
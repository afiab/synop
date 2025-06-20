// Load environment variables from .env file
require('dotenv').config();

// Import necessary modules
const express = require('express');
const cors = require('cors');
const axios = require('axios'); // For making HTTP requests (e.g., to fetch URL content)
const cheerio = require('cheerio'); // For parsing HTML content fetched from URLs
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Google Gemini API SDK

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000

// --- Google Gemini API Configuration ---
// Make sure GEMINI_API_KEY is set in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Use "gemini-pro" for text-only tasks

// --- Middleware Setup ---
// Enable CORS for all origins. This is crucial for your React frontend to communicate with your Node.js backend.
app.use(cors({
  origin: 'http://localhost:5173', // <--- THIS IS THE CRITICAL CHANGE!
  methods: ['GET', 'POST', 'OPTIONS'], // Allow these HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow these headers
}));
// Enable Express to parse JSON formatted request bodies
app.use(express.json());

// --- Helper Function: Extract text from a URL ---
// This function fetches HTML from a given URL and tries to extract meaningful text content.
async function extractTextFromUrl(url) {
  try {
    const { data } = await axios.get(url); // Fetch the HTML content
    const $ = cheerio.load(data); // Load the HTML into Cheerio for parsing

    // Attempt to get main article content from common HTML selectors.
    // This is a common strategy, but some sites might use different structures.
    const articleText = $('article').text() ||        // Common for blog posts, news articles
                       $('main').text() ||          // HTML5 main content tag
                       $('.post-content').text() || // WordPress/blog specific class
                       $('.entry-content').text() || // Another common blog/CMS class
                       $('body').text();           // Fallback to entire body text

    // Clean up extra whitespace and return
    return articleText.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('Error extracting text from URL:', error.message);
    // Provide a user-friendly error message if URL fetching/parsing fails
    throw new Error('Could not fetch or parse content from the provided URL. Ensure it\'s a publicly accessible article and not behind a login/paywall.');
  }
}

// --- API Endpoint: Summarize Text/Article ---
app.post('/summarize', async (req, res) => {
  const { text } = req.body; // Get the input text/URL from the request body

  // Input validation
  if (!text) {
    return res.status(400).json({ error: 'Text or URL is required in the request body.' });
  }

  let contentToSummarize = text;

  // If the input looks like a URL, try to fetch and extract text from it
  if (text.startsWith('http://') || text.startsWith('https://')) {
    try {
      contentToSummarize = await extractTextFromUrl(text);

      // Basic validation of extracted content to ensure it's not empty or too short
      if (contentToSummarize.length < 200) { // Require at least 200 characters for meaningful summarization
          throw new Error('Extracted content from URL was too short or failed to parse meaningful article text. Please try another URL or paste text directly.');
      }

      // Optional: Truncate very long articles to fit within Gemini's token limits.
      // Gemini-Pro has a ~32,000 token context window. 25,000 characters is a safe estimate.
      const maxContentLength = 25000;
      if (contentToSummarize.length > maxContentLength) {
          contentToSummarize = contentToSummarize.substring(0, maxContentLength) + '\n\n... [Content truncated for summarization due to length]';
          console.warn('Article content truncated due to exceeding max processing length.');
      }

    } catch (urlError) {
      // If there's an error in URL extraction, send it back to the frontend
      return res.status(400).json({ error: urlError.message });
    }
  }

  // --- Google Gemini API Call ---
  try {
    // This is the detailed prompt to guide Gemini to generate "meeting notes"
    const prompt = `Based on the following article/text, generate structured meeting notes. The notes should include a clear "Key Topics Covered:" section and a "Key Learnings/Takeaways:" section. Use bullet points for each item.

**Article/Text for Summary:**
${contentToSummarize}

---

**Meeting Notes from Article:**

**Key Topics Covered:**
* **Key Learnings/Takeaways:**
* Please ensure:
1.  Each section (Key Topics, Key Learnings) has at least 3-5 concise and impactful bullet points if the content allows.
2.  Bullet points should be clear, informative, and directly relevant to the article's content.
3.  Do not include any conversational filler, disclaimers, or introductory/concluding sentences outside the requested structured format.
4.  If a section cannot be meaningfully filled (e.g., no explicit learnings), simply write "N/A" or "No specific points identified" under that heading.`;

    // Make the API call to Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text(); // Extract the generated text from the response

    // Send the generated summary back to the frontend
    res.json({ summary });

  } catch (geminiApiError) {
    console.error('Error calling Google Gemini API:', geminiApiError); // Log the full error for debugging

    let errorMessage = 'Failed to summarize text using Google Gemini. Please check your API key, try again later, or review backend logs.';

    // Provide more specific error messages based on common Gemini errors
    if (geminiApiError.message) {
        if (geminiApiError.message.includes('API key not valid') || geminiApiError.message.includes('permission denied')) {
            errorMessage = 'Gemini API Error: Your API key might be invalid or improperly configured. Double-check your .env file and Google AI Studio settings.';
        } else if (geminiApiError.message.includes('quota exceeded') || geminiApiError.message.includes('Resource has been exhausted')) {
            errorMessage = 'Gemini API Error: You have exceeded your usage quota. Please check your Google Cloud Console for billing/usage details or try again later.';
        } else if (geminiApiError.message.includes('blocked') || geminiApiError.message.includes('safety')) {
            errorMessage = 'Gemini API Error: The content violated safety policies or was blocked. Please try a different input or adjust content.';
        } else if (geminiApiError.message.includes('timeout')) {
            errorMessage = 'Gemini API Error: The request timed out. This can happen with very long prompts or network issues. Please try again.';
        }
    }
    res.status(500).json({ error: errorMessage });
  }
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
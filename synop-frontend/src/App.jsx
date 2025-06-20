// synop-frontend/src/App.js
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown'; // <-- NEW IMPORT
import remarkGfm from 'remark-gfm';       // <-- NEW IMPORT
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const summarizeArticle = async () => {
    setError('');
    setSummary('');
    setIsLoading(true);

    try {
      // Ensure this matches your backend port (likely 5001)
      const response = await fetch('http://localhost:5001/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // You might see the specific Gemini error here now
        throw new Error(errorData.error || 'Something went wrong on the server.');
      }

      const data = await response.json();
      setSummary(data.summary); // This `summary` should be your markdown string
    } catch (err) {
      console.error('Error fetching summary:', err);
      setError(err.message || 'Failed to get summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1><span class="sitename">Synop</span>: AI Article Summarizer</h1>
        <p>Paste an article URL or text below to get a quick summary.</p>
      </header>

      <div className="input-section">
        <textarea
          placeholder="Paste your article text or URL here..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows="15"
        />
        <button onClick={summarizeArticle} disabled={isLoading || inputText.trim() === ''}>
          {isLoading ? 'Summarizing...' : 'Summarize'}
        </button>
      </div>

      {error && <p className="error-message">Error: {error}</p>}

      {summary && (
        <div className="summary-section">
          <h2>Summary:</h2>
          {/* Use ReactMarkdown here to render the markdown content */}
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown> {/* <-- NEW USAGE */}
        </div>
      )}

      {!summary && !isLoading && !error && (
        <p className="placeholder-message">Your summary will appear here.</p>
      )}
    </div>
  );
}

export default App;
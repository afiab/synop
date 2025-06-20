// swiftsum-frontend/src/App.js
import React, { useState } from 'react';
import './App.css'; // We'll add some basic CSS later

function App() {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const summarizeArticle = async () => {
    setError(''); // Clear previous errors
    setSummary(''); // Clear previous summary
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5001/summarize', { // Make sure this matches your backend port
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong on the server.');
      }

      const data = await response.json();
      setSummary(data.summary);
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
        <h1>SwiftSum: AI Article Summarizer</h1>
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
          <p>{summary}</p>
        </div>
      )}

      {!summary && !isLoading && !error && (
        <p className="placeholder-message">Your summary will appear here.</p>
      )}
    </div>
  );
}

export default App;
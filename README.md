# synop

## What is it and why?
This is an article summarizer, but it prioritizes providing meaningful output in a meeting notes format. So instead of just a general summary, you'll get notes on what topics are covered in the article and the key takeaways you should get by reading it.

I made this because I've found some articles to be unnecessarily lengthy with filler, and some summarizers weren't giving me the results I was looking for. This is a more efficient summarizer for me because it gives me the more valuable contents of the article.

The site is also mobile friendly, which is convinient if you're looking for a quick summary on your phone or on the go.

## Demo
(to be added)

## Tech Stack
Frontend: Reactjs

Backend: Expressjs and Nodejs

API: Google Gemini 2.0 Flash API

## Running locally
If you have your own api key, then running locally can be a better choice so that you don't reach the daily free tier limits of the api I'm using. 

Start by locally cloning this repository. Next, add the necessary installations using the command below. You must have node installed for this to work.

```npm install express dotenv cors axios cheerio @google/generative-ai```

This is an explanation for the installations:

- express: web framework
- dotenv: load environment variables for API key
- axios: make http requests to get article
- cheerio: manipulate HTML
- @google/generative-ai: this project uses the Google Gemini API

Now put your Gemini API Key in the `synop-backend/.env` file by replacing the "api_key_here" portion of the first line.

Finally, run these last two commands to get the site running locally:

```cd synop-backend; node server.js```
```cd synop-frontend; npm run dev```

Now the site will be running on localhost 5173
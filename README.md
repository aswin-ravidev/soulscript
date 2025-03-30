# SoulScript

A mental health journaling and therapy management platform.

## Features

- **Journaling**: Users can create and manage personal journal entries
- **Sentiment Analysis**: Journal entries are analyzed to detect mental health patterns
- **Appointment Management**: Therapists can schedule and manage appointments
- **User Management**: Profile settings and password management
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Anaconda with Python 3.8+ and torch_env environment (for sentiment analysis)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/soulscript.git
cd soulscript
```

2. Install dependencies:

```bash
npm install
```

3. Make sure you have Anaconda installed with the torch_env environment set up.
   The conda path is currently set to: `C:\Users\aswin\anaconda3\Scripts\conda.exe`
   You may need to modify this path in `lib/ml-models/start_anaconda_server.js` 
   if your Anaconda installation is in a different location.

### Development

1. Start the development server with sentiment analysis:

```bash
npm run dev-with-sentiment
```

This will start both the sentiment analysis server using Anaconda and the Next.js development server.

2. Or start just the Next.js server (sentiment analysis will use random assignment):

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Sentiment Analysis

The application uses a PyTorch neural network to classify journal entries into one of seven mental health categories:
- Anxiety
- Bipolar
- Depression 
- Normal
- Personality disorder
- Stress
- Suicidal

### Testing the Sentiment Server

You can test the sentiment analysis server to ensure it's working correctly:

```bash
npm run test-sentiment
```

This will start the sentiment server and provide an interactive interface to test with sample texts or your own input.

### Fallback Mechanism

If the sentiment server is not available, the application will automatically fall back to a random sentiment assignment to ensure the app continues to function.

## Project Structure

- `/app` - Next.js application routes and components
- `/components` - Reusable UI components
- `/lib` - Utility functions and models
  - `/lib/ml-models` - Machine learning model and server
- `/public` - Static assets
- `/styles` - Global CSS styles

## Technologies

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **ML Model**: PyTorch, Flask (for serving model predictions)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
# AI Job Automator 🚀

A comprehensive AI-powered job search automation platform that helps job seekers streamline their application process, prepare for interviews, and optimize their career prospects using advanced AI technologies.

## ✨ Features

### 🔐 Authentication
- Secure user authentication powered by Clerk
- Protected routes and user session management

### 📊 Dashboard & Analytics
- Personalized dashboard with job search metrics
- Application tracking and status monitoring
- Visual analytics for job search progress

### 🎯 Job Search Tools
- **Job Analysis**: AI-powered job posting analysis
- **Resume Builder**: Create tailored resumes for specific positions
- **Cover Letter Generator**: Generate personalized cover letters
- **Easy Apply**: Streamlined application process

### 🎤 Interview Preparation
- **Mock Interviews**: Practice with AI-generated questions
- **Video Mock Interviews**: Record and review your performance
- **Interview Prep**: Get insights about company and role-specific questions

### 💼 Career Development
- **Skills Gap Analysis**: Identify areas for improvement
- **Career Planner**: AI-guided career path recommendations
- **Networking Assistant**: Professional networking guidance
- **Negotiation Coach**: Salary and offer negotiation strategies

### 📧 Communication Tools
- **Follow-up Emails**: Automated follow-up email generation
- **Company Briefing**: Research and insights about target companies

### 📱 User Experience
- Responsive design for desktop and mobile
- Modern, intuitive interface
- Real-time notifications and updates

## 🛠️ Tech Stack

- **Frontend**: React 19 with TypeScript
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **AI Integration**: Google Gemini API
- **Charts**: Recharts
- **Build Tool**: Vite
- **Package Manager**: npm

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key
- Clerk account for authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI-Job-Automator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your API keys:
   ```env
   # Google Gemini API Key
   # Get from: https://makersuite.google.com/app/apikey
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Clerk Authentication Keys
   # Get from: https://dashboard.clerk.com/
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
   CLERK_SECRET_KEY=your_clerk_secret_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173` to see the application.

## 🔑 API Keys Setup

### Google Gemini API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `GEMINI_API_KEY`

### Clerk Authentication
1. Sign up at [Clerk](https://dashboard.clerk.com/)
2. Create a new application
3. Copy the publishable key and secret key
4. Add them to your `.env` file

## 📁 Project Structure

```
AI-Job-Automator/
├── components/          # Reusable UI components
├── contexts/           # React context providers
├── screens/            # Main application screens
├── services/           # API services and utilities
├── types.ts           # TypeScript type definitions
├── constants.ts       # Application constants
├── App.tsx           # Main application component
└── index.tsx         # Application entry point
```

## 🎯 Usage

1. **Sign Up/Sign In**: Create an account or sign in using Clerk authentication
2. **Dashboard**: View your job search overview and statistics
3. **Job Analysis**: Paste job postings to get AI-powered insights
4. **Resume Building**: Create tailored resumes for specific positions
5. **Interview Prep**: Practice with mock interviews and get feedback
6. **Track Applications**: Monitor your job application status
7. **Career Planning**: Get AI-guided career development recommendations

## 🔒 Security

- Environment variables are used for sensitive data
- `.env` files are excluded from version control
- Secure authentication with Clerk
- API keys are properly protected

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions, please open an issue on GitHub or contact the development team.

---

**Happy Job Hunting! 🎉**

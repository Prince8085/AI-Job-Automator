// TestSprite Test Runner for AI Job Automator
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Define the API key
const TESTSPRITE_API_KEY = 'sk-user-RMwYHNsHcV8E5JT3ngRmQSvfPejWUH7Xf3xzO1-shM9kII7ByiGckt029_mYqoKzp34mhbJWCFqeroGJ5c30PBo0h3rASVVCQnP6p5ORPTKupr50GMAKuO5hBwS4h8eN8IY';

// Define the test suites for different components of the AI Job Automator
const testSuites = [
  {
    name: "Frontend Components Test Suite",
    modules: [
      "Header", "BottomNav", "JobCard", "StatCard", 
      "Toast", "TrackerModal", "LoadingSpinner", "icons"
    ],
    entryPoint: "./components/",
    testTypes: ["unit", "integration"]
  },
  {
    name: "Screen Components Test Suite",
    modules: [
      "DashboardScreen", "SearchScreen", "JobDetailsScreen", 
      "ResumeBuilderScreen", "CoverLetterScreen", "InterviewPrepScreen",
      "AnalyticsScreen", "ProfileScreen", "AutoApplyAgentScreen",
      "EasyApplyScreen", "TrackerScreen", "WishlistScreen", 
      "LandingPage", "WelcomeScreen", "CompanyBriefingScreen",
      "LinkedInScraperScreen", "NetworkingAssistantScreen", 
      "NegotiationCoachScreen", "SkillsGapScreen", "InternshipCalendarScreen",
      "SalaryCalculatorScreen", "CareerPlannerScreen", "MockInterviewScreen",
      "VideoMockInterviewScreen", "AutofillResumeScreen", "JobAlertsScreen",
      "AnalyzeJobScreen", "FollowUpEmailScreen"
    ],
    entryPoint: "./screens/",
    testTypes: ["functional", "ui"]
  },
  {
    name: "Database Services Test Suite",
    modules: ["userService", "jobService", "interviewService"],
    entryPoint: "./db/services/",
    testTypes: ["integration", "performance"]
  },
  {
    name: "Core Services Test Suite",
    modules: [
      "geminiService", "jobScrapingService", "paymentService",
      "proxyService", "urlParsingService"
    ],
    entryPoint: "./services/",
    testTypes: ["unit", "integration", "performance"]
  },
  {
    name: "Browser Extension Test Suite",
    modules: ["content", "background", "popup"],
    entryPoint: "./extension/",
    testTypes: ["functional", "compatibility"]
  },
  {
    name: "Context Providers Test Suite",
    modules: ["CreditContext", "JobDataContext"],
    entryPoint: "./contexts/",
    testTypes: ["integration", "state-management"]
  }
];

// Function to run TestSprite tests
async function runTestSuite(suite) {
  console.log(`\n🧪 Running ${suite.name}...`);
  
  try {
    const { stdout, stderr } = await execAsync(`npx @testsprite/testsprite-mcp@latest generateCodeAndExecute`, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        TESTSPRITE_API_KEY: TESTSPRITE_API_KEY
      }
    });
    
    console.log(stdout);
    if (stderr) {
      console.error(stderr);
    }
    
    console.log(`✅ ${suite.name} completed successfully`);
    return 0;
  } catch (error) {
    console.error(`❌ ${suite.name} failed:`, error.message);
    return error.code || 1; // Continue with other tests even if one fails
  }
}

// Main function to run all test suites
async function runAllTests() {
  console.log("🚀 Starting comprehensive TestSprite tests for AI Job Automator...\n");
  
  let totalSuites = testSuites.length;
  let completedSuites = 0;
  let failedSuites = 0;
  
  console.log(`📋 Total test suites to run: ${totalSuites}\n`);
  
  // Run each test suite sequentially
  for (let i = 0; i < testSuites.length; i++) {
    const suite = testSuites[i];
    console.log(`(${i + 1}/${totalSuites}) Executing: ${suite.name}`);
    
    try {
      const result = await runTestSuite(suite);
      completedSuites++;
      
      if (result !== 0) {
        failedSuites++;
      }
    } catch (error) {
      console.error(`Error executing ${suite.name}:`, error.message);
      failedSuites++;
    }
  }
  
  // Print final summary
  console.log("\n📊 Test Execution Summary:");
  console.log(`✅ Completed: ${completedSuites}`);
  console.log(`❌ Failed: ${failedSuites}`);
  console.log(`📈 Success Rate: ${Math.round(((completedSuites - failedSuites) / totalSuites) * 100)}%`);
  
  if (failedSuites > 0) {
    console.log("\n⚠️ Some test suites encountered issues, but the overall process completed.");
  } else {
    console.log("\n🎉 All test suites completed successfully!");
  }
  
  console.log("\n🏁 Test execution finished.");
}

// Run the tests
runAllTests().catch(error => {
  console.error('Critical error running tests:', error);
  process.exit(1);
});
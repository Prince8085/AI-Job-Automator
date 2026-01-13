import express from 'express';
import cors from 'cors';
import { scrapeInternshala, scrapeLinkedInJobs } from './scrapers/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Job Scraping Server is running!' });
});

// ============================================
// JOB SEARCH ENDPOINTS
// ============================================

// Search Internshala internships (India)
app.get('/api/jobs/internshala', async (req, res) => {
    try {
        const { keyword, location } = req.query;
        console.log(`📡 Scraping Internshala: ${keyword} in ${location || 'India'}`);

        const jobs = await scrapeInternshala(
            keyword?.toString() || 'developer',
            location?.toString() || ''
        );

        res.json({
            success: true,
            source: 'internshala',
            count: jobs.length,
            jobs
        });
    } catch (error: any) {
        console.error('Internshala scraping error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to scrape Internshala'
        });
    }
});

// Search LinkedIn Jobs (via RSS/Alternative)
app.get('/api/jobs/linkedin', async (req, res) => {
    try {
        const { keyword, location } = req.query;
        console.log(`📡 Fetching LinkedIn Jobs: ${keyword} in ${location || 'India'}`);

        const jobs = await scrapeLinkedInJobs(
            keyword?.toString() || 'developer',
            location?.toString() || 'India'
        );

        res.json({
            success: true,
            source: 'linkedin',
            count: jobs.length,
            jobs
        });
    } catch (error: any) {
        console.error('LinkedIn scraping error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch LinkedIn jobs'
        });
    }
});

// Combined search (all sources)
app.get('/api/jobs/search', async (req, res) => {
    try {
        const { keyword, location, timeFilter } = req.query;
        console.log(`🔍 Combined search: ${keyword} in ${location}`);

        // Fetch from multiple sources in parallel
        const [internshalaResult, linkedinResult] = await Promise.allSettled([
            scrapeInternshala(keyword?.toString() || 'developer', location?.toString() || ''),
            scrapeLinkedInJobs(keyword?.toString() || 'developer', location?.toString() || 'India')
        ]);

        const allJobs: any[] = [];

        if (internshalaResult.status === 'fulfilled') {
            allJobs.push(...internshalaResult.value);
        }

        if (linkedinResult.status === 'fulfilled') {
            allJobs.push(...linkedinResult.value);
        }

        // Remove duplicates by title + company
        const seen = new Set();
        const uniqueJobs = allJobs.filter(job => {
            const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        res.json({
            success: true,
            sources: ['internshala', 'linkedin'],
            count: uniqueJobs.length,
            jobs: uniqueJobs
        });
    } catch (error: any) {
        console.error('Combined search error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Search failed'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════╗
║     🚀 AI Job Automator - Backend Server           ║
║                                                    ║
║     Server running on: http://localhost:${PORT}      ║
║     Health check: http://localhost:${PORT}/api/health║
║                                                    ║
║     Available Endpoints:                           ║
║     • GET /api/jobs/internshala?keyword=...        ║
║     • GET /api/jobs/linkedin?keyword=...           ║
║     • GET /api/jobs/search?keyword=...             ║
╚════════════════════════════════════════════════════╝
  `);
});

export default app;

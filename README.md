# AUTOBOTQ - Automated Economic Data Bot

Automated economic data aggregation and AI-powered analysis for your Notion dashboard.

## 🤖 What This Does

AUTOBOTQ is a Node.js bot that:

1. **Fetches** economic data from fxmacrodata.com (currencies, bonds, commodities, economic indicators)
2. **Analyzes** the data using 4 AI engines:
   - Economy Health Analyzer (calculates strength/weakness)
   - Data Impact Analyzer (what data means for economy)
   - Rate Policy Analyzer (central bank implications)
   - Bond Impact Analyzer (yield & curve implications)
3. **Pushes** everything to your Notion database automatically
4. **Provides** summaries of each economy's health & key events to watch

## 📊 Data Covered

### Economic Indicators
- GDP (MoM, YoY, QoQ)
- Inflation (Core, CPI - MoM, YoY, QoQ)
- Labour (Unemployment, Employment changes, NFP)
- PMI (Manufacturing, Services, Composite)
- Retail Sales (MoM, YoY)
- Earnings & Wages
- Consumer & Business Confidence
- Bank Forecasts

### Bond Markets (All Economies)
- 2Y Yields
- 10Y Yields
- 30Y Yields
- 2s/10s Spread

### Currencies & Commodities
- Major forex pairs (EUR/USD, GBP/USD, etc.)
- Oil/Energy (WTI, Brent, Natural Gas)
- Metals (Gold, Silver, Copper, Platinum, Palladium)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Get Your API Keys

**Notion Integration Token:**
- Go to https://www.notion.so/my-integrations
- Create new integration named "AUTOBOTQ"
- Copy "Internal Integration Token"

**Notion Database ID:**
- Open your Notion database
- Copy the ID from the URL
- Share the database with your AUTOBOTQ integration

**FXMacroData API Key:**
- From your fxmacrodata.com account settings

### 3. Setup Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```
NOTION_API_KEY=your_key_here
NOTION_DATABASE_ID=your_database_id
FXMACRODATA_API_KEY=your_api_key
```

### 4. Start the Bot

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

## 📁 Project Structure

```
src/
├── index.js                          # Main entry point
├── config/
│   ├── config.js                    # Environment configuration
│   ├── constants.js                 # Data type constants
│   └── parameters.js                # Customizable tracking parameters
├── services/
│   ├── dataFetcher.js              # FXMacroData API integration
│   ├── notionPusher.js             # Notion database integration
│   ├── eventManager.js             # Main orchestration engine
│   └── analyzers/
│       ├── economyHealthAnalyzer.js    # Economy health scoring
│       ├── dataImpactAnalyzer.js       # Data interpretation
│       ├── ratePolicyAnalyzer.js       # Central bank implications
│       └── bondImpactAnalyzer.js       # Bond market implications
└── utils/
    ├── logger.js                    # Winston logging
    ├── validators.js                # Data validation & filtering
    └── formatters.js                # Data formatting for Notion
```

## ⚙️ Configuration

Edit `src/config/parameters.js` to customize:

```javascript
PARAMETERS = {
  trackedEconomies: ['USA', 'UK', 'EUR', 'JPY', ...],
  trackedIndicators: ['GDP Growth', 'Inflation', ...],
  trackedBonds: ['2Y', '10Y', '30Y', '2s/10s Spread'],
  trackedCurrencies: ['EURUSD', 'GBPUSD', ...],
  trackedCommodities: ['Gold', 'Oil', ...],
  maxAgeMinutes: 60,           // Only fetch recent data
  minimumImportance: 1,        // 1=Low, 2=Medium, 3=High
  significantMoveThreshold: 0.5,
}
```

## 📝 What Gets Pushed to Notion

For each data point, your Notion database receives:

**Indicator Data:**
- Current, previous, and forecast values
- Economic meaning (what it means for growth/inflation/employment)
- Investor focus (what to watch for)
- Policy implication (Fed reaction)
- Rate direction prediction
- Bond yield impact
- Sentiment (Bullish/Bearish/Neutral)
- Importance level

**Bond Data:**
- Current yield vs previous
- Yield change in basis points
- Yield direction prediction
- Curve impact (steepening/flattening)
- Duration impact (bond price effects)
- Investor implications

**Economy Summary:**
- Health score (0-100)
- Key strengths
- Key weaknesses
- Critical events to watch
- Last updated timestamp

## 🔄 How It Works

1. **Polling**: Every 5 minutes (configurable), bot fetches latest data
2. **Validation**: Filters data for relevance (economy, importance, age)
3. **Analysis**: 4 engines analyze each data point:
   - Is economy healthy?
   - What does this mean?
   - Will Fed change rates?
   - How do bonds react?
4. **Push**: Batches data to Notion database
5. **Summary**: Creates/updates economy health summary pages

## 🛠️ Environment Variables

```
NOTION_API_KEY          # Required: Notion integration token
NOTION_DATABASE_ID      # Required: Notion database ID
FXMACRODATA_API_KEY     # Required: FXMacroData API key
POLL_INTERVAL           # Optional: Polling frequency (ms, default: 300000)
MAX_AGE_MINUTES         # Optional: Max data age (minutes, default: 60)
BATCH_SIZE              # Optional: Notion batch size (default: 25)
LOG_LEVEL               # Optional: Log level (default: info)
NODE_ENV                # Optional: Environment (development/production)
```

## 📊 Notion Database Setup

Your Notion database should have these properties:

### Recommended Properties
- **Title** (text) - Data point name
- **Type** (select) - Indicator/Bond/Summary
- **Economy** (select) - Country/Region
- **Current Value** (number)
- **Previous Value** (number)
- **Forecast Value** (number)
- **Sentiment** (select) - Bullish/Bearish/Neutral
- **Economic Meaning** (rich_text)
- **Investor Focus** (rich_text)
- **Policy Implication** (rich_text)
- **Rate Direction** (rich_text)
- **Bond Impact** (rich_text)
- **Health Score** (number) - For summaries
- **Strengths** (rich_text) - For summaries
- **Weaknesses** (rich_text) - For summaries
- **Key Events** (rich_text) - For summaries
- **Released At** / **Updated At** (date)

## 🚨 Troubleshooting

### Connection Errors
```
Error: Failed to connect to required APIs
```
- Check your `.env` file has correct API keys
- Verify Notion integration has access to database
- Check FXMacroData API key is valid

### Notion Permission Denied
```
Error: Notion database connection failed
```
- Go to Notion database → Share
- Add "AUTOBOTQ" integration
- Grant full access

### No Data Being Pushed
- Check logs: `logs/combined.log`
- Verify FXMacroData API is responding
- Check that tracked economies match API format

## 📚 API Documentation

### EventManager
```javascript
const manager = new EventManager();
await manager.initialize();      // Test connections
await manager.start(300000);     // Start polling (5min interval)
await manager.stop();            // Stop polling
manager.getStatus();             // Get current status
```

### DataFetcher
```javascript
const fetcher = new DataFetcher();
await fetcher.fetchEconomicIndicators({economies: ['USA', 'UK']});
await fetcher.fetchBondYields(['USA'], ['2Y', '10Y']);
await fetcher.fetchCurrencies(['EURUSD', 'GBPUSD']);
```

### NotionPusher
```javascript
const pusher = new NotionPusher();
await pusher.pushIndicatorData(indicator, analysis);
await pusher.pushBatch(dataArray, 'indicator');
await pusher.createEconomySummaryPage(economy, analysis, events);
```

## 📄 License

MIT

## 👤 Author

mj4212

---

**Questions?** Check the logs in `logs/` directory for detailed error messages.

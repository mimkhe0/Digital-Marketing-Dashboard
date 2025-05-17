
// Digital Marketing Dashboard for Looker Studio
// This file contains the main visualization code

(function() {
  'use strict';
  
  // Load required libraries
  const loadScript = (url) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };
  
  // Load CSS
  const loadCSS = (url) => {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  };
  
  // Main visualization class
  class MarketingDashboard {
    constructor() {
      this.data = null;
      this.style = null;
      this.container = null;
      this.charts = {};
      this.dimensions = [];
      this.metrics = [];
      this.dateRange = '30'; // Default to 30 days
      this.deviceFilter = 'all'; // Default to all devices
      this.activeTab = 'overview';
    }
    
    async initialize(element) {
      this.container = element;
      
      // Load required libraries
      try {
        await Promise.all([
          loadScript('https://cdn.tailwindcss.com'),
          loadScript('https://cdn.jsdelivr.net/npm/chart.js'),
          loadScript('https://cdn.jsdelivr.net/npm/luxon@3.0.1/build/global/luxon.min.js'),
          loadScript('https://cdn.jsdelivr.net/npm/chartjs-adapter-luxon@1.0.0'),
          loadCSS('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap')
        ]);
        
        // Initialize Chart.js defaults
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = '#6b7280';
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(17, 24, 39, 0.8)';
        Chart.defaults.plugins.tooltip.titleColor = '#ffffff';
        Chart.defaults.plugins.tooltip.bodyColor = '#ffffff';
        Chart.defaults.plugins.tooltip.padding = 12;
        Chart.defaults.plugins.tooltip.cornerRadius = 6;
        
      } catch (error) {
        console.error('Failed to load required libraries:', error);
        this.showError('Failed to load required libraries');
        return;
      }
    }
    
    draw(data, style) {
      this.data = data;
      this.style = style;
      
      // Clear container
      this.container.innerHTML = '';
      
      try {
        // Extract dimensions and metrics from data
        this.extractData();
        
        // Create dashboard structure
        this.createDashboard();
        
        // Initialize charts and tables
        this.initializeCharts();
        
        // Add event listeners
        this.addEventListeners();
        
      } catch (error) {
        console.error('Error rendering dashboard:', error);
        this.showError('Error rendering dashboard: ' + error.message);
      }
    }
    
    extractData() {
      // Extract dimensions and metrics from Looker Studio data
      // In a real implementation, this would map the data from Looker Studio's format
      
      // For demonstration, we'll use sample data
      this.dimensions = [];
      this.metrics = [];
      
      // Sample data structure
      if (this.data && this.data.tables && this.data.tables.DEFAULT) {
        const tableData = this.data.tables.DEFAULT;
        
        // Extract dimensions
        if (tableData.dimensions) {
          this.dimensions = tableData.dimensions.map((dim, i) => {
            return {
              id: dim.id,
              name: dim.name,
              values: tableData.rows.map(row => row[i])
            };
          });
        }
        
        // Extract metrics
        if (tableData.metrics) {
          const dimCount = this.dimensions.length;
          this.metrics = tableData.metrics.map((metric, i) => {
            return {
              id: metric.id,
              name: metric.name,
              values: tableData.rows.map(row => row[i + dimCount])
            };
          });
        }
      }
    }
    
    createDashboard() {
      // Create main dashboard container
      const dashboard = document.createElement('div');
      dashboard.className = 'container mx-auto px-4 py-6 max-w-7xl';
      
      // Add header
      dashboard.appendChild(this.createHeader());
      
      // Add date comparison bar
      dashboard.appendChild(this.createDateComparison());
      
      // Add tabs
      dashboard.appendChild(this.createTabs());
      
      // Add tab content
      const overviewTab = this.createOverviewTab();
      overviewTab.classList.add('active');
      dashboard.appendChild(overviewTab);
      
      // Add other tabs (hidden by default)
      dashboard.appendChild(this.createGA4Tab());
      dashboard.appendChild(this.createGSCTab());
      dashboard.appendChild(this.createAdsTab());
      
      // Add footer
      dashboard.appendChild(this.createFooter());
      
      // Add to container
      this.container.appendChild(dashboard);
    }
    
    createHeader() {
      const header = document.createElement('div');
      header.className = 'flex flex-col md:flex-row justify-between items-center mb-6';
      
      header.innerHTML = `
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-800">Digital Marketing Analytics Dashboard</h1>
          <p class="text-gray-600 mt-1">Comprehensive overview of website performance and marketing campaigns</p>
        </div>
        <div class="mt-4 md:mt-0">
          <div class="flex items-center space-x-4">
            <div class="relative">
              <select id="dateRange" class="bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="7">Last 7 days</option>
                <option value="30" selected>Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="180">Last 6 months</option>
                <option value="365">Last 12 months</option>
              </select>
            </div>
            <div class="relative">
              <select id="deviceFilter" class="bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="all" selected>All Devices</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>
            <button id="exportPDF" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Export PDF
            </button>
          </div>
        </div>
      `;
      
      return header;
    }
    
    createDateComparison() {
      const dateComp = document.createElement('div');
      dateComp.className = 'bg-blue-50 p-4 rounded-lg mb-6 flex items-center justify-between';
      
      // Get current date and previous period
      const now = new Date();
      const currentPeriodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const currentPeriodStart = new Date(currentPeriodEnd);
      currentPeriodStart.setDate(currentPeriodStart.getDate() - parseInt(this.dateRange));
      
      const prevPeriodEnd = new Date(currentPeriodStart);
      prevPeriodEnd.setDate(prevPeriodEnd.getDate() - 1);
      const prevPeriodStart = new Date(prevPeriodEnd);
      prevPeriodStart.setDate(prevPeriodStart.getDate() - parseInt(this.dateRange));
      
      // Format dates
      const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      };
      
      dateComp.innerHTML = `
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span class="text-blue-800 font-medium">${formatDate(currentPeriodStart)} - ${formatDate(currentPeriodEnd)}</span>
          <span class="mx-2 text-gray-500">vs</span>
          <span class="text-gray-600">${formatDate(prevPeriodStart)} - ${formatDate(prevPeriodEnd)}</span>
        </div>
        <div>
          <button id="comparisonToggle" class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
            <span>Show comparison</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      `;
      
      return dateComp;
    }
    
    createTabs() {
      const tabsContainer = document.createElement('div');
      tabsContainer.className = 'mb-6 border-b border-gray-200';
      
      tabsContainer.innerHTML = `
        <ul class="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li class="mr-2">
            <a href="#" class="inline-block p-4 tab-active" data-tab="overview">Overview</a>
          </li>
          <li class="mr-2">
            <a href="#" class="inline-block p-4 text-gray-500 hover:text-gray-700" data-tab="ga4">Google Analytics</a>
          </li>
          <li class="mr-2">
            <a href="#" class="inline-block p-4 text-gray-500 hover:text-gray-700" data-tab="gsc">Search Console</a>
          </li>
          <li class="mr-2">
            <a href="#" class="inline-block p-4 text-gray-500 hover:text-gray-700" data-tab="ads">Google Ads</a>
          </li>
        </ul>
      `;
      
      return tabsContainer;
    }
    
    createOverviewTab() {
      const tab = document.createElement('div');
      tab.id = 'overview';
      tab.className = 'tab-content';
      
      // KPI Scorecards
      const scorecards = this.createScorecards();
      tab.appendChild(scorecards);
      
      // Second row of KPIs
      const secondRowKPIs = this.createSecondRowKPIs();
      tab.appendChild(secondRowKPIs);
      
      // Charts Row
      const chartsRow = document.createElement('div');
      chartsRow.className = 'grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6';
      
      // Traffic Over Time chart
      const trafficChart = document.createElement('div');
      trafficChart.className = 'card p-4';
      trafficChart.innerHTML = `
        <h3 class="text-lg font-semibold mb-4">Traffic Over Time</h3>
        <div class="h-64">
          <canvas id="trafficChart"></canvas>
        </div>
      `;
      chartsRow.appendChild(trafficChart);
      
      // Clicks & Impressions chart
      const searchChart = document.createElement('div');
      searchChart.className = 'card p-4';
      searchChart.innerHTML = `
        <h3 class="text-lg font-semibold mb-4">Search Clicks & Impressions</h3>
        <div class="h-64">
          <canvas id="searchChart"></canvas>
        </div>
      `;
      chartsRow.appendChild(searchChart);
      
      tab.appendChild(chartsRow);
      
      // Third Row (3 charts)
      const thirdRow = document.createElement('div');
      thirdRow.className = 'grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6';
      
      // Traffic by Source chart
      const sourceChart = document.createElement('div');
      sourceChart.className = 'card p-4';
      sourceChart.innerHTML = `
        <h3 class="text-lg font-semibold mb-4">Traffic by Source</h3>
        <div class="h-64">
          <canvas id="sourceChart"></canvas>
        </div>
      `;
      thirdRow.appendChild(sourceChart);
      
      // Device Category chart
      const deviceChart = document.createElement('div');
      deviceChart.className = 'card p-4';
      deviceChart.innerHTML = `
        <h3 class="text-lg font-semibold mb-4">Users by Device</h3>
        <div class="h-64">
          <canvas id="deviceChart"></canvas>
        </div>
      `;
      thirdRow.appendChild(deviceChart);
      
      // Ad Performance chart
      const adChart = document.createElement('div');
      adChart.className = 'card p-4';
      adChart.innerHTML = `
        <h3 class="text-lg font-semibold mb-4">Ad Performance</h3>
        <div class="h-64">
          <canvas id="adChart"></canvas>
        </div>
      `;
      thirdRow.appendChild(adChart);
      
      tab.appendChild(thirdRow);
      
      // Tables Row
      const tablesRow = this.createTablesRow();
      tab.appendChild(tablesRow);
      
      // Ad Campaigns Table
      const adCampaignsTable = this.createAdCampaignsTable();
      tab.appendChild(adCampaignsTable);
      
      // AI Insights
      const aiInsights = this.createAIInsights();
      tab.appendChild(aiInsights);
      
      return tab;
    }
    
    createScorecards() {
      const scorecardsContainer = document.createElement('div');
      scorecardsContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6';
      
      // Define scorecard data
      const scorecardData = [
        {
          name: 'Users',
          value: '24,582',
          change: '+12.4%',
          positive: true,
          icon: 'user'
        },
        {
          name: 'Sessions',
          value: '32,145',
          change: '+8.7%',
          positive: true,
          icon: 'shield'
        },
        {
          name: 'Search Clicks',
          value: '18,743',
          change: '-3.2%',
          positive: false,
          icon: 'search'
        },
        {
          name: 'Ad Conversions',
          value: '1,284',
          change: '+15.8%',
          positive: true,
          icon: 'check-circle'
        }
      ];
      
      // Create each scorecard
      scorecardData.forEach(data => {
        const scorecard = document.createElement('div');
        scorecard.className = 'card p-4 scorecard';
        
        const changeClass = data.positive ? 'text-green-600' : 'text-red-600';
        const changeIcon = data.positive ? 
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />' :
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />';
        
        scorecard.innerHTML = `
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm text-gray-500 mb-1">${data.name}</p>
              <h3 class="text-2xl font-bold">${data.value}</h3>
              <div class="flex items-center mt-1">
                <span class="${changeClass} text-sm font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${changeIcon}
                  </svg>
                  ${data.change}
                </span>
                <span class="text-xs text-gray-500 ml-1">vs previous period</span>
              </div>
            </div>
            <div class="bg-blue-50 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                ${this.getIconPath(data.icon)}
              </svg>
            </div>
          </div>
        `;
        
        scorecardsContainer.appendChild(scorecard);
      });
      
      return scorecardsContainer;
    }
    
    createSecondRowKPIs() {
      const kpisContainer = document.createElement('div');
      kpisContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6';
      
      // Define KPI data
      const kpiData = [
        {
          name: 'Avg. Engagement Time',
          value: '2:45',
          change: '+5.2%',
          positive: true,
          icon: 'clock'
        },
        {
          name: 'Bounce Rate',
          value: '42.8%',
          change: '-2.1%',
          positive: true,
          icon: 'chart-line'
        },
        {
          name: 'Avg. Position',
          value: '14.3',
          change: '+1.8',
          positive: true,
          icon: 'arrow-up'
        },
        {
          name: 'Ad Spend',
          value: '$8,452',
          change: '+7.3%',
          positive: false,
          icon: 'currency-dollar'
        }
      ];
      
      // Create each KPI card
      kpiData.forEach(data => {
        const kpiCard = document.createElement('div');
        kpiCard.className = 'card p-4 scorecard';
        
        const changeClass = data.positive ? 'text-green-600' : 'text-red-600';
        const changeIcon = data.positive ? 
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />' :
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />';
        
        kpiCard.innerHTML = `
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm text-gray-500 mb-1">${data.name}</p>
              <h3 class="text-2xl font-bold">${data.value}</h3>
              <div class="flex items-center mt-1">
                <span class="${changeClass} text-sm font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${changeIcon}
                  </svg>
                  ${data.change}
                </span>
                <span class="text-xs text-gray-500 ml-1">vs previous period</span>
              </div>
            </div>
            <div class="bg-blue-50 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                ${this.getIconPath(data.icon)}
              </svg>
            </div>
          </div>
        `;
        
        kpisContainer.appendChild(kpiCard);
      });
      
      return kpisContainer;
    }
    
    createTablesRow() {
      const tablesRow = document.createElement('div');
      tablesRow.className = 'grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6';
      
      // Top Landing Pages table
      const landingPagesTable = document.createElement('div');
      landingPagesTable.className = 'card p-4';
      landingPagesTable.innerHTML = `
        <h3 class="text-lg font-semibold mb-4">Top Landing Pages</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr>
                <th>Page</th>
                <th>Users</th>
                <th>Bounce Rate</th>
                <th>Avg. Time</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-blue-600">/homepage</td>
                <td>8,452</td>
                <td>32.4%</td>
                <td>3:12</td>
              </tr>
              <tr>
                <td class="text-blue-600">/products</td>
                <td>4,271</td>
                <td>41.7%</td>
                <td>2:45</td>
              </tr>
              <tr>
                <td class="text-blue-600">/blog/seo-tips</td>
                <td>3,845</td>
                <td>28.9%</td>
                <td>4:32</td>
              </tr>
              <tr>
                <td class="text-blue-600">/services</td>
                <td>2,937</td>
                <td>35.2%</td>
                <td>2:18</td>
              </tr>
              <tr>
                <td class="text-blue-600">/contact</td>
                <td>1,842</td>
                <td>45.8%</td>
                <td>1:47</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
      tablesRow.appendChild(landingPagesTable);
      
      // Top Search Queries table
      const searchQueriesTable = document.createElement('div');
      searchQueriesTable.className = 'card p-4';
      searchQueriesTable.innerHTML = `
        <h3 class="text-lg font-semibold mb-4">Top Search Queries</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr>
                <th>Query</th>
                <th>Clicks</th>
                <th>Impressions</th>
                <th>CTR</th>
                <th>Position</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>digital marketing dashboard</td>
                <td>1,245</td>
                <td>15,782</td>
                <td>7.9%</td>
                <td>3.2</td>
              </tr>
              <tr>
                <td>marketing analytics tools</td>
                <td>987</td>
                <td>12,453</td>
                <td>7.9%</td>
                <td>4.7</td>
              </tr>
              <tr>
                <td>seo reporting dashboard</td>
                <td>854</td>
                <td>9,874</td>
                <td>8.6%</td>
                <td>5.3</td>
              </tr>
              <tr>
                <td>google analytics 4 reports</td>
                <td>742</td>
                <td>8,521</td>
                <td>8.7%</td>
                <td>6.1</td>
              </tr>
              <tr>
                <td>marketing performance metrics</td>
                <td>631</td>
                <td>7,845</td>
                <td>8.0%</td>
                <td>7.4</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
      tablesRow.appendChild(searchQueriesTable);
      
      return tablesRow;
    }
    
    createAdCampaignsTable() {
      const adCampaignsTable = document.createElement('div');
      adCampaignsTable.className = 'card p-4 mb-6';
      adCampaignsTable.innerHTML = `
        <h3 class="text-lg font-semibold mb-4">Top Ad Campaigns</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Clicks</th>
                <th>Impressions</th>
                <th>CTR</th>
                <th>Cost</th>
                <th>Conversions</th>
                <th>Cost/Conv.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Brand Awareness</td>
                <td>4,521</td>
                <td>125,478</td>
                <td>3.6%</td>
                <td>$2,845</td>
                <td>387</td>
                <td>$7.35</td>
              </tr>
              <tr>
                <td>Product Promotion</td>
                <td>3,874</td>
                <td>98,745</td>
                <td>3.9%</td>
                <td>$2,154</td>
                <td>312</td>
                <td>$6.90</td>
              </tr>
              <tr>
                <td>Remarketing</td>
                <td>2,987</td>
                <td>45,871</td>
                <td>6.5%</td>
                <td>$1,745</td>
                <td>284</td>
                <td>$6.14</td>
              </tr>
              <tr>
                <td>Search Campaign</td>
                <td>2,541</td>
                <td>32,458</td>
                <td>7.8%</td>
                <td>$1,254</td>
                <td>198</td>
                <td>$6.33</td>
              </tr>
              <tr>
                <td>Display Network</td>
                <td>1,874</td>
                <td>87,542</td>
                <td>2.1%</td>
                <td>$954</td>
                <td>103</td>
                <td>$9.26</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
      
      return adCampaignsTable;
    }
    
    createAIInsights() {
      const aiInsights = document.createElement('div');
      aiInsights.className = 'card p-4 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100';
      
      aiInsights.innerHTML = `
        <div class="flex items-start">
          <div class="bg-blue-100 p-2 rounded-lg mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-2 text-blue-800">AI Insights</h3>
            <ul class="space-y-2 text-gray-700">
              <li class="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>User engagement has increased by 12.4% compared to the previous period, with mobile traffic showing the strongest growth at 18.2%.</span>
              </li>
              <li class="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>The "Blog/SEO-Tips" page has a significantly lower bounce rate (28.9%) than other pages, suggesting its content is highly engaging. Consider creating more similar content.</span>
              </li>
              <li class="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>The Remarketing campaign has the best conversion rate and lowest cost per conversion. Consider reallocating budget from Display Network to Remarketing for better ROI.</span>
              </li>
            </ul>
          </div>
        </div>
      `;
      
      return aiInsights;
    }
    
    createGA4Tab() {
      const tab = document.createElement('div');
      tab.id = 'ga4';
      tab.className = 'tab-content hidden';
      
      tab.innerHTML = `
        <div class="text-center py-12">
          <p class="text-gray-500">Switch to the Google Analytics tab to view detailed GA4 metrics</p>
        </div>
      `;
      
      return tab;
    }
    
    createGSCTab() {
      const tab = document.createElement('div');
      tab.id = 'gsc';
      tab.className = 'tab-content hidden';
      
      tab.innerHTML = `
        <div class="text-center py-12">
          <p class="text-gray-500">Switch to the Search Console tab to view detailed GSC metrics</p>
        </div>
      `;
      
      return tab;
    }
    
    createAdsTab() {
      const tab = document.createElement('div');
      tab.id = 'ads';
      tab.className = 'tab-content hidden';
      
      tab.innerHTML = `
        <div class="text-center py-12">
          <p class="text-gray-500">Switch to the Google Ads tab to view detailed advertising metrics</p>
        </div>
      `;
      
      return tab;
    }
    
    createFooter() {
      const footer = document.createElement('div');
      footer.className = 'mt-8 text-center text-gray-500 text-sm';
      
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      
      footer.innerHTML = `
        <p>Last updated: ${formattedDate} • Data sources: Google Analytics 4, Google Search Console, Google Ads</p>
      `;
      
      return footer;
    }
    
    initializeCharts() {
      // Initialize charts after a short delay to ensure DOM elements are ready
      setTimeout(() => {
        this.initTrafficChart();
        this.initSearchChart();
        this.initSourceChart();
        this.initDeviceChart();
        this.initAdChart();
      }, 100);
    }
    
    initTrafficChart() {
      const ctx = document.getElementById('trafficChart');
      if (!ctx) return;
      
      this.charts.trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Apr 1', 'Apr 5', 'Apr 10', 'Apr 15', 'Apr 20', 'Apr 25', 'Apr 30'],
          datasets: [
            {
              label: 'Users',
              data: [845, 1245, 1050, 1380, 1420, 1650, 1520],
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.3,
              fill: true
            },
            {
              label: 'Sessions',
              data: [1050, 1450, 1250, 1580, 1720, 1950, 1820],
              borderColor: 'rgb(139, 92, 246)',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              tension: 0.3,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              display: this.style && this.style.showLegend !== false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          },
          animation: {
            duration: this.style && this.style.enableAnimation !== false ? 1000 : 0
          }
        }
      });
    }
    
    initSearchChart() {
      const ctx = document.getElementById('searchChart');
      if (!ctx) return;
      
      this.charts.searchChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Apr 1', 'Apr 5', 'Apr 10', 'Apr 15', 'Apr 20', 'Apr 25', 'Apr 30'],
          datasets: [
            {
              label: 'Clicks',
              data: [520, 580, 620, 710, 680, 750, 780],
              borderColor: 'rgb(16, 185, 129)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.3,
              fill: true,
              yAxisID: 'y'
            },
            {
              label: 'Impressions',
              data: [8500, 9200, 9800, 10500, 11200, 12000, 12500],
              borderColor: 'rgb(245, 158, 11)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              tension: 0.3,
              fill: true,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              display: this.style && this.style.showLegend !== false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              position: 'left',
              title: {
                display: true,
                text: 'Clicks'
              }
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              grid: {
                drawOnChartArea: false
              },
              title: {
                display: true,
                text: 'Impressions'
              }
            }
          },
          animation: {
            duration: this.style && this.style.enableAnimation !== false ? 1000 : 0
          }
        }
      });
    }
    
    initSourceChart() {
      const ctx = document.getElementById('sourceChart');
      if (!ctx) return;
      
      this.charts.sourceChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Organic', 'Direct', 'Referral', 'Social', 'Email', 'Paid'],
          datasets: [{
            label: 'Sessions',
            data: [12500, 8700, 4200, 3800, 2100, 5400],
            backgroundColor: [
              'rgba(59, 130, 246, 0.7)',
              'rgba(16, 185, 129, 0.7)',
              'rgba(245, 158, 11, 0.7)',
              'rgba(236, 72, 153, 0.7)',
              'rgba(139, 92, 246, 0.7)',
              'rgba(220, 38, 38, 0.7)'
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          },
          animation: {
            duration: this.style && this.style.enableAnimation !== false ? 1000 : 0
          }
        }
      });
    }
    
    initDeviceChart() {
      const ctx = document.getElementById('deviceChart');
      if (!ctx) return;
      
      this.charts.deviceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Mobile', 'Desktop', 'Tablet'],
          datasets: [{
            data: [15200, 8400, 1800],
            backgroundColor: [
              'rgba(59, 130, 246, 0.7)',
              'rgba(16, 185, 129, 0.7)',
              'rgba(245, 158, 11, 0.7)'
            ],
            borderWidth: 1,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              display: this.style && this.style.showLegend !== false
            }
          },
          animation: {
            duration: this.style && this.style.enableAnimation !== false ? 1000 : 0
          }
        }
      });
    }
    
    initAdChart() {
      const ctx = document.getElementById('adChart');
      if (!ctx) return;
      
      this.charts.adChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Brand', 'Product', 'Remarketing', 'Search', 'Display'],
          datasets: [
            {
              label: 'Clicks',
              data: [4521, 3874, 2987, 2541, 1874],
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
              borderWidth: 0,
              yAxisID: 'y'
            },
            {
              label: 'Conversions',
              data: [387, 312, 284, 198, 103],
              backgroundColor: 'rgba(16, 185, 129, 0.7)',
              borderWidth: 0,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              display: this.style && this.style.showLegend !== false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              position: 'left',
              title: {
                display: true,
                text: 'Clicks'
              }
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              grid: {
                drawOnChartArea: false
              },
              title: {
                display: true,
                text: 'Conversions'
              }
            }
          },
          animation: {
            duration: this.style && this.style.enableAnimation !== false ? 1000 : 0
          }
        }
      });
    }
    
    addEventListeners() {
      // Tab switching
      const tabs = document.querySelectorAll('[data-tab]');
      const tabContents = document.querySelectorAll('.tab-content');
      
      tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          
          // Remove active class from all tabs
          tabs.forEach(t => {
            t.classList.remove('tab-active');
            t.classList.add('text-gray-500');
          });
          
          // Add active class to clicked tab
          tab.classList.add('tab-active');
          tab.classList.remove('text-gray-500');
          
          // Hide all tab contents
          tabContents.forEach(content => {
            content.classList.add('hidden');
          });
          
          // Show the selected tab content
          const tabId = tab.getAttribute('data-tab');
          document.getElementById(tabId).classList.remove('hidden');
          
          // Update active tab
          this.activeTab = tabId;
        });
      });
      
      // Date range filter
      const dateRange = document.getElementById('dateRange');
      if (dateRange) {
        dateRange.addEventListener('change', () => {
          this.dateRange = dateRange.value;
          // In a real implementation, this would trigger a data refresh
          console.log('Date range changed to:', this.dateRange);
        });
      }
      
      // Device filter
      const deviceFilter = document.getElementById('deviceFilter');
      if (deviceFilter) {
        deviceFilter.addEventListener('change', () => {
          this.deviceFilter = deviceFilter.value;
          // In a real implementation, this would filter the data
          console.log('Device filter changed to:', this.deviceFilter);
        });
      }
      
      // Export PDF button
      const exportPDF = document.getElementById('exportPDF');
      if (exportPDF) {
        exportPDF.addEventListener('click', () => {
          alert('PDF export functionality would be implemented here. In a real dashboard, this would generate and download a PDF report.');
        });
      }
      
      // Comparison toggle
      const comparisonToggle = document.getElementById('comparisonToggle');
      if (comparisonToggle) {
        comparisonToggle.addEventListener('click', () => {
          alert('In a real dashboard, this would toggle comparison data visibility in charts and tables.');
        });
      }
    }
    
    getIconPath(icon) {
      const icons = {
        'user': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />',
        'shield': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />',
        'search': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />',
        'check-circle': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />',
        'clock': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />',
        'chart-line': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />',
        'arrow-up': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />',
        'currency-dollar': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'
      };
      
      return icons[icon] || icons['user'];
    }
    
    showError(message) {
      this.container.innerHTML = `
        <div class="p-4 bg-red-50 border border-red-200 rounded-md">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Error</h3>
              <div class="mt-2 text-sm text-red-700">
                <p>${message}</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }
  
  // Register the visualization with Looker Studio
  dscc.subscribeToData(function(data) {
    const dashboard = new MarketingDashboard();
    dashboard.initialize(document.body).then(() => {
      dashboard.draw(data, data.style);
    });
  });
})();


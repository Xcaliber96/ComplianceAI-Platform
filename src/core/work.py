# dow_regulatory_fetcher.py - Dow Chemical Compliance Data Pipeline
from sec_edgar_api import EdgarClient
import json
import time
from datetime import datetime, timedelta
import requests
from typing import List, Dict

class DowComplianceDataFetcher:
    """
    Dow Chemical-specific regulatory data fetcher
    Focuses on chemical industry compliance and multi-jurisdictional monitoring
    """
    
    def __init__(self):
        # Dow-specific user agent (professional format for SEC)
        self.user_agent = "DowChemical-ComplianceAI compliance@dow.com"
        
        try:
            self.edgar_client = EdgarClient(user_agent=self.user_agent)
            print("Dow Chemical Compliance Data Pipeline Initialized")
            print("SEC EDGAR client ready for chemical industry monitoring")
        except Exception as e:
            print(f"Failed to initialize SEC client: {e}")
            raise
        
        # Chemical industry focus - companies Dow competes with or partners with
        self.dow_relevant_companies = [
            # Major Chemical Companies (Dow's direct competitors)
            {"cik": "1067983", "name": "DuPont de Nemours Inc.", "ticker": "DD", "sector": "chemicals", "priority": "high"},
            {"cik": "1440507", "name": "Dow Inc.", "ticker": "DOW", "sector": "chemicals", "priority": "critical"},
            {"cik": "1912536", "name": "LyondellBasell Industries", "ticker": "LYB", "sector": "chemicals", "priority": "high"},
            {"cik": "1534701", "name": "Eastman Chemical Company", "ticker": "EMN", "sector": "chemicals", "priority": "high"},
            
            # Dow's Major Customers (Tech companies using Dow materials)
            {"cik": "320193", "name": "Apple Inc.", "ticker": "AAPL", "sector": "technology", "priority": "medium"},
            {"cik": "789019", "name": "Microsoft Corporation", "ticker": "MSFT", "sector": "technology", "priority": "medium"},
            {"cik": "1318605", "name": "Tesla, Inc.", "ticker": "TSLA", "sector": "automotive", "priority": "high"},
            
            # Dow's Suppliers/Partners
            {"cik": "66740", "name": "3M Company", "ticker": "MMM", "sector": "materials", "priority": "medium"},
            {"cik": "1467858", "name": "BASF SE", "ticker": "BASFY", "sector": "chemicals", "priority": "high"}
        ]
        
        # Compliance forms relevant to Dow's operations
        self.compliance_forms = {
            'financial_compliance': ['10-K', '10-Q', '8-K'],  # SOX compliance, financial reporting
            'environmental_disclosure': ['8-K'],               # Environmental incidents, regulatory changes
            'governance': ['DEF 14A'],                         # Board governance, executive compensation
            'acquisitions': ['8-K', '10-K'],                  # M&A activity (Dow mentions mergers/acquisitions)
            'risk_factors': ['10-K', '10-Q']                  # Risk disclosures relevant to chemical industry
        }
        
        # regulatory keywords for content analysis
        self.dow_regulatory_keywords = {
            'environmental': [
                'environmental compliance', 'epa', 'clean air act', 'clean water act',
                'rcra', 'superfund', 'emissions', 'discharge', 'remediation'
            ],
            'chemical_safety': [
                'chemical safety', 'toxic substances', 'tsca', 'reach', 'osha',
                'safety data sheet', 'hazardous materials', 'chemical registration'
            ],
            'international_trade': [
                'export control', 'sanctions', 'ofac', 'trade compliance',
                'dual use', 'embargo', 'restricted party screening'
            ],
            'product_liability': [
                'product liability', 'recall', 'consumer protection', 'product safety',
                'class action', 'litigation', 'settlement'
            ]
        }

    def fetch_dow_regulatory_intelligence(self, days_back: int = 30) -> Dict:
        """
        Fetch regulatory intelligence specifically relevant to Dow Chemical
        
        Args:
            days_back: Number of days to look back for filings (default: 30)
        
        Returns:
            Dictionary with categorized regulatory intelligence
        """
        print(f"\nSTARTING DOW CHEMICAL REGULATORY INTELLIGENCE FETCH")
        print(f"Monitoring period: Last {days_back} days")
        print(f"Companies monitored: {len(self.dow_relevant_companies)}")
        print(f"Compliance areas: Environmental, Chemical Safety, Trade, Governance")
        print("=" * 70)
        
        all_intelligence = {
            'critical_alerts': [],      # Dow company filings
            'competitor_intelligence': [],  # Direct competitors
            'customer_updates': [],     # Major customers like Apple, Tesla
            'supplier_alerts': [],      # Key suppliers/partners
            'regulatory_trends': [],    # Industry-wide patterns
            'metadata': {
                'fetch_timestamp': datetime.now().isoformat(),
                'monitoring_period_days': days_back,
                'companies_processed': 0,
                'total_filings_found': 0
            }
        }
        
        # Process each company with Dow-specific analysis
        for i, company in enumerate(self.dow_relevant_companies):
            print(f"\n--- Processing {i+1}/{len(self.dow_relevant_companies)}: {company['name']} ({company['priority'].upper()}) ---")
            
            try:
                # SEC rate limiting compliance
                if i > 0:
                    time.sleep(0.15)  # Slightly more conservative for enterprise use
                
                # Fetch company submissions
                print(f"Fetching SEC submissions for CIK: {company['cik']}")
                submissions = self.edgar_client.get_submissions(cik=company['cik'])
                
                if submissions:
                    print(f"Connected to {submissions['name']}")
                    
                    # Analyze filings for Dow-relevant content
                    relevant_filings = self._analyze_dow_relevance(
                        submissions, company, days_back
                    )
                    
                    # Categorize by company relationship to Dow
                    if company['ticker'] == 'DOW':
                        all_intelligence['critical_alerts'].extend(relevant_filings)
                        print(f"CRITICAL: {len(relevant_filings)} Dow company filings")
                    elif company['sector'] == 'chemicals':
                        all_intelligence['competitor_intelligence'].extend(relevant_filings)
                        print(f"COMPETITOR: {len(relevant_filings)} competitor filings")
                    elif company['sector'] in ['technology', 'automotive']:
                        all_intelligence['customer_updates'].extend(relevant_filings)
                        print(f"CUSTOMER: {len(relevant_filings)} customer filings")
                    else:
                        all_intelligence['supplier_alerts'].extend(relevant_filings)
                        print(f"SUPPLIER: {len(relevant_filings)} supplier filings")
                    
                    all_intelligence['metadata']['total_filings_found'] += len(relevant_filings)
                    all_intelligence['metadata']['companies_processed'] += 1
                    
                else:
                    print(f"No data received for {company['name']}")
                    
            except Exception as e:
                print(f"Error processing {company['name']}: {e}")
                continue
        
        # Generate Dow-specific insights
        all_intelligence['regulatory_trends'] = self._identify_regulatory_trends(all_intelligence)
        
        # Final summary
        print(f"\n{'='*70}")
        print(f"DOW CHEMICAL REGULATORY INTELLIGENCE COMPLETE")
        print(f"Total filings analyzed: {all_intelligence['metadata']['total_filings_found']}")
        print(f"Critical Dow alerts: {len(all_intelligence['critical_alerts'])}")
        print(f"Competitor intelligence: {len(all_intelligence['competitor_intelligence'])}")
        print(f"Customer updates: {len(all_intelligence['customer_updates'])}")
        print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*70}")
        
        return all_intelligence
    
    def _analyze_dow_relevance(self, submissions: Dict, company: Dict, days_back: int) -> List[Dict]:
        """Analyze SEC filings for Dow-specific regulatory relevance"""
        
        cutoff_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
        relevant_filings = []
        recent = submissions['filings']['recent']
        
        print(f"Scanning {len(recent.get('form', []))} total filings since {cutoff_date}")
        
        # Get all relevant forms for chemical industry
        all_relevant_forms = []
        for form_list in self.compliance_forms.values():
            all_relevant_forms.extend(form_list)
        
        dow_relevant_count = 0
        for i, form in enumerate(recent.get('form', [])):
            filing_date = recent.get('filingDate', [])[i] if i < len(recent.get('filingDate', [])) else None
            
            # Filter by date and form type
            if (filing_date and filing_date >= cutoff_date and 
                form in all_relevant_forms and 
                dow_relevant_count < 8):  # Limit per company for enterprise efficiency
                
                filing_data = {
                    'company': submissions.get('name'),
                    'company_relationship': company['sector'],
                    'priority_level': company['priority'],
                    'cik': company['cik'],
                    'ticker': company.get('ticker'),
                    'form_type': form,
                    'filing_date': filing_date,
                    'document': recent.get('primaryDocument', [])[i] if i < len(recent.get('primaryDocument', [])) else None,
                    'access_number': recent.get('accessionNumber', [])[i] if i < len(recent.get('accessionNumber', [])) else None,
                    'file_size': recent.get('size', [])[i] if i < len(recent.get('size', [])) else 0,
                    'compliance_category': self._categorize_compliance_area(form),
                    'dow_relevance_score': self._calculate_dow_relevance_score(company, form),
                    'sec_url': self._generate_sec_url_fixed(company['cik'], recent.get('accessionNumber', [])[i], recent.get('primaryDocument', [])[i]),
                    'sec_backup_urls': self._generate_backup_access_methods(company, recent.get('accessionNumber', [])[i], form),
                    'fetched_timestamp': datetime.now().isoformat()
                }
                
                relevant_filings.append(filing_data)
                dow_relevant_count += 1
                
                print(f"   {form} on {filing_date} - {filing_data['compliance_category']} (Score: {filing_data['dow_relevance_score']})")
        
        return sorted(relevant_filings, key=lambda x: x['dow_relevance_score'], reverse=True)
    
    def _categorize_compliance_area(self, form_type: str) -> str:
        """Categorize filing by compliance area relevant to Dow"""
        
        form_category_map = {
            '10-K': 'Annual Financial & Risk Disclosure',
            '10-Q': 'Quarterly Financial Update', 
            '8-K': 'Material Events & Corporate Changes',
            'DEF 14A': 'Shareholder Governance',
        }
        
        return form_category_map.get(form_type, 'General Compliance')
    
    def _calculate_dow_relevance_score(self, company: Dict, form_type: str) -> float:
        """Calculate relevance score for Dow Chemical compliance (0-10 scale)"""
        
        base_score = {
            'critical': 10.0,  # Dow company itself
            'high': 7.5,       # Direct competitors, major customers
            'medium': 5.0,     # Suppliers, partners
            'low': 2.5         # General market
        }
        
        score = base_score.get(company['priority'], 2.5)
        
        # Boost score for high-impact form types
        if form_type == '8-K':
            score += 1.0  # Material events most relevant for real-time monitoring
        elif form_type == '10-K':
            score += 0.5  # Annual reports have strategic importance
        
        return min(10.0, score)  # Cap at 10.0
    
    def _generate_sec_url_fixed(self, cik: str, access_number: str, document: str) -> str:
        """Generate corrected direct URL to SEC filing for compliance team access"""
        if not all([cik, access_number, document]):
            return ""
        
        # Remove leading zeros from CIK for URL structure
        clean_cik = str(int(cik))
        
        return f"https://www.sec.gov/Archives/edgar/data/{clean_cik}/{access_number}/{document}"
    
    def _generate_backup_access_methods(self, company: Dict, access_number: str, form_type: str) -> Dict:
        """Generate multiple access methods for enterprise reliability"""
        
        backup_methods = {}
        
        if access_number:
            # SEC Search URL
            backup_methods['sec_search'] = f"https://www.sec.gov/edgar/search/#/dateRange=all&entityName={company['name']}&forms={form_type}"
            
            # Company-specific filing page
            backup_methods['company_page'] = f"https://www.sec.gov/edgar/browse/?CIK={company['cik']}"
            
            # Alternative search by accession number
            clean_accession = access_number.replace('-', '')
            backup_methods['accession_search'] = f"https://www.sec.gov/edgar/search/#/q={clean_accession}"
        
        return backup_methods
    
    def _identify_regulatory_trends(self, intelligence_data: Dict) -> List[Dict]:
        """Identify regulatory trends relevant to Dow Chemical"""
        
        trends = []
        
        # Analyze filing patterns
        all_filings = (
            intelligence_data['critical_alerts'] +
            intelligence_data['competitor_intelligence'] +
            intelligence_data['customer_updates'] +
            intelligence_data['supplier_alerts']
        )
        
        if len(all_filings) > 5:
            # Trend 1: Form type frequency
            form_counts = {}
            for filing in all_filings:
                form_type = filing.get('form_type', 'Unknown')
                form_counts[form_type] = form_counts.get(form_type, 0) + 1
            
            if form_counts.get('8-K', 0) > 3:
                trends.append({
                    'trend_type': 'Increased Material Events',
                    'description': f"High frequency of 8-K filings ({form_counts['8-K']}) suggests significant corporate events in chemical industry",
                    'dow_impact': 'Monitor for market shifts, competitive moves, regulatory changes',
                    'confidence': 'High' if form_counts['8-K'] > 5 else 'Medium'
                })
        
        return trends
    
    def export_dow_intelligence(self, intelligence_data: Dict, custom_filename: str = None) -> str:
        """Export intelligence data in Dow-specific format"""
        
        if not custom_filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            custom_filename = f"dow_regulatory_intelligence_{timestamp}.json"
        
        # Add Dow-specific metadata
        intelligence_data['dow_metadata'] = {
            'generated_for': 'Dow Chemical Company',
            'compliance_focus': 'Multi-jurisdictional chemical industry compliance',
            'alert_categories': list(self.compliance_forms.keys()),
            'monitoring_scope': f"{len(self.dow_relevant_companies)} industry-relevant companies",
            'next_fetch_recommended': (datetime.now() + timedelta(days=1)).isoformat(),
            'url_access_methods': 'Primary URLs with enterprise backup methods included'
        }
        
        try:
            with open(custom_filename, 'w') as f:
                json.dump(intelligence_data, f, indent=2, default=str)
            
            print(f"Dow regulatory intelligence exported to: {custom_filename}")
            return custom_filename
            
        except Exception as e:
            print(f"Export failed: {e}")
            return None

def main():
    """Main execution for Dow Chemical regulatory monitoring"""
    
    print("DOW CHEMICAL REGULATORY INTELLIGENCE SYSTEM")
    print("Monitoring SEC filings for compliance-relevant information")
    print("Chemical industry focus with multi-jurisdictional awareness")
    print("=" * 70)
    
    # Initialize Dow-specific fetcher
    dow_fetcher = DowComplianceDataFetcher()
    
    # Fetch intelligence (monitor last 14 days for more frequent updates)
    intelligence = dow_fetcher.fetch_dow_regulatory_intelligence(days_back=14)
    
    if intelligence and intelligence['metadata']['total_filings_found'] > 0:
        
        # Display executive summary for Dow compliance team
        print(f"\nDOW EXECUTIVE SUMMARY:")
        print(f"Critical Dow alerts requiring immediate attention: {len(intelligence['critical_alerts'])}")
        if intelligence['critical_alerts']:
            print("   Most recent Dow filing:")
            latest = intelligence['critical_alerts'][0]
            print(f"   • {latest['form_type']} filed {latest['filing_date']} - {latest['compliance_category']}")
        
        print(f"Competitor intelligence updates: {len(intelligence['competitor_intelligence'])}")
        if intelligence['competitor_intelligence']:
            print("   Key competitor activity:")
            for comp in intelligence['competitor_intelligence'][:2]:
                print(f"   • {comp['company']}: {comp['form_type']} - {comp['compliance_category']}")
        
        print(f"Customer/Partner updates: {len(intelligence['customer_updates']) + len(intelligence['supplier_alerts'])}")
        
        # Export for Dow compliance team
        export_filename = dow_fetcher.export_dow_intelligence(intelligence)
        
        print(f"\nRECOMMENDED ACTIONS FOR DOW COMPLIANCE TEAM:")
        print("1. Review critical alerts for immediate compliance impact")
        print("2. Analyze competitor filings for industry trend insights") 
        print("3. Schedule daily monitoring for real-time regulatory awareness")
        print("4. Integrate with existing ABEX hotline and Skillsoft training systems")
        
        return intelligence
        
    else:
        print("No regulatory intelligence collected - check connections and try again")
        return None

if __name__ == "__main__":
    main()

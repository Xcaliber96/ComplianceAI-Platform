from sec_edgar_api import EdgarClient
import json
import time
from datetime import datetime, timedelta
from typing import List, Dict


class ComplianceDataFetcher:
    """
    Generic regulatory data fetcher for any company or sector,
    fully featured as per original Dow-specific code but configurable.
    """
    def __init__(self,
                 user_agent: str,
                 relevant_companies: List[Dict],
                 compliance_forms: Dict,
                 regulatory_keywords: Dict,
                 company_name: str = "Company"):
        self.user_agent = user_agent
        self.company_name = company_name
        try:
            self.edgar_client = EdgarClient(user_agent=self.user_agent)
            print(f"{self.company_name} Compliance Data Pipeline Initialized")
            print("SEC EDGAR client ready for multi-industry monitoring")
        except Exception as e:
            print(f"Failed to initialize SEC client: {e}")
            raise
        
        self.relevant_companies = relevant_companies
        self.compliance_forms = compliance_forms
        self.regulatory_keywords = regulatory_keywords

    def fetch_regulatory_intelligence(self, days_back=30) -> Dict:
        """
        Fetch regulatory intelligence relevant for configured companies.
        """
        print(f"\nSTARTING REGULATORY INTELLIGENCE FETCH FOR {self.company_name}")
        print(f"Monitoring period: Last {days_back} days")
        print(f"Companies monitored: {len(self.relevant_companies)}")
        print(f"Compliance areas: {list(self.compliance_forms.keys())}")
        print("=" * 70)

        all_intelligence = {
            'critical_alerts': [],
            'competitor_intelligence': [],
            'customer_updates': [],
            'supplier_alerts': [],
            'regulatory_trends': [],
            'metadata': {
                'fetch_timestamp': datetime.now().isoformat(),
                'monitoring_period_days': days_back,
                'companies_processed': 0,
                'total_filings_found': 0
            }
        }

        for i, company in enumerate(self.relevant_companies):
            print(f"\n--- Processing {i+1}/{len(self.relevant_companies)}: {company['name']} ({company.get('priority', '').upper()}) ---")

            try:
                if i > 0:
                    time.sleep(0.15)

                print(f"Fetching SEC submissions for CIK: {company['cik']}")
                submissions = self.edgar_client.get_submissions(cik=company['cik'])

                if submissions:
                    print(f"Connected to {submissions['name']}")
                    
                    relevant_filings = self._analyze_compliance_relevance(submissions, company, days_back)

                    rel = company.get('relationship', '')
                    sector = company.get('sector', '').lower()
                    if rel == 'self' or company['ticker'] == self.company_name:
                        all_intelligence['critical_alerts'].extend(relevant_filings)
                        print(f"CRITICAL: {len(relevant_filings)} company filings")
                    elif sector == 'chemicals':
                        all_intelligence['competitor_intelligence'].extend(relevant_filings)
                        print(f"COMPETITOR: {len(relevant_filings)} competitor filings")
                    elif sector in ['technology', 'automotive']:
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

        all_intelligence['regulatory_trends'] = self._identify_regulatory_trends(all_intelligence)

        print(f"\n{'='*70}")
        print(f"{self.company_name.upper()} REGULATORY INTELLIGENCE COMPLETE")
        print(f"Total filings analyzed: {all_intelligence['metadata']['total_filings_found']}")
        print(f"Critical alerts: {len(all_intelligence['critical_alerts'])}")
        print(f"Competitor intelligence: {len(all_intelligence['competitor_intelligence'])}")
        print(f"Customer updates: {len(all_intelligence['customer_updates'])}")
        print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*70}")

        return all_intelligence

    def _analyze_compliance_relevance(self, submissions: Dict, company: Dict, days_back: int) -> List[Dict]:
        cutoff_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
        relevant_filings = []
        recent = submissions['filings']['recent']

        print(f"Scanning {len(recent.get('form', []))} total filings since {cutoff_date}")
        
        all_relevant_forms = []
        for form_list in self.compliance_forms.values():
            all_relevant_forms.extend(form_list)

        relevant_count = 0
        for i, form in enumerate(recent.get('form', [])):
            filing_date = recent.get('filingDate', [])[i] if i < len(recent.get('filingDate', [])) else None

            if (filing_date and filing_date >= cutoff_date and 
                form in all_relevant_forms and 
                relevant_count < 8):  # Limit per company for efficiency
                
                filing_data = {
                    'company': submissions.get('name'),
                    'company_relationship': company.get('sector', 'unknown'),
                    'priority_level': company.get('priority'),
                    'cik': company.get('cik'),
                    'ticker': company.get('ticker'),
                    'form_type': form,
                    'filing_date': filing_date,
                    'document': recent.get('primaryDocument', [])[i] if i < len(recent.get('primaryDocument', [])) else None,
                    'access_number': recent.get('accessionNumber', [])[i] if i < len(recent.get('accessionNumber', [])) else None,
                    'file_size': recent.get('size', [])[i] if i < len(recent.get('size', [])) else 0,
                    'compliance_category': self._categorize_compliance_area(form),
                    'relevance_score': self._calculate_relevance_score(company, form),
                    'sec_url': self._generate_sec_url(company['cik'], recent.get('accessionNumber', [])[i], recent.get('primaryDocument', [])[i]),
                    'sec_backup_urls': self._generate_backup_access_methods(company, recent.get('accessionNumber', [])[i], form),
                    'fetched_timestamp': datetime.now().isoformat()
                }

                relevant_filings.append(filing_data)
                relevant_count += 1
                print(f"   {form} on {filing_date} - {filing_data['compliance_category']} (Score: {filing_data['relevance_score']})")

        return sorted(relevant_filings, key=lambda x: x['relevance_score'], reverse=True)

    def _categorize_compliance_area(self, form_type: str) -> str:
        form_category_map = {
            '10-K': 'Annual Financial & Risk Disclosure',
            '10-Q': 'Quarterly Financial Update',
            '8-K': 'Material Events & Corporate Changes',
            'DEF 14A': 'Shareholder Governance',
        }
        return form_category_map.get(form_type, 'General Compliance')

    def _calculate_relevance_score(self, company: Dict, form_type: str) -> float:
        base_score = {
            'critical': 10.0,
            'high': 7.5,
            'medium': 5.0,
            'low': 2.5
        }
        score = base_score.get(company.get('priority', ''), 2.5)
        if form_type == '8-K':
            score += 1.0 
        elif form_type == '10-K':
            score += 0.5 
        return min(10.0, score)

    def _generate_sec_url(self, cik: str, access_number: str, document: str) -> str:
        if not all([cik, access_number, document]):
            return ""
        clean_cik = str(int(cik))
        return f"https://www.sec.gov/Archives/edgar/data/{clean_cik}/{access_number}/{document}"

    def _generate_backup_access_methods(self, company: Dict, access_number: str, form_type: str) -> Dict:
        backup_methods = {}
        if access_number:
            backup_methods['sec_search'] = f"https://www.sec.gov/edgar/search/#/dateRange=all&entityName={company['name']}&forms={form_type}"
            backup_methods['company_page'] = f"https://www.sec.gov/edgar/browse/?CIK={company['cik']}"
            clean_accession = access_number.replace('-', '')
            backup_methods['accession_search'] = f"https://www.sec.gov/edgar/search/#/q={clean_accession}"
        return backup_methods

    def _identify_regulatory_trends(self, intelligence_data: Dict) -> List[Dict]:
        trends = []
        all_filings = (
            intelligence_data['critical_alerts'] +
            intelligence_data['competitor_intelligence'] +
            intelligence_data['customer_updates'] +
            intelligence_data['supplier_alerts']
        )
        if len(all_filings) > 5:
            form_counts = {}
            for filing in all_filings:
                form_type = filing.get('form_type', 'Unknown')
                form_counts[form_type] = form_counts.get(form_type, 0) + 1
            if form_counts.get('8-K', 0) > 3:
                trends.append({
                    'trend_type': 'Increased Material Events',
                    'description': f"High frequency of 8-K filings ({form_counts['8-K']}) suggests significant corporate events",
                    'impact': 'Monitor market shifts and regulatory changes',
                    'confidence': 'High' if form_counts['8-K'] > 5 else 'Medium'
                })
        return trends

    def export_intelligence(self, intelligence_data: Dict, custom_filename: str = None) -> str:
        if not custom_filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            custom_filename = f"{self.company_name.lower().replace(' ', '_')}_regulatory_intelligence_{timestamp}.json"
        
        intelligence_data['metadata']['generated_for'] = self.company_name
        
        try:
            with open(custom_filename, 'w') as f:
                json.dump(intelligence_data, f, indent=2, default=str)
            print(f"Regulatory intelligence exported to: {custom_filename}")
            return custom_filename
        except Exception as e:
            print(f"Export failed: {e}")
            return None


def main():
    print("MULTI-COMPANY REGULATORY INTELLIGENCE SYSTEM")
    print("Adapted for industry-specific monitoring")
    print("=" * 70)

    expanded_companies = [
        {"cik": "1067983", "name": "DuPont de Nemours Inc.", "ticker": "DD", "sector": "chemicals", "priority": "high", "relationship": "competitor"},
        {"cik": "1440507", "name": "Dow Inc.", "ticker": "DOW", "sector": "chemicals", "priority": "critical", "relationship": "self"},
        {"cik": "1912536", "name": "LyondellBasell Industries", "ticker": "LYB", "sector": "chemicals", "priority": "high", "relationship": "competitor"},
        {"cik": "1534701", "name": "Eastman Chemical Company", "ticker": "EMN", "sector": "chemicals", "priority": "high", "relationship": "competitor"},
        {"cik": "320193", "name": "Apple Inc.", "ticker": "AAPL", "sector": "technology", "priority": "medium", "relationship": "customer"},
        {"cik": "789019", "name": "Microsoft Corporation", "ticker": "MSFT", "sector": "technology", "priority": "medium", "relationship": "customer"},
        {"cik": "1318605", "name": "Tesla, Inc.", "ticker": "TSLA", "sector": "automotive", "priority": "high", "relationship": "customer"},
        {"cik": "66740", "name": "3M Company", "ticker": "MMM", "sector": "materials", "priority": "medium", "relationship": "supplier"},
        {"cik": "1467858", "name": "BASF SE", "ticker": "BASFY", "sector": "chemicals", "priority": "high", "relationship": "competitor"}
    ]

    compliance_forms = {
        'financial_compliance': ['10-K', '10-Q', '8-K'],
        'environmental_disclosure': ['8-K'],
        'governance': ['DEF 14A'],
        'acquisitions': ['8-K', '10-K'],
        'risk_factors': ['10-K', '10-Q']
    }

    regulatory_keywords = {
        'environmental': ['environmental compliance', 'epa', 'clean air act', 'clean water act', 'rcra', 'superfund', 'emissions', 'discharge', 'remediation'],
        'chemical_safety': ['chemical safety', 'toxic substances', 'tsca', 'reach', 'osha', 'safety data sheet', 'hazardous materials', 'chemical registration'],
        'international_trade': ['export control', 'sanctions', 'ofac', 'trade compliance', 'dual use', 'embargo', 'restricted party screening'],
        'product_liability': ['product liability', 'recall', 'consumer protection', 'product safety', 'class action', 'litigation', 'settlement']
    }

    fetcher = ComplianceDataFetcher(
        user_agent="ComplianceAI-Platform compliance@yourcompany.com",
        relevant_companies=expanded_companies,
        compliance_forms=compliance_forms,
        regulatory_keywords=regulatory_keywords,
        company_name="Your Company"
    )

    intelligence = fetcher.fetch_regulatory_intelligence(days_back=14)

    if intelligence and intelligence['metadata']['total_filings_found'] > 0:
        fetcher.export_intelligence(intelligence)
        print("\nRECOMMENDED ACTIONS:")
        print("1. Review critical alerts for immediate compliance impact")
        print("2. Analyze competitor filings for industry trend insights")
        print("3. Schedule daily monitoring for real-time regulatory awareness")
        print("4. Integrate with internal compliance & training systems")
    else:
        print("No regulatory intelligence collected - check connections and try again")

if __name__ == "__main__":
    main()

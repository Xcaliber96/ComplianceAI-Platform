# working_sec_fetcher.py 
from sec_edgar_api import EdgarClient
import json
import time
from datetime import datetime, timedelta

def fetch_regulatory_data():
    """Enhanced SEC fetcher with comprehensive output logging"""
    print("Starting SEC regulatory data fetch...")
    
    # Initialize client with error handling
    try:
        edgar = EdgarClient(user_agent="YourCompanyName admin@yourcompany.com")
        print(" SEC client initialized successfully")
    except Exception as e:
        print(f" Failed to initialize SEC client: {e}")
        return None
    
    # Companies to monitor
    companies = [
        {"cik": "320193", "name": "Apple Inc.", "ticker": "AAPL"},
        {"cik": "789019", "name": "Microsoft Corporation", "ticker": "MSFT"},
        {"cik": "1318605", "name": "Tesla, Inc.", "ticker": "TSLA"}
    ]
    
    all_data = []
    forms_to_track = ['10-K', '10-Q', '8-K', 'DEF 14A']
    
    print(f" Processing {len(companies)} companies...")
    print(f" Tracking forms: {', '.join(forms_to_track)}")
    
    for i, company in enumerate(companies):
        print(f"\n--- Processing {i+1}/{len(companies)}: {company['name']} ---")
        
        try:
            print(f" Fetching submissions for CIK: {company['cik']}")
            
            # SEC rate limiting compliance
            if i > 0:
                print(" Rate limiting delay...")
                time.sleep(0.12)
            
            # Make API request
            submissions = edgar.get_submissions(cik=company['cik'])
            
            if submissions:
                print(f" Got data for {submissions['name']}")
                
                # Process filings
                recent_filings = []
                recent = submissions['filings']['recent']
                
                forms_found = 0
                total_forms = len(recent['form'])
                print(f" Scanning {total_forms} total filings...")
                
                for j, form in enumerate(recent['form']):
                    if form in forms_to_track and forms_found < 5:  # Limit to 5 per company
                        filing_data = {
                            'company': submissions['name'],
                            'cik': company['cik'],
                            'ticker': company['ticker'],
                            'form': form,
                            'filing_date': recent['filingDate'][j],
                            'document': recent['primaryDocument'][j],
                            'access_number': recent['accessionNumber'][j],
                            'size': recent['size'][j]
                        }
                        recent_filings.append(filing_data)
                        forms_found += 1
                        print(f"   Found: {form} on {recent['filingDate'][j]} ({recent['size'][j]} bytes)")
                
                all_data.extend(recent_filings)
                print(f" Added {len(recent_filings)} filings from {company['name']}")
                
            else:
                print(f" No data received for {company['name']}")
                
        except Exception as e:
            print(f" Error processing {company['name']}: {e}")
            print(f"   Error type: {type(e).__name__}")
            continue
    
    # Final results summary
    print(f"\n{'='*60}")
    print(f" FETCH COMPLETE!")
    print(f" Total filings collected: {len(all_data)}")
    print(f" Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")
    
    return all_data

# Main execution
if __name__ == "__main__":
    print(" SEC EDGAR Regulatory Data Fetcher")
    print("="*50)
    
    # Run the fetch
    result = fetch_regulatory_data()
    
    if result:
        print(f"\n SUCCESS! Collected {len(result)} regulatory filings")
        
        # Show sample data
        print("\n Sample filings:")
        for i, filing in enumerate(result[:3]):
            print(f"\n{i+1}. {filing['company']} ({filing['ticker']})")
            print(f"   Form: {filing['form']}")
            print(f"   Date: {filing['filing_date']}")
            print(f"   Size: {filing['size']:,} bytes")
        
        # Export JSON
        output = {
            'filings': result,
            'metadata': {
                'total_count': len(result),
                'fetched_at': datetime.now().isoformat(),
                'companies_processed': 3,
                'status': 'success'
            }
        }
        
        # Save to file
        filename = f"sec_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(output, f, indent=2)
        
        print(f"\n Data exported to: {filename}")
        print(f" Use this data for your regulatory monitoring pipeline!")
        
    else:
        print("\n FAILED - No data collected")
        print("Check your internet connection and user agent format")

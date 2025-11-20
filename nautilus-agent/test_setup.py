"""
Simple test script to verify Nautilus Agent setup
"""
import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

def check_dependencies():
    """Check if required packages are installed"""
    print("\n=== Checking Python Dependencies ===\n")
    
    required = {
        'requests': '✓ HTTP requests',
        'openai': '✓ OpenAI API (for certificate analysis)',
        'PIL': '✓ Pillow (image processing)',
        'github': '✓ PyGithub (GitHub API)',
        'dotenv': '✓ Python-dotenv (environment variables)'
    }
    
    all_installed = True
    for package, description in required.items():
        try:
            __import__(package)
            print(f"  {description}")
        except ImportError:
            print(f"  ✗ {package} - NOT INSTALLED")
            all_installed = False
    
    return all_installed

def check_env_variables():
    """Check environment variables"""
    print("\n=== Checking Environment Variables ===\n")
    
    from dotenv import load_dotenv
    load_dotenv()
    
    required_vars = {
        'GITHUB_CLIENT_ID': os.getenv('GITHUB_CLIENT_ID'),
        'GITHUB_CLIENT_SECRET': os.getenv('GITHUB_CLIENT_SECRET'),
        'OPENAI_API_KEY': os.getenv('OPENAI_API_KEY'),
        'TRUST_ORACLE_PACKAGE_ID': os.getenv('TRUST_ORACLE_PACKAGE_ID'),
        'WALRUS_AGGREGATOR': os.getenv('WALRUS_AGGREGATOR'),
        'SUI_RPC_URL': os.getenv('SUI_RPC_URL'),
    }
    
    all_set = True
    for var, value in required_vars.items():
        if value:
            masked = value[:10] + '...' if len(value) > 10 else value
            print(f"  ✓ {var}: {masked}")
        else:
            print(f"  ✗ {var}: NOT SET")
            all_set = False
    
    return all_set

def test_github_auth():
    """Test GitHub authentication module"""
    print("\n=== Testing GitHub Authentication Module ===\n")
    
    try:
        from src.github_auth import GitHubAuthenticator
        
        auth = GitHubAuthenticator(
            client_id=os.getenv('GITHUB_CLIENT_ID', 'test'),
            client_secret=os.getenv('GITHUB_CLIENT_SECRET', 'test'),
            redirect_uri=os.getenv('GITHUB_REDIRECT_URI', 'http://localhost:5173/verify')
        )
        
        # Test OAuth URL generation
        url = auth.get_authorization_url('test_state')
        print(f"  ✓ OAuth URL generated successfully")
        print(f"    {url[:80]}...")
        
        return True
    except Exception as e:
        print(f"  ✗ Error: {str(e)}")
        return False

def test_certificate_analyzer():
    """Test certificate analyzer module"""
    print("\n=== Testing Certificate Analyzer Module ===\n")
    
    try:
        from src.certificate_analyzer import CertificateAnalyzer
        
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            print("  ⚠️  OpenAI API Key not set - skipping actual API test")
            print("  ✓ Module import successful")
            return True
        
        analyzer = CertificateAnalyzer(api_key=api_key)
        print("  ✓ CertificateAnalyzer initialized successfully")
        
        return True
    except Exception as e:
        print(f"  ✗ Error: {str(e)}")
        return False

def test_main_agent():
    """Test main Nautilus agent"""
    print("\n=== Testing Main Nautilus Agent ===\n")
    
    try:
        from src.agent import NautilusAgent
        
        agent = NautilusAgent()
        print("  ✓ NautilusAgent initialized successfully")
        
        # Check if enhanced features are available
        if hasattr(agent, 'github_manager'):
            print("  ✓ GitHub integration loaded")
        else:
            print("  ⚠️  GitHub integration not loaded")
        
        if hasattr(agent, 'certificate_analyzer'):
            print("  ✓ Certificate analyzer loaded")
        else:
            print("  ⚠️  Certificate analyzer not loaded")
        
        return True
    except Exception as e:
        print(f"  ✗ Error: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("  NAUTILUS TRUST ENGINE - SYSTEM CHECK")
    print("="*60)
    
    results = {
        'Dependencies': check_dependencies(),
        'Environment Variables': check_env_variables(),
        'GitHub Auth Module': test_github_auth(),
        'Certificate Analyzer': test_certificate_analyzer(),
        'Main Agent': test_main_agent(),
    }
    
    print("\n" + "="*60)
    print("  SUMMARY")
    print("="*60 + "\n")
    
    for test, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        color = "\033[92m" if passed else "\033[91m"
        reset = "\033[0m"
        print(f"  {color}{status}{reset} - {test}")
    
    all_passed = all(results.values())
    
    print("\n" + "="*60)
    if all_passed:
        print("  ✓ ALL CHECKS PASSED!")
        print("="*60 + "\n")
        print("  🚀 System is ready to use!")
        print("  Next steps:")
        print("    1. Get OpenAI API key if not already set")
        print("    2. Start the backend server")
        print("    3. Start the frontend with 'npm run dev'")
    else:
        print("  ⚠️  SOME CHECKS FAILED")
        print("="*60 + "\n")
        print("  Please fix the issues above before proceeding.")
    
    print()

if __name__ == "__main__":
    main()

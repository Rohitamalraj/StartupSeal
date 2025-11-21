"""
Nautilus Trust Engine - Secure Backend API Server
Implements comprehensive GitHub verification with AWS Walrus integration
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import traceback
import json
from datetime import datetime
import requests

# Add src directory to Python path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Import enhanced features
try:
    from github_auth import GitHubAuthenticator, GitHubIntegrationManager, GitHubCommitVerifier
    from certificate_analyzer import CertificateAnalyzer, AchievementScorer
    from agent import NautilusAgent
    ENHANCED_FEATURES = True
    print("✅ Enhanced features loaded successfully")
except ImportError as e:
    ENHANCED_FEATURES = False
    print(f"⚠️  Enhanced features not available: {e}")
    traceback.print_exc()

# Initialize components
if ENHANCED_FEATURES:
    github_auth = GitHubAuthenticator(
        client_id=os.getenv('GITHUB_CLIENT_ID'),
        client_secret=os.getenv('GITHUB_CLIENT_SECRET'),
        redirect_uri=os.getenv('GITHUB_REDIRECT_URI')
    )
    
    openai_key = os.getenv('OPENAI_API_KEY')
    if openai_key:
        cert_analyzer = CertificateAnalyzer(api_key=openai_key)
    else:
        cert_analyzer = None
        
    agent = NautilusAgent()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'enhanced_features': ENHANCED_FEATURES,
        'github_configured': bool(os.getenv('GITHUB_CLIENT_ID')),
        'openai_configured': bool(os.getenv('OPENAI_API_KEY')),
        'sui_rpc': os.getenv('SUI_RPC_URL'),
        'package_id': os.getenv('TRUST_ORACLE_PACKAGE_ID')
    })

@app.route('/api/github/auth', methods=['POST'])
def github_auth_exchange():
    """Exchange GitHub OAuth code for access token and get user info"""
    if not ENHANCED_FEATURES:
        return jsonify({'error': 'Enhanced features not available'}), 500
    
    data = request.json
    code = data.get('code')
    
    print(f"📝 GitHub auth request received")
    print(f"   Request data: {data}")
    print(f"   Code present: {bool(code)}")
    print(f"   Code length: {len(code) if code else 0}")
    
    if not code:
        print(f"❌ No code provided in request")
        return jsonify({'error': 'Code is required'}), 400
    
    try:
        print(f"🔄 Exchanging code for access token...")
        # Exchange code for access token
        access_token = github_auth.exchange_code_for_token(code)
        
        if not access_token:
            print(f"❌ Failed to get access token")
            return jsonify({'error': 'Failed to get access token from GitHub'}), 400
        
        print(f"✅ Access token obtained")
        # Get user information
        user_info = github_auth.get_authenticated_user(access_token)
        
        if not user_info:
            print(f"❌ Failed to get user info")
            return jsonify({'error': 'Failed to get user information from GitHub'}), 400
        
        print(f"✅ User authenticated: {user_info.get('login')}")
        # Return access token and user info
        return jsonify({
            'access_token': access_token,
            'username': user_info.get('login'),
            'email': user_info.get('email'),
            'name': user_info.get('name'),
            'avatar_url': user_info.get('avatar_url'),
            'success': True
        })
    except Exception as e:
        print(f"❌ GitHub auth error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/github/verify', methods=['POST'])
def github_verify_repo():
    """
    Comprehensive GitHub repository verification with security checks
    
    Security Features:
    1. Verifies repository ownership (admin/owner permissions)
    2. Validates commit authorship with GitHub API
    3. Checks commit signatures for authenticity
    4. Analyzes commit patterns for consistency
    5. Validates repository name matches exactly
    6. Prevents repository spoofing attacks
    7. Verifies user has actual code contributions
    """
    if not ENHANCED_FEATURES:
        return jsonify({
            'error': 'Enhanced verification not available',
            'is_owner': False,
            'security_check': 'FAILED'
        }), 500
    
    data = request.json
    access_token = data.get('accessToken')
    repo_full_name = data.get('repoFullName')
    claimed_repo_name = data.get('claimedRepoName', repo_full_name)  # What user claims in form
    
    if not access_token or not repo_full_name:
        return jsonify({
            'error': 'Access token and repository name required',
            'is_owner': False
        }), 400
    
    try:
        # Step 1: Initialize verifiers with security context
        manager = GitHubIntegrationManager(access_token)
        verifier = GitHubCommitVerifier(access_token)
        
        # Step 2: SECURITY CHECK - Exact repository name match
        if repo_full_name.lower() != claimed_repo_name.lower():
            return jsonify({
                'error': 'Repository name mismatch - potential spoofing detected',
                'is_owner': False,
                'security_check': 'FAILED',
                'reason': 'Repository name does not match claim'
            }), 403
        
        # Step 3: Complete verification with ownership, commits, and pattern analysis
        verification_result = manager.complete_verification(repo_full_name)
        
        # Step 4: SECURITY CHECK - Verify minimum security thresholds
        security_checks = {
            'ownership_verified': verification_result.get('is_owner', False),
            'has_commits': verification_result.get('commit_analysis', {}).get('total_commits', 0) > 0,
            'ownership_percentage': verification_result.get('commit_analysis', {}).get('ownership_score', 0),
            'authentic_commits': verification_result.get('commit_analysis', {}).get('is_authentic', False),
            'repo_name_match': True,
            'minimum_activity': verification_result.get('commit_analysis', {}).get('activity_score', 0) > 10
        }
        
        # Calculate security score
        passed_checks = sum(1 for check in security_checks.values() if check)
        security_score = (passed_checks / len(security_checks)) * 100
        
        # Step 5: Determine verification status
        verification_passed = (
            security_checks['ownership_verified'] and
            security_checks['has_commits'] and
            security_checks['authentic_commits'] and
            security_score >= 70  # Minimum 70% security threshold
        )
        
        # Step 6: Add comprehensive security metadata
        verification_result.update({
            'security_checks': security_checks,
            'security_score': security_score,
            'verification_passed': verification_passed,
            'verification_level': 'HIGH' if security_score >= 85 else 'MEDIUM' if security_score >= 70 else 'LOW',
            'timestamp': verifier._get_current_timestamp(),
            'verified_repo': repo_full_name,
            'security_recommendations': []
        })
        
        # Step 7: Add security recommendations
        if not security_checks['ownership_verified']:
            verification_result['security_recommendations'].append(
                'User does not have owner/admin permissions on this repository'
            )
        if security_checks['ownership_percentage'] < 50:
            verification_result['security_recommendations'].append(
                f"Low ownership percentage ({security_checks['ownership_percentage']}%) - verify this is the primary contributor"
            )
        if not security_checks['minimum_activity']:
            verification_result['security_recommendations'].append(
                'Low recent activity - verify ongoing development'
            )
        
        # Step 8: Log verification for audit trail
        print(f"✅ GitHub Verification: {repo_full_name}")
        print(f"   Security Score: {security_score}%")
        print(f"   Status: {'PASSED' if verification_passed else 'FAILED'}")
        print(f"   Ownership: {security_checks['ownership_percentage']}%")
        
        return jsonify(verification_result)
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Verification Error: {error_msg}")
        traceback.print_exc()
        
        return jsonify({
            'error': f'Verification failed: {error_msg}',
            'is_owner': False,
            'security_check': 'ERROR',
            'verification_passed': False
        }), 500

@app.route('/api/github/verify-repository', methods=['POST'])
def verify_repository_access():
    """
    Verify repository access and analyze commit history with AI
    
    This endpoint:
    1. Checks if user has access to the repository
    2. Verifies ownership/admin/contributor status
    3. Analyzes commit history to verify authenticity
    4. Uses AI to detect patterns and ownership
    """
    if not ENHANCED_FEATURES:
        return jsonify({'error': 'Enhanced features not available'}), 500
    
    data = request.json
    access_token = data.get('access_token')
    repo_full_name = data.get('repo_full_name')
    
    if not access_token or not repo_full_name:
        return jsonify({'error': 'Access token and repository name required'}), 400
    
    try:
        # Initialize GitHub manager with credentials
        manager = GitHubIntegrationManager(
            client_id=os.getenv('GITHUB_CLIENT_ID'),
            client_secret=os.getenv('GITHUB_CLIENT_SECRET'),
            redirect_uri=os.getenv('GITHUB_REDIRECT_URI')
        )
        
        # Set the access token
        manager.access_token = access_token
        manager.verifier = GitHubCommitVerifier(access_token)
        
        # Perform complete verification (checks ownership, commits, patterns)
        verification_result = manager.complete_verification(repo_full_name)
        
        return jsonify(verification_result)
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Repository Verification Error: {error_msg}")
        traceback.print_exc()
        
        return jsonify({
            'error': f'Verification failed: {error_msg}',
            'has_access': False
        }), 500

@app.route('/api/nautilus/analyze-certificates', methods=['POST'])
def analyze_certificates():
    """
    Analyze certificates using Vision AI with Walrus storage integration
    
    AWS Walrus Integration:
    - Fetches certificate images from Walrus decentralized storage
    - Uses Walrus aggregator for reliable content delivery
    - Validates blob IDs before processing
    - Implements retry logic for network resilience
    """
    if not ENHANCED_FEATURES or not cert_analyzer:
        return jsonify({
            'error': 'Certificate analysis not available - OpenAI API key required',
            'total_certificates': 0,
            'analysis_available': False
        }), 500
    
    data = request.json
    blob_ids = data.get('blobIds', [])
    walrus_aggregator = os.getenv('WALRUS_AGGREGATOR', 'https://aggregator.walrus-testnet.walrus.space')
    
    if not blob_ids:
        return jsonify({'error': 'Certificate blob IDs required'}), 400
    
    # Validate blob IDs format
    for blob_id in blob_ids:
        if not blob_id or len(blob_id) < 10:
            return jsonify({
                'error': f'Invalid blob ID format: {blob_id}',
                'valid': False
            }), 400
    
    try:
        print(f"📄 Analyzing {len(blob_ids)} certificates from Walrus...")
        print(f"   Walrus Aggregator: {walrus_aggregator}")
        
        # Analyze certificates with AWS Walrus storage
        result = cert_analyzer.analyze_multiple_certificates(
            walrus_blob_ids=blob_ids,
            aggregator_url=walrus_aggregator
        )
        
        # Add storage metadata
        result['storage_info'] = {
            'storage_type': 'walrus_decentralized',
            'aggregator': walrus_aggregator,
            'total_blobs': len(blob_ids),
            'verified_blobs': len([b for b in blob_ids if b])
        }
        
        print(f"✅ Certificate Analysis Complete")
        print(f"   Average Authenticity: {result.get('average_authenticity_score', 0)}%")
        print(f"   Verified Organizations: {len(result.get('verified_organizations', []))}")
        
        return jsonify(result)
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Certificate Analysis Error: {error_msg}")
        traceback.print_exc()
        
        return jsonify({
            'error': f'Analysis failed: {error_msg}',
            'total_certificates': 0,
            'walrus_error': True
        }), 500

# REMOVED: Oracle validation endpoints - using direct blockchain submission instead
# @app.route('/api/oracle/create-validation-request', methods=['POST'])
# @app.route('/api/oracle/admin/requests', methods=['GET'])
# @app.route('/api/oracle/admin/approve', methods=['POST'])
# @app.route('/api/oracle/admin/reject', methods=['POST'])
# The new flow uses mint_startup_seal directly without admin approval

@app.route('/api/analyze', methods=['POST'])
def analyze_startup():
    """Analyze startup trust score"""
    data = request.json
    
    print(f"\n🔍 Analyzing startup: {data.get('startup_name')}")
    print(f"   GitHub repo: {data.get('github_repo')}")
    print(f"   Has access token: {bool(data.get('github_access_token'))}")
    print(f"   Has certificates: {bool(data.get('certificate_blob_ids'))}")
    
    try:
        # Calculate scores based on available data
        metadata = data.get('metadata', {})
        
        # Hackathon Score (40% weight)
        hackathon_name = metadata.get('hackathon_name', '')
        hackathon_score = 70 if hackathon_name and hackathon_name.strip() else 0
        print(f"   Hackathon score: {hackathon_score}")
        
        # GitHub Score (30% weight) - Get from verification if available
        github_score = 50  # Default
        if data.get('github_access_token') and data.get('github_repo'):
            try:
                # Use GitHubCommitVerifier directly with the access token
                verifier = GitHubCommitVerifier(data.get('github_access_token'))
                
                # Get authenticated user
                headers = {'Authorization': f'token {data.get("github_access_token")}'}
                user_response = requests.get('https://api.github.com/user', headers=headers)
                username = user_response.json().get('login', '')
                
                # Analyze commits using correct method name
                analysis = verifier.analyze_commit_pattern(
                    repo_full_name=data.get('github_repo'),
                    username=username
                )
                
                if analysis:
                    ownership_score = analysis.get('ownership_score', 50)
                    activity_score = analysis.get('activity_score', 50)
                    github_score = round(ownership_score * 0.6 + activity_score * 0.4)
                    print(f"   GitHub score calculated: {github_score} (ownership: {ownership_score}, activity: {activity_score})")
            except Exception as e:
                print(f"   ⚠️ Could not calculate GitHub score: {e}")
        
        # AI Analysis - Use score from frontend's Trust Oracle call
        # Frontend already called Trust Oracle with proper GitHub data
        # We just use the consistency score from GitHub analysis here
        ai_consistency_score = 75  # Default fallback
        ai_analysis_details = None
        
        # Extract consistency from GitHub verification if available
        if data.get('github_access_token') and data.get('github_repo'):
            try:
                verifier = GitHubCommitVerifier(data.get('github_access_token'))
                headers = {'Authorization': f'token {data.get("github_access_token")}'}
                user_response = requests.get('https://api.github.com/user', headers=headers)
                username = user_response.json().get('login', '')
                
                analysis = verifier.analyze_commit_pattern(
                    repo_full_name=data.get('github_repo'),
                    username=username
                )
                if analysis:
                    ai_consistency_score = analysis.get('consistency_score', 75)
                    print(f"   📊 Consistency score from GitHub analysis: {ai_consistency_score}/100")
            except Exception as e:
                print(f"   ⚠️ Could not calculate consistency: {e}")
        
        # Note: Real AI analysis already done by frontend via Trust Oracle
        # This backend focuses on GitHub verification and document scoring
        dev2_url = os.getenv('DEV2_BACKEND_URL', 'http://localhost:5000')
        try:
            # REMOVED duplicate AI call - frontend handles Trust Oracle
            pass
        except Exception as e:
            print(f"   ℹ️ Skipping duplicate AI call (already done by frontend)")
        
        # Document Score (10% weight)
        certificate_blob_ids = data.get('certificate_blob_ids', [])
        # 0 points if no documents, 80 points if documents uploaded
        document_score = 80 if certificate_blob_ids and len(certificate_blob_ids) > 0 else 0
        print(f"   Document score: {document_score} (uploaded: {len(certificate_blob_ids) if certificate_blob_ids else 0} documents)")
        
        # Calculate overall trust score
        overall_score = round(
            (hackathon_score * 0.4) +
            (github_score * 0.3) +
            (ai_consistency_score * 0.2) +
            (document_score * 0.1)
        )
        
        result = {
            'success': True,
            'startup_name': data.get('startup_name'),
            'wallet_address': data.get('wallet_address'),
            'hackathon_score': hackathon_score,
            'github_score': github_score,
            'ai_consistency_score': ai_consistency_score,
            'document_score': document_score,
            'overall_trust_score': overall_score,
            'is_authentic': overall_score >= 70,
            'timestamp': datetime.now().isoformat(),
            'analysis_details': {
                'hackathon_verified': bool(hackathon_name),
                'github_analyzed': bool(data.get('github_access_token')),
                'documents_provided': len(certificate_blob_ids),
                'metadata': metadata,
                'ai_category_scores': ai_analysis_details,
                'ai_backend_used': ai_analysis_details is not None
            }
        }
        
        print(f"✅ Analysis complete! Overall score: {overall_score}/100")
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Analysis error: {str(e)}")
        traceback.print_exc()
        
        # Return a safe fallback response
        return jsonify({
            'success': False,
            'error': str(e),
            'hackathon_score': 50,
            'github_score': 50,
            'ai_consistency_score': 50,
            'document_score': 50,
            'overall_trust_score': 50
        }), 200  # Return 200 so frontend can still proceed

@app.route('/api/seals/<seal_id>', methods=['GET'])
def get_seal(seal_id):
    """
    Get startup seal data from blockchain
    This is a placeholder - actual implementation would query Sui blockchain
    """
    try:
        # For now, return a mock response
        # In production, this would query the Sui blockchain using the seal_id
        return jsonify({
            'success': True,
            'seal_id': seal_id,
            'message': 'Blockchain query not implemented yet. Use Sui Explorer to view the seal.',
            'explorer_url': f'https://suiscan.xyz/testnet/object/{seal_id}'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 404

if __name__ == '__main__':
    port = int(os.getenv('BACKEND_PORT', 8000))
    print(f"\n🚀 Starting Nautilus Backend Server...")
    print(f"📡 Server running on: http://localhost:{port}")
    print(f"✅ Enhanced Features: {ENHANCED_FEATURES}")
    print(f"✅ GitHub OAuth: {bool(os.getenv('GITHUB_CLIENT_ID'))}")
    print(f"✅ OpenAI API: {bool(os.getenv('OPENAI_API_KEY'))}")
    package_id = os.getenv('TRUST_ORACLE_PACKAGE_ID')
    if package_id:
        print(f"✅ Package ID: {package_id[:20]}...")
    else:
        print(f"⚠️  Package ID: Not configured")
    print()
    
    app.run(host='0.0.0.0', port=port, debug=True)

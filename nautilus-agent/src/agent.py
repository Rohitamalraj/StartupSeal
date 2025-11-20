"""
Nautilus AI Agent for Trust Score Calculation
This agent downloads documents from Walrus, analyzes them, and computes trust scores.
Enhanced with GitHub OAuth and Certificate Analysis.
"""

import os
import json
import hashlib
import requests
from typing import Dict, List, Tuple, Optional
from datetime import datetime
from analysis import DocumentAnalyzer, CodeAnalyzer, OnChainAnalyzer
from scorer import TrustScorer

# Import enhanced components
try:
    from github_auth import GitHubIntegrationManager
    from certificate_analyzer import CertificateAnalyzer, AchievementScorer
    ENHANCED_FEATURES = True
except ImportError:
    ENHANCED_FEATURES = False
    print("⚠️  Enhanced features not available. Install required packages.")

class NautilusAgent:
    """Main agent orchestrating trust score calculation"""
    
    def __init__(self):
        self.aggregator_url = os.getenv(
            'AGGREGATOR', 
            'https://aggregator.walrus-testnet.walrus.space'
        )
        self.document_analyzer = DocumentAnalyzer()
        self.code_analyzer = CodeAnalyzer()
        self.onchain_analyzer = OnChainAnalyzer()
        self.scorer = TrustScorer()
        
        # Initialize enhanced components if available
        if ENHANCED_FEATURES:
            self.github_manager = GitHubIntegrationManager(
                client_id=os.getenv('GITHUB_CLIENT_ID', ''),
                client_secret=os.getenv('GITHUB_CLIENT_SECRET', ''),
                redirect_uri=os.getenv('GITHUB_REDIRECT_URI', '')
            )
            self.certificate_analyzer = CertificateAnalyzer(
                api_key=os.getenv('OPENAI_API_KEY')
            )
            self.achievement_scorer = AchievementScorer()
        
    def fetch_from_walrus(self, blob_id: str, output_path: str) -> bool:
        """
        Download a blob from Walrus
        
        Args:
            blob_id: The Walrus blob ID
            output_path: Where to save the file
            
        Returns:
            bool: True if successful
        """
        try:
            url = f"{self.aggregator_url}/v1/blobs/{blob_id}"
            print(f"📥 Downloading blob {blob_id}...")
            
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"✅ Downloaded to {output_path}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to download blob: {e}")
            return False
    
    def fetch_quilt(self, quilt_id: str, identifier: str, output_path: str) -> bool:
        """
        Download a specific file from a Walrus quilt
        
        Args:
            quilt_id: The Walrus quilt ID
            identifier: The file identifier within the quilt
            output_path: Where to save the file
            
        Returns:
            bool: True if successful
        """
        try:
            url = f"{self.aggregator_url}/v1/blobs/by-quilt-id/{quilt_id}/{identifier}"
            print(f"📥 Downloading {identifier} from quilt {quilt_id}...")
            
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"✅ Downloaded to {output_path}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to download from quilt: {e}")
            return False
    
    def analyze_startup(
        self,
        quilt_id: str,
        startup_name: str,
        wallet_address: str = None,
        github_repo: str = None
    ) -> Dict:
        """
        Complete analysis of a startup
        
        Args:
            quilt_id: Walrus quilt ID containing all documents
            startup_name: Name of the startup
            wallet_address: Optional Sui wallet address for on-chain analysis
            github_repo: Optional GitHub repository for code analysis
            
        Returns:
            Dict containing trust score and analysis results
        """
        print(f"\n🔍 Starting analysis for {startup_name}")
        print(f"📦 Quilt ID: {quilt_id}")
        
        results = {
            'startup_name': startup_name,
            'timestamp': datetime.utcnow().isoformat(),
            'quilt_id': quilt_id,
            'wallet_address': wallet_address,
            'github_repo': github_repo
        }
        
        # Create temp directory for downloads
        temp_dir = f"./temp/{startup_name.replace(' ', '_')}"
        os.makedirs(temp_dir, exist_ok=True)
        
        # Download and analyze documents
        print("\n📄 Analyzing off-chain documents...")
        off_chain_score = self._analyze_documents(quilt_id, temp_dir)
        results['off_chain_analysis'] = off_chain_score
        
        # Analyze on-chain data
        print("\n⛓️  Analyzing on-chain activity...")
        on_chain_score = self._analyze_onchain(wallet_address) if wallet_address else {'score': 0}
        results['on_chain_analysis'] = on_chain_score
        
        # Analyze code repository
        print("\n💻 Analyzing code repository...")
        code_score = self._analyze_code(github_repo) if github_repo else {'score': 0}
        results['code_analysis'] = code_score
        
        # Calculate final trust score
        print("\n🎯 Calculating final trust score...")
        trust_score = self.scorer.calculate_final_score(
            off_chain_score['score'],
            on_chain_score['score'],
            code_score['score']
        )
        
        results['trust_score'] = trust_score
        results['component_scores'] = {
            'off_chain': off_chain_score['score'],
            'on_chain': on_chain_score['score'],
            'ai_analysis': code_score['score']
        }
        
        # Generate verification hash
        verification_hash = self._generate_verification_hash(results)
        results['verification_hash'] = verification_hash
        
        # Risk assessment
        risk_report = self.scorer.generate_risk_report(results)
        results['risk_report'] = risk_report
        
        print(f"\n✅ Analysis complete!")
        print(f"   Trust Score: {trust_score['overall_score']}/100")
        print(f"   Risk Level: {trust_score['risk_level']}")
        
        return results
    
    def _analyze_documents(self, quilt_id: str, temp_dir: str) -> Dict:
        """Analyze pitch deck, whitepaper, and other documents"""
        
        documents = {
            'deck': 'pitchdeck.pdf',
            'whitepaper': 'whitepaper.pdf',
            'financials': 'financials.xlsx',
            'demo': 'demo.mp4'
        }
        
        analysis_results = {}
        
        for identifier, filename in documents.items():
            filepath = os.path.join(temp_dir, filename)
            
            # Try to download
            if self.fetch_quilt(quilt_id, identifier, filepath):
                # Analyze based on file type
                if filename.endswith('.pdf'):
                    analysis_results[identifier] = self.document_analyzer.analyze_pdf(filepath)
                elif filename.endswith('.mp4'):
                    analysis_results[identifier] = self.document_analyzer.analyze_video(filepath)
                elif filename.endswith('.xlsx'):
                    analysis_results[identifier] = self.document_analyzer.analyze_spreadsheet(filepath)
        
        # Calculate aggregate score
        scores = [r.get('quality_score', 0) for r in analysis_results.values()]
        avg_score = sum(scores) / len(scores) if scores else 0
        
        return {
            'score': avg_score,
            'details': analysis_results,
            'document_count': len(analysis_results)
        }
    
    def _analyze_onchain(self, wallet_address: str) -> Dict:
        """Analyze on-chain activity"""
        if not wallet_address:
            return {'score': 0, 'reason': 'No wallet address provided'}
        
        return self.onchain_analyzer.analyze_wallet(wallet_address)
    
    def _analyze_code(self, github_repo: str) -> Dict:
        """Analyze GitHub repository"""
        if not github_repo:
            return {'score': 0, 'reason': 'No GitHub repository provided'}
        
        return self.code_analyzer.analyze_repository(github_repo)
    
    def _generate_verification_hash(self, results: Dict) -> str:
        """
        Generate a deterministic hash of the analysis results
        This allows verification that the AI analysis hasn't been tampered with
        """
        # Extract key fields for hashing
        hash_data = {
            'startup_name': results['startup_name'],
            'quilt_id': results['quilt_id'],
            'trust_score': results['trust_score'],
            'component_scores': results['component_scores'],
            'timestamp': results['timestamp']
        }
        
        # Convert to deterministic JSON string
        json_str = json.dumps(hash_data, sort_keys=True)
        
        # Calculate SHA-256 hash
        hash_bytes = hashlib.sha256(json_str.encode()).digest()
        
        # Return as hex string
        return hash_bytes.hex()
    
    def save_report(self, results: Dict, output_path: str):
        """Save analysis report to JSON file"""
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n💾 Report saved to {output_path}")
    
    def analyze_startup_enhanced(
        self,
        startup_name: str,
        quilt_id: str,
        wallet_address: str,
        github_access_token: str,
        github_repo: str,
        certificate_blob_ids: List[str],
        additional_metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Enhanced startup analysis with GitHub OAuth and certificate verification
        
        Args:
            startup_name: Name of the startup
            quilt_id: Walrus quilt ID containing documents
            wallet_address: Sui wallet address
            github_access_token: OAuth access token from GitHub
            github_repo: Repository in format "owner/repo"
            certificate_blob_ids: List of Walrus blob IDs for certificates
            additional_metadata: Optional additional data
            
        Returns:
            Comprehensive trust analysis
        """
        if not ENHANCED_FEATURES:
            print("⚠️  Enhanced features not available. Falling back to standard analysis.")
            return self.analyze_startup(quilt_id, startup_name, wallet_address, github_repo)
        
        print(f"\n{'='*60}")
        print(f"ENHANCED NAUTILUS ANALYSIS: {startup_name}")
        print(f"{'='*60}\n")
        
        results = {
            "startup_name": startup_name,
            "analysis_timestamp": datetime.now().isoformat(),
            "quilt_id": quilt_id,
            "wallet_address": wallet_address,
            "github_repo": github_repo,
        }
        
        # 1. GitHub Verification
        print("Step 1/6: Verifying GitHub repository...")
        self.github_manager.access_token = github_access_token
        from github_auth import GitHubCommitVerifier
        self.github_manager.verifier = GitHubCommitVerifier(github_access_token)
        github_verification = self.github_manager.complete_verification(github_repo)
        results["github_verification"] = github_verification
        print(f"✓ GitHub verified: Owner={github_verification.get('is_owner', False)}")
        
        # 2. Certificate Analysis
        print("\nStep 2/6: Analyzing certificates with Vision AI...")
        certificate_analysis = self.certificate_analyzer.analyze_multiple_certificates(
            walrus_blob_ids=certificate_blob_ids,
            aggregator_url=self.aggregator_url
        )
        results["certificate_analysis"] = certificate_analysis
        print(f"✓ Certificates analyzed: {certificate_analysis['total_certificates']}")
        
        # 3. Document Analysis
        print("\nStep 3/6: Analyzing documents from Walrus...")
        temp_dir = f"./temp/{startup_name.replace(' ', '_')}"
        os.makedirs(temp_dir, exist_ok=True)
        doc_scores = self._analyze_documents(quilt_id, temp_dir)
        results["document_analysis"] = doc_scores
        print(f"✓ Documents analyzed: {doc_scores['document_count']} files")
        
        # 4. On-Chain Analysis
        print("\nStep 4/6: Analyzing on-chain activity...")
        onchain_score = self._analyze_onchain(wallet_address)
        results["onchain_analysis"] = onchain_score
        print(f"✓ On-chain score: {onchain_score.get('score', 0)}/100")
        
        # 5. Calculate Achievement Score
        print("\nStep 5/6: Calculating achievement score...")
        achievement_score_data = self.achievement_scorer.calculate_achievement_score(
            certificate_analyses=certificate_analysis.get("analyses", []),
            github_verification=github_verification
        )
        results["achievement_score"] = achievement_score_data
        print(f"✓ Achievement score: {achievement_score_data['total_score']}/100")
        
        # 6. Calculate Final Trust Score
        print("\nStep 6/6: Calculating final trust score...")
        component_scores = {
            "off_chain": int(doc_scores.get('score', 0)),
            "on_chain": int(onchain_score.get('score', 0)),
            "github_code": int(
                (github_verification.get("commit_analysis", {}).get("ownership_score", 0) * 0.6 +
                 github_verification.get("commit_analysis", {}).get("activity_score", 0) * 0.4)
            ),
            "achievements": achievement_score_data["total_score"]
        }
        
        final_score = (
            component_scores["off_chain"] * 0.30 +
            component_scores["on_chain"] * 0.30 +
            component_scores["github_code"] * 0.20 +
            component_scores["achievements"] * 0.20
        )
        
        trust_score_data = self.scorer.calculate_final_score(
            off_chain_score=component_scores["off_chain"],
            on_chain_score=component_scores["on_chain"],
            ai_score=int((component_scores["github_code"] + component_scores["achievements"]) / 2)
        )
        trust_score_data["overall_score"] = int(final_score)
        trust_score_data["component_scores"] = component_scores
        
        results["trust_score"] = trust_score_data
        results["component_scores"] = component_scores
        
        # Generate verification hash
        verification_hash = hashlib.sha256(
            f"{startup_name}:{github_verification.get('username', '')}:{github_repo}:{certificate_analysis.get('average_authenticity_score', 0):.0f}:{final_score:.0f}".encode()
        ).hexdigest()
        results["verification_hash"] = verification_hash
        
        print(f"\n{'='*60}")
        print(f"FINAL TRUST SCORE: {final_score:.0f}/100")
        print(f"Risk Level: {trust_score_data.get('risk_level', 'UNKNOWN')}")
        print(f"{'='*60}\n")
        
        return results


def main():
    """Example usage"""
    agent = NautilusAgent()
    
    # Example: Analyze a startup
    results = agent.analyze_startup(
        quilt_id="Q9mK7pL3nR5wT8vB2cF4hJ6dS1aG9xE7yN4qW0zV5rU",
        startup_name="DeFi Protocol X",
        wallet_address="0x1234567890abcdef",
        github_repo="defi-protocol-x/core"
    )
    
    # Save report
    agent.save_report(results, "./trust_report.json")
    
    # Print summary
    print("\n" + "="*60)
    print("TRUST SCORE SUMMARY")
    print("="*60)
    print(f"Startup: {results['startup_name']}")
    print(f"Overall Score: {results['trust_score']['overall_score']}/100")
    print(f"Risk Level: {results['trust_score']['risk_level']}")
    print(f"Verification Hash: {results['verification_hash'][:32]}...")
    print("="*60)


if __name__ == "__main__":
    main()

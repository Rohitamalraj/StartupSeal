"""
Certificate and Achievement Analyzer
Uses Vision AI to analyze uploaded certificates, awards, and achievement photos
"""

import base64
import requests
import os
from typing import Dict, List, Optional
from datetime import datetime
import hashlib


class CertificateAnalyzer:
    """Analyzes certificates and achievement documents using Vision AI"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize with OpenAI or similar Vision API
        For production, use actual API key
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.api_url = "https://api.openai.com/v1/chat/completions"
        
    def analyze_certificate(
        self, 
        image_path: str = None,
        image_url: str = None,
        image_data: bytes = None
    ) -> Dict:
        """
        Analyze certificate image using Vision AI
        
        Args:
            image_path: Local path to image
            image_url: URL to image (e.g., Walrus blob)
            image_data: Raw image bytes
            
        Returns:
            Analysis results with authenticity score
        """
        # Prepare image for API
        if image_path:
            with open(image_path, 'rb') as f:
                image_data = f.read()
        elif image_url:
            response = requests.get(image_url)
            image_data = response.content
        
        if not image_data:
            return self._empty_analysis("No image data provided")
        
        # Convert to base64
        base64_image = base64.b64encode(image_data).decode('utf-8')
        
        # Prepare vision API request
        prompt = """
Analyze this certificate/award/achievement document and extract the following information:

1. Type of document (certificate, award, diploma, hackathon win, etc.)
2. Issuing organization/institution
3. Recipient name
4. Achievement/skill certified
5. Date issued (if visible)
6. Any verification codes or IDs
7. Authenticity indicators (official seals, signatures, watermarks)
8. Overall authenticity score (0-100) based on:
   - Visual quality and professionalism
   - Presence of official elements (seals, signatures)
   - Text consistency and formatting
   - Watermarks or security features
   - Issuing organization credibility

Respond in JSON format:
{
  "document_type": "...",
  "issuing_org": "...",
  "recipient_name": "...",
  "achievement": "...",
  "date_issued": "...",
  "verification_code": "...",
  "authenticity_indicators": [...],
  "authenticity_score": 0-100,
  "credibility_level": "high/medium/low",
  "detected_issues": [...],
  "recommendation": "..."
}
"""
        
        try:
            # Call Vision API (using OpenAI GPT-4 Vision as example)
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            payload = {
                "model": "gpt-4o",  # or gpt-4-vision-preview
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": 1000
            }
            
            response = requests.post(
                self.api_url,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Parse JSON response
                import json
                analysis = json.loads(content)
                
                # Add metadata
                analysis["analyzed_at"] = datetime.now().isoformat()
                analysis["image_hash"] = hashlib.sha256(image_data).hexdigest()
                
                return analysis
            else:
                return self._empty_analysis(f"API error: {response.status_code}")
                
        except Exception as e:
            return self._empty_analysis(f"Analysis failed: {str(e)}")
    
    def analyze_multiple_certificates(
        self, 
        walrus_blob_ids: List[str],
        aggregator_url: str
    ) -> Dict:
        """
        Analyze multiple certificates from Walrus storage
        
        Args:
            walrus_blob_ids: List of Walrus blob IDs
            aggregator_url: Walrus aggregator URL
            
        Returns:
            Aggregated analysis results
        """
        analyses = []
        total_score = 0
        
        for blob_id in walrus_blob_ids:
            # Download from Walrus
            image_url = f"{aggregator_url}/v1/blobs/{blob_id}"
            
            analysis = self.analyze_certificate(image_url=image_url)
            analysis["blob_id"] = blob_id
            analyses.append(analysis)
            
            total_score += analysis.get("authenticity_score", 0)
        
        # Calculate aggregate metrics
        avg_score = total_score / len(walrus_blob_ids) if walrus_blob_ids else 0
        
        high_credibility = sum(
            1 for a in analyses 
            if a.get("credibility_level") == "high"
        )
        
        verified_orgs = set()
        achievements = []
        
        for analysis in analyses:
            org = analysis.get("issuing_org", "")
            if org and analysis.get("credibility_level") == "high":
                verified_orgs.add(org)
            
            achievement = analysis.get("achievement", "")
            if achievement:
                achievements.append(achievement)
        
        return {
            "total_certificates": len(walrus_blob_ids),
            "analyses": analyses,
            "average_authenticity_score": avg_score,
            "high_credibility_count": high_credibility,
            "verified_organizations": list(verified_orgs),
            "achievements": achievements,
            "overall_credibility": self._calculate_overall_credibility(analyses),
            "recommendation": self._generate_recommendation(avg_score, analyses)
        }
    
    def verify_hackathon_win(self, certificate_analysis: Dict) -> Dict:
        """
        Specifically verify hackathon wins
        Checks for common hackathon organizers and patterns
        """
        known_hackathons = [
            "ETHGlobal", "Devfolio", "MLH", "Encode Club",
            "Sui Foundation", "Aptos", "Polygon", "Solana",
            "Chainlink", "The Graph", "Gitcoin"
        ]
        
        issuing_org = certificate_analysis.get("issuing_org", "").lower()
        is_known_organizer = any(
            org.lower() in issuing_org 
            for org in known_hackathons
        )
        
        achievement = certificate_analysis.get("achievement", "").lower()
        is_win = any(
            keyword in achievement 
            for keyword in ["winner", "prize", "award", "champion", "finalist"]
        )
        
        return {
            "is_hackathon": "hackathon" in achievement or "hackathon" in issuing_org,
            "is_known_organizer": is_known_organizer,
            "is_win": is_win,
            "credibility_boost": 20 if (is_known_organizer and is_win) else 0,
            "verified": is_known_organizer and is_win
        }
    
    def _calculate_overall_credibility(self, analyses: List[Dict]) -> str:
        """Calculate overall credibility level"""
        if not analyses:
            return "none"
        
        avg_score = sum(a.get("authenticity_score", 0) for a in analyses) / len(analyses)
        
        if avg_score >= 80:
            return "high"
        elif avg_score >= 60:
            return "medium"
        else:
            return "low"
    
    def _generate_recommendation(self, avg_score: float, analyses: List[Dict]) -> str:
        """Generate investment recommendation based on certificates"""
        if avg_score >= 80:
            return "Strong credential verification. Team demonstrates proven track record."
        elif avg_score >= 60:
            return "Moderate credential verification. Additional verification recommended."
        else:
            return "Weak credential verification. High risk of fraudulent claims."
    
    def _empty_analysis(self, reason: str) -> Dict:
        """Return empty analysis result"""
        return {
            "document_type": "unknown",
            "issuing_org": "",
            "recipient_name": "",
            "achievement": "",
            "date_issued": "",
            "verification_code": "",
            "authenticity_indicators": [],
            "authenticity_score": 0,
            "credibility_level": "low",
            "detected_issues": [reason],
            "recommendation": "Analysis could not be completed",
            "analyzed_at": datetime.now().isoformat(),
            "image_hash": ""
        }


class AchievementScorer:
    """Scores achievements based on certificate analysis"""
    
    def calculate_achievement_score(
        self, 
        certificate_analyses: List[Dict],
        github_verification: Dict
    ) -> Dict:
        """
        Calculate comprehensive achievement score
        
        Combines:
        - Certificate authenticity
        - Hackathon wins
        - GitHub ownership verification
        - Contribution patterns
        """
        # Certificate score (0-40 points)
        cert_score = 0
        if certificate_analyses:
            avg_cert_score = sum(
                c.get("authenticity_score", 0) 
                for c in certificate_analyses
            ) / len(certificate_analyses)
            cert_score = (avg_cert_score / 100) * 40
        
        # GitHub ownership (0-30 points)
        github_ownership = github_verification.get("commit_analysis", {}).get("ownership_score", 0)
        ownership_score = (github_ownership / 100) * 30
        
        # GitHub activity (0-20 points)
        github_activity = github_verification.get("commit_analysis", {}).get("activity_score", 0)
        activity_score = (github_activity / 100) * 20
        
        # Bonus points for hackathon wins (0-10 points)
        hackathon_wins = sum(
            1 for c in certificate_analyses
            if "hackathon" in c.get("achievement", "").lower() and
            c.get("authenticity_score", 0) >= 80
        )
        hackathon_bonus = min(10, hackathon_wins * 5)
        
        total_score = cert_score + ownership_score + activity_score + hackathon_bonus
        
        return {
            "total_score": min(100, int(total_score)),
            "certificate_score": int(cert_score),
            "github_ownership_score": int(ownership_score),
            "github_activity_score": int(activity_score),
            "hackathon_bonus": int(hackathon_bonus),
            "breakdown": {
                "certificates": f"{cert_score:.1f}/40",
                "github_ownership": f"{ownership_score:.1f}/30",
                "github_activity": f"{activity_score:.1f}/20",
                "hackathon_wins": f"{hackathon_bonus}/10"
            },
            "risk_level": self._determine_risk_level(total_score),
            "recommendation": self._generate_investment_recommendation(total_score)
        }
    
    def _determine_risk_level(self, score: float) -> str:
        """Determine risk level from score"""
        if score >= 80:
            return "LOW"
        elif score >= 60:
            return "MEDIUM"
        elif score >= 40:
            return "HIGH"
        else:
            return "VERY HIGH"
    
    def _generate_investment_recommendation(self, score: float) -> str:
        """Generate investment recommendation"""
        if score >= 80:
            return "RECOMMENDED - Strong verification across all metrics"
        elif score >= 60:
            return "CONSIDER - Moderate verification, due diligence advised"
        elif score >= 40:
            return "CAUTION - Weak verification, significant risk"
        else:
            return "NOT RECOMMENDED - Insufficient verification, high fraud risk"

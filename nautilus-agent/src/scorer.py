"""
Trust score calculation and risk assessment
"""

from typing import Dict

class TrustScorer:
    """Calculates final trust scores and generates risk reports"""
    
    def __init__(self):
        # Weights for score components
        self.weights = {
            'off_chain': 0.40,  # 40% - Documents, pitch deck, whitepaper
            'on_chain': 0.40,   # 40% - Blockchain activity, transactions
            'ai_analysis': 0.20 # 20% - Code quality, GitHub activity
        }
    
    def calculate_final_score(
        self,
        off_chain_score: float,
        on_chain_score: float,
        ai_score: float
    ) -> Dict:
        """
        Calculate weighted final trust score
        
        Args:
            off_chain_score: Score from document analysis (0-100)
            on_chain_score: Score from blockchain analysis (0-100)
            ai_score: Score from code/AI analysis (0-100)
            
        Returns:
            Dict with overall score and risk level
        """
        
        # Calculate weighted score
        overall_score = (
            off_chain_score * self.weights['off_chain'] +
            on_chain_score * self.weights['on_chain'] +
            ai_score * self.weights['ai_analysis']
        )
        
        # Determine risk level
        if overall_score >= 80:
            risk_level = "LOW"
            investment_recommendation = "RECOMMENDED"
        elif overall_score >= 60:
            risk_level = "MEDIUM"
            investment_recommendation = "CONSIDER WITH CAUTION"
        elif overall_score >= 40:
            risk_level = "HIGH"
            investment_recommendation = "HIGH RISK - ADDITIONAL DUE DILIGENCE REQUIRED"
        else:
            risk_level = "CRITICAL"
            investment_recommendation = "NOT RECOMMENDED"
        
        # Determine confidence level
        # Higher variance in component scores = lower confidence
        scores = [off_chain_score, on_chain_score, ai_score]
        variance = sum((s - overall_score) ** 2 for s in scores) / len(scores)
        
        if variance < 100:
            confidence = "HIGH"
        elif variance < 400:
            confidence = "MEDIUM"
        else:
            confidence = "LOW"
        
        return {
            'overall_score': round(overall_score, 2),
            'risk_level': risk_level,
            'investment_recommendation': investment_recommendation,
            'confidence': confidence,
            'score_breakdown': {
                'off_chain': {
                    'score': round(off_chain_score, 2),
                    'weight': self.weights['off_chain'] * 100,
                    'contribution': round(off_chain_score * self.weights['off_chain'], 2)
                },
                'on_chain': {
                    'score': round(on_chain_score, 2),
                    'weight': self.weights['on_chain'] * 100,
                    'contribution': round(on_chain_score * self.weights['on_chain'], 2)
                },
                'ai_analysis': {
                    'score': round(ai_score, 2),
                    'weight': self.weights['ai_analysis'] * 100,
                    'contribution': round(ai_score * self.weights['ai_analysis'], 2)
                }
            }
        }
    
    def generate_risk_report(self, analysis_results: Dict) -> Dict:
        """
        Generate comprehensive risk assessment report
        
        Args:
            analysis_results: Full analysis results from NautilusAgent
            
        Returns:
            Dict containing detailed risk assessment
        """
        
        trust_score = analysis_results['trust_score']
        component_scores = analysis_results['component_scores']
        
        # Identify risk factors
        risk_factors = []
        positive_factors = []
        
        # Off-chain risk factors
        if component_scores['off_chain'] < 50:
            risk_factors.append({
                'category': 'Documentation',
                'severity': 'HIGH',
                'description': 'Incomplete or low-quality documentation',
                'recommendation': 'Request updated pitch deck and whitepaper'
            })
        elif component_scores['off_chain'] >= 80:
            positive_factors.append({
                'category': 'Documentation',
                'description': 'Comprehensive and professional documentation'
            })
        
        # On-chain risk factors
        if component_scores['on_chain'] < 50:
            risk_factors.append({
                'category': 'On-chain Activity',
                'severity': 'HIGH',
                'description': 'Limited blockchain activity or suspicious patterns',
                'recommendation': 'Verify team wallets and transaction history'
            })
        elif component_scores['on_chain'] >= 80:
            positive_factors.append({
                'category': 'On-chain Activity',
                'description': 'Strong blockchain presence and healthy activity'
            })
        
        # Code quality risk factors
        if component_scores['ai_analysis'] < 50:
            risk_factors.append({
                'category': 'Code Quality',
                'severity': 'MEDIUM',
                'description': 'Limited development activity or code quality concerns',
                'recommendation': 'Review GitHub repository and request code audit'
            })
        elif component_scores['ai_analysis'] >= 80:
            positive_factors.append({
                'category': 'Code Quality',
                'description': 'Active development with good practices'
            })
        
        # Overall variance check
        scores = [
            component_scores['off_chain'],
            component_scores['on_chain'],
            component_scores['ai_analysis']
        ]
        max_score = max(scores)
        min_score = min(scores)
        
        if max_score - min_score > 40:
            risk_factors.append({
                'category': 'Score Consistency',
                'severity': 'MEDIUM',
                'description': 'Significant variance between evaluation categories',
                'recommendation': 'Investigate discrepancies in performance across areas'
            })
        
        # Fraud indicators
        fraud_score = self._calculate_fraud_likelihood(analysis_results)
        
        if fraud_score > 70:
            risk_factors.append({
                'category': 'Fraud Detection',
                'severity': 'CRITICAL',
                'description': 'High likelihood of fraudulent activity detected',
                'recommendation': 'DO NOT INVEST - Conduct thorough investigation'
            })
        
        # Milestone credibility
        milestone_score = self._assess_milestone_credibility(analysis_results)
        
        return {
            'overall_risk_level': trust_score['risk_level'],
            'fraud_likelihood': fraud_score,
            'milestone_credibility': milestone_score,
            'risk_factors': risk_factors,
            'positive_factors': positive_factors,
            'total_risk_count': len(risk_factors),
            'investment_readiness': self._calculate_investment_readiness(trust_score['overall_score']),
            'recommended_actions': self._generate_recommendations(risk_factors, trust_score)
        }
    
    def _calculate_fraud_likelihood(self, results: Dict) -> float:
        """
        Calculate likelihood of fraudulent activity (0-100)
        
        Higher scores indicate higher fraud risk
        """
        fraud_score = 0
        
        # Check documentation quality
        off_chain = results.get('off_chain_analysis', {})
        if off_chain.get('score', 0) < 30:
            fraud_score += 30
        
        # Check on-chain activity
        on_chain = results.get('on_chain_analysis', {})
        if on_chain.get('score', 0) < 20:
            fraud_score += 40
        
        # Check code activity
        code = results.get('code_analysis', {})
        if code.get('score', 0) < 20:
            fraud_score += 30
        
        return min(fraud_score, 100)
    
    def _assess_milestone_credibility(self, results: Dict) -> float:
        """
        Assess credibility of claimed milestones (0-100)
        
        Higher scores indicate more credible milestones
        """
        credibility = 100
        
        # Reduce credibility for lack of evidence
        on_chain = results.get('on_chain_analysis', {})
        if on_chain.get('transaction_count', 0) < 10:
            credibility -= 20
        
        code = results.get('code_analysis', {})
        if code.get('commits', 0) < 50:
            credibility -= 15
        
        if code.get('contributors', 0) < 2:
            credibility -= 15
        
        return max(credibility, 0)
    
    def _calculate_investment_readiness(self, overall_score: float) -> str:
        """Determine if startup is ready for investment"""
        if overall_score >= 75:
            return "READY"
        elif overall_score >= 60:
            return "NEARLY READY - MINOR IMPROVEMENTS NEEDED"
        elif overall_score >= 40:
            return "NOT READY - SIGNIFICANT WORK REQUIRED"
        else:
            return "NOT SUITABLE FOR INVESTMENT"
    
    def _generate_recommendations(self, risk_factors: list, trust_score: Dict) -> list:
        """Generate actionable recommendations based on risk factors"""
        recommendations = []
        
        if trust_score['overall_score'] < 80:
            recommendations.append({
                'priority': 'HIGH',
                'action': 'Improve overall documentation and transparency',
                'expected_impact': 'Increase trust score by 10-15 points'
            })
        
        if any(rf['category'] == 'On-chain Activity' for rf in risk_factors):
            recommendations.append({
                'priority': 'HIGH',
                'action': 'Increase on-chain activity and provide transaction transparency',
                'expected_impact': 'Reduce fraud risk and improve credibility'
            })
        
        if any(rf['category'] == 'Code Quality' for rf in risk_factors):
            recommendations.append({
                'priority': 'MEDIUM',
                'action': 'Improve code quality, testing, and documentation',
                'expected_impact': 'Increase technical credibility'
            })
        
        if trust_score['confidence'] == 'LOW':
            recommendations.append({
                'priority': 'MEDIUM',
                'action': 'Balance performance across all evaluation areas',
                'expected_impact': 'Increase investor confidence'
            })
        
        return recommendations

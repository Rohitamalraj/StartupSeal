"""
GitHub OAuth Authentication and Repository Verification
Handles OAuth flow, repository access, and ownership verification
"""

import requests
import hashlib
import time
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta


class GitHubAuthenticator:
    """Handles GitHub OAuth authentication and verification"""
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.base_url = "https://api.github.com"
        
    def get_authorization_url(self, state: str) -> str:
        """
        Generate GitHub OAuth authorization URL
        
        Args:
            state: Random state string for CSRF protection
            
        Returns:
            Authorization URL for user to visit
        """
        scopes = "read:user,repo,read:org"
        return (
            f"https://github.com/login/oauth/authorize?"
            f"client_id={self.client_id}&"
            f"redirect_uri={self.redirect_uri}&"
            f"scope={scopes}&"
            f"state={state}"
        )
    
    def exchange_code_for_token(self, code: str) -> Optional[str]:
        """
        Exchange authorization code for access token
        
        Args:
            code: Authorization code from OAuth callback
            
        Returns:
            Access token or None if failed
        """
        print(f"🔄 Exchanging code for token...")
        print(f"   Client ID: {self.client_id[:10]}...")
        print(f"   Redirect URI: {self.redirect_uri}")
        print(f"   Code: {code[:10]}...")
        
        response = requests.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "code": code,
                "redirect_uri": self.redirect_uri
            }
        )
        
        print(f"📥 GitHub response status: {response.status_code}")
        print(f"📥 GitHub response: {response.text[:200]}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📦 Response data keys: {list(data.keys())}")
            
            if 'error' in data:
                print(f"❌ GitHub OAuth error: {data.get('error')}")
                print(f"   Error description: {data.get('error_description')}")
                return None
                
            access_token = data.get("access_token")
            if access_token:
                print(f"✅ Access token obtained (length: {len(access_token)})")
            else:
                print(f"❌ No access_token in response")
            return access_token
        
        print(f"❌ Non-200 status code from GitHub")
        return None
    
    def get_authenticated_user(self, access_token: str) -> Dict:
        """Get authenticated user information"""
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json"
        }
        
        response = requests.get(f"{self.base_url}/user", headers=headers)
        if response.status_code == 200:
            return response.json()
        return {}
    
    def verify_repository_ownership(
        self, 
        access_token: str, 
        repo_full_name: str
    ) -> Tuple[bool, Dict]:
        """
        Verify if authenticated user owns or has access to repository
        
        Args:
            access_token: GitHub access token
            repo_full_name: Repository in format "owner/repo"
            
        Returns:
            Tuple of (is_owner, repository_data)
        """
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json"
        }
        
        # Get repository information
        response = requests.get(
            f"{self.base_url}/repos/{repo_full_name}",
            headers=headers
        )
        
        if response.status_code != 200:
            return False, {}
        
        repo_data = response.json()
        
        # Get authenticated user
        user = self.get_authenticated_user(access_token)
        user_login = user.get("login", "")
        
        # Check ownership
        is_owner = (
            repo_data.get("owner", {}).get("login") == user_login or
            repo_data.get("permissions", {}).get("admin", False)
        )
        
        return is_owner, repo_data


class GitHubCommitVerifier:
    """Verifies GitHub commits and contribution patterns"""
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json"
        }
    
    def get_user_commits(
        self, 
        repo_full_name: str, 
        username: str, 
        since_days: int = 365
    ) -> List[Dict]:
        """
        Get commits by specific user in repository
        
        Args:
            repo_full_name: Repository in format "owner/repo"
            username: GitHub username
            since_days: Look back this many days
            
        Returns:
            List of commit data
        """
        since_date = (datetime.now() - timedelta(days=since_days)).isoformat()
        
        commits = []
        page = 1
        
        # First, get ALL commits to compare
        all_commits = []
        all_page = 1
        
        print(f"[DEBUG] Fetching commits for repo: {repo_full_name}, username: {username}")
        
        while True:
            response = requests.get(
                f"{self.base_url}/repos/{repo_full_name}/commits",
                headers=self.headers,
                params={
                    "since": since_date,
                    "per_page": 100,
                    "page": all_page
                }
            )
            
            if response.status_code != 200:
                print(f"[DEBUG] Failed to fetch all commits: {response.status_code}")
                break
            
            page_commits = response.json()
            if not page_commits:
                break
            
            all_commits.extend(page_commits)
            all_page += 1
            
            if all_page > 10:
                break
        
        print(f"[DEBUG] Total commits in repo: {len(all_commits)}")
        
        # Now filter by username manually (checking all author fields)
        for commit in all_commits:
            commit_author = commit.get("commit", {}).get("author", {}).get("name", "")
            commit_login = commit.get("author", {}).get("login", "") if commit.get("author") else ""
            
            # Check both the commit author name and the GitHub login
            if commit_login.lower() == username.lower() or commit_author.lower() == username.lower():
                commits.append(commit)
        
        print(f"[DEBUG] User commits found: {len(commits)}")
        if len(commits) > 0 and len(all_commits) > 0:
            print(f"[DEBUG] First commit author login: {commits[0].get('author', {}).get('login', 'N/A')}")
            print(f"[DEBUG] First commit author name: {commits[0].get('commit', {}).get('author', {}).get('name', 'N/A')}")
        
        return commits
    
    def analyze_commit_pattern(
        self, 
        repo_full_name: str, 
        username: str
    ) -> Dict:
        """
        Analyze user's commit patterns for authenticity
        
        Returns:
            Analysis including commit frequency, consistency, etc.
        """
        commits = self.get_user_commits(repo_full_name, username)
        
        if not commits:
            return {
                "user_commits": 0,
                "total_commits": 0,
                "ownership_score": 0,
                "activity_score": 0,
                "consistency_score": 0,
                "is_authentic": False
            }
        
        # Calculate metrics
        user_commits = len(commits)  # User's commits
        
        # Get commit dates
        commit_dates = []
        for commit in commits:
            date_str = commit.get("commit", {}).get("author", {}).get("date", "")
            if date_str:
                commit_dates.append(datetime.fromisoformat(date_str.replace("Z", "+00:00")))
        
        # Calculate consistency (commits spread over time)
        consistency_score = self._calculate_consistency(commit_dates)
        
        # Calculate activity score (recent activity)
        activity_score = self._calculate_activity_score(commit_dates)
        
        # Calculate ownership score (percentage of total commits)
        # This function gets the TOTAL commits in the repo
        ownership_score, total_commits = self._calculate_ownership_score(
            repo_full_name, 
            username, 
            user_commits
        )
        
        print(f"[DEBUG] Analysis results - User commits: {user_commits}, Total commits: {total_commits}, Ownership: {ownership_score}%")
        
        # Overall authenticity
        is_authentic = (
            user_commits >= 5 and
            consistency_score >= 50 and
            ownership_score >= 20
        )
        
        return {
            "user_commits": user_commits,  # User's commits
            "total_commits": total_commits,  # All commits in repo
            "ownership_score": ownership_score,
            "activity_score": activity_score,
            "consistency_score": consistency_score,
            "is_authentic": is_authentic,
            "first_commit": min(commit_dates).isoformat() if commit_dates else None,
            "last_commit": max(commit_dates).isoformat() if commit_dates else None,
            "commit_frequency": user_commits / 365 if commit_dates else 0
        }
    
    def _calculate_consistency(self, commit_dates: List[datetime]) -> int:
        """Calculate consistency score based on commit distribution"""
        if not commit_dates or len(commit_dates) < 2:
            return 0
        
        # Check if commits are spread across different weeks
        weeks = set()
        for date in commit_dates:
            week = date.isocalendar()[1]
            weeks.add(week)
        
        # More weeks with commits = more consistent
        consistency = min(100, (len(weeks) / 52) * 100)
        return int(consistency)
    
    def _calculate_activity_score(self, commit_dates: List[datetime]) -> int:
        """Calculate activity score based on recent commits"""
        if not commit_dates:
            return 0
        
        now = datetime.now(commit_dates[0].tzinfo)
        recent_commits = sum(
            1 for date in commit_dates 
            if (now - date).days <= 90
        )
        
        # More recent commits = higher activity
        activity = min(100, (recent_commits / 10) * 100)
        return int(activity)
    
    def _calculate_ownership_score(
        self, 
        repo_full_name: str, 
        username: str, 
        user_commits: int
    ) -> tuple:
        """
        Calculate ownership score based on commit percentage
        
        Returns:
            Tuple of (ownership_score, total_commits)
        """
        # Get total repository commits
        response = requests.get(
            f"{self.base_url}/repos/{repo_full_name}",
            headers=self.headers
        )
        
        if response.status_code != 200:
            return (0, 0)
        
        # Get contributor stats
        response = requests.get(
            f"{self.base_url}/repos/{repo_full_name}/stats/contributors",
            headers=self.headers
        )
        
        if response.status_code != 200:
            # Fallback: return 50% ownership and user's commits as total
            return (50, user_commits)
        
        contributors = response.json()
        total_commits = sum(c.get("total", 0) for c in contributors)
        
        if total_commits == 0:
            return (0, 0)
        
        ownership = (user_commits / total_commits) * 100
        return (min(100, int(ownership)), total_commits)
    
    def verify_commit_signatures(
        self, 
        repo_full_name: str, 
        username: str,
        sample_size: int = 10
    ) -> Dict:
        """
        Verify GPG signatures on commits (if used)
        
        Returns:
            Signature verification results
        """
        commits = self.get_user_commits(repo_full_name, username)[:sample_size]
        
        signed_commits = 0
        verified_signatures = 0
        
        for commit in commits:
            sha = commit.get("sha")
            if not sha:
                continue
            
            # Get detailed commit info
            response = requests.get(
                f"{self.base_url}/repos/{repo_full_name}/commits/{sha}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                commit_data = response.json()
                verification = commit_data.get("commit", {}).get("verification", {})
                
                if verification.get("signature"):
                    signed_commits += 1
                    if verification.get("verified"):
                        verified_signatures += 1
        
        return {
            "total_checked": len(commits),
            "signed_commits": signed_commits,
            "verified_signatures": verified_signatures,
            "signature_rate": (signed_commits / len(commits) * 100) if commits else 0,
            "verification_rate": (verified_signatures / signed_commits * 100) if signed_commits else 0
        }


class GitHubIntegrationManager:
    """Main class for GitHub integration"""
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        self.authenticator = GitHubAuthenticator(client_id, client_secret, redirect_uri)
        self.access_token: Optional[str] = None
        self.verifier: Optional[GitHubCommitVerifier] = None
    
    def authenticate(self, code: str) -> bool:
        """Complete OAuth flow and authenticate"""
        self.access_token = self.authenticator.exchange_code_for_token(code)
        
        if self.access_token:
            self.verifier = GitHubCommitVerifier(self.access_token)
            return True
        return False
    
    def complete_verification(
        self, 
        repo_full_name: str
    ) -> Dict:
        """
        Complete verification process for repository
        
        Returns:
            Comprehensive verification results
        """
        if not self.access_token or not self.verifier:
            return {
                "authenticated": False,
                "error": "Not authenticated"
            }
        
        # Get user info
        user = self.authenticator.get_authenticated_user(self.access_token)
        username = user.get("login", "")
        
        print(f"[DEBUG] Starting verification for repo: {repo_full_name}")
        print(f"[DEBUG] Authenticated user: {username}")
        
        # Verify ownership
        is_owner, repo_data = self.authenticator.verify_repository_ownership(
            self.access_token,
            repo_full_name
        )
        
        # Check repository permissions
        permissions = repo_data.get("permissions", {})
        is_admin = permissions.get("admin", False)
        is_contributor = permissions.get("push", False) or permissions.get("pull", False)
        has_access = is_owner or is_admin or is_contributor
        
        # Analyze commits
        commit_analysis = self.verifier.analyze_commit_pattern(
            repo_full_name,
            username
        )
        
        # Verify signatures
        signature_verification = self.verifier.verify_commit_signatures(
            repo_full_name,
            username
        )
        
        return {
            "authenticated": True,
            "username": username,
            "user_id": user.get("id"),
            "user_avatar": user.get("avatar_url"),
            "repository": repo_full_name,
            "has_access": has_access,
            "is_owner": is_owner,
            "is_admin": is_admin,
            "is_contributor": is_contributor,
            "repository_data": {
                "stars": repo_data.get("stargazers_count", 0),
                "forks": repo_data.get("forks_count", 0),
                "watchers": repo_data.get("watchers_count", 0),
                "created_at": repo_data.get("created_at"),
                "updated_at": repo_data.get("updated_at"),
                "language": repo_data.get("language"),
                "size": repo_data.get("size", 0)
            },
            "commit_analysis": commit_analysis,
            "signature_verification": signature_verification,
            "verification_timestamp": datetime.now().isoformat(),
            "verification_hash": self._generate_verification_hash(
                username,
                repo_full_name,
                commit_analysis,
                is_owner
            )
        }
    
    def _generate_verification_hash(
        self,
        username: str,
        repo: str,
        analysis: Dict,
        is_owner: bool
    ) -> str:
        """Generate deterministic hash for verification"""
        data = f"{username}:{repo}:{is_owner}:{analysis.get('total_commits', 0)}"
        return hashlib.sha256(data.encode()).hexdigest()

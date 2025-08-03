#!/usr/bin/env python3
"""
Live integration test script for FastAPI backend.

This script tests the actual running FastAPI server to verify full integration.
Run this script while the FastAPI server is running on port 8000.
"""
import requests
import json
import sys
import uuid
from typing import Dict, Any


class LiveIntegrationTester:
    """Live integration tester for FastAPI backend."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.unique_id = str(uuid.uuid4())[:8]
        self.auth_headers = {}
        
    def log(self, message: str):
        """Log a message with timestamp."""
        print(f"🔍 {message}")
    
    def success(self, message: str):
        """Log a success message."""
        print(f"✅ {message}")
        
    def error(self, message: str):
        """Log an error message."""
        print(f"❌ {message}")
        
    def test_server_health(self) -> bool:
        """Test if server is running and healthy."""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                self.success("Server health check passed")
                return True
            else:
                self.error(f"Server health check failed: {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            self.error(f"Server health check failed: {e}")
            return False
    
    def test_user_registration(self) -> Dict[str, Any]:
        """Test user registration."""
        self.log("Testing user registration...")
        
        register_data = {
            "email": f"live-test-{self.unique_id}@test.com",
            "name": "Live Test User",
            "password": "TestPassword123!"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/auth/register",
                json=register_data,
                timeout=10
            )
            
            if response.status_code == 201:
                auth_data = response.json()
                self.auth_headers = {
                    "Authorization": f"Bearer {auth_data['access_token']}"
                }
                self.success("User registration successful")
                return auth_data
            else:
                self.error(f"User registration failed: {response.status_code} - {response.text}")
                return {}
        except requests.exceptions.RequestException as e:
            self.error(f"User registration request failed: {e}")
            return {}
    
    def test_user_login(self) -> Dict[str, Any]:
        """Test user login."""
        self.log("Testing user login...")
        
        login_data = {
            "email": f"live-test-{self.unique_id}@test.com",
            "password": "TestPassword123!",
            "remember_me": False
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/auth/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                auth_data = response.json()
                self.auth_headers = {
                    "Authorization": f"Bearer {auth_data['access_token']}"
                }
                self.success("User login successful")
                return auth_data
            else:
                self.error(f"User login failed: {response.status_code} - {response.text}")
                return {}
        except requests.exceptions.RequestException as e:
            self.error(f"User login request failed: {e}")
            return {}
    
    def test_user_profile(self) -> bool:
        """Test user profile operations."""
        self.log("Testing user profile operations...")
        
        try:
            # Get profile
            response = requests.get(
                f"{self.base_url}/users/me",
                headers=self.auth_headers,
                timeout=10
            )
            
            if response.status_code != 200:
                self.error(f"Get profile failed: {response.status_code} - {response.text}")
                return False
            
            profile_data = response.json()
            self.success("Get user profile successful")
            
            # Update profile
            update_data = {"name": "Updated Live Test User"}
            response = requests.put(
                f"{self.base_url}/users/me",
                json=update_data,
                headers=self.auth_headers,
                timeout=10
            )
            
            if response.status_code == 200:
                self.success("Update user profile successful")
                return True
            else:
                self.error(f"Update profile failed: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.error(f"User profile request failed: {e}")
            return False
    
    def test_todo_operations(self) -> bool:
        """Test Todo CRUD operations."""
        self.log("Testing Todo CRUD operations...")
        
        try:
            # Create todo
            todo_data = {
                "title": "Live Test Todo",
                "description": "Test description",
                "priority": "HIGH",
                "todo_type": "TASK"
            }
            
            response = requests.post(
                f"{self.base_url}/todos",
                json=todo_data,
                headers=self.auth_headers,
                timeout=10
            )
            
            if response.status_code != 201:
                self.error(f"Create todo failed: {response.status_code} - {response.text}")
                return False
            
            created_todo = response.json()
            todo_id = created_todo["id"]
            self.success("Create todo successful")
            
            # Get todos
            response = requests.get(
                f"{self.base_url}/todos",
                headers=self.auth_headers,
                timeout=10
            )
            
            if response.status_code != 200:
                self.error(f"Get todos failed: {response.status_code} - {response.text}")
                return False
            
            todos = response.json()
            self.success(f"Get todos successful - found {len(todos)} todos")
            
            # Update todo
            update_data = {
                "title": "Updated Live Test Todo",
                "priority": "MEDIUM"
            }
            
            response = requests.put(
                f"{self.base_url}/todos/{todo_id}",
                json=update_data,
                headers=self.auth_headers,
                timeout=10
            )
            
            if response.status_code != 200:
                self.error(f"Update todo failed: {response.status_code} - {response.text}")
                return False
            
            self.success("Update todo successful")
            
            # Toggle completion
            response = requests.patch(
                f"{self.base_url}/todos/{todo_id}/toggle",
                headers=self.auth_headers,
                timeout=10
            )
            
            if response.status_code != 200:
                self.error(f"Toggle todo failed: {response.status_code} - {response.text}")
                return False
            
            self.success("Toggle todo completion successful")
            
            # Get stats
            response = requests.get(
                f"{self.base_url}/todos/stats",
                headers=self.auth_headers,
                timeout=10
            )
            
            if response.status_code != 200:
                self.error(f"Get stats failed: {response.status_code} - {response.text}")
                return False
            
            stats = response.json()
            self.success(f"Get stats successful - {stats}")
            
            # Delete todo
            response = requests.delete(
                f"{self.base_url}/todos/{todo_id}",
                headers=self.auth_headers,
                timeout=10
            )
            
            if response.status_code != 204:
                self.error(f"Delete todo failed: {response.status_code} - {response.text}")
                return False
            
            self.success("Delete todo successful")
            return True
            
        except requests.exceptions.RequestException as e:
            self.error(f"Todo operations request failed: {e}")
            return False
    
    def test_user_settings(self) -> bool:
        """Test user settings operations."""
        self.log("Testing user settings operations...")
        
        try:
            # Get settings
            response = requests.get(
                f"{self.base_url}/user-settings",
                headers=self.auth_headers,
                timeout=10
            )
            
            if response.status_code != 200:
                self.error(f"Get settings failed: {response.status_code} - {response.text}")
                return False
            
            settings = response.json()
            self.success("Get user settings successful")
            
            # Update settings
            update_data = {
                "theme": "dark",
                "language": "en",
                "theme_color": "#FF5722"
            }
            
            response = requests.put(
                f"{self.base_url}/user-settings",
                json=update_data,
                headers=self.auth_headers,
                timeout=10
            )
            
            if response.status_code != 200:
                self.error(f"Update settings failed: {response.status_code} - {response.text}")
                return False
            
            self.success("Update user settings successful")
            return True
            
        except requests.exceptions.RequestException as e:
            self.error(f"User settings request failed: {e}")
            return False
    
    def test_category_management(self) -> bool:
        """Test category management."""
        self.log("Testing category management...")
        
        try:
            # Create category
            category_data = {
                "name": "Live Test Category",
                "color": "#2196F3",
                "icon": "work"
            }
            
            response = requests.post(
                f"{self.base_url}/user-settings/categories",
                json=category_data,
                headers=self.auth_headers,
                timeout=10
            )
            
            if response.status_code != 201:
                self.error(f"Create category failed: {response.status_code} - {response.text}")
                return False
            
            created_category = response.json()["category"]
            category_id = created_category["id"]
            self.success("Create category successful")
            
            # Get categories
            response = requests.get(
                f"{self.base_url}/user-settings/categories",
                headers=self.auth_headers,
                timeout=10
            )
            
            if response.status_code != 200:
                self.error(f"Get categories failed: {response.status_code} - {response.text}")
                return False
            
            categories = response.json()["categories"]
            self.success(f"Get categories successful - found {len(categories)} categories")
            
            # Update category
            update_data = {
                "name": "Updated Live Test Category",
                "color": "#FF5722"
            }
            
            response = requests.put(
                f"{self.base_url}/user-settings/categories/{category_id}",
                json=update_data,
                headers=self.auth_headers,
                timeout=10
            )
            
            if response.status_code != 200:
                self.error(f"Update category failed: {response.status_code} - {response.text}")
                return False
            
            self.success("Update category successful")
            
            # Delete category
            response = requests.delete(
                f"{self.base_url}/user-settings/categories/{category_id}",
                headers=self.auth_headers,
                timeout=10
            )
            
            if response.status_code != 200:
                self.error(f"Delete category failed: {response.status_code} - {response.text}")
                return False
            
            self.success("Delete category successful")
            return True
            
        except requests.exceptions.RequestException as e:
            self.error(f"Category management request failed: {e}")
            return False
    
    def test_logout(self) -> bool:
        """Test user logout."""
        self.log("Testing user logout...")
        
        try:
            response = requests.post(
                f"{self.base_url}/auth/logout",
                headers=self.auth_headers,
                timeout=10
            )
            
            if response.status_code == 204:
                self.success("User logout successful")
                return True
            else:
                self.error(f"User logout failed: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.error(f"User logout request failed: {e}")
            return False
    
    def run_all_tests(self) -> bool:
        """Run all integration tests."""
        print(f"🚀 Starting live integration tests with unique ID: {self.unique_id}")
        print(f"🔗 Testing server at: {self.base_url}")
        print("=" * 60)
        
        # Check server health
        if not self.test_server_health():
            return False
        
        # Test user registration
        auth_data = self.test_user_registration()
        if not auth_data:
            return False
        
        # Test user login
        login_data = self.test_user_login()
        if not login_data:
            return False
        
        # Test user profile
        if not self.test_user_profile():
            return False
        
        # Test user settings
        if not self.test_user_settings():
            return False
        
        # Test category management
        if not self.test_category_management():
            return False
        
        # Test todo operations
        if not self.test_todo_operations():
            return False
        
        # Test logout
        if not self.test_logout():
            return False
        
        print("=" * 60)
        self.success("All live integration tests passed! 🎉")
        return True


def main():
    """Main function to run integration tests."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Live integration tests for FastAPI backend")
    parser.add_argument(
        "--url", 
        default="http://localhost:8000", 
        help="Base URL of the FastAPI server (default: http://localhost:8000)"
    )
    
    args = parser.parse_args()
    
    tester = LiveIntegrationTester(base_url=args.url)
    
    success = tester.run_all_tests()
    
    if success:
        print("\n🎊 All tests completed successfully!")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()
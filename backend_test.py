import requests
import sys
import json
from datetime import datetime

class ActivateFlowAPITester:
    def __init__(self, base_url="https://activation-tool-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    details = f"Status: {response.status_code}, Response: {json.dumps(response_data, indent=2)[:200]}..."
                except:
                    details = f"Status: {response.status_code}, Response: {response.text[:100]}..."
            else:
                details = f"Expected {expected_status}, got {response.status_code}. Response: {response.text[:200]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_save_funnel_data(self):
        """Test saving funnel data"""
        test_data = {
            "revenue_per_activated_user": 450.0,
            "stages": [
                {"stage_name": "Signup Completed", "users": 10000, "avg_time_hours": 0, "target_sla_hours": 0},
                {"stage_name": "Email Verified", "users": 7200, "avg_time_hours": 8, "target_sla_hours": 2},
                {"stage_name": "First Action Started", "users": 5100, "avg_time_hours": 24, "target_sla_hours": 12},
                {"stage_name": "First Action Completed", "users": 3400, "avg_time_hours": 36, "target_sla_hours": 24},
                {"stage_name": "Second Usage", "users": 2550, "avg_time_hours": 120, "target_sla_hours": 168}
            ]
        }
        return self.run_test("Save Funnel Data", "POST", "funnel", 200, test_data)

    def test_get_latest_funnel(self):
        """Test getting latest funnel data"""
        return self.run_test("Get Latest Funnel", "GET", "funnel/latest", 200)

    def test_recovery_calculation(self):
        """Test recovery calculation endpoint"""
        recovery_data = {
            "stage_index": 1,
            "action": {
                "action_name": "Automated reminder emails",
                "expected_lift_percent": 15.0
            },
            "current_users": 1800,
            "revenue_per_activated_user": 450.0
        }
        return self.run_test("Recovery Calculation", "POST", "recovery/calculate", 200, recovery_data)

    def test_invalid_endpoints(self):
        """Test invalid endpoints return proper errors"""
        success, _ = self.run_test("Invalid Endpoint", "GET", "nonexistent", 404)
        return success

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting ActivateFlow Backend API Tests")
        print(f"Testing against: {self.api_url}")
        print("=" * 60)

        # Test all endpoints
        self.test_root_endpoint()
        self.test_save_funnel_data()
        self.test_get_latest_funnel()
        self.test_recovery_calculation()
        self.test_invalid_endpoints()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend tests passed!")
            return True
        else:
            print("⚠️  Some backend tests failed!")
            failed_tests = [t for t in self.test_results if not t['success']]
            print("\nFailed tests:")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['details']}")
            return False

def main():
    tester = ActivateFlowAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            "summary": {
                "total_tests": tester.tests_run,
                "passed_tests": tester.tests_passed,
                "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
                "timestamp": datetime.now().isoformat()
            },
            "detailed_results": tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
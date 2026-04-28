import requests

url = "https://kmfjtqyislinfcatnhjn.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZmp0cXlpc2xpbmZjYXRuaGpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NjgwODMsImV4cCI6MjA5MjU0NDA4M30.GNLtdJ4Dspwe_aoTDZMmnQrHEfOS0vCURhzVdWv4h_8"

# 1. Login
login_res = requests.post(f"{url}/auth/v1/token?grant_type=password", 
                          headers={"apikey": key, "Content-Type": "application/json"},
                          json={"email":"myrealemail_test_123@gmail.com", "password":"password123"})
                          
token = login_res.json().get("access_token")

if not token:
    print("Login Failed:", login_res.text)
    exit(1)

# 2. Insert Category
ins_res = requests.post(f"{url}/rest/v1/categories",
                        headers={"apikey": key, "Authorization": f"Bearer {token}", "Content-Type": "application/json", "Prefer": "return=representation"},
                        json={"username":"myrealemail_test_123@gmail.com", "name":"Test Python"})

print("Insert Result:", ins_res.text)

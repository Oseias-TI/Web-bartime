// Test the business-hours API endpoint with authentication
const API = 'http://localhost:3333';

async function main() {
  // 1. Login to get token
  const loginRes = await fetch(`${API}/auth/business`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'oseias@barberflow.com', password: 'Oseias123!' })
  });
  const loginData = await loginRes.json();
  console.log('Login status:', loginRes.status);
  console.log('Login response keys:', Object.keys(loginData));

  const token = loginData.accessToken || loginData.token;
  if (!token) {
    console.log('No token found. Full login response:', JSON.stringify(loginData, null, 2));
    return;
  }

  // 2. Fetch business hours
  const bhRes = await fetch(`${API}/business-hours`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('\nBusiness-hours status:', bhRes.status);
  const bhData = await bhRes.json();
  console.log('Business-hours response type:', typeof bhData);
  console.log('Business-hours is array:', Array.isArray(bhData));
  console.log('Business-hours length:', Array.isArray(bhData) ? bhData.length : 'N/A');
  console.log('Business-hours data:', JSON.stringify(bhData, null, 2));
}

main().catch(console.error);

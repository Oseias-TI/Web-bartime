// Full flow test: login then call business-hours
const API = 'http://localhost:3333';

async function main() {
  // Login
  const loginRes = await fetch(`${API}/auth/business`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'oseias@barberflow.com', password: 'Oseias123!' })
  });
  const loginData = await loginRes.json();
  console.log('Login status:', loginRes.status);

  const token = loginData.token;
  console.log('Token (first 50 chars):', token?.substring(0, 50));

  // Call business-hours
  const bhRes = await fetch(`${API}/business-hours`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  console.log('BH status:', bhRes.status);
  const bhText = await bhRes.text();
  console.log('BH response:', bhText.substring(0, 200));

  // Now test with an INVALID token to see what error looks like
  const badRes = await fetch(`${API}/business-hours`, {
    headers: { 
      'Authorization': `Bearer invalid_token_here`,
      'Content-Type': 'application/json'
    }
  });
  console.log('\nBad token status:', badRes.status);
  const badText = await badRes.text();
  console.log('Bad token response:', badText);
}

main().catch(console.error);

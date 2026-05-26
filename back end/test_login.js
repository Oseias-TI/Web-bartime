async function test() {
  const res = await fetch('http://127.0.0.1:3333/auth/business', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'oseias@barberflow.com', password: 'Oseias123!' })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();

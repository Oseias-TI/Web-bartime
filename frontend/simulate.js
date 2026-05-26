const puppeteer = require('puppeteer');

async function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

async function simulate() {
  console.log("🚀 Iniciando Simulação do BarberFlow...");
  
  // Launch browser in non-headless mode so the user can watch!
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  try {
    console.log("👉 Acessando a página de Login...");
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await delay(1500);

    // Fill login form
    console.log("⌨️  Digitando as credenciais...");
    await page.type('input[type="email"]', 'oseias@barberflow.com', { delay: 100 });
    await page.type('input[type="password"]', 'Oseias123!', { delay: 100 });
    await delay(1000);

    // Click Login
    console.log("🖱️  Clicando no botão de Entrar...");
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    console.log("✅ Login bem-sucedido! Carregando Dashboard...");
    await delay(3000);

    // Navigate to Agendamentos
    console.log("👉 Acessando Agendamentos...");
    await page.goto('http://localhost:3000/agendamentos', { waitUntil: 'networkidle2' });
    await delay(3000);

    // Navigate to Clientes
    console.log("👉 Acessando Clientes...");
    await page.goto('http://localhost:3000/clientes', { waitUntil: 'networkidle2' });
    await delay(3000);

    // Navigate to Serviços
    console.log("👉 Acessando Serviços...");
    await page.goto('http://localhost:3000/servicos', { waitUntil: 'networkidle2' });
    await delay(3000);

    // Navigate to Financeiro
    console.log("👉 Acessando Financeiro...");
    await page.goto('http://localhost:3000/financeiro', { waitUntil: 'networkidle2' });
    await delay(3000);

    // Navigate to Relatórios
    console.log("👉 Acessando Relatórios...");
    await page.goto('http://localhost:3000/relatorios', { waitUntil: 'networkidle2' });
    await delay(4000);

    console.log("🎉 Simulação visual concluída com sucesso!");

  } catch (err) {
    console.error("❌ Erro durante a simulação:", err.message);
    // If we get a timeout, maybe the login failed due to API connection!
    if (err.message.includes('timeout')) {
      console.log("\n⚠️ ALERTA: O login não redirecionou. Isso significa que o Front-end não conseguiu se comunicar com o Back-end (localhost:3333). O back-end está ligado?");
    }
  } finally {
    console.log("A janela será fechada em 10 segundos...");
    await delay(10000);
    await browser.close();
  }
}

simulate();

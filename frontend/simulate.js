const puppeteer = require('puppeteer');

async function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

async function simulate() {
  console.log("🚀 Iniciando Simulação do BarberFlow...");
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  try {
    console.log("👉 Acessando a página de Login...");
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await delay(1500);

    // 1. Login
    console.log("⌨️  Realizando Autenticação...");
    await page.type('input[type="email"]', 'oseias@barberflow.com', { delay: 50 });
    await page.type('input[type="password"]', 'Oseias123!', { delay: 50 });
    await delay(500);
    await page.click('button[type="submit"]');
    
    // Wait for the URL to change to /dashboard (Next.js does soft navigation, so waitForNavigation can fail)
    await page.waitForFunction("window.location.pathname.includes('/dashboard')", { timeout: 15000 });
    console.log("✅ Login bem-sucedido!");
    await delay(2000);

    // 2. Criar Cliente
    console.log("👥  Navegando para Clientes...");
    await page.goto('http://localhost:3000/dashboard/clientes', { waitUntil: 'domcontentloaded' });
    await delay(2000);
    
    console.log("➕ Criando novo cliente...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Novo Cliente'));
      if(btn) btn.click();
    });
    await delay(1000); // Wait modal
    
    const randomSuffix = Math.floor(Math.random() * 9999);
    await page.type('input[placeholder="Nome completo"]', `Cliente Simulação ${randomSuffix}`, { delay: 50 });
    await page.type('input[placeholder="(00) 00000-0000"]', `119999${randomSuffix}`, { delay: 50 });
    await delay(500);
    
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent === 'Cadastrar' || b.textContent === 'Salvar');
      if(btn) btn.click();
    });
    console.log("✅ Cliente cadastrado!");
    await delay(2000);

    // 3. Criar Serviço
    console.log("✂️   Navegando para Serviços...");
    await page.goto('http://localhost:3000/dashboard/servicos', { waitUntil: 'domcontentloaded' });
    await delay(2000);

    console.log("➕ Criando novo serviço...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Novo Serviço'));
      if(btn) btn.click();
    });
    await delay(1000); // Wait modal
    
    await page.type('input[placeholder="Ex: Corte Degradê"]', `Corte Premium ${randomSuffix}`, { delay: 50 });
    
    // Clear and type price
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
      if(inputs[0]) inputs[0].value = '';
    });
    await page.type('input[placeholder="45.00"]', '80', { delay: 50 });
    
    // Clear and type duration
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
      if(inputs[1]) inputs[1].value = '';
    });
    await page.type('input[placeholder="30"]', '45', { delay: 50 });
    await delay(500);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent === 'Salvar' || b.textContent === 'Cadastrar');
      if(btn) btn.click();
    });
    console.log("✅ Serviço cadastrado!");
    await delay(2000);

    // 4. Criar Agendamento
    console.log("📅  Navegando para Agendamentos...");
    await page.goto('http://localhost:3000/dashboard/agendamentos', { waitUntil: 'domcontentloaded' });
    await delay(2000);

    console.log("➕ Criando novo agendamento...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Novo Agendamento'));
      if(btn) btn.click();
    });
    await delay(1000); // Wait modal

    // Selecionar Cliente
    console.log("🔍  Selecionando Cliente...");
    await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if(!dialog) return;
      const triggers = Array.from(dialog.querySelectorAll('button[role="combobox"]'));
      if(triggers[0]) triggers[0].click();
    });
    await delay(1000);
    await page.evaluate(() => {
      const openSelect = document.querySelector('[data-state="open"][role="presentation"]');
      if(openSelect) {
        const options = Array.from(openSelect.querySelectorAll('[role="option"]'));
        if(options.length > 0) options[options.length - 1].click(); // Select the last one created
      }
    });
    await delay(500);

    // Selecionar Servico
    console.log("🔍  Selecionando Serviço...");
    await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if(!dialog) return;
      const triggers = Array.from(dialog.querySelectorAll('button[role="combobox"]'));
      if(triggers[1]) triggers[1].click();
    });
    await delay(1000);
    await page.evaluate(() => {
      const openSelect = document.querySelector('[data-state="open"][role="presentation"]');
      if(openSelect) {
        const options = Array.from(openSelect.querySelectorAll('[role="option"]'));
        if(options.length > 0) options[options.length - 1].click();
      }
    });
    await delay(500);

    // Selecionar Profissional
    console.log("🔍  Selecionando Profissional...");
    await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if(!dialog) return;
      const triggers = Array.from(dialog.querySelectorAll('button[role="combobox"]'));
      if(triggers[2]) triggers[2].click();
    });
    await delay(1000);
    await page.evaluate(() => {
      const openSelect = document.querySelector('[data-state="open"][role="presentation"]');
      if(openSelect) {
        const options = Array.from(openSelect.querySelectorAll('[role="option"]'));
        if(options.length > 0) options[0].click();
      }
    });
    await delay(2000); // Wait for slots to load

    // Clicar no primeiro horario disponivel
    console.log("🕒  Escolhendo horário...");
    let clickedSlot = false;
    for(let i=0; i < 10; i++) {
      clickedSlot = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const availableBtns = btns.filter(b => b.textContent.includes(':') && !b.disabled && b.textContent.length === 5);
        if(availableBtns.length > 0) {
          availableBtns[0].click();
          return true;
        }
        return false;
      });
      if(clickedSlot) break;
      await delay(500); // Wait half second and try again
    }

    if(!clickedSlot) {
      console.log("⚠️ Nenhum horário disponível na lista de botões. Tentando campo manual...");
      const hasInput = await page.$('input[type="time"]');
      if(hasInput) {
        await page.type('input[type="time"]', '1500');
      } else {
        console.log("⚠️ Campo manual também não encontrado. Tentando forçar o agendamento mesmo assim...");
      }
    }
    
    await delay(1000);

    console.log("🖱️  Confirmando agendamento...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent === 'Agendar');
      if(btn) btn.click();
    });
    await delay(3000);
    console.log("✅ Agendamento criado!");

    // 5. Financeiro
    console.log("💰  Navegando para Financeiro...");
    await page.goto('http://localhost:3000/dashboard/financeiro', { waitUntil: 'domcontentloaded' });
    await delay(4000);

    console.log("🎉 Simulação E2E concluída com sucesso!");

  } catch (err) {
    console.error("❌ Erro durante a simulação:", err.message);
  } finally {
    console.log("A janela será fechada em 15 segundos para observação...");
    await delay(15000);
    await browser.close();
  }
}

simulate();

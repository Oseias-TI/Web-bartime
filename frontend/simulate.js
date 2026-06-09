const puppeteer = require('puppeteer');

(async () => {
  console.log('Iniciando simulação de UI com Puppeteer...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('Navegando para a página de login...');
    await page.goto('http://localhost:3000/login');
    
    // Espera o formulário carregar
    await page.waitForSelector('input[type="email"]');
    
    console.log('Preenchendo formulário...');
    await page.type('input[type="email"]', 'admin@bartime.com');
    await page.type('input[type="password"]', 'SenhaForte123!');
    
    console.log('Submetendo...');
    // Clica no botão de submit
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
    } else {
      console.log('Botão de submit não encontrado!');
    }
    
    // Aguarda um pouco para ver o resultado
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('Simulação concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a simulação:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

import puppeteer from 'puppeteer';

export async function generatePdf(htmlContent: string): Promise<Buffer> {
  let browser;
  let page;
  try {
    console.log('[PDF Generator] Launching Puppeteer...');
    
    // Launch options - using new headless mode and avoiding problematic flags
    const launchOptions: any = {
      headless: 'new', // Use new headless mode to avoid deprecation warning
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-component-extensions-with-background-pages',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-sync',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--enable-automation',
        '--password-store=basic',
        '--use-mock-keychain'
        // Removed --single-process as it can cause frame detachment issues
      ],
      timeout: 60000,
      protocolTimeout: 60000,
      ignoreHTTPSErrors: true,
      dumpio: false
    };

    browser = await puppeteer.launch(launchOptions);
    console.log('[PDF Generator] Puppeteer launched successfully');

    // Verify browser is connected
    if (!browser || !browser.isConnected()) {
      throw new Error('Browser is not connected');
    }

    page = await browser.newPage();
    console.log('[PDF Generator] Page created successfully');
    
    // Set longer timeouts for page operations
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);
    
    console.log('[PDF Generator] Setting HTML content...');
    // Use 'load' instead of 'networkidle0' for static HTML - more reliable
    await page.setContent(htmlContent, { 
      waitUntil: 'load',
      timeout: 60000
    });
    console.log('[PDF Generator] HTML content set, generating PDF...');
    
    // Wait a bit for any CSS/styles to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      printBackground: true,
      timeout: 60000
    });

    if (page && !page.isClosed()) {
      await page.close();
      console.log('[PDF Generator] Page closed');
    }

    if (!pdf || pdf.length === 0) {
      throw new Error('Generated PDF buffer is empty');
    }

    console.log(`[PDF Generator] PDF generated successfully, size: ${pdf.length} bytes`);
    return Buffer.from(pdf);
  } catch (error: any) {
    console.error('[PDF Generator] Puppeteer error:', error);
    console.error('[PDF Generator] Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    });
    
    // Check for common error patterns and provide helpful messages
    if (error.message?.includes('Could not find Chrome') || 
        error.message?.includes('No usable sandbox') ||
        error.code === 'ECONNREFUSED') {
      throw new Error('Chrome/Chromium не найден или не может быть запущен. Попробуйте: npm install puppeteer --force');
    }
    
    if (error.message?.includes('socket hang up') || 
        error.code === 'ECONNRESET' ||
        error.message?.includes('Target closed')) {
      throw new Error('Ошибка подключения к браузеру. Возможно, Chromium не установлен корректно. Попробуйте: npm install puppeteer --force или переустановите зависимости.');
    }
    
    if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      throw new Error('Таймаут при генерации PDF. Попробуйте еще раз.');
    }
    
    if (error.message?.includes('Protocol error') || error.message?.includes('Session closed')) {
      throw new Error('Ошибка протокола браузера. Попробуйте перезапустить сервер.');
    }
    
    if (error.message?.includes('frame was detached') || error.message?.includes('Navigating frame was detached')) {
      throw new Error('Ошибка при загрузке страницы. Попробуйте еще раз или перезапустите сервер.');
    }
    
    throw new Error(`PDF generation failed: ${error.message || 'Unknown error'}`);
  } finally {
    // Clean up page if it exists and wasn't closed
    if (page && !page.isClosed()) {
      try {
        await page.close();
      } catch (e) {
        // Ignore errors when closing page
      }
    }
    
    // Clean up browser
    if (browser) {
      try {
        if (browser.isConnected()) {
          const pages = await browser.pages().catch(() => []);
          await Promise.all(pages.map(p => p.close().catch(() => {})));
          await browser.close();
          console.log('[PDF Generator] Browser closed');
        }
      } catch (e) {
        console.error('[PDF Generator] Error closing browser:', e);
      }
    }
  }
}

export function generateCalculationHtml(data: any): string {
  // Helper function to safely format numbers
  const formatNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) return '0';
    return Number(value).toLocaleString('ru-RU');
  };

  // Ensure tax_2025 and tax_2026 exist
  const tax2025 = data.tax_2025 || { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 };
  const tax2026 = data.tax_2026 || { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 };
  const revenue = Number(data.revenue_2025 || 0);
  const recommendation = data.recommendation || 'Нет рекомендаций';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Расчет налогов</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #0284C7; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f0f0f0; }
        .total { font-weight: bold; background-color: #fffacd; }
        .section { margin: 30px 0; page-break-inside: avoid; }
      </style>
    </head>
    <body>
      <h1>Расчет налоговой нагрузки</h1>
      
      <div class="section">
        <h2>Входные данные</h2>
        <p><strong>Статус:</strong> ${data.status_type || 'Не указан'}</p>
        <p><strong>Выручка 2025:</strong> ${formatNumber(revenue)} ₽</p>
        <p><strong>Текущая система:</strong> ${data.tax_regime || 'Не указана'}</p>
      </div>

      <div class="section">
        <h2>Налоговая нагрузка по годам</h2>
        <table>
          <tr>
            <th>Год</th>
            <th>Основной налог</th>
            <th>НДС</th>
            <th>Взносы</th>
            <th>Итого</th>
          </tr>
          <tr>
            <td>2025 (факт)</td>
            <td>${formatNumber(tax2025.main_tax)} ₽</td>
            <td>${formatNumber(tax2025.nds_tax)} ₽</td>
            <td>${formatNumber(tax2025.contributions)} ₽</td>
            <td class="total">${formatNumber(tax2025.total)} ₽</td>
          </tr>
          <tr>
            <td>2026 (прогноз)</td>
            <td>${formatNumber(tax2026.main_tax)} ₽</td>
            <td>${formatNumber(tax2026.nds_tax)} ₽</td>
            <td>${formatNumber(tax2026.contributions)} ₽</td>
            <td class="total">${formatNumber(tax2026.total)} ₽</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>Рекомендация</h2>
        <p>${recommendation}</p>
      </div>
    </body>
    </html>
  `;
}

import puppeteer from 'puppeteer';
import * as fs from 'fs';

export async function generatePdf(htmlContent: string): Promise<Buffer> {
  let browser;
  let page;
  try {
    console.log('[PDF Generator] Launching Puppeteer...');
    
    // Get executable path for debugging
    const executablePath = puppeteer.executablePath();
    console.log('[PDF Generator] Chromium path:', executablePath);
    
    // Check if executable exists and is accessible
    try {
      fs.accessSync(executablePath, fs.constants.F_OK | fs.constants.X_OK);
      console.log('[PDF Generator] Chromium executable is accessible');
    } catch (accessError: any) {
      console.error('[PDF Generator] Chromium executable access error:', accessError.message);
      throw new Error(`Chromium executable not accessible at ${executablePath}. Check permissions and dependencies.`);
    }
    
    // Launch options - using new headless mode and avoiding problematic flags
    const launchOptions: any = {
      headless: 'new', // Use new headless mode to avoid deprecation warning
      // Allow using system Chromium if PUPPETEER_EXECUTABLE_PATH is set
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
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
        '--disable-audio', // Additional flag to disable audio completely
        '--disable-audio-output', // Disable audio output
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
      dumpio: process.env.NODE_ENV === 'development' // Enable in dev for debugging
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
        error.code === 'ECONNREFUSED' ||
        error.code === 127 ||
        error.message?.includes('Code: 127') ||
        error.message?.includes('Failed to launch the browser process')) {
      throw new Error('Chrome/Chromium не найден или не может быть запущен. Установите системные зависимости: apt install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils && npm install puppeteer --force');
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

  // Ensure tax data exists for all years
  const tax2025 = data.tax_2025 || { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 };
  const tax2026 = data.tax_2026 || { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 };
  const tax2027 = data.tax_2027 || { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 };
  const tax2028 = data.tax_2028 || { main_tax: 0, nds_tax: 0, contributions: 0, total: 0 };
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
            <td>${formatNumber(tax2026.nds_tax)} ₽ ${tax2026.nds_tax > 0 ? '(порог: 20M)' : ''}</td>
            <td>${formatNumber(tax2026.contributions)} ₽</td>
            <td class="total">${formatNumber(tax2026.total)} ₽</td>
          </tr>
          <tr>
            <td>2027 (прогноз)</td>
            <td>${formatNumber(tax2027.main_tax)} ₽</td>
            <td>${formatNumber(tax2027.nds_tax)} ₽ ${tax2027.nds_tax > 0 ? '(порог: 15M)' : ''}</td>
            <td>${formatNumber(tax2027.contributions)} ₽</td>
            <td class="total">${formatNumber(tax2027.total)} ₽</td>
          </tr>
          <tr>
            <td>2028 (прогноз)</td>
            <td>${formatNumber(tax2028.main_tax)} ₽</td>
            <td>${formatNumber(tax2028.nds_tax)} ₽ ${tax2028.nds_tax > 0 ? '(порог: 10M)' : ''}</td>
            <td>${formatNumber(tax2028.contributions)} ₽</td>
            <td class="total">${formatNumber(tax2028.total)} ₽</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>Изменения порогов НДС</h2>
        <ul>
          <li><strong>2026 год:</strong> Порог освобождения от НДС - 20 млн руб.</li>
          <li><strong>2027 год:</strong> Порог освобождения от НДС снижается до 15 млн руб.</li>
          <li><strong>2028 год:</strong> Порог освобождения от НДС снижается до 10 млн руб.</li>
        </ul>
        <p><em>При превышении порога применяются специальные ставки НДС: 5% (до 272M), 7% (272-450M), 22% (свыше 450M)</em></p>
      </div>

      <div class="section">
        <h2>Рекомендация</h2>
        <p>${recommendation}</p>
      </div>
    </body>
    </html>
  `;
}

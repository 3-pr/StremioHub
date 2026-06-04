const fs = require('fs');

const files = [
  'extension/popup/popup.js',
  'extension-firefox/popup/popup.js'
];

for (const file of files) {
  let js = fs.readFileSync(file, 'utf8');

  // Add new Arabic translations
  if (!js.includes('api_test_empty:')) {
    js = js.replace(
      /stremio_web_oled_desc: "استبدال اللون الرمادي بالأسود الحقيقي للحفاظ على الشاشة."\s*\},/g,
      `stremio_web_oled_desc: "استبدال اللون الرمادي بالأسود الحقيقي للحفاظ على الشاشة.",
    api_test_empty: "أدخل المفتاح أولاً",
    api_test_success: "✓ يعمل — {count} مصادر تقييم",
    api_test_error: "✗ خطأ: {error}",
    api_test_no_resp: "لا يوجد رد",
    api_testing: "..."
  },`
    );
  }

  // Add new English translations
  if (!js.includes('api_test_empty: "Enter key first"')) {
    js = js.replace(
      /stremio_web_oled_desc: "Replace gray backgrounds with true black to save battery and reduce eye strain."\s*\}\s*;/g,
      `stremio_web_oled_desc: "Replace gray backgrounds with true black to save battery and reduce eye strain.",
    api_test_empty: "Enter key first",
    api_test_success: "✓ Works — {count} sources",
    api_test_error: "✗ Error: {error}",
    api_test_no_resp: "No response",
    api_testing: "..."
  }
;`
    );
  }

  // Patch applyI18N to use innerHTML for _desc tags
  if (!js.includes('if (key.includes(\'_desc\'))')) {
    js = js.replace(
      /if\s*\(\s*t\[key\]\s*\)\s*el\.textContent\s*=\s*t\[key\];/g,
      `if (t[key]) {
      if (key.includes('_desc') && t[key].includes('<')) {
        el.innerHTML = t[key];
      } else {
        el.textContent = t[key];
      }
    }`
    );
  }

  // Patch testApiKey to use I18N
  if (!js.includes('const lang = state.language')) {
    js = js.replace(
      /function testApiKey\(source, key\) \{[\s\S]*?chrome\.runtime\.sendMessage/m,
      `function testApiKey(source, key) {
  const resultEl = document.getElementById('sh-api-test-result');
  const lang = typeof state !== 'undefined' && state.language ? state.language : 'ar';
  const t = I18N[lang] || I18N.ar;
  
  if (!key) {
    if (resultEl) {
      resultEl.style.display    = 'block';
      resultEl.style.background = 'rgba(239,68,68,0.15)';
      resultEl.style.color      = '#f87171';
      resultEl.textContent      = t.api_test_empty || 'أدخل المفتاح أولاً';
      setTimeout(() => resultEl.style.display = 'none', 3000);
    }
    return;
  }

  const btn = source === 'mdblist'
    ? document.getElementById('sh-test-mdblist')
    : document.getElementById('sh-test-publicmetadb');
  if (btn) { btn.textContent = t.api_testing || '...'; btn.disabled = true; }

  chrome.runtime.sendMessage`
    );

    js = js.replace(
      /resultEl\.textContent\s*=\s*`✓ يعمل — \$\{res\.count\} مصادر تقييم`;/g,
      `resultEl.textContent = t.api_test_success ? t.api_test_success.replace('{count}', res.count) : \`✓ يعمل — \${res.count} مصادر تقييم\`;`
    );

    js = js.replace(
      /resultEl\.textContent\s*=\s*`✗ خطأ: \$\{res\?\.error \|\| 'لا يوجد رد'\}`;/g,
      `resultEl.textContent = t.api_test_error ? t.api_test_error.replace('{error}', res?.error || (t.api_test_no_resp || 'لا يوجد رد')) : \`✗ خطأ: \${res?.error || 'لا يوجد رد'}\`;`
    );
    
    // The previous regex didn't account for the fact there is no "بقت" in the original source, so let's use the actual text.
  }

  fs.writeFileSync(file, js);
}
console.log('Done modifying popup.js files');

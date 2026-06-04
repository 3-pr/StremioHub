const fs = require('fs');

const dirs = ['extension', 'extension-firefox', 'extension-beta'];

for (const dir of dirs) {
  const htmlPath = `${dir}/popup/popup.html`;
  const jsPath = `${dir}/popup/popup.js`;

  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');

    html = html.replace(
      '<span>Rotten Tomatoes (النقاد)</span>',
      '<span data-i18n="rating_rt_critics">Rotten Tomatoes (النقاد)</span>'
    );
    html = html.replace(
      '<span>Rotten Tomatoes (الجمهور)</span>',
      '<span data-i18n="rating_rt_audience">Rotten Tomatoes (الجمهور)</span>'
    );
    html = html.replace(
      '<span>Metacritic (النقاد)</span>',
      '<span data-i18n="rating_meta_critics">Metacritic (النقاد)</span>'
    );
    html = html.replace(
      '<span>Metacritic (الجمهور)</span>',
      '<span data-i18n="rating_meta_audience">Metacritic (الجمهور)</span>'
    );

    html = html.replace(
      '<h4>لون مميز مخصص</h4>',
      '<h4 data-i18n="stremio_web_accent_title">لون مميز مخصص</h4>'
    );
    html = html.replace(
      '<p>يغير اللون البنفسجي الافتراضي في واجهة Stremio Web.</p>',
      '<p data-i18n="stremio_web_accent_desc">يغير اللون البنفسجي الافتراضي في واجهة Stremio Web.</p>'
    );
    
    html = html.replace(
      /\s*إعادة تعيين\s*<\/button>/g,
      '\n                <span data-i18n="btn_reset">إعادة تعيين</span>\n              </button>'
    );

    fs.writeFileSync(htmlPath, html);
  }

  if (fs.existsSync(jsPath)) {
    let js = fs.readFileSync(jsPath, 'utf8');

    // Add Arabic keys for the missing UI items
    if (!js.includes('rating_rt_critics:')) {
      js = js.replace(
        /api_test_empty: "أدخل المفتاح أولاً",/g,
        `rating_rt_critics: "Rotten Tomatoes (النقاد)",
    rating_rt_audience: "Rotten Tomatoes (الجمهور)",
    rating_meta_critics: "Metacritic (النقاد)",
    rating_meta_audience: "Metacritic (الجمهور)",
    stremio_web_accent_title: "لون مميز مخصص",
    stremio_web_accent_desc: "يغير اللون البنفسجي الافتراضي في واجهة Stremio Web.",
    btn_reset: "إعادة تعيين",
    api_test_empty: "أدخل المفتاح أولاً",`
      );
    }

    // Add English keys for missing items (including Theme options which weren't in English dict)
    if (!js.includes('rating_rt_critics: "Rotten Tomatoes (Critics)"')) {
      js = js.replace(
        /api_test_empty: "Enter key first",/g,
        `theme_title: "Appearance (Theme)",
    theme_desc: "Customize UI colors and style.",
    theme_default: "Default",
    theme_oled: "Soft OLED Purple",
    rating_rt_critics: "Rotten Tomatoes (Critics)",
    rating_rt_audience: "Rotten Tomatoes (Audience)",
    rating_meta_critics: "Metacritic (Critics)",
    rating_meta_audience: "Metacritic (Audience)",
    stremio_web_accent_title: "Custom Accent Color",
    stremio_web_accent_desc: "Changes the default purple accent in Stremio Web UI.",
    btn_reset: "Reset",
    api_test_empty: "Enter key first",`
      );
    }

    fs.writeFileSync(jsPath, js);
  }
}

console.log('All remaining translation strings added.');

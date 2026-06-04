const fs = require('fs');

let html = fs.readFileSync('extension/popup/popup.html', 'utf8');

const replacements = {
  '<div class="settings-group-title">تقييمات المجتمع</div>': '<div class="settings-group-title" data-i18n="community_ratings_title">تقييمات المجتمع</div>',
  '<h4>تفعيل التقييمات</h4>': '<h4 data-i18n="enable_ratings_title">تفعيل التقييمات</h4>',
  '<p>تظهر تقييمات RT وMetacritic وLetterboxd وغيرها بجانب شارة IMDb عند فتح أي عمل.</p>': '<p data-i18n="enable_ratings_desc">تظهر تقييمات RT وMetacritic وLetterboxd وغيرها بجانب شارة IMDb عند فتح أي عمل.</p>',
  '<h4>تقييمات المجتمع في الإضافة</h4>': '<h4 data-i18n="popup_ratings_title">تقييمات المجتمع في الإضافة</h4>',
  '<p>عرض تقييمات المجتمع داخل صفحة تفاصيل العمل عند النقر عليه في قسم "الأعمال".</p>': '<p data-i18n="popup_ratings_desc">عرض تقييمات المجتمع داخل صفحة تفاصيل العمل عند النقر عليه في قسم "الأعمال".</p>',
  '<h4>مصدر التقييمات</h4>': '<h4 data-i18n="ratings_source_title">مصدر التقييمات</h4>',
  '<p>اختر الخدمة التي تجلب منها التقييمات. كلاهما يحتاج مفتاح API مجاني.</p>': '<p data-i18n="ratings_source_desc">اختر الخدمة التي تجلب منها التقييمات. كلاهما يحتاج مفتاح API مجاني.</p>',
  '<option value="mdblist">MDBList (موصى به)</option>': '<option value="mdblist" data-i18n="source_mdblist">MDBList (موصى به)</option>',
  '<p>\n                احصل على مفتاح مجاني من\n                <a href="https://mdblist.com/api/" target="_blank" style="color:var(--accent-light)">mdblist.com/api</a>\n              </p>': '<p data-i18n="mdblist_key_desc">\n                احصل على مفتاح مجاني من\n                <a href="https://mdblist.com/api/" target="_blank" style="color:var(--accent-light)">mdblist.com/api</a>\n              </p>',
  '<input type="password"\n                id="setting-mdblist-key"\n                class="size-select-modern"\n                placeholder="أدخل المفتاح هنا..."': '<input type="password"\n                id="setting-mdblist-key"\n                class="size-select-modern"\n                data-i18n-placeholder="api_key_placeholder"\n                placeholder="أدخل المفتاح هنا..."',
  '<button id="sh-test-mdblist" class="addon-action-btn backup-btn">اختبار</button>': '<button id="sh-test-mdblist" class="addon-action-btn backup-btn" data-i18n="test_api_btn">اختبار</button>',
  '<p>\n                احصل على مفتاح مجاني من\n                <a href="https://publicmetadb.com" target="_blank" style="color:var(--accent-light)">publicmetadb.com</a>\n                <br><span style="opacity:0.7;font-size:10px;">← قسم Developer</span>\n              </p>': '<p data-i18n="publicmetadb_key_desc">\n                احصل على مفتاح مجاني من\n                <a href="https://publicmetadb.com" target="_blank" style="color:var(--accent-light)">publicmetadb.com</a>\n                <br><span style="opacity:0.7;font-size:10px;">← قسم Developer</span>\n              </p>',
  '<input type="password"\n                id="setting-publicmetadb-key"\n                class="size-select-modern"\n                placeholder="أدخل المفتاح هنا..."': '<input type="password"\n                id="setting-publicmetadb-key"\n                class="size-select-modern"\n                data-i18n-placeholder="api_key_placeholder"\n                placeholder="أدخل المفتاح هنا..."',
  '<button id="sh-test-publicmetadb" class="addon-action-btn backup-btn">اختبار</button>': '<button id="sh-test-publicmetadb" class="addon-action-btn backup-btn" data-i18n="test_api_btn">اختبار</button>',
  '<h4>تخصيص منصات التقييم</h4>': '<h4 data-i18n="platforms_filter_title">تخصيص منصات التقييم</h4>',
  '<p>اختر المنصات التي ترغب بظهور تقييماتها بجانب العمل.</p>': '<p data-i18n="platforms_filter_desc">اختر المنصات التي ترغب بظهور تقييماتها بجانب العمل.</p>',
  '<div class="settings-group-title" style="margin-top:4px;">تخصيص مظهر Stremio Web</div>': '<div class="settings-group-title" style="margin-top:4px;" data-i18n="web_appearance_title">تخصيص مظهر Stremio Web</div>',
  '<h4>الخط المخصص</h4>': '<h4 data-i18n="stremio_web_font_title">الخط المخصص</h4>',
  '<p>يُطبَّق فوراً على Stremio Web بعد الاختيار.</p>': '<p data-i18n="stremio_web_font_desc">يُطبَّق فوراً على Stremio Web بعد الاختيار.</p>',
  '<option value="">افتراضي (بدون تغيير)</option>': '<option value="" data-i18n="font_default">افتراضي (بدون تغيير)</option>',
  '<h4>ألوان OLED (أسود عميق)</h4>': '<h4 data-i18n="stremio_web_oled_title">ألوان OLED (أسود عميق)</h4>',
  '<p>استبدال اللون الرمادي بالأسود الحقيقي للحفاظ على الشاشة.</p>': '<p data-i18n="stremio_web_oled_desc">استبدال اللون الرمادي بالأسود الحقيقي للحفاظ على الشاشة.</p>'
};

for (const [key, value] of Object.entries(replacements)) {
  html = html.replace(key, value);
}

fs.writeFileSync('extension/popup/popup.html', html);
fs.writeFileSync('extension-firefox/popup/popup.html', html);
console.log('HTML updated successfully');

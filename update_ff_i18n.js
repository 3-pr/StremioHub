const fs = require('fs');

let js = fs.readFileSync('extension-firefox/popup/popup.js', 'utf8');

const arKeys = `    tab_webenhancer: 'ستريميو ويب',
    community_ratings_title: "تقييمات المجتمع",
    enable_ratings_title: "تفعيل التقييمات",
    enable_ratings_desc: "تظهر تقييمات RT وMetacritic وLetterboxd وغيرها بجانب شارة IMDb عند فتح أي عمل.",
    popup_ratings_title: "تقييمات المجتمع في الإضافة",
    popup_ratings_desc: "عرض تقييمات المجتمع داخل صفحة تفاصيل العمل عند النقر عليه في قسم \\"الأعمال\\".",
    ratings_source_title: "مصدر التقييمات",
    ratings_source_desc: "اختر الخدمة التي تجلب منها التقييمات. كلاهما يحتاج مفتاح API مجاني.",
    source_mdblist: "MDBList (موصى به)",
    api_key_placeholder: "أدخل المفتاح هنا...",
    test_api_btn: "اختبار",
    mdblist_key_desc: "احصل على مفتاح مجاني من <a href=\\"https://mdblist.com/api/\\" target=\\"_blank\\" style=\\"color:var(--accent-light)\\">mdblist.com/api</a>",
    publicmetadb_key_desc: "احصل على مفتاح مجاني من <a href=\\"https://publicmetadb.com\\" target=\\"_blank\\" style=\\"color:var(--accent-light)\\">publicmetadb.com</a><br><span style=\\"opacity:0.7;font-size:10px;\\">← قسم Developer</span>",
    platforms_filter_title: "تخصيص منصات التقييم",
    platforms_filter_desc: "اختر المنصات التي ترغب بظهور تقييماتها بجانب العمل.",
    web_appearance_title: "تخصيص مظهر Stremio Web",
    stremio_web_font_title: "الخط المخصص",
    stremio_web_font_desc: "يُطبَّق فوراً على Stremio Web بعد الاختيار.",
    font_default: "افتراضي (بدون تغيير)",
    stremio_web_oled_title: "ألوان OLED (أسود عميق)",
    stremio_web_oled_desc: "استبدال اللون الرمادي بالأسود الحقيقي للحفاظ على الشاشة."`;

const enKeys = `    tab_webenhancer: 'Stremio Web',
    community_ratings_title: "Community Ratings",
    enable_ratings_title: "Enable Ratings",
    enable_ratings_desc: "Show RT, Metacritic, Letterboxd, etc. next to the IMDb badge when opening an item.",
    popup_ratings_title: "Ratings in Extension",
    popup_ratings_desc: "Show community ratings inside the item details page when clicked from the library.",
    ratings_source_title: "Ratings Source",
    ratings_source_desc: "Choose the service to fetch ratings from. Both require a free API key.",
    source_mdblist: "MDBList (Recommended)",
    api_key_placeholder: "Enter key here...",
    test_api_btn: "Test",
    mdblist_key_desc: "Get a free key from <a href=\\"https://mdblist.com/api/\\" target=\\"_blank\\" style=\\"color:var(--accent-light)\\">mdblist.com/api</a>",
    publicmetadb_key_desc: "Get a free key from <a href=\\"https://publicmetadb.com\\" target=\\"_blank\\" style=\\"color:var(--accent-light)\\">publicmetadb.com</a><br><span style=\\"opacity:0.7;font-size:10px;\\">← Developer section</span>",
    platforms_filter_title: "Platform Filters",
    platforms_filter_desc: "Choose which platforms' ratings you want to display next to the item.",
    web_appearance_title: "Stremio Web Appearance",
    stremio_web_font_title: "Custom Font",
    stremio_web_font_desc: "Applied instantly to Stremio Web.",
    font_default: "Default (No change)",
    stremio_web_oled_title: "OLED Black Theme",
    stremio_web_oled_desc: "Replace gray backgrounds with true black to save battery and reduce eye strain."`;

js = js.replace(/tab_webenhancer:\s*'ستريميو ويب'/g, arKeys);
js = js.replace(/tab_webenhancer:\s*'Stremio Web'/g, enKeys);

fs.writeFileSync('extension-firefox/popup/popup.js', js);
console.log('Firefox popup.js updated successfully');

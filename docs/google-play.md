<div dir="rtl">

# העלאת STAR לגוגל פליי

המשחק הוא אתר (PWA). לגוגל פליי עולה עטיפת אנדרואיד דקה שפותחת את האתר במסך מלא: **Trusted Web Activity (TWA)**, שנבנית עם **Bubblewrap**. כל עדכון לאתר מגיע לשחקנים מיד, בלי לשחרר גרסה חדשה בחנות.

## מה כבר מוכן בריפו

| קובץ | מה הוא |
|---|---|
| `public/manifest.webmanifest` | המניפסט של האפליקציה: שם, צבעים, אייקונים 192/512 ואייקון maskable |
| `public/icons/` | אייקונים לאפליקציה |
| `store/play-icon-512.png` | האייקון לחנות (512×512) |
| `store/feature-graphic-1024x500.png` | התמונה הראשית בדף החנות |
| `android/twa-manifest.json` | ההגדרות ל־Bubblewrap (צריך להחליף את הדומיין) |
| `android/assetlinks.template.json` | תבנית לקובץ שמוכיח לגוגל שהאתר והאפליקציה שלך |
| `android/ads.txt.template` | תבנית ל־ads.txt של AdSense |
| `src/game/ads.ts` | חיבור הפרסומות (כבוי עד שמגדירים מזהה מפרסם) |
| `/privacy` | מדיניות הפרטיות (חובה בחנות) |
| `/login` | הרשמה, התחברות ו**מחיקת חשבון** (חובה בחנות לאפליקציה עם הרשמה) |

## שלבים

### 1. דומיין קבוע
צריך כתובת HTTPS קבועה למשחק, למשל `star-game.com`. מחליפים את `YOUR-DOMAIN.example` בכתובת הזאת בקובץ `android/twa-manifest.json`.

### 2. חשבון מפתח בגוגל פליי
נרשמים ב־Play Console. ההרשמה בתשלום חד־פעמי. לחשבון אישי חדש גוגל דורשת בדיקה סגורה עם בודקים לפני שמותר לפרסם, אז כדאי להתחיל את זה מוקדם.

### 3. בניית האפליקציה (על המחשב שלך)
```
npm i -g @bubblewrap/cli
cd android
bubblewrap init --manifest=https://YOUR-DOMAIN/manifest.webmanifest
bubblewrap build
```
`bubblewrap build` מייצר קובץ `app-release-bundle.aab`, וזה הקובץ שמעלים לחנות. בפעם הראשונה Bubblewrap יוצר מפתח חתימה (`android.keystore`). **שמור אותו ואת הסיסמה במקום בטוח**, כי בלעדיו אי אפשר לעדכן את האפליקציה. הוא לא נכנס לגיט.

### 4. אימות הדומיין (Digital Asset Links)
1. ב־Play Console: **App integrity → App signing**, מעתיקים את ה־**SHA-256** של מפתח החתימה של גוגל.
2. מעתיקים את `android/assetlinks.template.json` לנתיב `public/.well-known/assetlinks.json` ומדביקים את ה־SHA-256.
3. מעלים לאתר ובודקים שהכתובת `https://YOUR-DOMAIN/.well-known/assetlinks.json` נפתחת.

בלי השלב הזה האפליקציה תיפתח עם שורת כתובת של דפדפן למעלה.

### 5. פרסומות
- נרשמים ל־AdSense ומבקשים גישה ל־**H5 Games Ads**.
- מגדירים בסביבת ההרצה `VITE_ADSENSE_CLIENT=ca-pub-…` (ולבדיקות גם `VITE_ADSENSE_TEST=on`).
- מעתיקים את `android/ads.txt.template` ל־`public/ads.txt` עם מזהה המפרסם שלך.
- **חשוב:** לפי מדריך AdSense, באפליקציה שבבעלותך הדרך התקינה לפרסומות היא AdMob. ל־TWA אין SDK של AdMob. לכן לפני ההשקה כדאי לבדוק מול גוגל אם AdSense מאושר אצלך בתוך TWA. אם לא, החלופה היא לעטוף את המשחק ב־Capacitor עם AdMob. הקוד במשחק בנוי כך שמחליפים רק את `src/game/ads.ts`.

כללי הבית שכבר בקוד: אין פרסומת באמצע משחק, אין פרסומת מסך מלא בכניסה הראשונה, לכל היותר אחת כל 3 דקות, והקליפים עם הפרס תמיד לפי בחירה.

### 6. טופסי החנות
- **קהל יעד:** מומלץ **13 ומעלה**. אם מסמנים קהל מתחת לגיל 13, המשחק נכנס לתוכנית Families, ושם מותר להשתמש רק ברשתות פרסום שמאושרות לילדים.
- **סיווג תוכן (IARC):** אין אלימות, אין הימורים, אין צ'אט בין שחקנים. יש פרסומות.
- **Data safety:** בלי חשבון, הנתונים נשמרים רק במכשיר. עם חשבון, נאספים מייל ושם לצורך התחברות, לא משותפים עם אחרים, ואפשר למחוק אותם. הפרסומות אוספות מזהה פרסום (Advertising ID) דרך גוגל.
- **מחיקת חשבון:** קישור למחיקה מהאתר: `https://YOUR-DOMAIN/login`.
- **מדיניות פרטיות:** `https://YOUR-DOMAIN/privacy`.
- **Contains ads:** כן.

### 7. צילומי מסך
צריך לפחות 2 צילומי מסך של טלפון. מומלץ 4–6: בית, מרכז העונה, רגע הכרעה, סיכום עונה, הצעות חוזה והישגים. צלם מהטלפון אחרי שהגרסה באוויר.

## טקסטים לדף החנות

**שם (עד 30 תווים):** STAR – קריירת כדורגל

**תיאור קצר (עד 80 תווים):** בונים כוכב כדורגל מגיל 16. רגעי הכרעה, העברות, והמרוץ היומי לבלון ד'אור.

**תיאור מלא:**
מתחילים בגיל 16 בליגה נמוכה וחולמים על גמר אירופה.
• קריירה שלמה בדקות: עונה נמשכת כמה דקות, אפשר לשחק בהפסקה.
• רגעי הכרעה: במשחקים הגדולים אתה מחליט – לבעוט, לעקוף את השוער או למסור.
• החלטות בין המשחקים: ראיונות, סרט הקפטן, סוכן וקבוצה גדולה שעוקבת.
• העברות וחוזים: משווים הצעות לפי שכר, תפקיד ודקות משחק.
• המרוץ היומי: כולם מתחילים מאותה נקודה. מי יגיע לבלון ד'אור בפחות עונות? משתפים את התוצאה עם החברים.
• מורשת והישגים: כל קריירה שנגמרת פותחת יתרונות לקריירה הבאה.
• עברית, אנגלית, ספרדית וצרפתית.

**English listing**
- Title: STAR – Football Career
- Short description: Build a football star from 16. Big-match moments, transfers, a daily race.
- Full description: Start at 16 in a lower league and climb to a European final. Play a full season in minutes, make the call in the big moments (shoot, take on the keeper, or square it), handle the press and your agent between matches, compare contract offers, and race everyone to the Golden Star Award in the daily challenge. Finished careers earn legacy perks for the next one.

## לפני ההשקה: נקודות פתוחות

1. **שמות:** כל שמות הקבוצות, הליגות, הגביעים, הפרסים והשחקנים במשחק בדויים. שמות המדינות אמיתיים, וזה מותר.
2. **התווית "Created with Grok":** הפלטפורמה של Grok מזריקה תווית לאתר. באפליקציה בחנות זה ייראה לא מקצועי. מכבים אותה בהגדרות הפרויקט ב־Grok, לא בקוד.
3. **הפעלת חשבונות:** בהגדרות הפרויקט ב־Grok צריך להפעיל התחברות (`VITE_AUTH_ENABLED`). בלי זה עמוד ההרשמה לא פעיל.
4. **מדידה:** מומלץ לחבר Google Analytics או Firebase לפני ההשקה, כדי לדעת כמה שחקנים חוזרים אחרי יום ואחרי שבוע.

</div>

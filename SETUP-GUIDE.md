# JL Verify — FI / CPV · Setup Guide

Jain & Lunkad ka Field Investigation / Contact Point Verification app.
**Frontend:** React + Vite + Tailwind (indigo theme, dark/light mode) · **Backend:** Google Sheet + Apps Script.

Total setup time: about 20 minutes.

---

## Step 1 — Google Sheet + backend (5 min)

1. [sheets.new](https://sheets.new) kholo. Ek **blank Google Sheet** banao aur naam do: `JL Verify Database`.
2. Menu **Extensions → Apps Script**.
3. Default `Code.gs` ka sab kuch delete karo. Phir is project ki file [`google-apps-script/Code.gs`](google-apps-script/Code.gs) poori copy-paste karo.
4. Top par **`API_TOKEN`** ko ek lamba random string bana do, jaise do UUID jode hue. Ise kahin note kar lo, Step 3 me chahiye.
   ```js
   const API_TOKEN = 'f3b1c7e2-9a44-4c1e-b0d2-7e6a1f2c9d10-71c2a8e4-55d3-4b9f-a1e6-0c9b3d7f2e48';
   ```
5. 💾 Save karo. Function dropdown me **`setup`** chuno, phir **▶ Run** dabao.
   - "Authorization required" aayega → **Review permissions** → apna Google account chuno.
   - Agar "Google hasn't verified this app" dikhe → **Advanced → Go to … (unsafe)** → **Allow**. Ye aapki apni script hai.
   - Ek baar me yeh saari permissions maangi jaati hain: Sheets, Drive (photos ke liye), Gmail send (alerts), Telegram (external request) aur Triggers (daily alert).
6. Sheet me ye tabs ban jayenge: **Login, Clients, Branches, Cases, Reports, Audit, Settings**. Default admin login: **`admin` / `admin123`**.

> Optional: `JL-Verify-Database.xlsx` bhi project me hai. Use import karoge toh bhi `setup()` ek baar zaroor chalana, kyunki wahi columns ko text-format karta hai aur password hash karta hai.

## Step 2 — Deploy as Web App (2 min)

1. Apps Script me **Deploy → New deployment**.
2. ⚙️ (Select type) → **Web app**.
3. **Execute as: Me**, aur **Who has access: Anyone**.
   ⚠️ "Anyone within *domain*" mat chunna, warna app ko JSON ki jagah login page milega.
4. **Deploy** dabao, phir **Web app URL** copy karo (`https://script.google.com/macros/s/…/exec`).

> `Code.gs` me koi bhi badlaav karne ke baad: **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. URL wahi rehta hai.

## Step 3 — Run the app (3 min)

```bash
npm install
```

`.env` file kholo (ya `.env.example` copy karke `.env` banao) aur bharo:

```
VITE_APPSCRIPT_URL=https://script.google.com/macros/s/XXXX/exec
VITE_API_TOKEN=<wahi API_TOKEN jo Code.gs me daala>
```

```bash
npm run dev
```

Browser me http://localhost:5173 kholo. Login **admin / admin123** → turant **My Profile → Change password** karo.

## Step 4 — First-time configuration (5 min, as Admin)

1. **Clients (Banks)**: HDFC Bank, Bajaj Finance, … add karo.
2. **Branches**: har client ki branch aur city add karo. City report me "Location" ke roop me chhapti hai.
3. **Users & Access**: team banao.

   | Role | Kya kar sakta hai |
   |---|---|
   | **Admin** | Sab kuch: users, masters, settings, alerts, audit log |
   | **Reviewer / Office** | Case allocate karna, review, edit, approve / send back, PDF banana |
   | **Field Executive** | Sirf **apne assigned cases**. Field form, GPS photos, submit |

   - Admin/Reviewer ka **Email** zaroor bharo, kyunki email alerts usi par jaate hain.
   - Kisi ko hatana ho toh **Inactive** kar do. Wo turant logout ho jayega aur purana record bacha rahega.
4. **Settings & Alerts → Report letterhead**: firm details aur disclaimer pehle se bhare hain. **Stamp** aur **Signature** ki image (PNG) upload karo.

## Step 5 — Notifications: Email + Telegram

**Settings & Alerts** page par:

### Kab alert jaata hai
- ✅ **Case submitted**: field executive ke submit karte hi saare active Admin + Reviewer ko alert jaata hai.
- ✅ **Daily TAT overdue summary**: roz set time par (default 10 AM IST) un cases ki list jaati hai jo TAT limit (default 24h) se purane hain.
  → Settings save karke **"Activate daily alert"** dabao. Isse Apps Script ka daily trigger ban jata hai.
  → **"Send overdue summary now"** se turant test kar sakte ho.

### 📧 Email
- Koi setup nahi chahiye. Mail usi Google account se jaata hai jisne script deploy ki.
- Toggle ON rakho → **Send test email**.
- Limit: free Gmail par ~100 emails/day, Workspace par 1,500/day.

### ✈️ Telegram
1. Telegram me **@BotFather** kholo → `/newbot` bhejo → naam do (jaise *JL Verify Alerts*) aur username do (jaise `jl_verify_bot`).
2. BotFather jo **token** deta hai (`123456789:AA…`), use **Bot token** box me paste karo → **Save settings**.
   (Token Apps Script ki Script Properties me save hota hai, sheet me nahi.)
3. Telegram toggle **ON** karo.
4. Har Admin/Reviewer apne login se **My Profile → Connect Telegram** kare → bot khulega → **Start** tap kare → app me **verify** dabaye. Bas, ho gaya.
5. *(Optional)* Office group ke liye: bot ko group me add karo → group me koi bhi message bhejo → Settings me **Detect chats** → group ke saamne **"Use as office group"** → Save.
6. **Send test message** se check karo.

## Step 6 — Go live (Vercel / Netlify)

```bash
npm run build
```

- **Vercel**: repo import karo. Environment Variables me `VITE_APPSCRIPT_URL` aur `VITE_API_TOKEN` daalo, phir deploy karo.
- SPA routing ke liye `vercel.json` (Vercel) aur `public/_redirects` (Netlify) pehle se project me hain.
- Live URL ko **Settings → App URL** me daalo, taaki alerts me "Open case" link sahi aaye.
- Field executives phone par live URL kholein. Chrome menu → **Add to Home screen** se app icon jaisa khulega.

---

## Daily workflow

```
Allocate (office) → Field exec visits → fills form + GPS photos → Submit
   → 🔔 Email/Telegram to office → Review (edit, comments) → Approve / Send Back
   → Report → Generate PDF (Save as PDF) → Mark Sent
```

- **TAT** = allocation → approval. Dashboard aur All Cases me 24h se purane cases **red** dikhte hain.
- **Comments** case ke data se apne-aap bante hain, isliye purane case ke naam kabhi nahi aate. Reviewer edit kar sakta hai aur generated + final dono save hote hain.
- **Validation** submit/approve ko rokti hai jab: rented ho par rent na ho, earning members family se zyada hon, info mismatch ho par overall Positive ho, address concern ho par remark na ho, ITR computation verify na ho par genuine marked ho (reviewer override reason de sakta hai), ya kisi visited section ki GPS photo na ho.
- **Photos** live camera se hi lete hain. GPS + time photo par chhap jaata hai aur 500 KB se chhoti hoti hai. Drive me **private** rehti hai. Agar photo pichhli photo se 1 km se door ho toh warning aati hai.
- **Offline**: field form har badlaav par phone me save hota hai. Network aane par apne-aap server par sync hota hai (har 30 sec).
- **PDF**: Report page → **Generate PDF** dabao (isse ek naya version record hota hai) → print dialog me **Save as PDF, A4, Margins: None, Background graphics ON**. File ka naam apne-aap `JL-2026-000001_Applicant_Name_Home_Loan.pdf` aata hai.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Unauthorized` | `.env` ka `VITE_API_TOKEN` aur `Code.gs` ka `API_TOKEN` exactly same hone chahiye. Code.gs badla ho toh **New version** deploy karo. |
| `Backend did not return JSON` | Deployment me **Who has access: Anyone** set karo. `.env` sahi bhara ho aur dev server restart kiya ho. |
| `Sheet "X" not found` | Apps Script me `setup` dobara Run karo. |
| `Session expired` | 6 ghante tak koi activity na ho toh session khatam hota hai. Dobara login karo. Draft phone me safe rehta hai. |
| Admin password bhool gaye | Apps Script me function **`resetAdminPassword`** Run karo → `admin / admin123`. |
| Telegram "Not received yet" | Bot me **Start** dabaya ho, ya `/start CODE` bheja ho. Phir 5 sec baad verify karo. |
| Daily alert nahi aaya | Settings → **Activate daily alert** dabao. Apps Script → ⏰ Triggers me `dailyOverdueAlert` dikhna chahiye. |
| GPS nahi mil raha | Phone ki Location ON karo. Browser me site ko Location permission do. App **https** par chalna chahiye (localhost ke alawa). |

## Security notes

- Har request par server **role aur case ownership** dobara check karta hai. Field executive dusre ka case API se bhi nahi khol sakta.
- Passwords SHA-256 hash me save hote hain. 5 galat try par 15 minute ka lock lagta hai.
- PAN aur account number kabhi URL ya logs me nahi jaate. Lists me account number masked (`XXXX5678`) dikhta hai.
- Har login, allocation, edit, submit, approve, send-back aur report generation **Audit** sheet me record hota hai (Admin → Audit Log).

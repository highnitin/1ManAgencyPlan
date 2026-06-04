# 1ManAgencyPlan — Setup Checklist

## Files in this Repo
- `index.html` — Main landing page
- `thankyou.html` — Post-payment thank you page
- `apps-script.js` — Google Apps Script (paste into Google Apps Script editor)
- `CNAME` — Custom domain config for GitHub Pages
- `.nojekyll` — Prevents GitHub Pages from running Jekyll

---

## Step 1: GitHub Pages Setup
1. Push this repo to GitHub as `1ManAgencyPlan` (private)
2. Go to **Settings → Pages**
3. Source: **Deploy from branch → main → / (root)**
4. Save. Your site will be live at `https://highnitin.github.io/1ManAgencyPlan/`

## Step 2: Custom Domain (1managencyplan.com)
1. Go to your domain registrar (where 1managencyplan.com is registered)
2. Add these DNS records:
   ```
   Type: A    | Host: @    | Value: 185.199.108.153
   Type: A    | Host: @    | Value: 185.199.109.153
   Type: A    | Host: @    | Value: 185.199.110.153
   Type: A    | Host: @    | Value: 185.199.111.153
   Type: CNAME | Host: www | Value: highnitin.github.io
   ```
3. In GitHub Pages settings, enter custom domain: `1managencyplan.com`
4. Check "Enforce HTTPS"
5. DNS propagation: 10 minutes to 48 hours

## Step 3: Google Apps Script
1. Create a new Google Sheet: "1ManAgencyPlan — Leads & Payments"
2. Create 3 tabs: `All Leads`, `Payments Completed`, `Failed Payments`
3. Open **Extensions → Apps Script**
4. Paste the contents of `apps-script.js`
5. Update `SPREADSHEET_ID` with your sheet's ID
6. Run `initializeSheetHeaders()` once to auto-format headers
7. Deploy → **New Deployment → Web App**
   - Execute as: Me
   - Who has access: Anyone (anonymous)
8. Copy the Web App URL
9. In `index.html`, replace `REPLACE_WITH_YOUR_APPS_SCRIPT_URL`

## Step 4: Razorpay Payment Links
1. Go to Razorpay Dashboard → Payment Links → Create
2. Create 4 links:
   - Workshop ₹99 (description: "1ManAgencyPlan Workshop — Early Bird")
   - Workshop ₹299 (description: "1ManAgencyPlan Workshop — Regular")
   - Workshop ₹499 (description: "1ManAgencyPlan Workshop — Last Batch")
   - Workshop + Recording ₹199/299/599 (₹100 add-on included)
3. For each link, set:
   - After Payment: Redirect to `https://1managencyplan.com/thankyou.html`
4. In `index.html`, replace the 4 `REPLACE_WITH_RAZORPAY_LINK_*` placeholders

## Step 5: Razorpay Webhook
1. Razorpay Dashboard → Settings → Webhooks → Add New
2. URL: Your Apps Script Web App URL
3. Events: ✅ `payment.captured` ✅ `payment.failed`
4. Set a webhook secret, paste it into `apps-script.js` → `RAZORPAY_WEBHOOK_SECRET`

## Step 6: Meta Pixel
1. Facebook Business → Events Manager → Create Pixel
2. Copy the Pixel ID
3. In both `index.html` and `thankyou.html`, replace `REPLACE_WITH_YOUR_PIXEL_ID`

## Step 7: Update Contact Info in thankyou.html
- Replace `91XXXXXXXXXX` with your WhatsApp number (e.g. `919876543210`)

---

## Placeholders to Replace (Quick Reference)
| File | Placeholder | Replace With |
|------|-------------|--------------|
| index.html | `REPLACE_WITH_YOUR_PIXEL_ID` | Meta Pixel ID |
| index.html | `REPLACE_WITH_YOUR_APPS_SCRIPT_URL` | Apps Script Web App URL |
| index.html | `REPLACE_WITH_RAZORPAY_LINK_99` | Razorpay ₹99 link |
| index.html | `REPLACE_WITH_RAZORPAY_LINK_299` | Razorpay ₹299 link |
| index.html | `REPLACE_WITH_RAZORPAY_LINK_499` | Razorpay ₹499 link |
| index.html | `REPLACE_WITH_RAZORPAY_LINK_WITH_RECORDING` | Razorpay recording bundle link |
| thankyou.html | `REPLACE_WITH_YOUR_PIXEL_ID` | Meta Pixel ID |
| thankyou.html | `91XXXXXXXXXX` | Your WhatsApp number |
| apps-script.js | `REPLACE_WITH_YOUR_GOOGLE_SHEET_ID` | Google Sheet ID |
| apps-script.js | `REPLACE_WITH_YOUR_RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret |

#!/usr/bin/env node

/**
 * Script to upload captain/driver data from Excel to Firebase
 * 
 * Usage: node scripts/uploadCaptainsFromExcel.js <path-to-excel-file>
 * 
 * Excel file should have these columns:
 * - captain id
 * - name
 * - city
 * - day
 * - limo
 * - total order
 * - captain earning
 * - available hour
 * - accepted offer
 * - total offer
 * - acceptance rate
 * - qualification_status
 * - Amount AED
 * - total
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
  path.join(__dirname, '../serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Firebase service account key not found at:', serviceAccountPath);
  console.log('📝 To use this script:');
  console.log('1. Download your Firebase service account key from Firebase Console');
  console.log('2. Save it as serviceAccountKey.json in the project root');
  console.log('3. Set FIREBASE_SERVICE_ACCOUNT_PATH environment variable (optional)');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function uploadCaptainsFromExcel(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('❌ File not found:', filePath);
      process.exit(1);
    }

    console.log('📂 Reading Excel file:', filePath);
    
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    console.log(`📊 Found ${data.length} captains in Excel\n`);

    if (data.length === 0) {
      console.error('❌ No data found in Excel file');
      process.exit(1);
    }

    // Validate and transform data
    const validatedCaptains = [];
    const errors = [];

    data.forEach((row, index) => {
      const rowNum = index + 2; // Excel row numbers start at 1, plus header
      
      // Normalize headers to lowercase and trim spaces
      const normalizedRow = {};
      for (const [key, value] of Object.entries(row)) {
        const lowerKey = key.toLowerCase().trim();
        normalizedRow[lowerKey] = value;
      }

      // Check required fields (name and city)
      const name = normalizedRow.name || normalizedRow['captain name'] || '';
      const city = normalizedRow.city || '';

      if (!name || !city) {
        errors.push(`Row ${rowNum}: Missing required fields (name or city)`);
        return;
      }

      // Helper function to find column value with multiple possible names
      const getColumnValue = (row, ...possibleNames) => {
        for (const name of possibleNames) {
          const value = row[name];
          if (value !== undefined && value !== '' && value !== null) {
            return value;
          }
        }
        return '';
      };

      // Helper for numeric fields
      const getNumericValue = (row, ...possibleNames) => {
        const value = getColumnValue(row, ...possibleNames);
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      };

      // Helper to convert Excel serial date to formatted date string
      const excelDateToString = (excelSerialDate) => {
        if (!excelSerialDate || isNaN(excelSerialDate)) return '';
        const serialNumber = parseFloat(excelSerialDate);
        // Excel's epoch is December 30, 1899
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + serialNumber * 86400000);
        // Format as MM/DD/YYYY
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      };

      // Transform to captain object - parse numeric fields with exact Excel column names
      const dayValue = getColumnValue(normalizedRow, 'day', 'days');
      const captain = {
        captainId: getColumnValue(normalizedRow, 'captain_id', 'captain id', 'captainid', 'id'),
        name: name.toString().trim(),
        city: city.toString().trim(),
        day: excelDateToString(dayValue), // Convert Excel date to readable format
        limo: getColumnValue(normalizedRow, 'limo', 'vehicle', 'car'),
        totalOrder: parseInt(getNumericValue(normalizedRow, 'total_orders', 'total orders', 'totalorder', 'total order')) || 0,
        captainEarning: getNumericValue(normalizedRow, 'captain_earning_aed', 'captain earning aed', 'captain_earning', 'captain earning', 'earning') || 0,
        availableHour: parseInt(getNumericValue(normalizedRow, 'available_hours', 'available hours', 'availablehour', 'available hour', 'hours')) || 0,
        acceptedOffer: parseInt(getNumericValue(normalizedRow, 'accepted_offers', 'accepted offers', 'acceptedoffer', 'accepted offer')) || 0,
        totalOffer: parseInt(getNumericValue(normalizedRow, 'total_offers', 'total offers', 'totaloffer', 'total offer')) || 0,
        acceptanceRate: getColumnValue(normalizedRow, 'acceptance_rate', 'acceptance rate', 'acceptancerate') || '0%',
        qualificationStatus: getColumnValue(normalizedRow, 'qualification_status', 'qualificationstatus', 'qualification status', 'status') || 'Active',
        amountAED: getNumericValue(normalizedRow, 'amount aed', 'amount_aed', 'amountaed') || 0,
        total: getNumericValue(normalizedRow, 'total') || 0,
        // Metadata
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Debug: Log first row to see what was parsed
      if (index === 0) {
        console.log('\n📋 Sample parsed data (Row 1):');
        console.log(JSON.stringify(captain, null, 2));
        console.log('\n📋 Available columns in Excel:');
        console.log(Object.keys(normalizedRow).sort());
        console.log('\n');
      }

      validatedCaptains.push(captain);
    });

    if (errors.length > 0) {
      console.error('\n❌ Validation Errors:');
      errors.forEach(err => console.error('  ' + err));
      console.error(`\n✅ Valid captains: ${validatedCaptains.length}/${data.length}\n`);
    }

    if (validatedCaptains.length === 0) {
      console.error('❌ No valid captains to upload');
      process.exit(1);
    }

    // Show summary before upload
    console.log('\n📋 Summary:');
    console.log(`  Total: ${validatedCaptains.length} captains`);
    
    const cityCount = {};
    const statusCount = {};
    validatedCaptains.forEach(captain => {
      cityCount[captain.city] = (cityCount[captain.city] || 0) + 1;
      statusCount[captain.qualificationStatus] = (statusCount[captain.qualificationStatus] || 0) + 1;
    });
    
    console.log('\n  By City:');
    Object.entries(cityCount).forEach(([city, count]) => {
      console.log(`    - ${city}: ${count}`);
    });

    console.log('\n  By Qualification Status:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`    - ${status}: ${count}`);
    });

    const totalEarnings = validatedCaptains.reduce((sum, c) => sum + c.captainEarning, 0);
    const totalAED = validatedCaptains.reduce((sum, c) => sum + c.amountAED, 0);
    console.log(`\n  Total Earnings: ${totalEarnings.toFixed(2)} AED`);
    console.log(`  Total Amount AED: ${totalAED.toFixed(2)} AED`);

    // Countdown before upload
    console.log('\n⏳ Upload starts in 5 seconds (press Ctrl+C to cancel)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n🚀 Starting upload...\n');

    // Batch upload with progress
    const batchSize = 500; // Firestore batch limit
    let uploaded = 0;
    let failed = 0;

    for (let i = 0; i < validatedCaptains.length; i += batchSize) {
      const batch = db.batch();
      const batchCaptains = validatedCaptains.slice(i, Math.min(i + batchSize, validatedCaptains.length));

      batchCaptains.forEach(captain => {
        const docRef = db.collection('captains').doc();
        batch.set(docRef, captain);
      });

      try {
        await batch.commit();
        uploaded += batchCaptains.length;
        const progress = Math.round((uploaded / validatedCaptains.length) * 100);
        const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
        console.log(`  [${bar}] ${progress}% (${uploaded}/${validatedCaptains.length})`);
      } catch (error) {
        failed += batchCaptains.length;
        console.error(`❌ Batch upload failed: ${error.message}`);
      }
    }

    console.log('\n✅ Upload complete!');
    console.log(`  Uploaded: ${uploaded} captains`);
    console.log(`  Failed: ${failed}`);

    // Verify by counting
    const snapshot = await db.collection('captains').get();
    console.log(`\n📊 Total captains in Firestore: ${snapshot.size}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Main
const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/uploadCaptainsFromExcel.js <path-to-excel-file>');
  console.error('Example: node scripts/uploadCaptainsFromExcel.js ./captains.xlsx');
  process.exit(1);
}

uploadCaptainsFromExcel(filePath);

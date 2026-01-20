#!/usr/bin/env node

/**
 * Script to upload fleet payment data from Excel to Firebase
 * 
 * Usage: node scripts/uploadFleetFromExcel.js <path-to-excel-file>
 * 
 * Excel file should have these columns:
 * - limo_company
 * - limo_company_id
 * - captain_name
 * - captain_id
 * - payment_date
 * - payment_id
 * - payment_method
 * - total_driver_base_cost
 * - total_driver_other_cost
 * - total_driver_payment
 * - tips
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

async function uploadFleetFromExcel(filePath) {
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

    console.log(`📊 Found ${data.length} fleet records in Excel\n`);

    if (data.length === 0) {
      console.error('❌ No data found in Excel file');
      process.exit(1);
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

    // Validate and transform data
    const validatedFleet = [];
    const errors = [];

    data.forEach((row, index) => {
      const rowNum = index + 2; // Excel row numbers start at 1, plus header
      
      // Normalize headers to lowercase and trim spaces
      const normalizedRow = {};
      for (const [key, value] of Object.entries(row)) {
        const lowerKey = key.toLowerCase().trim();
        normalizedRow[lowerKey] = value;
      }

      // Check required fields (at least captain name or company)
      const captainName = getColumnValue(normalizedRow, 'captain_name', 'captain name', 'captainname', 'captain') || '';
      const limoCompany = getColumnValue(normalizedRow, 'limo_company', 'limo company', 'limocompany', 'company') || '';

      if (!captainName && !limoCompany) {
        errors.push(`Row ${rowNum}: Missing both captain name and limo company`);
        return;
      }

      // Transform to fleet object
      const paymentDateValue = getColumnValue(normalizedRow, 'payment_date', 'payment date', 'paymentdate', 'date');
      const fleet = {
        limoCompany: limoCompany,
        limoCompanyId: getColumnValue(normalizedRow, 'limo_company_id', 'limo company id', 'limocompanyid', 'company_id'),
        captainName: captainName,
        captainId: getColumnValue(normalizedRow, 'captain_id', 'captain id', 'captainid'),
        paymentDate: excelDateToString(paymentDateValue),
        paymentId: getColumnValue(normalizedRow, 'payment_id', 'payment id', 'paymentid'),
        paymentMethod: getColumnValue(normalizedRow, 'payment_method', 'payment method', 'paymentmethod', 'method'),
        totalDriverBaseCost: getNumericValue(normalizedRow, 'total_driver_base_cost', 'total driver base cost', 'base_cost', 'base cost') || 0,
        totalDriverOtherCost: getNumericValue(normalizedRow, 'total_driver_other_cost', 'total driver other cost', 'other_cost', 'other cost') || 0,
        totalDriverPayment: getNumericValue(normalizedRow, 'total_driver_payment', 'total driver payment', 'total_payment', 'total payment') || 0,
        tips: getNumericValue(normalizedRow, 'tips', 'tip') || 0,
        // Metadata
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Debug: Log first row to see what was parsed
      if (index === 0) {
        console.log('\n📋 Sample parsed data (Row 1):');
        console.log(JSON.stringify(fleet, null, 2));
        console.log('\n📋 Available columns in Excel:');
        console.log(Object.keys(normalizedRow).sort());
        console.log('\n');
      }

      validatedFleet.push(fleet);
    });

    if (errors.length > 0) {
      console.error('\n❌ Validation Errors:');
      errors.forEach(err => console.error('  ' + err));
      console.error(`\n✅ Valid fleet records: ${validatedFleet.length}/${data.length}\n`);
    }

    if (validatedFleet.length === 0) {
      console.error('❌ No valid fleet records to upload');
      process.exit(1);
    }

    // Show summary before upload
    console.log('\n📋 Summary:');
    console.log(`  Total: ${validatedFleet.length} fleet records`);
    
    const companyCount = {};
    const methodCount = {};
    validatedFleet.forEach(fleet => {
      if (fleet.limoCompany) {
        companyCount[fleet.limoCompany] = (companyCount[fleet.limoCompany] || 0) + 1;
      }
      if (fleet.paymentMethod) {
        methodCount[fleet.paymentMethod] = (methodCount[fleet.paymentMethod] || 0) + 1;
      }
    });
    
    if (Object.keys(companyCount).length > 0) {
      console.log('\n  By Limo Company:');
      Object.entries(companyCount).forEach(([company, count]) => {
        console.log(`    - ${company}: ${count}`);
      });
    }

    if (Object.keys(methodCount).length > 0) {
      console.log('\n  By Payment Method:');
      Object.entries(methodCount).forEach(([method, count]) => {
        console.log(`    - ${method}: ${count}`);
      });
    }

    const totalPayments = validatedFleet.reduce((sum, f) => sum + f.totalDriverPayment, 0);
    const totalTips = validatedFleet.reduce((sum, f) => sum + f.tips, 0);
    console.log(`\n  Total Payments: ${totalPayments.toFixed(2)} AED`);
    console.log(`  Total Tips: ${totalTips.toFixed(2)} AED`);

    // Countdown before upload
    console.log('\n⏳ Upload starts in 5 seconds (press Ctrl+C to cancel)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n🚀 Starting upload...\n');

    // Batch upload with progress
    const batchSize = 500; // Firestore batch limit
    let uploaded = 0;
    let failed = 0;

    for (let i = 0; i < validatedFleet.length; i += batchSize) {
      const batch = db.batch();
      const batchFleet = validatedFleet.slice(i, Math.min(i + batchSize, validatedFleet.length));

      batchFleet.forEach(fleet => {
        const docRef = db.collection('fleet').doc();
        batch.set(docRef, fleet);
      });

      try {
        await batch.commit();
        uploaded += batchFleet.length;
        const progress = Math.round((uploaded / validatedFleet.length) * 100);
        const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
        console.log(`  [${bar}] ${progress}% (${uploaded}/${validatedFleet.length})`);
      } catch (error) {
        failed += batchFleet.length;
        console.error(`❌ Batch upload failed: ${error.message}`);
      }
    }

    console.log('\n✅ Upload complete!');
    console.log(`  Uploaded: ${uploaded} fleet records`);
    console.log(`  Failed: ${failed}`);

    // Verify by counting
    const snapshot = await db.collection('fleet').get();
    console.log(`\n📊 Total fleet records in Firestore: ${snapshot.size}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Main
const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/uploadFleetFromExcel.js <path-to-excel-file>');
  console.error('Example: node scripts/uploadFleetFromExcel.js ./fleet.xlsx');
  process.exit(1);
}

uploadFleetFromExcel(filePath);

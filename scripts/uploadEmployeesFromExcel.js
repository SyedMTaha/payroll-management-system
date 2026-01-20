#!/usr/bin/env node

/**
 * Script to upload employee data from Excel to Firebase
 * 
 * Usage: node scripts/uploadEmployeesFromExcel.js <path-to-excel-file>
 * 
 * Excel file should have these columns:
 * - name
 * - role
 * - paymentType (Weekly, Monthly, Per Delivery)
 * - salary
 * - client
 * - status (Active, Inactive, On Leave)
 * - emiratesId (optional)
 * - passportNumber (optional)
 * - drivingLicense (optional)
 * - labourCard (optional)
 * - insuranceDocuments (optional)
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

async function uploadEmployeesFromExcel(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    console.log('📂 Reading Excel file...');
    
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✅ Found ${data.length} employees in Excel file\n`);

    // Validate data
    const validEmployees = [];
    const errors = [];

    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 because row 1 is header, 0-indexed
      
      if (!row.name || !row.name.trim()) {
        errors.push(`Row ${rowNum}: Missing employee name`);
        return;
      }

      if (!row.role || !row.role.trim()) {
        errors.push(`Row ${rowNum}: Missing role`);
        return;
      }

      if (!row.salary || !row.salary.toString().trim()) {
        errors.push(`Row ${rowNum}: Missing salary`);
        return;
      }

      if (!row.client || !row.client.trim()) {
        errors.push(`Row ${rowNum}: Missing client`);
        return;
      }

      const employee = {
        name: String(row.name).trim(),
        role: String(row.role).trim(),
        paymentType: String(row.paymentType || 'Monthly').trim(),
        salary: String(row.salary).trim(),
        client: String(row.client).trim(),
        status: String(row.status || 'Active').trim(),
        emiratesId: row.emiratesId ? String(row.emiratesId).trim() : '',
        passportNumber: row.passportNumber ? String(row.passportNumber).trim() : '',
        drivingLicense: row.drivingLicense ? String(row.drivingLicense).trim() : '',
        labourCard: row.labourCard ? String(row.labourCard).trim() : '',
        insuranceDocuments: row.insuranceDocuments ? String(row.insuranceDocuments).trim() : '',
        image: null,
        emiratesIdImage: null,
        passportImage: null,
        drivingLicenseImage: null,
        labourCardImage: null,
        insuranceDocumentsImage: null,
        salaryHistory: [],
        advances: [],
        assets: [],
        createdAt: new Date(),
      };

      validEmployees.push(employee);
    });

    if (errors.length > 0) {
      console.log('⚠️  Validation Errors:');
      errors.forEach(err => console.log(`  - ${err}`));
      console.log('');
    }

    console.log(`📊 Valid employees: ${validEmployees.length}/${data.length}`);

    if (validEmployees.length === 0) {
      console.error('❌ No valid employees to upload');
      process.exit(1);
    }

    // Ask for confirmation
    console.log('\n⚠️  About to upload ' + validEmployees.length + ' employees to Firestore');
    console.log('Press Ctrl+C to cancel, or continue in 5 seconds...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Upload to Firebase with batch writes
    console.log('🚀 Uploading to Firebase...\n');
    
    const batchSize = 500; // Firestore batch limit is 500
    let uploadedCount = 0;

    for (let i = 0; i < validEmployees.length; i += batchSize) {
      const batch = db.batch();
      const batchEmployees = validEmployees.slice(i, i + batchSize);

      batchEmployees.forEach((employee) => {
        const docRef = db.collection('employees').doc();
        batch.set(docRef, employee);
      });

      await batch.commit();
      uploadedCount += batchEmployees.length;
      
      const progressBar = createProgressBar(uploadedCount, validEmployees.length);
      process.stdout.write(`\r${progressBar} ${uploadedCount}/${validEmployees.length}`);
    }

    console.log('\n\n✅ Successfully uploaded ' + validEmployees.length + ' employees to Firestore!');
    console.log('📍 Collection: employees');
    
    // Show summary
    const paymentTypes = {};
    validEmployees.forEach(emp => {
      paymentTypes[emp.paymentType] = (paymentTypes[emp.paymentType] || 0) + 1;
    });

    console.log('\n📈 Summary:');
    console.log('  Payment Types:', paymentTypes);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function createProgressBar(current, total, width = 30) {
  const percentage = current / total;
  const filledWidth = Math.round(width * percentage);
  const emptyWidth = width - filledWidth;
  const percent = (percentage * 100).toFixed(1);
  
  const filled = '█'.repeat(filledWidth);
  const empty = '░'.repeat(emptyWidth);
  
  return `[${filled}${empty}] ${percent}%`;
}

// Get file path from command line argument
const excelFilePath = process.argv[2];

if (!excelFilePath) {
  console.error('❌ Please provide the path to your Excel file');
  console.log('Usage: node scripts/uploadEmployeesFromExcel.js <path-to-excel-file>');
  console.log('Example: node scripts/uploadEmployeesFromExcel.js ./employees.xlsx');
  process.exit(1);
}

uploadEmployeesFromExcel(excelFilePath);

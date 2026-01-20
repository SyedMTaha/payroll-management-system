#!/usr/bin/env node

/**
 * Script to convert Excel file to JSON format
 * 
 * Usage: node scripts/excelToJson.js <path-to-excel-file> [output-file]
 * 
 * Example:
 *   node scripts/excelToJson.js ./employees.xlsx ./employees.json
 *   node scripts/excelToJson.js ./employees.xlsx
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function convertExcelToJson(inputPath, outputPath = null) {
  try {
    // Check if file exists
    if (!fs.existsSync(inputPath)) {
      throw new Error(`File not found: ${inputPath}`);
    }

    console.log('📂 Reading Excel file...');
    
    // Read Excel file
    const workbook = XLSX.readFile(inputPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✅ Found ${data.length} records\n`);

    // Convert to standard employee format
    const employees = data.map((row, index) => ({
      id: index + 1,
      name: row.name ? String(row.name).trim() : '',
      role: row.role ? String(row.role).trim() : '',
      paymentType: row.paymentType ? String(row.paymentType).trim() : 'Monthly',
      salary: row.salary ? String(row.salary).trim() : '',
      client: row.client ? String(row.client).trim() : '',
      status: row.status ? String(row.status).trim() : 'Active',
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
    }));

    // Determine output file path
    const output = outputPath || inputPath.replace('.xlsx', '.json').replace('.xls', '.json');

    // Write to JSON file
    fs.writeFileSync(output, JSON.stringify(employees, null, 2), 'utf-8');

    console.log(`✅ Successfully converted to JSON!`);
    console.log(`📁 Output file: ${path.resolve(output)}`);
    console.log(`📊 Records: ${employees.length}`);
    console.log(`📦 File size: ${(fs.statSync(output).size / 1024).toFixed(2)} KB`);

    return employees;
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile) {
  console.error('❌ Please provide the path to your Excel file');
  console.log('Usage: node scripts/excelToJson.js <path-to-excel-file> [output-file]');
  console.log('Example: node scripts/excelToJson.js ./employees.xlsx ./employees.json');
  process.exit(1);
}

convertExcelToJson(inputFile, outputFile);

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function parseCSV(content) {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const emailIndex = headers.indexOf('email');
    const roleIndex = headers.indexOf('role');
    const nameIndex = headers.indexOf('name');
  
    if (emailIndex === -1 || roleIndex === -1) {
      throw new Error('CSV must have "email" and "role" columns');
    }
  
    const users = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
  
      const values = line.split(',').map(v => v.trim());
      const email = values[emailIndex];
      const role = values[roleIndex];
      const name = nameIndex !== -1 ? values[nameIndex] : null;
  
      if (!email || !role) {
        console.warn(`⚠️  Skipping line ${i + 1}: missing email or role`);
        continue;
      }
  
      if (role !== 'teacher' && role !== 'student') {
        console.warn(`⚠️  Skipping line ${i + 1}: invalid role "${role}"`);
        continue;
      }
  
      users.push({ email, role, name });
    }
  
    return users;
  }
  
  async function importUsers(csvPath) {
    // Read CSV file
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ File not found: ${csvPath}`);
      process.exit(1);
    }
    
    const content = fs.readFileSync(csvPath, 'utf-8');
    
    let users;
    try {
      users = parseCSV(content);
    } catch (error) {
      console.error(`❌ Error parsing CSV: ${error.message}`);
      process.exit(1);
    }
  
    if (users.length === 0) {
      console.error('❌ No valid users found in CSV');
      process.exit(1);
    }
  
    console.log(`Found ${users.length} users to import\n`);
  
    // Import users
    let added = 0;
    let skipped = 0;
    let updated = 0;
  
    for (const user of users) {
      try {
        const existing = await prisma.authorizedUser.findUnique({
          where: { email: user.email },
        });
  
        if (existing) {
          // Update if role or name changed
          if (existing.role !== user.role || (user.name && existing.name !== user.name)) {
            await prisma.authorizedUser.update({
              where: { email: user.email },
              data: {
                role: user.role,
                name: user.name || existing.name,
              },
            });
            console.log(`🔄 Updated: ${user.email} (${existing.role} → ${user.role})`);
            updated++;
          } else {
            console.log(`⏭️  Skipped: ${user.email} (already exists)`);
            skipped++;
          }
        } else {
          // Add new user
          await prisma.authorizedUser.create({
            data: {
              email: user.email,
              role: user.role,
              name: user.name,
              addedBy: 'csv-import',
            },
          });
          console.log(`✅ Added: ${user.email} as ${user.role}`);
          added++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${user.email}:`, error.message);
      }
    }
  
    console.log('\n' + '─'.repeat(50));
    console.log(`\n📊 Import Summary:`);
    console.log(`   ✅ Added: ${added}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📝 Total: ${users.length}\n`);
  }
  
  async function main() {
    const csvPath = process.argv[2];
  
    if (!csvPath) {
      process.exit(0);
    }
  
    await importUsers(csvPath);
    await prisma.$disconnect();
  }
  
  main();
// scripts/setupPasswords.js
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

const setupPasswords = async () => {
  console.log('🔐 Configurando contraseñas para usuarios...\n');

  // Define las contraseñas para cada wallet
  const passwords = {
    '0xF20A544DE14e733dc3892F16a58Aa2663618C9F7': '$2a$12$HS6KBuFSKMbumIzCRZR.fOaHD/SfZ7C.JYc4NGb8CBTaeh42mBm02',     // Sunwest (admin)
    '0x414114C70A76c13c1FB93f5F92AaA4B1cCBA218b': '$2a$12$Wh3aqtll0bmjCCGeNPgOxeM.hRcrce.oTdSUa8x7F6qFD8cWcX4w6',        // Mike (operator)
    '0xa2594374b8CF7Bff7558B86796AE49B7D5011640': '$2a$12$hJOpPFGkPql94bGKtI6dL.FOAyyiK2QEiYSvT9fEoWwMSzksv4xme',    // FCI Corporate (operator)
    '0x45fC43a4f814862d713e819871B6d28cdA8CF06C': '$2a$12$wysVx36TYTQ3AgVqkyyi9.NPuY4wNX4eKF4zAIhZsc.1vAKcAjdGW'         // Tim (operator)
  };

  try {
    // Leer archivo de usuarios
    const usersFile = path.join(__dirname, '../data/users.json');
    const data = await fs.readFile(usersFile, 'utf8');
    const users = JSON.parse(data);

    // Agregar passwordHash a cada usuario
    for (const [userId, user] of Object.entries(users)) {
      const password = passwords[user.address];
      
      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);
        user.passwordHash = passwordHash;
        
        console.log(`✅ ${user.name} (${user.address})`);
        console.log(`   Password: ${password}`);
        console.log(`   Hash: ${passwordHash.substring(0, 20)}...`);
        console.log('');
      } else {
        console.log(`⚠️  No password defined for ${user.address}`);
      }
    }

    // Guardar archivo actualizado
    await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
    
    console.log('✅ Contraseñas configuradas exitosamente!');
    console.log('\n📝 Credenciales de acceso:');
    console.log('═══════════════════════════════════════════════════════════');
    
    for (const [userId, user] of Object.entries(users)) {
      const password = passwords[user.address];
      if (password) {
        console.log(`\n${user.name} (${user.role.toUpperCase()})`);
        console.log(`Wallet: ${user.address}`);
        console.log(`Password: ${password}`);
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

setupPasswords();
// Despliegue del build de producción (SmarterASP.NET, host WIN8176.site4now.net) por FTP/FTPS.
// Credenciales y ruta remota SIEMPRE desde variables de entorno (.env local, no versionado) —
// nunca hardcodeadas aquí. Ver `.env.example` para las variables requeridas.

require('dotenv').config();
const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');

/** Suma recursiva del tamaño de todos los archivos de un directorio (para el % de subida). */
function tamanoDirectorio(dirPath) {
  let total = 0;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = path.join(dirPath, entry.name);
    total += entry.isDirectory() ? tamanoDirectorio(entryPath) : fs.statSync(entryPath).size;
  }
  return total;
}

function formatearBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const {
  FTP_HOST,
  FTP_USER,
  FTP_PASSWORD,
  FTP_REMOTE_DIR = '/',
  FTP_SECURE = 'true',
  FTP_LOCAL_DIR = 'dist',
} = process.env;

async function deploy() {
  const faltantes = ['FTP_HOST', 'FTP_USER', 'FTP_PASSWORD'].filter((k) => !process.env[k]);
  if (faltantes.length > 0) {
    console.error(`❌ Faltan variables de entorno: ${faltantes.join(', ')}. Copia .env.example a .env y complétalo.`);
    process.exit(1);
  }

  const localDir = path.join(__dirname, FTP_LOCAL_DIR);
  const client = new ftp.Client(30000); // timeout 30s, subida de un build puede tardar
  client.ftp.verbose = false;

  try {
    console.log(`🔌 Conectando a ${FTP_HOST} (${FTP_SECURE === 'true' ? 'FTPS' : 'FTP plano'})...`);
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
      secure: FTP_SECURE === 'true',
    });

    console.log(`📁 Entrando/creando ${FTP_REMOTE_DIR} en el servidor...`);
    await client.ensureDir(FTP_REMOTE_DIR);

    // Confirmación visible antes del paso destructivo: las cuentas FTP de SmarterASP.NET quedan
    // enjauladas en la carpeta del sitio (verificado con ftp-front: pwd="/" ya ES /admin-v2; cd a
    // cualquier otra ruta del hosting, como /Admin, da 550 — no es alcanzable desde esta cuenta).
    // Si este pwd no es el que esperas, aborta (Ctrl+C) antes de que limpie el directorio.
    const dirActual = await client.pwd();
    console.log(`🧹 Vaciando el directorio remoto actual (${dirActual}) — build anterior...`);
    await client.clearWorkingDir();

    const totalBytes = tamanoDirectorio(localDir);
    console.log(`📂 Subiendo ${FTP_LOCAL_DIR}/ al servidor (${formatearBytes(totalBytes)})...`);
    client.trackProgress((info) => {
      const pct = totalBytes > 0 ? Math.min(100, (info.bytesOverall / totalBytes) * 100) : 0;
      const linea = `   ${pct.toFixed(1)}% — ${formatearBytes(info.bytesOverall)} / ${formatearBytes(totalBytes)} — ${info.name}`;
      process.stdout.write(`\r${linea.padEnd(90)}`);
    });
    await client.uploadFromDir(localDir);
    client.trackProgress(undefined); // deja de rastrear, ya no hay mas subidas
    process.stdout.write('\n');

    console.log('✅ Despliegue por FTP completado con éxito.');
  } catch (error) {
    console.error('❌ Error durante el despliegue FTP:', error);
    process.exitCode = 1;
  } finally {
    client.close();
  }
}

deploy();

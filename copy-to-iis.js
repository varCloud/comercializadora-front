const fs = require("fs-extra");
const path = require("path");

// Rutas
const distPath = path.join(__dirname, "dist"); // Reemplaza con el nombre real de tu app
const iisPath = "C:\\inetpub\\wwwroot\\wms-lluvia-v2";

// Función para copiar archivos
async function deploy() {
  try {
    console.log("🚀 Eliminando archivos anteriores en IIS...");
    await fs.emptyDir(iisPath);

    console.log("📂 Copiando archivos al servidor IIS...");
    await fs.copy(distPath, iisPath);

    console.log("✅ Despliegue completado con éxito en IIS!");
  } catch (error) {
    console.error("❌ Error durante el despliegue:", error);
  }
}

// Ejecutar despliegue
deploy();

// Google Apps Script: recibe reportes EcoLimpia y envía correo automáticamente
// Despliegue: Implementar > Nueva implementación > Aplicación web
// Ejecutar como: yo | Acceso: cualquiera

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const subject = 'Reporte EcoLimpia ' + (data.codigo || '');
    const body =
      'Código: ' + (data.codigo || '-') + '\n' +
      'DNI: ' + (data.dni || '-') + '\n' +
      'Tipo: ' + (data.tipo || '-') + '\n' +
      'Ubicación: ' + (data.ubicacion || '-') + '\n' +
      'Sector: ' + (data.sector || '-') + '\n' +
      'Descripción: ' + (data.descripcion || '-') + '\n' +
      'Fecha: ' + (data.fecha || '-') + '\n' +
      'Contacto: ' + (data.contacto || 'sin contacto');

    MailApp.sendEmail({
      to: '60216566@continental.edu.pe',
      subject: subject,
      body: body
    });

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('EcoLimpia endpoint activo');
}
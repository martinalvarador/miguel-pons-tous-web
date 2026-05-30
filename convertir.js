const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'data', 'pinturas.csv');
const imagesDir = path.join(__dirname, 'assets', 'images', 'obras');
const outputPath = path.join(__dirname, 'data', 'obras.json');

// Leer CSV
const csv = fs.readFileSync(csvPath, 'utf8');

// Separar líneas
const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');

// Encabezados
const headers = lines[0].split(';').map(h => h.trim());

// Datos
const obras = [];

for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split(';');

  if (values.length < headers.length) continue;

  const row = {};

  headers.forEach((header, index) => {
    row[header] = values[index] ? values[index].trim() : '';
  });

  const idPintura = parseInt(row['ID PINTURA'], 10);

  if (isNaN(idPintura)) continue;

  const numeroImagen = idPintura + 1000;

  const archivoImagen = fs.readdirSync(imagesDir).find(file =>
    file.startsWith(numeroImagen + '_')
  );

  obras.push({
    id: idPintura,
    codigo: row['CÓDIGO'],
    artista: row['ARTISTA'],
    titulo: row['TÍTULO'],
    serie: row['SERIE'],
    precio: row['PRECIO'],
    disponible: row['DISPONIBLE'] === 'VERDADERO',
    anio: row['AÑO'],
    tecnica: row['TÉCNICA'],
    dimensiones: row['DIMENSIONES'],
    ubicacion: row['LOCALIZACION / UBICACIÓN'],
    enmarcado: row['ENMARCADO'] === 'VERDADERO',
    autenticado: row['AUTENTICADO'] === 'VERDADERO',
    descripcion: row['DESCRIPCIÓN / OBSERVACIONES'],
    imagen: archivoImagen
      ? `../assets/images/obras/${archivoImagen}`
      : null
  });
}

// Guardar JSON
const ids = obras.map(o => o.id);

for (let n = 1; n <= 404; n++) {
  if (!ids.includes(n)) {
    console.log(`❌ FALTA LA OBRA ID ${n}`);
  }
}
fs.writeFileSync(
  outputPath,
  JSON.stringify(obras, null, 2),
  'utf8'
);

console.log(`✅ JSON generado correctamente`);
console.log(`🎨 Obras procesadas: ${obras.length}`);
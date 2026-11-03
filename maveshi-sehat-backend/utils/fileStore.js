const fs = require('fs');

/**
 * Save an uploaded file to the PostgreSQL uploaded_files table
 * to ensure persistent storage across Render container restarts.
 */
async function persistUploadedFile(pool, filename, filePath, mimeType) {
  if (!pool || !filename || !filePath) return;
  try {
    if (!fs.existsSync(filePath)) return;
    const data = fs.readFileSync(filePath);
    await pool.query(
      `INSERT INTO uploaded_files (filename, mime_type, data)
       VALUES ($1, $2, $3)
       ON CONFLICT (filename) DO UPDATE 
       SET mime_type = EXCLUDED.mime_type, data = EXCLUDED.data, created_at = CURRENT_TIMESTAMP`,
      [filename, mimeType || 'image/jpeg', data]
    );
    console.log(`[FileStore] Persisted ${filename} (${data.length} bytes) to PostgreSQL.`);
  } catch (err) {
    console.error(`[FileStore] Error persisting ${filename} to DB:`, err.message);
  }
}

module.exports = {
  persistUploadedFile
};

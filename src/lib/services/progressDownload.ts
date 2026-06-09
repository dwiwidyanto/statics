export function buildProgressExportFilename(): string {
  return 'staticslab_progress.json';
}

export function buildInstructorCsvFilename(): string {
  return 'staticslab_instructor_attempts.csv';
}

export function buildDataUri(mimeType: string, text: string): string {
  return `data:${mimeType};charset=utf-8,${encodeURIComponent(text)}`;
}

export function downloadTextFile(filename: string, mimeType: string, text: string): void {
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', buildDataUri(mimeType, text));
  linkElement.setAttribute('download', filename);
  linkElement.click();
}

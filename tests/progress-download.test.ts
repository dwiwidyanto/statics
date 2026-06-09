import { describe, expect, it } from 'vitest';
import { buildDataUri, buildInstructorCsvFilename, buildProgressExportFilename } from '../src/lib/services/progressDownload';

describe('progress download helpers', () => {
  it('uses stable export filenames', () => {
    expect(buildProgressExportFilename()).toBe('staticslab_progress.json');
    expect(buildInstructorCsvFilename()).toBe('staticslab_instructor_attempts.csv');
  });

  it('builds encoded data uris with the requested mime type', () => {
    expect(buildDataUri('application/json', '{"score":1}')).toBe('data:application/json;charset=utf-8,%7B%22score%22%3A1%7D');
    expect(buildDataUri('text/csv', 'id,score\natt-1,1')).toBe('data:text/csv;charset=utf-8,id%2Cscore%0Aatt-1%2C1');
  });
});

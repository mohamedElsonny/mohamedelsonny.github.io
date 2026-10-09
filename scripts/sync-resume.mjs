// Builds the general CV in ai-cv-tailor and copies it unchanged to public/resume.pdf.
// Run by hand when the CV changes:  npm run sync-resume   (CV_TAILOR_DIR overrides ../ai-cv-tailor)
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const cvTailor = resolve(process.env.CV_TAILOR_DIR ?? '../ai-cv-tailor');
const builder = join(cvTailor, 'scripts', 'build_general_cv_pdf.py');
const built = join(cvTailor, 'output', 'pdf', 'Mohamed_Gamal_Senior_Full_Stack_Engineer_CV.pdf');
const target = resolve('public', 'resume.pdf');

if (!existsSync(builder)) {
  console.error(`CV builder not found: ${builder}\nSet CV_TAILOR_DIR to your ai-cv-tailor checkout.`);
  process.exit(1);
}

const run = spawnSync('uv', ['run', '--no-project', '--with', 'reportlab', 'python', builder], {
  cwd: cvTailor,
  stdio: 'inherit',
});
if (run.status !== 0) {
  console.error('CV build failed.');
  process.exit(run.status ?? 1);
}

const buffer = readFileSync(built);
if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
  console.error(`Not a PDF: ${built}`);
  process.exit(1);
}
copyFileSync(built, target);
console.log('Copied CV to public/resume.pdf');

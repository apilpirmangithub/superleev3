const { execSync } = require('child_process');

try {
  console.log('Running TypeScript check...');
  execSync('npx tsc --noEmit --pretty', { stdio: 'inherit', timeout: 60000 });
  console.log('✅ TypeScript check passed!');
} catch (error) {
  console.log('❌ TypeScript check failed:', error.message);
  process.exit(1);
}

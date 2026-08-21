require('dotenv/config')
const { defineConfig } = require('prisma/config')

function resolveIpv4DatabaseUrl(url) {
  if (!url || typeof url !== 'string') return url;
  let cleanUrl = url.trim();
  if (cleanUrl.includes('db.') && cleanUrl.includes('.supabase.co')) {
    const match = cleanUrl.match(/postgresql:\/\/([^:]+):([^@]+)@db\.([^.]+)\.supabase\.co:(\d+)\/([^?]+)(\?.*)?/);
    if (match) {
      const user = match[1];
      const pass = match[2];
      const projectRef = match[3];
      const dbName = match[5];
      const queryParams = match[6] || '';
      const poolerUser = user.includes('.') ? user : `${user}.${projectRef}`;
      cleanUrl = `postgresql://${poolerUser}:${pass}@aws-0-ap-northeast-2.pooler.supabase.com:5432/${dbName}${queryParams}`;
    }
  }
  return cleanUrl;
}

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: resolveIpv4DatabaseUrl(process.env.DATABASE_URL),
  },
})

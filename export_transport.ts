import { PrismaClient } from '@prisma/client';
import fs from 'fs';

async function main() {
  const prisma = new PrismaClient();
  const routes = await prisma.busRoute.findMany();
  const stops = await prisma.busStop.findMany();

  let sql = '\n-- Transport Seed Data --\n';
  
  if (routes.length > 0) {
    sql += 'INSERT INTO "bus_routes" ("id", "routeNo", "name", "isActive", "createdAt") VALUES\n';
    const routeVals = routes.map(r => `  ('${r.id}', '${r.routeNo.replace(/'/g, "''")}', '${r.name.replace(/'/g, "''")}', ${r.isActive}, '${r.createdAt.toISOString()}')`);
    sql += routeVals.join(',\n') + ';\n\n';
  }

  if (stops.length > 0) {
    sql += 'INSERT INTO "bus_stops" ("id", "routeId", "stopName", "stage", "pickupTime", "dropTime", "distance", "createdAt") VALUES\n';
    const stopVals = stops.map(s => {
      const stage = s.stage ? `'${s.stage.replace(/'/g, "''")}'` : 'NULL';
      const pickupTime = s.pickupTime ? `'${s.pickupTime}'` : 'NULL';
      const dropTime = s.dropTime ? `'${s.dropTime}'` : 'NULL';
      const distance = s.distance ? `'${s.distance}'` : 'NULL';
      return `  ('${s.id}', '${s.routeId}', '${s.stopName.replace(/'/g, "''")}', ${stage}, ${pickupTime}, ${dropTime}, ${distance}, '${s.createdAt.toISOString()}')`;
    });
    sql += stopVals.join(',\n') + ';\n\n';
  }

  if (routes.length > 0 || stops.length > 0) {
    const initSqlPath = 'database/init.sql';
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    // only append if not already there
    if (!initSql.includes('bus_routes" ("id", "routeNo"')) {
      // Find the end of the file or after the last INSERT
      fs.appendFileSync(initSqlPath, sql);
      console.log('Appended Transport data to init.sql!');
    } else {
      console.log('Data already in init.sql');
    }
  } else {
    console.log('No transport data found in local DB.');
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

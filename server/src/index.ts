import { createApp } from './app.js';
import { prisma } from './prisma.js';

const port = Number(process.env.PORT ?? 4000);

createApp(prisma).listen(port, () => {
  console.log(`jobtrackr API listening on http://localhost:${port}`);
});

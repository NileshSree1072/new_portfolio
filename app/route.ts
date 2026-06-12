import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'index.html');
  const html = fs.readFileSync(filePath, 'utf8');
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

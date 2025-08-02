import { NextResponse } from 'next/server';

export function middleware(request) {
  const origin = request.headers.get('origin') || '';
  const userAgent = request.headers.get('user-agent') || '';
  
  // Daftar origin yang diizinkan
  const allowedOrigins = [
    'https://snap.nzr.web.id',
    'http://localhost:3000',
    'http://localhost:1420',
    'http://localhost:5173',    // untuk vite dev
    'tauri://localhost',        // untuk aplikasi Tauri
    'https://tauri.localhost',  // alternative untuk Tauri
    'asset://localhost'
  ];

  // Check jika request dari Tauri desktop app
  const isTauriApp = userAgent.includes('Yeyo-Desktop-App') || 
                     userAgent.includes('tauri') || 
                     origin === 'null' || 
                     origin === '' ||
                     origin.startsWith('file://');

  const isOriginAllowed = allowedOrigins.includes(origin) || isTauriApp;

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const preflightHeaders = {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent, Accept',
      'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
    };
    
    if (isOriginAllowed) {
      if (isTauriApp) {
        preflightHeaders['Access-Control-Allow-Origin'] = '*';
      } else {
        preflightHeaders['Access-Control-Allow-Origin'] = origin;
      }
      preflightHeaders['Access-Control-Allow-Credentials'] = 'false';
    }
    
    return new NextResponse(null, { status: 204, headers: preflightHeaders });
  }

  // Handle actual requests
  const response = NextResponse.next();
  
  if (isOriginAllowed) {
    if (isTauriApp) {
      response.headers.set('Access-Control-Allow-Origin', '*');
    } else {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, User-Agent, Accept');
    response.headers.set('Access-Control-Allow-Credentials', 'false');
  }

  return response;
}

// Jalankan middleware hanya untuk route /api/*
export const config = {
  matcher: '/api/:path*',
};

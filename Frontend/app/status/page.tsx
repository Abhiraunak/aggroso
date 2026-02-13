"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface HealthStatus {
  backend: 'up' | 'down';
  database: 'up' | 'down';
  llm: 'up' | 'down';
  timestamp: string;
}

// Helper component for the status indicator circles (defined outside or at top level)
const StatusIndicator = ({ state, label, subtext }: { state: 'up' | 'down', label: string, subtext: string }) => (
  <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
    <div>
      <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
      <p className="text-sm text-gray-500">{subtext}</p>
    </div>
    <div className="flex items-center gap-2">
      <span className={`text-sm font-medium ${state === 'up' ? 'text-green-600' : 'text-red-600'}`}>
        {state === 'up' ? 'Operational' : 'Outage'}
      </span>
      <span className="relative flex h-4 w-4">
        {state === 'up' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-4 w-4 ${state === 'up' ? 'bg-green-500' : 'bg-red-500'}`}></span>
      </span>
    </div>
  </div>
);

export default function StatusPage() {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Wrapped in useCallback to prevent unnecessary re-renders
  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${baseUrl}/health`);
      
      if (!res.ok) throw new Error('Server error');

      const data = await res.json();
      setStatus(data);
    } catch (error) {
      // If the fetch completely fails, the server is down
      setStatus({
        backend: 'down',
        database: 'down',
        llm: 'down',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    // Auto-refresh the status every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-black">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
            <p className="text-sm text-gray-500 mt-1">
              Last checked: {status ? new Date(status.timestamp).toLocaleTimeString() : '...'}
            </p>
          </div>
          <Link href="/" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
            &larr; Back to App
          </Link>
        </div>

        {isLoading && !status ? (
          <div className="text-center text-gray-500 py-12">Pinging systems...</div>
        ) : (
          <div className="flex flex-col gap-4">
            <StatusIndicator
              state={status?.backend || 'down'}
              label="Express API"
              subtext="Core routing and request handling"
            />
            <StatusIndicator
              state={status?.database || 'down'}
              label="PostgreSQL Database"
              subtext="Prisma connection and data persistence"
            />
            <StatusIndicator
              state={status?.llm || 'down'}
              label="Gemini AI Engine"
              subtext="Google LLM connection and token generation"
            />

            <button
              onClick={checkHealth}
              disabled={isLoading}
              className="mt-6 w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Refreshing...' : 'Run Diagnostics Again'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
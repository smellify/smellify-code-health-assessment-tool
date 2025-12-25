import React from 'react';

export default function Error404Page() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex items-center space-x-8">
        <div className="text-6xl font-light text-gray-900">
          404
        </div>
        <div className="h-16 w-px bg-gray-300"></div>
        <div className="text-base text-gray-600">
          This page could not be found.
        </div>
      </div>
    </div>
  );
}